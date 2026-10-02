"""
EKA AI — app.py  v4
Stateless backend: no accounts, no database. The profile (name / photo) lives in the
browser and the display name is sent with each chat request so the LLM can see it.
Real-time web: ddgs metasearch (free, no key) + Wikipedia + DDG HTML fallback.
BYOK required: every user supplies their own OpenRouter key (no server key exists).
Modes: FREE (free OpenRouter models) / PAID (curated paid models, billed to the user's key).
"""
import os, re, time, json, logging, requests, base64, urllib.parse, html as html_lib
from datetime import datetime
from flask import Flask, render_template, request, jsonify, send_from_directory, g, has_request_context
from dotenv import load_dotenv
from flask_cors import CORS
from ddgs import DDGS

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s", datefmt="%H:%M:%S")
log = logging.getLogger("eka")

app = Flask(__name__, static_folder="static", template_folder="templates")

# ── CORS ──
# No cookies/sessions any more (no login), so credentials are not needed. The browser
# still sends custom headers (Authorization for BYOK, X-Eka-Mode / X-Eka-Model), which
# flask-cors allows by default. FRONTEND_ORIGINS = comma-separated allowed origins.
FRONTEND_ORIGINS = [o.strip() for o in os.getenv(
    "FRONTEND_ORIGINS",
    "https://abhiraj1121.github.io,http://localhost:5000,http://127.0.0.1:5000,http://127.0.0.1:5500"
).split(",") if o.strip()]
CORS(app, origins=FRONTEND_ORIGINS)

AI_API_URL = os.getenv("AI_API_URL", "https://openrouter.ai/api/v1/chat/completions")
# BYOK-only: there is deliberately NO server-side AI key. Every user brings their own OpenRouter key
# (sent per request as "Authorization: Bearer ..."), so the host never pays for anyone's usage.
BOT_NAME   = os.getenv("BOT_NAME", "EKA")
DEV_NAME   = os.getenv("DEV_NAME", "Abhi Raj Singh")

# ── Model waterfall (all free tier) ──
# "vision": True means the model accepts multimodal (image_url) content —
# needed so attached photos are only routed to models that can actually see them.
MODELS = [
    {"id": "nvidia/nemotron-3-super-120b-a12b:free", "max_tokens": 2026, "temp": 0.65, "vision": False}, #only text
    {"id": "liquid/lfm-2.5-2.6b:free", "max_tokens": 2026, "temp": 0.65, "vision": False}, #only text
    {"id": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", "max_tokens": 2026, "temp": 0.65, "vision": True}, #image redy
    #{"id": "nex-agi/nex-n2.5-mini:free", "max_tokens": 2026, "temp": 0.65, "vision": True}, #image redy
]


# ══════════════════════════════════════
# PAID MODEL CATALOGUE  — used only when the user switches to Paid mode.
# Free mode never touches these; Paid mode never touches the free MODELS above.
# Entries are checked against OpenRouter's live /models list (see /api/models), so an ID
# that has been renamed or retired is dropped from the picker instead of shown broken.
#   tier: "fast" (quick + cheap) · "balanced" · "best" (strongest, priciest)
#   vision: accepts images · think: reasoning family (we ask for low effort so the
#   token budget goes to the answer instead of hidden thinking)
# ══════════════════════════════════════
PAID_MODELS = [
    {"id": "google/gemini-3.1-flash-lite-preview", "name": "Gemini 3.1 Flash-Lite",  "tier": "fast",     "vision": True,  "think": True},
    {"id": "openai/gpt-5.4-nano",                  "name": "GPT-5.4 Nano",           "tier": "fast",     "vision": True,  "think": True},
    {"id": "google/gemini-3-flash-preview",        "name": "Gemini 3 Flash",         "tier": "fast",     "vision": True,  "think": True},
    {"id": "openai/gpt-5.4-mini",                  "name": "GPT-5.4 Mini",           "tier": "balanced", "vision": True,  "think": True},
    {"id": "anthropic/claude-haiku-4.5",           "name": "Claude Haiku 4.5",       "tier": "balanced", "vision": True,  "think": False},
    {"id": "deepseek/deepseek-chat",               "name": "DeepSeek Chat (budget)", "tier": "balanced", "vision": False, "think": False},
    {"id": "anthropic/claude-sonnet-4.6",          "name": "Claude Sonnet 4.6",      "tier": "best",     "vision": True,  "think": False},
    {"id": "openai/gpt-5.5",                       "name": "GPT-5.5",                "tier": "best",     "vision": True,  "think": True},
    {"id": "google/gemini-3.1-pro-preview",        "name": "Gemini 3.1 Pro",         "tier": "best",     "vision": True,  "think": True},
    # older, long-lived IDs — keep the picker populated if any of the above get renamed
    {"id": "openai/gpt-4.1-mini",                  "name": "GPT-4.1 Mini",           "tier": "balanced", "vision": True,  "think": False},
    {"id": "google/gemini-2.5-flash",              "name": "Gemini 2.5 Flash",       "tier": "fast",     "vision": True,  "think": True},
    {"id": "openai/gpt-4o-mini",                   "name": "GPT-4o Mini",            "tier": "fast",     "vision": True,  "think": False},
]
PAID_BY_ID = {m["id"]: m for m in PAID_MODELS}
# First one that is live on OpenRouter becomes the pre-selected default ("fast and good").
PAID_RECOMMENDED = ["google/gemini-3-flash-preview", "openai/gpt-5.4-mini", "anthropic/claude-haiku-4.5",
                    "openai/gpt-4.1-mini", "google/gemini-2.5-flash", "openai/gpt-4o-mini"]


def paid_request_extras(model_id: str) -> dict:
    """Extra body fields for paid calls: more room for the answer, and low reasoning effort
    on 'thinking' models so a short chat reply isn't eaten by hidden reasoning tokens."""
    extras = {"max_tokens": 4096}
    meta = PAID_BY_ID.get(model_id)
    if (meta and meta.get("think")) or (not meta and re.match(r"^(openai/(gpt-5|o\d)|google/gemini-(2\.5|3))", model_id)):
        extras["reasoning"] = {"effort": "low"}
    return extras


def post_completion(headers: dict, body: dict, timeout: int):
    """POST to OpenRouter. If a paid request is rejected with 400 while carrying the
    optional `reasoning` field, retry once without it (some providers don't accept it)."""
    resp = requests.post(AI_API_URL, headers=headers, json=body, timeout=timeout)
    if resp.status_code == 400 and "reasoning" in body:
        body = {k: v for k, v in body.items() if k != "reasoning"}
        resp = requests.post(AI_API_URL, headers=headers, json=body, timeout=timeout)
    return resp

# ══════════════════════════════════════
# PER-REQUEST CONTEXT (flask.g)
# Everything the frontend's Settings can change is read once per request here, so
# ai_query / tools / router don't need extra parameters threaded through them.
#   - Mode + model  : headers  X-Eka-Mode ("free"|"paid") and X-Eka-Model (paid only)
#   - Name / style  : JSON body of /api/chat (names can contain non-ASCII, so not headers)
# ══════════════════════════════════════
MODEL_ID_RE = re.compile(r"^[A-Za-z0-9_.\-]+/[A-Za-z0-9_.\-:~]+$")
STYLE_HINTS = {
    "concise":  "Keep answers short and to the point — a few sentences unless the user asks for more.",
    "balanced": "",
    "detailed": "Give thorough, well-structured answers with explanations and examples where useful.",
}
TEMP_BY_CREATIVITY = {"precise": 0.25, "balanced": None, "creative": 0.95}


def _clean_line(value, limit: int) -> str:
    """Single-line, length-capped text from user-controlled input (names etc.)."""
    if not isinstance(value, str):
        return ""
    value = re.sub(r"[\x00-\x1f\x7f]+", " ", value)
    return re.sub(r"\s{2,}", " ", value).strip()[:limit]


def _clean_block(value, limit: int) -> str:
    if not isinstance(value, str):
        return ""
    value = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", value)
    return value.strip()[:limit]


@app.before_request
def load_request_ctx():
    g.paid_requested = (request.headers.get("X-Eka-Mode") or "free").strip().lower() == "paid"
    model = (request.headers.get("X-Eka-Model") or "").strip()
    g.paid_model = model if (g.paid_requested and MODEL_ID_RE.match(model)) else None
    g.user_name = g.user_about = g.custom = ""
    g.style = "balanced"
    g.temp = None
    g.hist_limit = 16
    g.search_n = 5


def load_chat_prefs(payload: dict):
    """Read the user-facing preferences from the /api/chat JSON body."""
    g.user_name  = _clean_line(payload.get("user_name"), 32)
    g.user_about = _clean_line(payload.get("user_about"), 60)
    g.custom     = _clean_block(payload.get("custom_instructions"), 500)
    style = payload.get("style")
    g.style = style if style in STYLE_HINTS else "balanced"
    g.temp = TEMP_BY_CREATIVITY.get(payload.get("creativity"))
    try:
        g.hist_limit = max(0, min(30, int(payload.get("history_limit", 16))))
    except (TypeError, ValueError):
        g.hist_limit = 16
    try:
        g.search_n = max(2, min(8, int(payload.get("search_results", 5))))
    except (TypeError, ValueError):
        g.search_n = 5


NEEDS_KEY_MSG = ("EKA needs your own OpenRouter API key to reply — it's free to create at openrouter.ai/keys. "
                 "Add it in Settings → API Key, then try again.")


def paid_guard(user_key):
    """Paid mode needs a valid model on top of the (always required) user key."""
    if not getattr(g, "paid_requested", False):
        return None
    if not user_key:
        return NEEDS_KEY_MSG
    if not g.paid_model:
        return "Paid mode is on but no valid model is selected. Pick one in Settings → AI Mode."
    return None


def _is_paid() -> bool:
    return has_request_context() and bool(getattr(g, "paid_model", None))


def _ctx(name, default=None):
    return getattr(g, name, default) if has_request_context() else default


def build_system(web_content: str = None) -> str:
    """Built per request (the old module-level constants froze 'Today' at server start)."""
    today = datetime.now().strftime("%d %B %Y")
    lines = [f"You are {BOT_NAME}, a smart, warm female AI assistant built by {DEV_NAME} in India 🇮🇳.",
             "Refer to yourself with she/her pronouns when it comes up naturally — don't force it into every reply."]
    if web_content:
        lines += [
            "Several web search results are provided below, each with its own source link. Use them together",
            "to give an accurate, up-to-date answer — cross-check details across results where they overlap.",
            "Synthesise naturally in your own words — don't just copy sentences. Add context from your knowledge where helpful.",
            "If the results don't actually answer the question, say so plainly instead of guessing.",
            "End with: *Source: [the single most relevant source name/domain]*",
        ]
    else:
        lines += [
            "Be direct — lead with the answer. No filler phrases like \"Great question!\".",
            "Use markdown: **bold** for key terms, code blocks for code, bullet lists for steps.",
            "Match the user's language (Hindi if they write Hindi, Hinglish if mixed).",
            "If the user asks you to generate an image, tell them to toggle the image icon at the top.",
        ]
    lines.append(f"Today: {today}.")

    name, about = _ctx("user_name", ""), _ctx("user_about", "")
    if name:
        who = f"The person you're talking to is named {name}"
        if about:
            who += f" (they describe themselves as: {about})"
        lines.append(who + " — address them by name when it feels natural, don't force it into every reply.")
    style_hint = STYLE_HINTS.get(_ctx("style", "balanced"), "")
    if style_hint:
        lines.append(style_hint)
    custom = _ctx("custom", "")
    if custom:
        lines.append("The user's own custom instructions (follow them unless they conflict with safety):\n" + custom)
    if web_content:
        lines.append("\nWEB RESULTS:\n" + web_content)
    return "\n".join(lines)


# ══════════════════════════════════════
# WEB SEARCH — ddgs metasearch (free, no key) → DDG HTML → Wikipedia
#
# Why it was broken before:
#   1. chat() asked the router model first and returned its *text* reply immediately,
#      so for ordinary questions the web-search branch was never reached.
#   2. ddg_search() retried with backends "html" and "lite". Those were removed in
#      ddgs 9.x (valid text backends now: bing, brave, duckduckgo, google, mojeek,
#      yahoo, yandex, wikipedia…), so 2 of 3 attempts always raised.
#   3. Failures were silent — the user just got a normal, un-searched answer.
# ══════════════════════════════════════
SEARCH_BACKENDS = ["auto", "duckduckgo", "bing", "brave", "mojeek", "yahoo"]
NEWSY = re.compile(r"\b(news|latest|today|tonight|yesterday|breaking|score|scores|results?|live|update|updates|headline|headlines|price|stock|weather|aaj|khabar)\b", re.I)


def _fmt_results(results, limit: int):
    """Normalise ddgs results into (text_for_llm, [{title,url}])."""
    chunks, sources = [], []
    for r in results or []:
        title = (r.get("title") or "").strip()
        body  = (r.get("body") or r.get("snippet") or "").strip()
        href  = (r.get("href") or r.get("url") or "").strip()
        if not body:
            continue
        chunks.append(f"{title}\n{body}\nSource: {href}")
        if href:
            sources.append({"title": title or href, "url": href})
        if len(chunks) >= limit:
            break
    return chunks, sources


def ddg_search(query: str, limit: int = 5, diag: list = None):
    """ddgs metasearch. Tries backends one at a time under an overall time budget
    (so a blocked datacenter IP can't hang the request past gunicorn's timeout).
    Returns (text|None, source_label, sources)."""
    deadline = time.time() + 16
    use_news = bool(NEWSY.search(query))
    for backend in SEARCH_BACKENDS:
        if time.time() > deadline:
            break
        attempts = [("text", backend)]
        if use_news and backend in ("auto", "duckduckgo", "bing"):
            attempts.insert(0, ("news", backend))
        for kind, be in attempts:
            try:
                d = DDGS(timeout=6)
                if kind == "news":
                    results = d.news(query, max_results=limit, safesearch="moderate", backend=be)
                else:
                    results = d.text(query, max_results=limit, safesearch="moderate", backend=be)
                chunks, sources = _fmt_results(results, limit)
                if chunks:
                    if diag is not None:
                        diag.append({"engine": f"ddgs/{kind}/{be}", "ok": True, "results": len(chunks)})
                    return "\n\n".join(chunks)[:3200], "Web", sources
                if diag is not None:
                    diag.append({"engine": f"ddgs/{kind}/{be}", "ok": False, "error": "no results"})
            except Exception as e:
                log.warning(f"ddgs {kind}/{be} failed: {type(e).__name__}: {e}")
                if diag is not None:
                    diag.append({"engine": f"ddgs/{kind}/{be}", "ok": False, "error": f"{type(e).__name__}: {e}"[:160]})
    return None, "", []


_DDG_LINK = re.compile(r'<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>(.*?)</a>', re.S)
_DDG_SNIP = re.compile(r'<a[^>]+class="result__snippet"[^>]*>(.*?)</a>', re.S)


def _strip_tags(s: str) -> str:
    return html_lib.unescape(re.sub(r"<[^>]+>", "", s or "")).strip()


def parse_ddg_html(page: str, limit: int = 5) -> list:
    links, snips = _DDG_LINK.findall(page), _DDG_SNIP.findall(page)
    out = []
    for i, (href, title) in enumerate(links[:limit * 2]):
        if href.startswith("//"):
            href = "https:" + href
        qs = urllib.parse.parse_qs(urllib.parse.urlparse(href).query)
        if "uddg" in qs:
            href = qs["uddg"][0]
        if not href.startswith("http"):
            continue
        out.append({"title": _strip_tags(title), "href": href,
                    "body": _strip_tags(snips[i]) if i < len(snips) else ""})
        if len(out) >= limit:
            break
    return out


def ddg_html_search(query: str, limit: int = 5, diag: list = None):
    """Independent fallback: DuckDuckGo's no-JS HTML page via plain requests."""
    try:
        r = requests.post("https://html.duckduckgo.com/html/", data={"q": query},
                          headers={"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                                                 "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
                                   "Accept-Language": "en-US,en;q=0.9"}, timeout=8)
        if r.status_code != 200:
            raise RuntimeError(f"HTTP {r.status_code}")
        chunks, sources = _fmt_results(parse_ddg_html(r.text, limit), limit)
        if chunks:
            if diag is not None:
                diag.append({"engine": "ddg-html", "ok": True, "results": len(chunks)})
            return "\n\n".join(chunks)[:3200], "DuckDuckGo", sources
        raise RuntimeError("no results parsed")
    except Exception as e:
        log.warning(f"ddg html fallback failed: {e}")
        if diag is not None:
            diag.append({"engine": "ddg-html", "ok": False, "error": str(e)[:160]})
    return None, "", []


def wikipedia_search(query: str, diag: list = None):
    """Wikipedia intro extract. Returns (text|None, source_label, sources)."""
    try:
        hdr = {"User-Agent": f"{BOT_NAME}AI/4.0 (chat assistant)"}
        sr = requests.get(
            "https://en.wikipedia.org/w/api.php",
            params={"action": "query", "list": "search", "srsearch": query,
                    "format": "json", "srlimit": 2, "utf8": 1},
            headers=hdr, timeout=7,
        ).json()
        results = sr.get("query", {}).get("search", [])
        if not results:
            raise RuntimeError("no results")
        title = results[0]["title"]
        er = requests.get(
            "https://en.wikipedia.org/w/api.php",
            params={"action": "query", "titles": title, "prop": "extracts",
                    "exintro": True, "explaintext": True, "format": "json"},
            headers=hdr, timeout=7,
        ).json()
        pages = er.get("query", {}).get("pages", {})
        extract = next(iter(pages.values()), {}).get("extract", "").strip()
        if extract:
            url = "https://en.wikipedia.org/wiki/" + urllib.parse.quote(title.replace(" ", "_"))
            if diag is not None:
                diag.append({"engine": "wikipedia", "ok": True, "results": 1})
            return f"{title}\n{extract[:1400]}\nSource: {url}", "Wikipedia", [{"title": f"Wikipedia: {title}", "url": url}]
        raise RuntimeError("empty extract")
    except Exception as e:
        log.warning(f"Wikipedia error: {e}")
        if diag is not None:
            diag.append({"engine": "wikipedia", "ok": False, "error": str(e)[:160]})
    return None, "", []


def web_search(query: str, limit: int = 5, diag: list = None):
    """ddgs → DDG HTML → Wikipedia. Each leg is independent, so one blocked backend
    doesn't take the whole feature down. Returns (text|None, label, sources)."""
    for fn in (ddg_search, ddg_html_search):
        content, label, sources = fn(query, limit=limit, diag=diag)
        if content:
            return content, label, sources
    return wikipedia_search(query, diag=diag)


# ══════════════════════════════════════
# IMAGE GENERATION — Pollinations.ai (free, no key)
# Size is no longer hardcoded square: the prompt is scanned for orientation/format
# cues (portrait, landscape, passport photo, square, wallpaper, etc.) so the AI
# is free to generate whatever shape actually fits the request. Falls back to a
# balanced square only when nothing in the prompt implies a shape.
# ══════════════════════════════════════
def infer_image_size(prompt: str) -> tuple[int, int]:
    """Pick sensible (width, height) for Pollinations based on cues in the prompt.
    Keeps the long edge around ~1024-1152px for quality, short edge scaled down —
    never upscales past that so generation stays fast and free-tier friendly."""
    p = prompt.lower()

    # Explicit "AxB" or "A:B" style hints, e.g. "1080x1920" or "16:9"
    m = re.search(r"\b(\d{2,4})\s*[x×:]\s*(\d{2,4})\b", p)
    if m:
        w, h = int(m.group(1)), int(m.group(2))
        scale = 1152 / max(w, h)
        return max(64, round(w * scale)), max(64, round(h * scale))

    # Passport / ID photo — standard near-square portrait crop
    if re.search(r"passport|id photo|id card photo|visa photo", p):
        return 827, 1063  # ~ 35x45mm passport-photo ratio

    # Portrait cues
    if re.search(r"\bportrait\b|\bvertical\b|\bmobile wallpaper\b|\bphone wallpaper\b|\bstory\b|\breels?\b|\btiktok\b|\b9:16\b", p):
        return 864, 1536

    # Landscape / widescreen cues
    if re.search(r"\blandscape\b|\bhorizontal\b|\bwidescreen\b|\bdesktop wallpaper\b|\bbanner\b|\bpanorama\b|\bcinematic\b|\b16:9\b", p):
        return 1536, 864

    # Explicit square cue
    if re.search(r"\bsquare\b|\b1:1\b", p):
        return 1024, 1024

    return 1024, 1024  # default — unchanged behaviour when no shape is implied


def generate_image(prompt: str) -> tuple[str | None, str | None]:
    """Generates an image via Pollinations' free API. Returns (data_url, error)."""
    try:
        width, height = infer_image_size(prompt)
        encoded = urllib.parse.quote(prompt.strip())
        seed = int(time.time() * 1000) % 10_000_000
        url = (
            f"https://image.pollinations.ai/prompt/{encoded}"
            f"?width={width}&height={height}&seed={seed}&nologo=true&safe=true"
        )
        # NOTE: this timeout must stay comfortably under gunicorn's worker timeout
        # (set to 55s via the Procfile's --timeout flag). If Pollinations takes
        # longer than the *worker* timeout, gunicorn SIGABRTs the whole process
        # before this function's own except blocks ever get a chance to run —
        # that shows up in logs as "WORKER TIMEOUT" / SystemExit, not a clean
        # Python exception, and the request silently 500s with no JSON body.
        r = requests.get(url, timeout=45, headers={"User-Agent": f"{BOT_NAME}AI/3.0"})
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


def tool_generate_image(args: dict, api_key: str = None) -> tuple[dict | None, str | None]:
    """Wraps the existing Pollinations image generator in the standard tool
    contract so the auto-router can call it. api_key is accepted for dispatcher-
    signature consistency but unused — Pollinations is free, no key needed."""
    prompt = (args.get("prompt") or "").strip()
    if not prompt:
        return None, "Describe what you'd like me to draw."
    if len(prompt) > 600:
        return None, "That prompt is a bit long — try trimming it."

    data_url, err = generate_image(prompt)
    if err:
        return None, err
    return {"image": data_url, "prompt": prompt, "source": "pollinations"}, None


# ══════════════════════════════════════
# TOOL ORCHESTRATOR — Module 2: AI Code Writer & Static Verification
# Generates code via a code-specialized model, then runs STATIC-ONLY checks
# (syntax parsing / linting) — never executes generated code server-side.
# ══════════════════════════════════════
CODE_MODEL = "inclusionai/ling-3.0-flash-vl:free"

CODEGEN_SYSTEM = (
    "You are a precise code generation engine. Respond with NOTHING but a single "
    "fenced code block in the requested language. Do not explain your reasoning, "
    "do not think out loud, do not offer alternatives — the first characters of "
    "your response must be the opening code fence itself. Write clean, complete, "
    "idiomatic, production-quality code with brief inline comments where genuinely useful."
)

CODE_FENCE_RE = re.compile(r"```(?:[a-zA-Z0-9_+-]*)\n(.*?)```", re.DOTALL)

LANG_EXT = {
    "python": "py", "javascript": "js", "typescript": "ts", "bash": "sh", "shell": "sh",
    "html": "html", "css": "css", "java": "java", "c": "c", "cpp": "cpp", "c++": "cpp",
    "go": "go", "rust": "rs", "sql": "sql", "json": "json", "yaml": "yml", "ruby": "rb",
    "php": "php", "swift": "swift", "kotlin": "kt",
}


def extract_code(raw: str) -> str:
    """Only accepts a properly closed fenced code block. Deliberately does NOT
    fall back to raw text on a miss — unfenced/truncated output is usually the
    model's reasoning prose, not actual code, and showing that to the user is
    worse than a clean 'please try again' error."""
    m = CODE_FENCE_RE.search(raw or "")
    return m.group(1).strip() if m else ""


def verify_code_static(code: str, language: str) -> dict:
    """Static-only verification — NEVER executes the code. Python gets a real
    syntax check via ast.parse; other languages get a lightweight sanity check
    (non-empty, balanced brackets) since we don't run per-language parsers here."""
    language = (language or "").lower().strip()

    if language == "python":
        try:
            import ast as _ast
            _ast.parse(code)
            return {"checked": True, "passed": True, "language": "python", "detail": "Valid Python syntax."}
        except SyntaxError as e:
            return {"checked": True, "passed": False, "language": "python",
                    "detail": f"SyntaxError: {e.msg} (line {e.lineno})"}

    if not code.strip():
        return {"checked": True, "passed": False, "language": language, "detail": "Generated code is empty."}

    opens  = code.count("{") + code.count("(") + code.count("[")
    closes = code.count("}") + code.count(")") + code.count("]")
    if opens != closes:
        return {"checked": True, "passed": False, "language": language,
                "detail": f"Unbalanced brackets ({opens} opening vs {closes} closing) — likely truncated or malformed."}

    return {"checked": True, "passed": True, "language": language,
            "detail": "Basic structural check passed (no execution performed)."}


def tool_generate_code(args: dict, api_key: str = None) -> tuple[dict | None, str | None]:
    prompt   = (args.get("prompt") or "").strip()
    language = (args.get("language") or "python").strip().lower()

    if not prompt:
        return None, "Please describe what code you'd like generated."
    if len(prompt) > 2000:
        return None, "Prompt is too long — keep it under 2000 characters."

    user_input = f"Language: {language}\nTask: {prompt}"
    raw, err = ai_query_single_model(CODE_MODEL, CODEGEN_SYSTEM, user_input, api_key=api_key,
                                      max_tokens=1800, temp=0.25)
    if err:
        return None, err

    code = extract_code(raw)

    # One retry with a blunter reminder — catches the occasional response that
    # opens with reasoning/prose instead of the fence despite the system prompt.
    if not code:
        retry_input = f"{user_input}\n\nReminder: reply with ONLY the fenced code block. No reasoning, no explanation."
        raw, err = ai_query_single_model(CODE_MODEL, CODEGEN_SYSTEM, retry_input, api_key=api_key,
                                          max_tokens=1800, temp=0.15)
        if err:
            return None, err
        code = extract_code(raw)

    if not code:
        return None, "The model didn't return any code — try rephrasing your request, or ask for something simpler."

    verification = verify_code_static(code, language)
    ext = LANG_EXT.get(language, "txt")

    return {
        "code": code,
        "language": language,
        "extension": ext,
        "filename": f"generated.{ext}",
        "verification": verification,
    }, None


# ══════════════════════════════════════
# TOOL ORCHESTRATOR — Module 1: Avatar Generator (DiceBear, free/no key)
# Each tool is a plain function: (args: dict) -> (data: dict | None, error: str | None)
# Registered in TOOLS so /api/tool/<name> can dispatch generically. Future modules
# (code gen, diagrams, docs) register here too — this route/dispatch shape doesn't change.
# ══════════════════════════════════════
DICEBEAR_STYLES = {
    "bottts", "avataaars", "adventurer", "pixel-art", "identicon",
    "thumbs", "fun-emoji", "lorelei", "notionists", "shapes",
}

def tool_generate_avatar(args: dict, api_key: str = None) -> tuple[dict | None, str | None]:
    """Builds a DiceBear SVG avatar URL/data from a seed + style. No image bytes
    fetched server-side — DiceBear SVGs are safe to reference directly by URL,
    so we just validate inputs and hand back a ready-to-render URL.
    api_key is accepted for dispatcher-signature consistency but unused — this
    tool doesn't call an LLM."""
    seed  = (args.get("seed") or "").strip()
    style = (args.get("style") or "bottts").strip().lower()

    if not seed:
        return None, "Please provide a seed (e.g. a name) for the avatar."
    if len(seed) > 80:
        return None, "Seed is too long — keep it under 80 characters."
    if style not in DICEBEAR_STYLES:
        return None, f"Unknown style '{style}'. Choose one of: {', '.join(sorted(DICEBEAR_STYLES))}."

    encoded_seed = urllib.parse.quote(seed)
    url = f"https://api.dicebear.com/9.x/{style}/svg?seed={encoded_seed}"
    return {"url": url, "seed": seed, "style": style}, None


# Registry: tool_name -> { fn, desc, needs_key }.
# Dispatcher always forwards the resolved user_key; tools that don't call an LLM
# (needs_key=False) simply ignore it. needs_key is informational (used for UI hints
# / error messaging) — the forwarding behavior itself doesn't depend on it.
# ══════════════════════════════════════
# TOOL ORCHESTRATOR — Module 3: AI Diagram Generator (Mermaid.js)
# Generates Mermaid syntax only — rendering happens client-side via mermaid.js.
# ══════════════════════════════════════
DIAGRAM_MODEL = "inclusionai/ling-3.0-flash-fin:free"

DIAGRAM_SYSTEM = (
    "You are a diagram generation engine. Respond with NOTHING but a single fenced "
    "```mermaid code block containing valid Mermaid.js syntax. Do not explain your "
    "reasoning, do not think out loud, do not describe your plan — the first characters "
    "of your response must be the opening code fence itself. Pick the most fitting "
    "diagram type (flowchart, sequenceDiagram, classDiagram, stateDiagram-v2, erDiagram, "
    "gantt, mindmap, etc). Keep node labels short and syntax strictly valid — no "
    "unescaped special characters. Keep the diagram compact enough to fit comfortably "
    "within the response length."
)

MERMAID_FENCE_RE = re.compile(r"```(?:mermaid)?\n(.*?)```", re.DOTALL)


def extract_mermaid(raw: str) -> str:
    """Only accepts a properly closed ```mermaid fence. Deliberately does NOT fall
    back to raw text on a miss — unfenced/truncated output is usually the model's
    reasoning prose, not a diagram, and showing that to the user is worse than
    a clean 'please try again' error."""
    m = MERMAID_FENCE_RE.search(raw or "")
    return m.group(1).strip() if m else ""


def verify_mermaid_static(code: str) -> dict:
    """Static-only sanity check — never renders/executes. Confirms non-empty and
    that it opens with a recognized Mermaid diagram-type keyword."""
    valid_starts = ("flowchart", "graph", "sequenceDiagram", "classDiagram", "stateDiagram",
                    "erDiagram", "gantt", "pie", "mindmap", "journey", "timeline", "gitGraph")
    stripped = (code or "").strip()
    if not stripped:
        return {"checked": True, "passed": False, "detail": "Generated diagram is empty."}
    if not stripped.startswith(valid_starts):
        return {"checked": True, "passed": False,
                "detail": f"Doesn't start with a recognized Mermaid diagram type ({', '.join(valid_starts[:4])}, …)."}
    return {"checked": True, "passed": True, "detail": "Looks like valid Mermaid syntax (client will confirm on render)."}


def tool_generate_diagram(args: dict, api_key: str = None) -> tuple[dict | None, str | None]:
    prompt = (args.get("prompt") or "").strip()
    if not prompt:
        return None, "Please describe what diagram you'd like generated."
    if len(prompt) > 1500:
        return None, "Prompt is too long — keep it under 1500 characters."

    raw, err = ai_query_single_model(DIAGRAM_MODEL, DIAGRAM_SYSTEM, prompt, api_key=api_key,
                                      max_tokens=2000, temp=0.3)
    if err:
        return None, err

    mermaid_code = extract_mermaid(raw)

    # One retry with a blunter reminder — catches the occasional response that
    # opens with reasoning/prose instead of the fence despite the system prompt.
    if not mermaid_code:
        retry_prompt = (
            f"{prompt}\n\n"
            "Reminder: reply with ONLY the fenced ```mermaid block. No reasoning, "
            "no explanation, nothing before or after it."
        )
        raw, err = ai_query_single_model(DIAGRAM_MODEL, DIAGRAM_SYSTEM, retry_prompt, api_key=api_key,
                                          max_tokens=2000, temp=0.2)
        if err:
            return None, err
        mermaid_code = extract_mermaid(raw)

    if not mermaid_code:
        return None, "The model didn't return diagram syntax — try rephrasing your request, or ask for something simpler."

    verification = verify_mermaid_static(mermaid_code)
    return {"mermaid": mermaid_code, "prompt": prompt, "verification": verification}, None


# ══════════════════════════════════════
# TOOL ORCHESTRATOR — Module 5: AI Document Generator
# Generates content via LLM, then exports to md / docx / pdf. Falls back to .md
# if the requested format's library isn't installed — never a hard failure.
# ══════════════════════════════════════
import io  # local import kept near usage; io is stdlib, always available

DOC_MODEL = "inclusionai/ling-3.0-flash-fin:free"

DOC_TYPES = {"report", "resume", "article", "letter", "proposal", "summary", "essay"}
DOC_FORMATS = {"md", "docx", "pdf"}

DOC_SYSTEM_TMPL = (
    "You are a professional document writer. Write a well-structured {doc_type} on the "
    "given topic, in Markdown. Use a single top-level # heading as the title, ## for "
    "sections, and standard Markdown (bold, lists, etc). No preamble or meta-commentary "
    "— output only the document itself."
)


def _md_to_docx_bytes(markdown_text: str, title: str) -> bytes:
    """Converts simple Markdown (headings, bold, bullet/numbered lists, paragraphs)
    into a .docx using python-docx. Intentionally simple — not a full CommonMark parser."""
    from docx import Document
    from docx.shared import Pt

    doc = Document()
    for raw_line in markdown_text.splitlines():
        line = raw_line.rstrip()
        if not line.strip():
            continue
        if line.startswith("### "):
            doc.add_heading(line[4:].strip(), level=3)
        elif line.startswith("## "):
            doc.add_heading(line[3:].strip(), level=2)
        elif line.startswith("# "):
            doc.add_heading(line[2:].strip(), level=1)
        elif re.match(r"^[-*]\s+", line):
            doc.add_paragraph(re.sub(r"^[-*]\s+", "", line), style="List Bullet")
        elif re.match(r"^\d+\.\s+", line):
            doc.add_paragraph(re.sub(r"^\d+\.\s+", "", line), style="List Number")
        else:
            p = doc.add_paragraph()
            # Handle **bold** inline segments without a full markdown parser
            parts = re.split(r"(\*\*.*?\*\*)", line)
            for part in parts:
                if part.startswith("**") and part.endswith("**"):
                    run = p.add_run(part[2:-2])
                    run.bold = True
                elif part:
                    p.add_run(part)

    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


def _md_to_pdf_bytes(markdown_text: str, title: str) -> bytes:
    """Converts simple Markdown into a .pdf using reportlab Platypus."""
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem
    from reportlab.lib.styles import getSampleStyleSheet
    from xml.sax.saxutils import escape

    styles = getSampleStyleSheet()
    story = []

    def inline_bold(text: str) -> str:
        # Convert **bold** to reportlab's <b> markup, escaping everything else first
        escaped = escape(text)
        return re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", escaped)

    for raw_line in markdown_text.splitlines():
        line = raw_line.rstrip()
        if not line.strip():
            story.append(Spacer(1, 8))
            continue
        if line.startswith("### "):
            story.append(Paragraph(inline_bold(line[4:]), styles["Heading3"]))
        elif line.startswith("## "):
            story.append(Paragraph(inline_bold(line[3:]), styles["Heading2"]))
        elif line.startswith("# "):
            story.append(Paragraph(inline_bold(line[2:]), styles["Title"]))
        elif re.match(r"^[-*]\s+", line):
            item_text = inline_bold(re.sub(r"^[-*]\s+", "", line))
            story.append(ListFlowable([ListItem(Paragraph(item_text, styles["Normal"]))], bulletType="bullet"))
        else:
            story.append(Paragraph(inline_bold(line), styles["Normal"]))

    buf = io.BytesIO()
    SimpleDocTemplate(buf, pagesize=letter, title=title).build(story)
    return buf.getvalue()


def tool_generate_document(args: dict, api_key: str = None) -> tuple[dict | None, str | None]:
    topic    = (args.get("topic") or "").strip()
    doc_type = (args.get("doc_type") or "report").strip().lower()
    fmt      = (args.get("format") or "md").strip().lower()

    if not topic:
        return None, "Please provide a topic for the document."
    if len(topic) > 500:
        return None, "Topic is too long — keep it under 500 characters."
    if doc_type not in DOC_TYPES:
        return None, f"Unknown document type '{doc_type}'. Choose one of: {', '.join(sorted(DOC_TYPES))}."
    if fmt not in DOC_FORMATS:
        return None, f"Unknown format '{fmt}'. Choose one of: {', '.join(sorted(DOC_FORMATS))}."

    system = DOC_SYSTEM_TMPL.format(doc_type=doc_type)
    markdown_text, err = ai_query_single_model(DOC_MODEL, system, topic, api_key=api_key,
                                                max_tokens=2200, temp=0.5)
    if err:
        return None, err
    if not markdown_text.strip():
        return None, "The model didn't return any content — try rephrasing your topic."

    title_match = re.search(r"^#\s+(.+)$", markdown_text, re.MULTILINE)
    title = title_match.group(1).strip() if title_match else topic[:80]
    safe_stub = re.sub(r"[^a-zA-Z0-9_-]+", "-", title.lower()).strip("-")[:50] or "document"

    result = {
        "markdown": markdown_text,
        "title": title,
        "doc_type": doc_type,
        "requested_format": fmt,
        "actual_format": fmt,
        "fallback_reason": None,
        "filename": f"{safe_stub}.md",
        "file_b64": None,
        "mime": "text/markdown",
    }

    if fmt == "docx":
        try:
            file_bytes = _md_to_docx_bytes(markdown_text, title)
            result.update(
                actual_format="docx", filename=f"{safe_stub}.docx",
                file_b64=base64.b64encode(file_bytes).decode("ascii"),
                mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        except ImportError:
            result["fallback_reason"] = "python-docx isn't installed on the server — sending Markdown instead."
            result["actual_format"] = "md"
        except Exception as e:
            log.error(f"docx export failed: {e}")
            result["fallback_reason"] = "DOCX export failed unexpectedly — sending Markdown instead."
            result["actual_format"] = "md"

    elif fmt == "pdf":
        try:
            file_bytes = _md_to_pdf_bytes(markdown_text, title)
            result.update(
                actual_format="pdf", filename=f"{safe_stub}.pdf",
                file_b64=base64.b64encode(file_bytes).decode("ascii"),
                mime="application/pdf",
            )
        except ImportError:
            result["fallback_reason"] = "reportlab isn't installed on the server — sending Markdown instead."
            result["actual_format"] = "md"
        except Exception as e:
            log.error(f"pdf export failed: {e}")
            result["fallback_reason"] = "PDF export failed unexpectedly — sending Markdown instead."
            result["actual_format"] = "md"

    if result["file_b64"] is None:
        # md, or graceful fallback from docx/pdf
        result["file_b64"] = base64.b64encode(markdown_text.encode("utf-8")).decode("ascii")

    return result, None


TOOLS = {
    "generate_avatar": {
        "fn": tool_generate_avatar,
        "desc": "Generate a free DiceBear SVG avatar from a seed and style.",
        "needs_key": False,
    },
    "generate_code": {
        "fn": tool_generate_code,
        "desc": "Generate code for a task/language, with static-only syntax verification.",
        "needs_key": True,
    },
    "generate_diagram": {
        "fn": tool_generate_diagram,
        "desc": "Generate a Mermaid.js diagram from a description.",
        "needs_key": True,
    },
    "generate_document": {
        "fn": tool_generate_document,
        "desc": "Generate a document (report/resume/article/etc) exported as md/docx/pdf.",
        "needs_key": True,
    },
    "generate_image": {
        "fn": tool_generate_image,
        "desc": "Generate a custom illustration/scene from a description, via Pollinations (free, no key).",
        "needs_key": False,
    },
}


# ══════════════════════════════════════
# MODULE 6 — Auto-Routing / Tool Calling Integration
# Gives the primary router model (nemotron) OpenAI-style function-calling schemas
# for every registered tool. One request decides: plain reply, or a single tool
# call. Slash commands (Modules 1-5) remain as direct shortcuts and bypass this
# entirely — this only activates for natural-language requests.
# ══════════════════════════════════════
ROUTER_MODEL = "nvidia/nemotron-3-super-120b-a12b:free"

TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "generate_avatar",
            "description": "Generate a free DiceBear SVG avatar image from a seed (e.g. a name) and a visual style. Use when the user asks for an avatar, profile picture, or icon to be generated/created.",
            "parameters": {
                "type": "object",
                "properties": {
                    "seed": {"type": "string", "description": "Text to derive the avatar from, e.g. a name."},
                    "style": {"type": "string", "enum": sorted(DICEBEAR_STYLES), "description": "DiceBear avatar style."},
                },
                "required": ["seed"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "generate_code",
            "description": "Generate source code for a described task in a given programming language, with a static (non-executing) syntax check. Use when the user asks to write, create, or generate code, a script, or a function.",
            "parameters": {
                "type": "object",
                "properties": {
                    "prompt": {"type": "string", "description": "Description of the code to generate."},
                    "language": {"type": "string", "description": "Target programming language, e.g. python, javascript."},
                },
                "required": ["prompt"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "generate_diagram",
            "description": "Generate a Mermaid.js diagram (flowchart, sequence diagram, class diagram, etc) from a description. Use when the user asks for a diagram, flowchart, chart of a process, architecture visual, or similar.",
            "parameters": {
                "type": "object",
                "properties": {
                    "prompt": {"type": "string", "description": "Description of the diagram/process/system to visualize."},
                },
                "required": ["prompt"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "generate_document",
            "description": "Generate a written document (report, resume, article, letter, proposal, summary, or essay) on a topic, exported as Markdown, DOCX, or PDF. Use when the user asks to write/draft/create a document, report, resume, article, or similar deliverable, especially if they want it downloadable.",
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {"type": "string", "description": "The subject/topic of the document."},
                    "doc_type": {"type": "string", "enum": sorted(DOC_TYPES), "description": "Kind of document."},
                    "format": {"type": "string", "enum": sorted(DOC_FORMATS), "description": "Export file format."},
                },
                "required": ["topic"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "generate_image",
            "description": "Generate a custom illustration, picture, or scene from a text description — e.g. 'a cat eating ice cream', 'a sunset over mountains', 'a robot playing guitar'. Use this for any request to draw, create, generate, paint, or make a PICTURE or IMAGE of something. Distinct from generate_avatar, which only makes small stylized profile-icon avatars — use generate_image for anything more detailed or scene-like. If the user implies a shape (portrait, landscape, passport photo, square, wallpaper, banner, 16:9, 9:16, etc.), keep that wording in the prompt you pass — the renderer picks image dimensions from it.",
            "parameters": {
                "type": "object",
                "properties": {
                    "prompt": {"type": "string", "description": "Description of the image/scene to generate."},
                },
                "required": ["prompt"],
            },
        },
    },
]


def _headers(title: str, key: str) -> dict:
    return {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "HTTP-Referer": os.getenv("APP_URL", "https://eka-2j47.onrender.com"),
        "X-Title": f"{BOT_NAME} {title}",
    }


def resolve_key(api_key: str = None):
    """BYOK only — the caller's own key is the only key ever used, in Free and Paid mode.
    Returns (key, error)."""
    key = (api_key or "").strip()
    if not key:
        return None, NEEDS_KEY_MSG
    if _is_paid() or _ctx("paid_requested", False):
        err = paid_guard(key)
        if err:
            return None, err
    return key, None


def explain_http_error(status: int, body: str, paid: bool) -> str:
    """Turn an OpenRouter error into something a person can act on."""
    detail = ""
    try:
        detail = (json.loads(body).get("error") or {}).get("message", "")
    except Exception:
        pass
    if status == 401:
        return "OpenRouter rejected your API key (invalid or revoked). Check it in Settings → AI Mode."
    if status == 402:
        return "Your OpenRouter account has no credits left for this model. Top up at openrouter.ai/credits or switch to Free mode."
    if status == 403:
        return f"OpenRouter blocked this request{': ' + detail if detail else '.'}"
    if status == 404:
        return "OpenRouter couldn't find that model — pick another in Settings → AI Mode." if paid else "Model unavailable."
    if status == 429:
        return "OpenRouter is rate-limiting this model right now. Wait a moment and try again."
    return f"The AI provider returned an error ({status}){': ' + detail[:160] if detail else '.'}"


def route_intent(user_msg: str, history: list = None, api_key: str = None):
    """Single function-calling request to the router model. Returns a dict:
    {"type": "tool", "tool": name, "args": {...}} if the model wants a tool,
    {"type": "text", "text": "..."} if it answered directly,
    or {"type": "none"} on any failure — callers fall through to the normal
    ai_query path, so auto-routing never blocks a reply."""
    key, err = resolve_key(api_key)
    if err:
        return {"type": "none"}

    messages = [{
        "role": "system",
        "content": (
            f"You are {BOT_NAME}'s routing layer. Decide whether the user's message requires "
            "calling one of the available tools (avatar/code/diagram/document generation), or "
            "is a normal conversational message you should just answer directly. Only call a "
            "tool when the user is clearly asking to generate/create/write/draw one of those "
            "specific artifacts. For everything else — questions, chat, opinions — respond "
            "directly with no tool call."
        ),
    }]
    if history:
        for m in history[-8:]:
            if m.get("role") in ("user", "assistant") and isinstance(m.get("content"), str) and m.get("content"):
                messages.append({"role": m["role"], "content": m["content"]})
    messages.append({"role": "user", "content": user_msg})

    body = {
        "model": _ctx("paid_model") or ROUTER_MODEL,
        "messages": messages,
        "tools": TOOL_SCHEMAS,
        "tool_choice": "auto",
        "max_tokens": 700,
        "temperature": 0.2,
    }
    if _is_paid():
        body.update(paid_request_extras(g.paid_model))

    try:
        resp = post_completion(_headers("Router", key), body, 30)
        if resp.status_code != 200:
            log.warning(f"router: HTTP {resp.status_code}: {resp.text[:200]}")
            return {"type": "none"}

        choice = (resp.json().get("choices") or [{}])[0]
        message = choice.get("message", {})
        tool_calls = message.get("tool_calls") or []

        if tool_calls:
            fn = tool_calls[0].get("function", {})
            name = fn.get("name")
            if name not in TOOLS:
                return {"type": "none"}
            try:
                args = json.loads(fn.get("arguments") or "{}")
            except (json.JSONDecodeError, TypeError):
                args = {}
            return {"type": "tool", "tool": name, "args": args}

        text = (message.get("content") or "").strip()
        if text:
            return {"type": "text", "text": clean(text)}
        return {"type": "none"}
    except requests.exceptions.Timeout:
        log.warning("router: timeout")
        return {"type": "none"}
    except Exception as e:
        log.error(f"router error: {e}")
        return {"type": "none"}


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
def ai_query(user_input: str, history: list = None, system: str = None, image_data_url: str = None, api_key: str = None) -> str:
    key, err = resolve_key(api_key)
    if err:
        return err
    paid = _is_paid()

    messages = [{"role": "system", "content": system or build_system()}]

    limit = _ctx("hist_limit", 16)
    if history and limit:
        for m in history[-limit:]:
            if m.get("role") in ("user", "assistant") and isinstance(m.get("content"), str) and m.get("content"):
                messages.append({"role": m["role"], "content": m["content"]})

    if image_data_url:
        messages.append({"role": "user", "content": [
            {"type": "text", "text": user_input or "Please describe this image."},
            {"type": "image_url", "image_url": {"url": image_data_url}},
        ]})
    else:
        messages.append({"role": "user", "content": user_input})

    headers = _headers("AI", key)
    temp_override = _ctx("temp")

    if paid:
        # Paid mode: exactly the model the user chose, nothing else — no silent fallback
        # to other (possibly pricier) models.
        models_to_try = [{"id": g.paid_model, "temp": 0.65, **paid_request_extras(g.paid_model)}]
        meta = PAID_BY_ID.get(g.paid_model)
        if image_data_url and meta and not meta["vision"]:
            return f"{meta['name']} can't read images. Pick a vision model (most paid models can) in Settings → AI Mode."
    else:
        models_to_try = [m for m in MODELS if not image_data_url or m.get("vision")]
        if image_data_url and not models_to_try:
            return "None of the configured models support image input right now."

    last_problem = None
    for model in models_to_try:
        try:
            t0   = time.time()
            body = {"model": model["id"], "messages": messages, "max_tokens": model["max_tokens"],
                    "temperature": temp_override if temp_override is not None else model["temp"]}
            if model.get("reasoning"):
                body["reasoning"] = model["reasoning"]
            resp = post_completion(headers, body, 60 if paid else 35)
            log.info(f"  {model['id']} → {resp.status_code} ({round(time.time()-t0,2)}s)")

            if resp.status_code == 200:
                data   = resp.json()
                choice = (data.get("choices") or [{}])[0]
                text   = ((choice.get("message") or {}).get("content") or "").strip()
                if text:
                    return clean(text)
                last_problem = "The model returned an empty reply."
                log.warning(f"  Empty reply from {model['id']} — raw: {resp.text[:500]}")
            elif resp.status_code == 429:
                last_problem = explain_http_error(429, resp.text, paid)
                log.warning(f"  Rate-limited on {model['id']}, trying next…")
                if not paid:
                    time.sleep(2.0)
            else:
                last_problem = explain_http_error(resp.status_code, resp.text, paid)
                log.warning(f"  Error {resp.status_code} on {model['id']} — body: {resp.text[:300]}")
        except requests.exceptions.Timeout:
            last_problem = "The model took too long to respond."
            log.warning(f"  Timeout on {model['id']}")
        except Exception as e:
            last_problem = "Something went wrong reaching the AI provider."
            log.error(f"  Error on {model['id']}: {e}")

    if paid:
        return last_problem or "The model didn't respond. Please try again."
    return "All AI models are temporarily unavailable. Please try again shortly."


def ai_query_single_model(model_id: str, system: str, user_input: str, api_key: str = None,
                           max_tokens: int = 1500, temp: float = 0.3):
    """Like ai_query but targets one specific model — used by tools that want a
    particular model's strengths (e.g. code generation). Free mode falls back through
    the waterfall; paid mode uses ONLY the user's chosen model. Returns (text, error)."""
    key, err = resolve_key(api_key)
    if err:
        return None, err
    paid = _is_paid()

    headers  = _headers("AI", key)
    messages = [{"role": "system", "content": system}, {"role": "user", "content": user_input}]

    candidates = [g.paid_model] if paid else [model_id] + [m["id"] for m in MODELS if m["id"] != model_id]
    last_problem = None
    for mid in candidates:
        try:
            t0   = time.time()
            body = {"model": mid, "messages": messages, "max_tokens": max_tokens, "temperature": temp}
            if paid:
                body.update(paid_request_extras(mid))
                body["max_tokens"] = max(max_tokens, body["max_tokens"])
            resp = post_completion(headers, body, 60 if paid else 45)
            log.info(f"  {mid} → {resp.status_code} ({round(time.time()-t0,2)}s)")

            if resp.status_code == 200:
                data   = resp.json()
                choice = (data.get("choices") or [{}])[0]
                text   = ((choice.get("message") or {}).get("content") or "").strip()
                if text:
                    return clean(text), None
                last_problem = "The model returned an empty reply."
            elif resp.status_code == 429:
                last_problem = explain_http_error(429, resp.text, paid)
                if not paid:
                    time.sleep(1.5)
            else:
                last_problem = explain_http_error(resp.status_code, resp.text, paid)
                log.warning(f"  Error {resp.status_code} on {mid}: {resp.text[:300]}")
        except requests.exceptions.Timeout:
            last_problem = "The model took too long to respond."
        except Exception as e:
            last_problem = "Something went wrong reaching the AI provider."
            log.error(f"  Error on {mid}: {e}")

    return None, (last_problem if paid else None) or "All AI models are temporarily unavailable. Please try again shortly."


# ══════════════════════════════════════
# QUICK REPLIES (no AI cost)
# ══════════════════════════════════════
def quick_reply(text: str) -> str | None:
    t = text.lower().strip().rstrip("?!.,")
    greetings = {"hi","hello","hey","namaste","namaskar","hola","yo","hii","hai","hyy","good morning","good evening","good night","good afternoon"}
    if t in greetings:
        who = _ctx("user_name", "")
        hey = f"Hey {who}! 👋" if who else "Hey! 👋"
        return f"{hey} I'm **{BOT_NAME}**, your AI assistant, built in India 🇮🇳. What can I help you with?"

    identity = re.search(r"\b(who are you|your name|what are you|introduce yourself|aap kaun|tumhara naam|kaun ho)\b", t)
    if identity:
        return f"I'm **{BOT_NAME}** — an AI assistant built by **{DEV_NAME}** in India 🇮🇳. I can help with questions, code, writing, analysis, and more. Ask away!"

    return None


# ══════════════════════════════════════
# BYOK — Bring Your Own OpenRouter Key
# Frontend sends the user's key (from localStorage) via header on each request.
# Free mode falls back to the server env key; PAID mode never does (see resolve_key).
# ══════════════════════════════════════
def get_user_api_key() -> str | None:
    key = request.headers.get("Authorization", "").strip()
    if key.lower().startswith("bearer "):
        key = key[7:].strip()
    if not key:
        key = (request.headers.get("X-API-Key") or "").strip()
    return key or None


# Only ask the router model (an extra LLM call) when the message even sounds like a
# tool request. Saves a call on every ordinary message — which matters for free-tier
# rate limits and for paid-mode cost.
TOOL_HINT = re.compile(
    r"\b(draw|sketch|paint|illustrat\w*|diagram|flow\s?chart|sequence|er\s+diagram|mermaid|avatar|"
    r"image|picture|photo|logo|wallpaper|poster|"
    r"code|function|script|program|snippet|class|algorithm|"
    r"document|report|resume|r[eé]sum[eé]|cv|essay|article|letter|proposal|summary|pdf|docx|"
    r"generate|create|make|write|draft|build)\b", re.I)


# ══════════════════════════════════════
# ROUTES
# ══════════════════════════════════════
@app.route("/")
def index():
    return render_template("index.html", bot_name=BOT_NAME)


@app.route("/api/chat", methods=["POST"])
def chat():
    payload  = request.get_json(silent=True) or {}
    user_msg = (payload.get("message") or "").strip()
    history  = payload.get("history", [])
    if not isinstance(history, list):
        history = []
    use_web  = bool(payload.get("wiki", False))
    image    = payload.get("image")  # optional base64 data-URL of an attached photo
    user_key = get_user_api_key()    # BYOK — user's own OpenRouter key, if provided
    load_chat_prefs(payload)

    if not user_msg and not image:
        return jsonify({"reply": "Your message seems empty. What would you like to ask?", "source": "system"})

    if not user_key:   # BYOK is compulsory — the frontend shows its "add your key" screen on needs_key
        return jsonify({"reply": NEEDS_KEY_MSG, "source": "system", "needs_key": True})

    perr = paid_guard(user_key)
    if perr:
        return jsonify({"reply": perr, "source": "system"})

    mode = f"paid:{g.paid_model}" if g.paid_model else "free"
    log.info(f"→ [{mode}] {user_msg[:80]}{' [+image]' if image else ''}{' [BYOK]' if user_key else ''}{' [web]' if use_web else ''}")

    # Image path — route straight to a vision-capable model, skip quick-replies/web-search
    if image:
        reply = ai_query(user_msg, history=history, image_data_url=image, api_key=user_key)
        log.info(f"← ai+vision: {reply[:60]}")
        return jsonify({"reply": reply, "source": "ai"})

    # Quick path (no AI call)
    quick = quick_reply(user_msg)
    if quick:
        return jsonify({"reply": quick, "source": "system"})

    # ── Auto-routing — let the router model decide if a tool fits ──
    # Only consulted when the message looks like a tool request. A router *text* reply is
    # honoured only when web search is OFF; with web search ON we must not let it
    # short-circuit the search (that was the "web search never works" bug).
    routed = {"type": "none"}
    if TOOL_HINT.search(user_msg):
        routed = route_intent(user_msg, history=history, api_key=user_key)

    if routed["type"] == "tool":
        tool_name = routed["tool"]
        tool = TOOLS[tool_name]
        try:
            data, err = tool["fn"](routed["args"], api_key=user_key)
        except Exception as e:
            log.error(f"tool '{tool_name}' crashed: {e}")
            return jsonify({"reply": "That tool hit an unexpected error — please try again.", "source": "system"})
        log.info(f"← router→tool:{tool_name} {'ok' if not err else 'error: ' + err}")
        if err:
            return jsonify({"reply": err, "source": "system"})
        return jsonify({"reply": None, "source": "tool", "tool": tool_name, "tool_data": data})

    if routed["type"] == "text" and not use_web:
        log.info(f"← router (direct reply): {routed['text'][:60]}")
        return jsonify({"reply": routed["text"], "source": "ai"})

    # ── Web search path ──
    web_failed = False
    if use_web:
        diag = []
        content, label, sources = web_search(user_msg, limit=g.search_n, diag=diag)
        if content:
            reply = ai_query(user_msg, history=history, system=build_system(content), api_key=user_key)
            log.info(f"← web+ai [{label}]: {reply[:60]}")
            return jsonify({"reply": reply, "source": "web+ai", "web_source": label, "web_sources": sources})
        web_failed = True
        log.warning(f"web search found nothing for {user_msg[:60]!r}: {diag}")

    # ── Standard AI ──
    reply = ai_query(user_msg, history=history, api_key=user_key)
    log.info(f"← ai: {reply[:60]}")
    out = {"reply": reply, "source": "ai"}
    if web_failed:
        out["web_failed"] = True
    return jsonify(out)


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


@app.route("/api/tool/<tool_name>", methods=["POST"])
def run_tool(tool_name):
    tool = TOOLS.get(tool_name)
    if not tool:
        return jsonify({"ok": False, "tool": tool_name, "error": "Unknown tool."}), 404

    args = request.get_json(silent=True) or {}
    user_key = get_user_api_key()  # BYOK — forwarded to every tool; LLM-backed tools use it, others ignore it

    if tool.get("needs_key"):
        if not user_key:
            return jsonify({"ok": False, "tool": tool_name, "error": NEEDS_KEY_MSG, "needs_key": True}), 401
        perr = paid_guard(user_key)
        if perr:
            return jsonify({"ok": False, "tool": tool_name, "error": perr}), 400

    log.info(f"→ tool:{tool_name} args={str(args)[:120]}{' [BYOK]' if user_key else ''}")
    data, err = tool["fn"](args, api_key=user_key)

    if err:
        log.warning(f"← tool:{tool_name} error: {err}")
        return jsonify({"ok": False, "tool": tool_name, "error": err}), 400

    log.info(f"← tool:{tool_name} ok")
    return jsonify({"ok": True, "tool": tool_name, "data": data})


# ══════════════════════════════════════
# MODEL LISTS for the Settings screen
# ══════════════════════════════════════
_models_cache = {"t": 0, "data": None}


def _per_million(price) -> float | None:
    try:
        return round(float(price) * 1_000_000, 3)
    except (TypeError, ValueError):
        return None


def _live_prices():
    """{model_id: (in, out, context)} from OpenRouter's public model list, cached 1h.
    Returns None if it can't be fetched (the curated list is then shown unverified)."""
    now = time.time()
    if _models_cache["data"] is None or now - _models_cache["t"] > 3600:
        try:
            r = requests.get("https://openrouter.ai/api/v1/models", timeout=10,
                             headers={"User-Agent": f"{BOT_NAME}AI/4.0"})
            r.raise_for_status()
            live = {}
            for m in r.json().get("data", []):
                pr = m.get("pricing") or {}
                live[m.get("id", "")] = (_per_million(pr.get("prompt")), _per_million(pr.get("completion")), m.get("context_length"))
            _models_cache.update(t=now, data=live)
        except Exception as e:
            log.warning(f"models fetch failed: {e}")
            if _models_cache["data"] is None:
                return None
    return _models_cache["data"]


@app.route("/api/models")
def models():
    """What each mode uses. Free: the fixed free waterfall. Paid: the curated catalogue
    (verified against OpenRouter when reachable, with live per-million-token prices)."""
    live = _live_prices()
    rows = []
    for m in PAID_MODELS:
        if live is not None and m["id"] not in live:
            continue                      # retired / renamed on OpenRouter — don't offer it
        p_in, p_out, ctx = (live or {}).get(m["id"], (None, None, None))
        rows.append({"id": m["id"], "name": m["name"], "tier": m["tier"], "vision": m["vision"],
                    "in": p_in, "out": p_out, "context": ctx})
    ids = {r["id"] for r in rows}
    rec = next((i for i in PAID_RECOMMENDED if i in ids), rows[0]["id"] if rows else None)
    free = [{"id": m["id"], "name": shortname(m["id"]), "vision": m["vision"]} for m in MODELS]
    return jsonify({"live": live is not None, "models": rows, "recommended": rec, "free": free})


def shortname(model_id: str) -> str:
    return model_id.split("/", 1)[-1].split(":")[0]


@app.route("/api/key-info")
def key_info():
    """Validate the caller's OpenRouter key and report credit usage (never stores it)."""
    key = get_user_api_key()
    if not key:
        return jsonify({"ok": False, "error": "No key provided."}), 400
    last = "unknown error"
    for url in ("https://openrouter.ai/api/v1/key", "https://openrouter.ai/api/v1/auth/key"):
        try:
            r = requests.get(url, headers={"Authorization": f"Bearer {key}"}, timeout=8)
            if r.status_code == 401:
                return jsonify({"ok": False, "error": "OpenRouter rejected this key (invalid or revoked)."}), 200
            if r.status_code == 200:
                d = r.json().get("data", {})
                return jsonify({"ok": True, "label": d.get("label"), "usage": d.get("usage"),
                                "limit": d.get("limit"), "limit_remaining": d.get("limit_remaining"),
                                "is_free_tier": d.get("is_free_tier")})
            last = f"HTTP {r.status_code}"
        except Exception as e:
            last = str(e)[:100]
    return jsonify({"ok": False, "error": f"Couldn't verify the key ({last})."}), 200


@app.route("/api/search-test")
def search_test():
    """Diagnostics: which search engines work from THIS server (datacenter IPs get blocked
    by some). Visit /api/search-test?q=latest+news on your Render URL."""
    q = (request.args.get("q") or "latest news").strip()[:120]
    diag = []
    content, label, sources = web_search(q, limit=3, diag=diag)
    return jsonify({"query": q, "worked": bool(content), "engine": label, "attempts": diag,
                    "sources": sources, "preview": (content or "")[:300]})


@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "bot": BOT_NAME,
                    "models": [m["id"] for m in MODELS],
                    "byok_required": True,
                    "time": datetime.now().isoformat()})


# Serve the static 404.html (shared with GitHub Pages) for unmatched routes
# on the Flask side too, so both deployment targets show the same page.
@app.errorhandler(404)
def not_found(e):
    return send_from_directory(app.root_path, "404.html"), 404


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    log.info(f"Starting {BOT_NAME} AI on :{port}")
    app.run(debug=os.getenv("DEBUG", "false").lower() == "true", host="0.0.0.0", port=port)
