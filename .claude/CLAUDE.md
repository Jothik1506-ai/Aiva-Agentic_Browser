# AIVA Agentic Browser — Project Context for AI Coding Agents

This file is the onboarding brief for any AI coding assistant (Claude Code, Cursor,
Copilot, Codex, etc.) working in this repo. Read it fully before making changes.
Keep it updated when architecture, ports, or conventions change — it goes stale fast
otherwise and future sessions will re-learn the same lessons the hard way.

## What this project is

A desktop browser (Electron) with an integrated wellness backend (FastAPI + Python
CV models) and an AI chat assistant. It currently ships as a wellness-focused
browser (facial fatigue detection, posture/squat tracking, focus mode, breathing/
meditation/neck-exercise mini-apps). The active direction is to evolve it into an
**agentic browser**: the AI assistant should be able to act on the browser itself
(navigate, read page content, eventually click/fill/complete multi-step tasks) instead
of only answering wellness questions.

Repo name: `Aiva-Agentic_Browser`. Internal branding/titles in the code still say
"Wellness Browser" / `zen-browser` (package.json name) — this is a rebrand in
progress, not a bug. Don't do a mass find-and-replace rename unless asked; update
strings incrementally as you touch each file.

## Architecture

```
Electron (frontend)                    FastAPI (backend)
├── main.js          Electron main     backend/server.py
│                     process; spawns   ├── MediaPipe FaceLandmarker (fatigue/EAR/MAR)
│                     `python           ├── YOLOv8-pose (squat counting, posture)
│                     backend/server.py`├── YOLOv8 (object/phone detection)
│                     on startup        ├── pycaw (Windows system volume)
├── preload.js        (currently empty ├── OpenAI client (AI chat, /api/chat)
│                     — no exposed      └── uvicorn on 127.0.0.1:5001
│                     contextBridge
│                     APIs yet)
├── index.html         Dashboard + <webview> browser shell
├── renderer.js         All frontend logic (~1100+ lines, single file, no bundler)
├── style.css           Everything is hand-written CSS, uses CSS custom properties
└── {breathing,neck,meditation}.{html,js,css}   Standalone wellness mini-apps
```

There is no build step for the frontend — `index.html` loads `renderer.js` and
`style.css` directly via `<script>`/`<link>`. No TypeScript, no bundler, no
framework. Keep changes consistent with that (don't introduce a build step without
discussing it first).

The Electron `<webview>` tag (`#webview` inside `#webWrap`) is the actual browsing
surface. The dashboard (`#dashboard`) and the webview are mutually exclusive views
toggled by adding/removing the `hidden` class — see `navigate()` and `showHome()`
in `renderer.js`.

## Ports & endpoints

- Backend: `http://127.0.0.1:5001` (NOT 5000 — several of the older `.md` docs in
  this repo say 5000, that's stale; the code (`backend/server.py` bottom,
  `uvicorn.run(..., port=5001)`) is the source of truth).
- Frontend: Electron desktop window, no HTTP port.

Backend endpoints (`backend/server.py`):
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/status` | Health check |
| GET | `/api/weather` | Mock weather widget data |
| GET | `/api/news` | Mock news widget data |
| GET | `/api/apps` | Quick-launch app list |
| POST | `/api/resolve` | Resolve a search-bar query into a URL (used by `navigate()`) |
| POST | `/api/face_auth` | Face-based login/auth via MediaPipe |
| POST | `/api/analyze_face` | Fatigue/stress analysis (EAR/MAR from face mesh) |
| GET | `/api/health/volume` | Reads Windows system volume via pycaw |
| POST | `/api/exercise` | YOLOv8-pose squat counting frame-by-frame |
| POST | `/api/history` | Logs browsing history (currently just returns `{"status": "logged"}` — not persisted) |
| POST | `/api/chat` | AI Wellness Assistant chat, calls OpenAI `gpt-4o` with a fixed wellness-only system prompt |

`/api/chat` is the natural extension point for agentic behavior — right now it's a
plain Q&A endpoint with no tool use / function calling and no awareness of the
current page or browser state.

Spotify: `requirements.txt` includes `spotipy` and `.env.example` has
`SPOTIPY_CLIENT_ID`/`SECRET`, but there is no actual Spotify API integration wired up
in `server.py` — the "Spotify Hub" is just the webview navigating to open.spotify.com.
Don't assume the Spotify credentials do anything yet.

## Environment gotchas (learned the hard way — don't rediscover these)

1. **`face_landmarker.task` is not in the repo** (it's git-ignored, ~a few MB).
   Run `python download_model.py` once after cloning — it fetches it from Google's
   MediaPipe model storage into `backend/`. `server.py` will crash on import without it.
2. **numpy must be `<2.0`.** `pip install -r requirements.txt` alone pulls in
   `ultralytics`, which installs numpy 2.x, but `mediapipe`'s TensorFlow dependency
   chain requires numpy 1.x and will fail with `AttributeError: _ARRAY_API not found`
   / `ImportError: numpy.core._multiarray_umath failed to import`. After installing
   requirements, run `pip install "numpy<2.0"` to force it back down. This is safe —
   ultralytics/torch/opencv all still work fine on numpy 1.26.x despite pip's
   dependency-conflict warning about opencv wanting numpy>=2.
3. **`requirements.txt` is incomplete.** It's missing `mediapipe`, `ultralytics`,
   `spotipy`, `pycaw`, `comtypes` even though `server.py` imports all of them. Install
   them explicitly if a fresh `pip install -r requirements.txt` leaves import errors.
4. **`ELECTRON_RUN_AS_NODE`**: if this env var is set in your shell, `electron .`
   silently runs as plain Node instead of launching the GUI (`app.whenReady` will be
   `undefined` and main.js throws immediately). Unset it before `npm start` if you hit
   `TypeError: Cannot read properties of undefined (reading 'whenReady')`.
5. **`main.js` spawns its own `python backend/server.py`** on `createWindow()` (see
   `startPythonServer()`). If you already have a backend running manually on 5001,
   Electron's spawned copy will just fail to bind the port and log a harmless error —
   it doesn't crash the app. Don't "fix" this by killing your manual backend; it's
   expected redundancy, not a bug, unless you're specifically working on process
   lifecycle management.
6. **No `.env` ships in git** (gitignored). Copy `.env.example` to `.env` in the repo
   root. `OPENAI_API_KEY` is required for `/api/chat` to do anything other than
   return an error string; the app runs fine without it otherwise.
7. **Large binaries are committed directly to git**: `yolov8n.pt`, `yolov8n-pose.pt`
   (~6.5MB each), and `Song 1 final.wav` (~63MB) are all tracked in the repo root,
   not via Git LFS. Be aware of this before doing broad git operations (clone time,
   history size) — raise it with the team before changing, don't unilaterally
   remove/rewrite history.

## Recent fixes worth knowing about

- **Home button overlap bug (fixed)**: `.webWrap`'s height was a hardcoded
  `calc(100vh - 65px)`, but the real bottom nav bar (`#bottomBrowserBar`) could
  render taller than that, letting the `<webview>` bleed under the bar and swallow
  clicks meant for the Home button. Fixed by having `renderer.js` measure the bar's
  real height (`syncBottomBarHeight()`) into a `--bottom-bar-height` CSS var that
  `.webWrap` consumes, plus a redundant floating "⌂ Home" button
  (`#floatingHomeBtn`) overlaid top-left of the webview as a backup escape hatch. If
  you touch the bottom bar's layout (add buttons, change padding), this dynamic
  sync means you generally don't need to hand-tune a pixel height anywhere.

## Agentic browser roadmap (in progress, not yet built)

Discussed direction, smallest-first:
1. **Navigate + read** — AI can open URLs and read/summarize the current webview
   page's text via chat. (Not yet started.)
2. **Navigate + read + act** — AI can click elements / fill forms driven by DOM
   inspection it reads back from the page (needs a way to extract interactive
   elements + selectors from the webview, likely via `webContents.executeJavaScript`
   through the `<webview>`'s guest page).
3. **Full autonomous multi-step agent** — plan/observe/act loop across multiple
   pages/steps with tool-use/function-calling, step limits, and a stop mechanism.

`/api/chat` and `renderer.js`'s chat handling (`sendMessage()`, around line ~914) are
the two places this will need to grow from. `preload.js` is currently empty — any
webview-content-reading capability will likely need a `contextBridge` API exposed
there, or `webview.executeJavaScript()` called from `renderer.js` directly (simpler,
no context isolation currently since `nodeIntegration: true, contextIsolation: false`
in `main.js`'s `BrowserWindow` config — that's a real security looseness worth
revisiting once the webview starts executing AI-driven actions on arbitrary sites).

## Conventions

- No comments explaining *what* code does — only *why*, for non-obvious constraints.
- Don't introduce a bundler/framework/TypeScript without discussing it first — this
  is intentionally a plain HTML/CSS/JS Electron app.
- Test UI changes by actually launching the app (see README "Running Locally"), not
  just by reading the diff — the webview/dashboard toggle and CSS layering issues in
  this codebase don't show up from static review.
- Don't touch the committed model/audio binaries' history without asking first.
