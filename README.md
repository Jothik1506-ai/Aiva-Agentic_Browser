# 🌟 AIVA — Agentic Wellness Browser

AIVA is a desktop browser (Electron) built around two ideas: a **wellness layer**
(facial fatigue detection, posture tracking, focus mode, guided breathing/
meditation/neck exercises) and, going forward, an **agentic layer** — an AI
assistant that doesn't just answer questions in a side panel, but can act on the
browser itself: read pages, navigate, and eventually complete multi-step tasks on
the user's behalf.

Today it ships as a working wellness browser with an AI chat assistant. The
agentic capability (AI controlling the browser) is the active area of development —
see [Roadmap](#-roadmap) below.

---

## 🧠 New to this repo? Start here

Before writing any code, point your AI coding assistant (Claude Code, Cursor,
Copilot Chat, Codex, etc.) at **[`.claude/CLAUDE.md`](.claude/CLAUDE.md)** — it has
the full architecture, the exact environment gotchas that cost real time to
discover (missing deps, numpy version conflicts, port mismatches between the docs
and the code, an Electron env-var trap), the API surface, and the current agentic
roadmap.

**Paste this into your IDE/AI assistant when you start working in this repo:**

> I'm working in the AIVA Agentic Browser repo (Electron + FastAPI wellness
> browser being evolved into an agentic browser). Read `.claude/CLAUDE.md` at the
> repo root first — it has the architecture, known environment gotchas (missing
> Python deps, a numpy version conflict, the real backend port, an Electron
> `ELECTRON_RUN_AS_NODE` trap, and committed large binaries), the full backend API
> list, and the in-progress agentic-browser roadmap. Don't rediscover those from
> scratch — follow what's documented there, and update that file if you learn
> something new that the next person shouldn't have to re-learn.

---

## 📋 Prerequisites

- **Python 3.11+** (with pip)
- **Node.js** (with npm) — tested with Node 22, Electron 39
- **Git**
- **Webcam** (for facial fatigue detection and posture tracking)
- **Windows** (pycaw/volume control and some setup scripts are Windows-specific;
  the app hasn't been verified on Mac/Linux)

---

## 🚀 Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/Jothik1506-ai/Aiva-Agentic_Browser.git
cd Aiva-Agentic_Browser
```

### 2. Set up the Python backend

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

# requirements.txt is missing a few packages server.py actually imports — install them too:
pip install mediapipe ultralytics spotipy pycaw comtypes

# mediapipe's TensorFlow dependency needs numpy 1.x, but the step above installs numpy 2.x.
# Force it back down (this is safe — everything else still works on 1.26.x):
pip install "numpy<2.0"

# Download the face landmark model (git-ignored, not in the repo):
python download_model.py
```

### 3. Set up the Electron frontend

```bash
npm install
```

### 4. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and add your `OPENAI_API_KEY` (needed for the AI chat assistant —
everything else works without it). The Spotify credentials in `.env.example` are
placeholders for a future integration; nothing reads them yet.

---

## ▶️ Running the Application

You need **two processes** running: the Python backend and the Electron frontend.
(`main.js` also auto-spawns its own copy of the backend on launch — if you already
started it manually, the auto-spawned one will just fail to bind the port silently.
That's expected, not a bug.)

**Terminal 1 — Backend (FastAPI):**
```powershell
cd backend
python server.py
```
Runs on **http://127.0.0.1:5001**. Verify it's up: `curl http://127.0.0.1:5001/api/status`.

**Terminal 2 — Frontend (Electron):**
```powershell
npm start
```

If `npm start` throws `TypeError: Cannot read properties of undefined (reading
'whenReady')`, your shell has `ELECTRON_RUN_AS_NODE` set — unset it and retry (see
`.claude/CLAUDE.md` for why).

---

## 📁 Project Structure

```
Aiva-Agentic_Browser/
├── .claude/
│   └── CLAUDE.md          # Full architecture + gotchas brief for AI coding agents
├── backend/
│   ├── server.py          # FastAPI backend — AI chat, face/pose analysis, all APIs
│   └── *.pt / *.task      # YOLOv8 + MediaPipe models (some git-ignored)
├── index.html             # Dashboard + browser shell (<webview>-based)
├── style.css              # All styling, plain CSS with custom properties
├── renderer.js             # All frontend logic — no bundler, no framework
├── main.js                # Electron main process (creates window, spawns backend)
├── preload.js             # Currently empty — no exposed contextBridge APIs yet
├── breathing/neck/meditation .html/.js/.css   # Standalone wellness mini-apps
├── download_model.py      # One-time script to fetch the MediaPipe face model
├── requirements.txt       # Python deps (incomplete — see Setup step 2)
└── package.json           # Node deps (Electron only)
```

---

## 🔧 Core Features (today)

- 🤖 **AI Wellness Assistant** — chat-based wellness/productivity Q&A via OpenAI.
- ✅ **Facial Fatigue Detection** — MediaPipe face mesh (EAR/MAR-based stress signals).
- ✅ **Posture & Squat Tracking** — YOLOv8-pose powered exercise monitoring.
- 🛡️ **Focus Mode** — blocks distracting domains, swaps quick-launch shortcuts.
- 📏 **Ultra-slim browser UI** with a real `<webview>` for actual web browsing.
- 🧘 **Guided wellness breaks** — breathing, neck exercise, and meditation mini-apps.
- 🎨 **Wallpaper picker** with glassmorphism styling.

## 🎯 Roadmap: becoming an agentic browser

The AI assistant currently only answers wellness questions — it has no awareness
of the current page and can't act on the browser. Planned progression (smallest
first):

1. **Navigate + read** — chat can open URLs and read/summarize the current page.
2. **Navigate + read + act** — chat can click elements and fill forms based on the
   page's DOM.
3. **Full autonomous agent** — multi-step planning across pages with tool-use,
   step limits, and a stop mechanism.

See `.claude/CLAUDE.md` → "Agentic browser roadmap" for the concrete extension
points (`/api/chat`, `renderer.js`'s chat handler, `preload.js`).

---

## 🐛 Troubleshooting

### "Port 5001 already in use" (older docs in this repo say 5000 — that's stale)
- Stop any other running `python server.py` process, or change the port in
  `backend/server.py` (last line).

### Backend crashes on `import mediapipe` with `AttributeError: _ARRAY_API not found`
- You have numpy 2.x installed. Run `pip install "numpy<2.0"`.

### Backend crashes with a missing `face_landmarker.task` error
- Run `python download_model.py` from the repo root.

### "Camera not found"
- Ensure no other app is using your webcam; grant camera permissions in Windows
  settings for Electron/Node.

### Electron window never opens, no error
- Check whether `ELECTRON_RUN_AS_NODE` is set in your environment and unset it.

---

## 👥 Contributing

This is a small, actively-changing hackathon-turned-product codebase — no build
step, no framework, plain HTML/CSS/JS by design. Keep changes consistent with that
unless the team decides otherwise. Update `.claude/CLAUDE.md` whenever you learn
something a teammate (or their AI assistant) shouldn't have to rediscover.

## 📄 License

This project is open-source and available for educational purposes.
