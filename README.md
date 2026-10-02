# EKA AI

Flask backend + static frontend (GitHub Pages). Stateless: **no accounts, no database**.

## What changed in v2
- **No login/signup.** Name, "about" and profile photo are stored in the browser (localStorage). The name is sent with each chat so the AI can address you.
- **Stop button.** The send button turns into Stop while EKA is thinking or typing (Esc also works).
- **Web search fixed.** The router no longer swallows search requests; search uses ddgs (valid backends) -> DuckDuckGo HTML -> Wikipedia, shows source links, and tells you if the web can't be reached. Diagnose on your server: `/api/search-test?q=latest+news`.
- **Free / Paid mode** (Settings > AI Mode). Free uses the free OpenRouter models; Paid uses a separate curated set of faster/stronger models (verified against OpenRouter's live list), with a payment warning.
- **New settings:** response style, creativity, memory length, custom instructions, search result count, source links, key check (usage), import chat history.

## v3
- **New launch animation** ("bloom"): orb blooms, three orbits spin up, E·K·A resolve out of blur, then the screen irises shut onto the app. Uses the active theme's colours.
- **Voice is OFF by default.** EKA only speaks if you turn on Settings > Voice > "EKA speaks replies aloud" (or the speaker button, or Voice-only mode). The per-message speaker icon still plays a single reply.
- **16 themes** (9 new: Ocean, Sunset, Forest, Crimson, Aurora, Midnight AMOLED, Sky, Peach, Lavender).
- **9 live backgrounds** (Settings > Theme): dust, aurora ribbons, glow orbs, starfield, digital rain, waves, fireflies, bubbles, or off. They follow theme colours, pause in hidden tabs and honour Reduce motion.

## v4 — bring your own key (compulsory)
- **No server AI key.** Do not set `AI_API_KEY` on Render; it is no longer read. Every user must add their own OpenRouter key (free to create), in **both** Free and Paid mode. A blocking "Add your OpenRouter key" screen appears until one is saved; the server refuses any chat/tool request without it.
- **Free mode** = the 4 free models (waterfall). **Paid mode** = curated paid models grouped Fast / Balanced / Best with live prices, recommended default pre-selected, or any custom `provider/model` ID. Paid calls go to exactly the model chosen (no silent fallback to pricier models).

## Run locally
    pip install -r requirements.txt
    python app.py   # no server key needed — each user adds their own in the app

## Env vars
| name | purpose |
|---|---|
| FRONTEND_ORIGINS | comma-separated allowed origins (default: abhiraj1121.github.io + localhost) |
| APP_URL | sent to OpenRouter as HTTP-Referer |

## Deploy
Render: `gunicorn app:app --timeout 90 --workers 2` (see Procfile). Frontend: serve `index.html` + `static/` from GitHub Pages.
`index.html` in this repo is currently the maintenance page; the real app page is `templates/index.html` (also copied to `index-original.html`). Replace `index.html` with it to go live.
