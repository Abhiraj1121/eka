"""
EKA AI — app.py  v3
Real-time web: DuckDuckGo (free, no key) + Wikipedia
Models: Llama 4 Maverick → Scout → Qwen3 → Mistral (all free via OpenRouter)
"""

import os, re, time, logging, requests, base64, urllib.parse
from datetime import datetime
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from flask_cors import CORS
from ddgs import DDGS

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s", datefmt="%H:%M:%S")
log = logging.getLogger("eka")

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

AI_API_URL = os.getenv("AI_API_URL", "https://openrouter.ai/api/v1/chat/completions")
AI_API_KEY = os.getenv("AI_API_KEY", "")
BOT_NAME   = os.getenv("BOT_NAME", "EKA")
DEV_NAME   = os.getenv("DEV_NAME", "Abhi Raj Singh")

# ── Model waterfall (all free tier) ──
# "vision": True means the model accepts multimodal (image_url) content —
# needed so attached photos are only routed to models that can actually see them.
MODELS = [
    {"id": "nvidia/nemotron-3-super-120b-a12b:free", "max_tokens": 900, "temp": 0.65, "vision": False},
    {"id": "google/gemma-4-26b-a4b-it:free",         "max_tokens": 900, "temp": 0.65, "vision": True},
    {"id": "poolside/laguna-xs-2.1:free",            "max_tokens": 900, "temp": 0.65, "vision": False},
]

# ── System prompts ──
SYS_BASE = f"""You are {BOT_NAME}, a smart, warm female AI assistant built by {DEV_NAME} in India 🇮🇳.
Refer to yourself with she/her.
Be direct — lead with the answer. No filler phrases like "Great question!".
Use markdown: **bold** for key terms, code blocks for code, bullet lists for steps.
if user ask generate image tell them to toggle image icon on top.
Today: {datetime.now().strftime("%d %B %Y")}."""

SYS_WEB = f"""You are {BOT_NAME}, a smart, warm female AI assistant built by {DEV_NAME} in India 🇮🇳.
Refer to yourself with she/her
Several web search results are provided below, each with its own source link. Use them together
to give an accurate, up-to-date answer — cross-check details across results where they overlap.
Synthesise naturally in your own words — don't just copy sentences. Add context from your knowledge where helpful.
End with: *Source: [the single most relevant source name/domain]*
Today: {datetime.now().strftime("%d %B %Y")}.

WEB RESULTS:
{{web_content}}"""


# ══════════════════════════════════════
# WEB SEARCH — DuckDuckGo (free, no key)
# Uses the `duckduckgo_search` library for real web results (titles + snippets + links).
# NOTE: this was previously hitting api.duckduckgo.com (the "Instant Answer" API), which
# only returns something for dictionary/disambiguation-style queries — it silently
# returned nothing for news, scores, weather, etc. This calls actual DDG search instead.
# ══════════════════════════════════════
def ddg_search(query: str) -> tuple[str | None, str]:
    """Real DuckDuckGo web search — returns top result snippets, or None if it fails."""
    try:
        results = DDGS().text(query, max_results=5, safesearch="moderate")
        snippets = []
        for r in results or []:
            title = (r.get("title") or "").strip()
            body  = (r.get("body") or "").strip()
            href  = (r.get("href") or "").strip()
            if body:
                snippets.append(f"{title}\n{body}\nSource: {href}")
        if snippets:
            return "\n\n".join(snippets)[:2400], "DuckDuckGo"
    except Exception as e:
        log.warning(f"DDG search error: {e}")
    return None, ""


def wikipedia_search(query: str) -> tuple[str | None, str]:
    """Wikipedia full-extract API."""
    try:
        # Step 1: search
        sr = requests.get(
            "https://en.wikipedia.org/w/api.php",
            params={"action": "query", "list": "search", "srsearch": query,
                    "format": "json", "srlimit": 2, "utf8": 1},
            headers={"User-Agent": f"{BOT_NAME}AI/3.0"}, timeout=7,
        ).json()
        results = sr.get("query", {}).get("search", [])
        if not results:
            return None, ""
        title = results[0]["title"]

        # Step 2: extract
        er = requests.get(
            "https://en.wikipedia.org/w/api.php",
            params={"action": "query", "titles": title, "prop": "extracts",
                    "exintro": True, "explaintext": True, "format": "json"},
            headers={"User-Agent": f"{BOT_NAME}AI/3.0"}, timeout=7,
        ).json()
        pages = er.get("query", {}).get("pages", {})
        extract = next(iter(pages.values()), {}).get("extract", "").strip()
        if extract:
            return extract[:1400] + f"\n— Wikipedia: {title}", "Wikipedia"
    except Exception as e:
        log.warning(f"Wikipedia error: {e}")
    return None, ""


def web_search(query: str) -> tuple[str | None, str]:
    """Try DDG first (faster), then Wikipedia."""
    content, src = ddg_search(query)
    if content:
        return content, src
    return wikipedia_search(query)


# ══════════════════════════════════════
# IMAGE GENERATION — Pollinations.ai (free, no key)
# ══════════════════════════════════════
def generate_image(prompt: str) -> tuple[str | None, str | None]:
    """Generates an image via Pollinations' free API. Returns (data_url, error)."""
    try:
        encoded = urllib.parse.quote(prompt.strip())
        seed = int(time.time() * 1000) % 10_000_000
        url = (
            f"https://image.pollinations.ai/prompt/{encoded}"
            f"?width=1024&height=1024&seed={seed}&nologo=true&safe=true"
        )
        r = requests.get(url, timeout=60, headers={"User-Agent": f"{BOT_NAME}AI/3.0"})
        content_type = r.headers.get("content-type", "")
        if r.status_code == 200 and content_type.startswith("image"):
            b64 = base64.b64encode(r.content).decode()
            return f"data:{content_type};base64,{b64}", None
        log.warning(f"Pollinations non-image response: {r.status_code} {content_type}")
        return None, "Image generation failed — please try a different prompt."
    except requests.exceptions.Timeout:
        return None, "Image generation timed out — please try again."
    except Exception as e:
        log.error(f"Image gen error: {e}")
        return None, "Image generation failed — please try again."


# ══════════════════════════════════════
# RESPONSE CLEANING
# ══════════════════════════════════════
def clean(text: str) -> str:
    if not text:
        return ""
    # Strip internal <think> blocks some models emit
    text = re.sub(r"<think(?:ing)?>.*?</think(?:ing)?>", "", text, flags=re.DOTALL | re.IGNORECASE)
    # Strip self-labelling prefix
    text = re.sub(r"^(EKA\s*:\s*|Eka\s*:\s*|Assistant\s*:\s*)", "", text, flags=re.IGNORECASE)
    # Remove stray XML tags
    text = re.sub(r"</?[a-zA-Z_][^>]{0,50}>", "", text)
    # Collapse 3+ blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


# ══════════════════════════════════════
# AI CORE
# ══════════════════════════════════════
def ai_query(user_input: str, history: list = None, system: str = None, image_data_url: str = None) -> str:
    if not AI_API_KEY:
        return "AI backend not configured. Please set AI_API_KEY in your .env file."

    messages = [{"role": "system", "content": system or SYS_BASE}]

    if history:
        for m in history[-16:]:
            if m.get("role") in ("user", "assistant") and m.get("content"):
                messages.append({"role": m["role"], "content": m["content"]})

    if image_data_url:
        # Multimodal content — only vision-capable models in the waterfall will be tried below.
        messages.append({"role": "user", "content": [
            {"type": "text", "text": user_input or "Please describe this image."},
            {"type": "image_url", "image_url": {"url": image_data_url}},
        ]})
    else:
        messages.append({"role": "user", "content": user_input})

    headers = {
        "Authorization": f"Bearer {AI_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://eka-dev1.onrender.com",
        "X-Title": f"{BOT_NAME} AI",
    }

    models_to_try = [m for m in MODELS if not image_data_url or m.get("vision")]
    if image_data_url and not models_to_try:
        return "None of the configured models support image input right now."

    for model in models_to_try:
        try:
            t0   = time.time()
            body = {"model": model["id"], "messages": messages,
                    "max_tokens": model["max_tokens"], "temperature": model["temp"]}
            resp = requests.post(AI_API_URL, headers=headers, json=body, timeout=35)
            log.info(f"  {model['id']} → {resp.status_code} ({round(time.time()-t0,2)}s)")

            if resp.status_code == 200:
                data   = resp.json()
                choice = (data.get("choices") or [{}])[0]
                text   = (choice.get("message") or {}).get("content", "").strip()
                if text:
                    return clean(text)
                log.warning(f"  Empty reply from {model['id']} — raw: {resp.text[:500]}")

            elif resp.status_code == 429:
                log.warning(f"  Rate-limited on {model['id']}, trying next… body: {resp.text[:500]}")
                time.sleep(2.0)

            elif 400 <= resp.status_code < 500:
                log.warning(f"  Client error {resp.status_code} on {model['id']}, skipping — body: {resp.text[:500]}")

            else:
                log.warning(f"  Server error {resp.status_code} on {model['id']} — body: {resp.text[:500]}")

        except requests.exceptions.Timeout:
            log.warning(f"  Timeout on {model['id']}")
        except Exception as e:
            log.error(f"  Error on {model['id']}: {e}")

    return "All AI models are temporarily unavailable. Please try again shortly."


# ══════════════════════════════════════
# QUICK REPLIES (no AI cost)
# ══════════════════════════════════════
def quick_reply(text: str) -> str | None:
    t = text.lower().strip().rstrip("?!.,")
    greetings = {"hi","hello","hey","namaste","namaskar","hola","yo","hii","hai","hyy","good morning","good evening","good night","good afternoon"}
    if t in greetings:
        return f"Hey! 👋 I'm **{BOT_NAME}**, your AI assistant, built in India 🇮🇳. What can I help you with?"

    identity = re.search(r"\b(who are you|your name|what are you|introduce yourself|aap kaun|tumhara naam|kaun ho)\b", t)
    if identity:
        return f"I'm **{BOT_NAME}** — an AI assistant built by **{DEV_NAME}** in India 🇮🇳. I can help with questions, code, writing, analysis, and more. Ask away!"

    return None


# ══════════════════════════════════════
# ROUTES
# ══════════════════════════════════════
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/chat", methods=["POST"])
def chat():
    payload  = request.get_json(silent=True) or {}
    user_msg = (payload.get("message") or "").strip()
    history  = payload.get("history", [])
    use_web  = payload.get("wiki", False)
    image    = payload.get("image")  # optional base64 data-URL of an attached photo

    if not user_msg and not image:
        return jsonify({"reply": "Your message seems empty. What would you like to ask?", "source": "system"})

    log.info(f"→ {user_msg[:80]}{' [+image]' if image else ''}")

    # Image path — route straight to a vision-capable model, skip quick-replies/web-search
    if image:
        reply = ai_query(user_msg, history=history, image_data_url=image)
        log.info(f"← ai+vision: {reply[:60]}")
        return jsonify({"reply": reply, "source": "ai"})

    # Quick path
    quick = quick_reply(user_msg)
    if quick:
        return jsonify({"reply": quick, "source": "system"})

    # Web search path
    if use_web:
        content, src = web_search(user_msg)
        if content:
            system = SYS_WEB.replace("{web_content}", content)
            reply  = ai_query(user_msg, history=history, system=system)
            log.info(f"← web+ai [{src}]: {reply[:60]}")
            return jsonify({"reply": reply, "source": "web+ai", "web_source": src})

    # Standard AI
    reply = ai_query(user_msg, history=history)
    log.info(f"← ai: {reply[:60]}")
    return jsonify({"reply": reply, "source": "ai"})


@app.route("/api/image", methods=["POST"])
def image():
    payload = request.get_json(silent=True) or {}
    prompt  = (payload.get("prompt") or "").strip()

    if not prompt:
        return jsonify({"error": "Describe what you'd like me to draw."}), 400
    if len(prompt) > 600:
        return jsonify({"error": "That prompt is a bit long — try trimming it."}), 400

    log.info(f"→ image: {prompt[:80]}")
    data_url, err = generate_image(prompt)
    if err:
        log.warning(f"← image failed: {err}")
        return jsonify({"error": err}), 502

    log.info("← image: ok")
    return jsonify({"image": data_url, "prompt": prompt, "source": "pollinations"})


@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "bot": BOT_NAME,
                    "models": [m["id"] for m in MODELS],
                    "time": datetime.now().isoformat()})


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    log.info(f"Starting {BOT_NAME} AI on :{port}")
    app.run(debug=os.getenv("DEBUG","true").lower()=="true", host="0.0.0.0", port=port)
