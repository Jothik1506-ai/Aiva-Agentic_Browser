# Aiva-Agentic-browser — Project Context for AI Coding Agents

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

Project name: `Aiva-Agentic-browser`. The current checkout folder is
`Aiva-Agentic_Browser`; package metadata uses the npm-compatible lowercase form
`aiva-agentic-browser`.

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
├── index.html         Dashboard + vertical sidebar + initial <webview> host
├── renderer.js         All frontend logic (~1500+ lines, single file, no bundler)
├── style.css           Everything is hand-written CSS, uses CSS custom properties
└── {breathing,neck,meditation}.{html,js,css}   Standalone wellness mini-apps
```

There is no build step for the frontend — `index.html` loads `renderer.js` and
`style.css` directly via `<script>`/`<link>`. No TypeScript, no bundler, no
framework. Keep changes consistent with that (don't introduce a build step without
discussing it first).

The initial Electron `<webview>` (`#webview` inside `#webWrap`) becomes the first
sidebar tab. `renderer.js` creates an additional `<webview>` for every new tab, so
switching tabs preserves the guest page and its navigation history. The dashboard
is shown when the active tab is `about:blank`; otherwise `#webWrap` displays only
the active tab's webview.

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
| POST | `/api/chat` | Aiva Agentic Assistant chat; supports current-page context and browser tool-call continuations |

`/api/chat` accepts optional current-page context and a typed `tool_history`.
`renderer.js` executes one ordered tool call at a time (`parallel_tool_calls=False`)
and returns its result for the next model turn. Runs are capped at
`MAX_AGENT_STEPS` (14) and expose a Stop control that aborts the in-flight fetch.
Tools are defined in `BROWSER_TOOLS` (`server.py`) and executed in
`executeBrowserTool()` (`renderer.js`) — both must be updated together:

| Group | Tools |
|---|---|
| Navigation | `navigate`, `go_back`, `go_forward`, `reload_page`, `get_current_url` |
| Reading | `read_page`, `find_elements`, `scroll_page` |
| Interaction | `click_element`, `fill_input` |
| Tabs | `open_tab`, `list_tabs`, `switch_tab`, `close_tab` |
| Wellness | `get_wellness_status`, `suggest_break` |

Page interaction works by index, not selector: `find_elements` walks the guest
DOM, filters to visible/enabled interactive nodes, stamps each with a
`data-aiva-idx` attribute, and returns the list. `click_element`/`fill_input`
then re-find the node by that attribute. Indices go stale whenever the page
changes, so the model is told to re-run `find_elements` after any navigation.
`fill_input` assigns through the prototype `value` setter so React-style
frameworks see the change. After a click or a submitted fill,
`settleAfterInteraction()` waits ~400ms to see whether a navigation started and,
if so, waits for it to finish before the next step runs.

Backend validates replayed `tool_history` against `BROWSER_TOOL_NAMES` and caps
both history length and per-result size before rebuilding the OpenAI message
array.

## The wellness-aware agent (the product differentiator)

Every other agentic browser reads the *page*. Aiva also reads the *person*, and
lets that change how the agent behaves. This is the one thing competitors
cannot copy without a camera pipeline, so treat it as load-bearing.

`processFrame()` already polled `/api/analyze_face` once a second; those reads
now also feed `recordWellnessSample()` in `renderer.js`, which keeps a rolling
15-minute window of `{state, strain, away, phone}` samples. `getWellnessSnapshot()`
derives screen time, time since last break, strain ratio, unbroken strain streak,
and a `level` of `ok` / `elevated` / `high` via `gradeWellness()`.

Four things consume that snapshot:
1. **Chat context** — `attachWellnessContext()` puts a one-line summary on
   `wellness_context`, which `/api/chat` injects as a system message. The system
   prompt tells the model to let it change *how* it works (shorter answers, no
   optional side-quests at `high`), mention it at most once per conversation,
   never diagnose, and drop it if the user says they're fine.
2. **Mid-run checkpoint** — in `sendMessage()`, once a run passes
   `WELLNESS_CHECKPOINT_AFTER_STEPS` (5) at `level === "high"`, the agent stops
   itself and offers "Keep going" / "Pause & take a break" instead of silently
   burning the remaining step budget. This is the headline behaviour.
3. **Tools** — `get_wellness_status` lets the model check in; `suggest_break`
   renders an offer card wired to the existing breathing/neck/meditation apps.
   It is an *offer*: the tool never navigates, the user clicks.
4. **Proactive nudge** — `#wellnessNudge` appears on sustained `high` strain
   outside any chat turn.

Tuning invariants worth preserving (all covered by tests, see below):
- `gradeWellness()` is deliberately conservative — a brief drowsy blip must
  never interrupt. `high` needs a 3-min unbroken streak or ≥50% of a ≥5-min
  window.
- `strainRatio` is rounded **once**, before grading, so the level never
  disagrees with the percentage reported next to it.
- The nudge is suppressed during an agent run (the checkpoint covers that) and
  while the chat panel is open (it sits under the panel at z-index 1600 vs 2000).
- `#wellnessNudge` must stay **outside** `#dashboard` — the dashboard is hidden
  whenever a webview tab is active, which is precisely when the nudge matters.
- Stopping the scanner calls `resetWellnessSession()` and drops every sample.
  No wellness data is persisted anywhere, ever.
- Going away for 2+ min counts as a break and restarts the break clock.

Testing: this logic is verified by driving the **real running renderer** over
CDP (`--remote-debugging-port`) with synthetic samples fed through the actual
`recordWellnessSample()`, plus a backend suite that imports the real `server.py`
and stubs only the OpenAI client to inspect the assembled message array. Neither
re-implements the logic under test. Don't replace these with unit tests that
mock the functions being tested.

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

- **Vertical sidebar migration**: the old global bottom bookmark/navigation bar
  and floating Home escape button were removed. Navigation, address input,
  Essentials, pinned tabs, open tabs, workspaces, and utility controls now live in
  `#browserSidebar`. `--sidebar-width` drives both the dashboard and webview offset;
  the sidebar can be resized from 220–420px or fully hidden off-canvas. In auto-hide
  mode the page uses the full window width, and `main.js` polls Electron's screen
  cursor position and sends
  `browser-cursor-position` to the renderer. This is necessary because guest
  `<webview>` surfaces swallow DOM pointer-leave events and can leave CSS `:hover`
  stuck. Moving the cursor to the extreme left edge reveals the sidebar as an
  overlay, so the page does not jump sideways.
- **Real tab host**: each sidebar tab owns a separate Electron `<webview>`.
  Tab/workspace/pin metadata persists in `localStorage`; the live guest contents
  and per-tab navigation history persist while the window remains open.
- **Face Scanner is opt-in**: never call `getUserMedia()` at startup. The user must
  press `#toggleFaceScannerBtn`; stopping clears its interval, aborts in-flight face
  analysis, stops every media track, resets warnings, and removes `srcObject`.

## Agentic browser roadmap (in progress)

Discussed direction, smallest-first:
1. **Navigate + read (implemented)** — Chat requests made while the webview is
   active include its visible text as optional `page_context` (plus `page_url`) for
   `/api/chat` to inject into the model's system messages.
2. **Real browser tools (implemented)** — The regex navigation shortcut has been
   replaced by OpenAI function-calling. `renderer.js` executes navigation,
   back/forward, reload, URL inspection, and page-reading tools, reports progress,
   returns results to the model, enforces an eight-step limit, and supports user
   cancellation. Tool calls are sequential (`parallel_tool_calls=False`) so their
   history stays ordered.
3. **Page interaction (implemented)** — `find_elements` / `click_element` /
   `fill_input` / `scroll_page` let the model act on the page, plus
   `open_tab` / `list_tabs` / `switch_tab` / `close_tab` for tab control. See the
   "Ports & endpoints" section above for how indexing and settling work.
4. **Wellness-aware agent (implemented)** — the agent reads the face-scanner
   signals as context, self-interrupts long runs when strain is high, and offers
   the built-in break apps. See "The wellness-aware agent" above. This is the
   differentiator; the rest of the roadmap is table stakes competitors already
   have.
5. **Full autonomous multi-step agent (next)** — richer planning and recovery,
   a user-facing permission prompt before consequential actions, audit logs, and
   reusable saved workflows. The guardrails today are only the step cap, the Stop
   button, and system-prompt instructions telling the model not to enter
   credentials/payment details or take irreversible actions — none of that is
   *enforced* in code, which is the main gap to close for this milestone.

`/api/chat` (`BROWSER_TOOLS` + the system prompt) and `renderer.js`'s
`executeBrowserTool()` / `sendMessage()` are the two places this grows from.

**Security debt worth prioritising**: `preload.js` is still empty and the window
runs with `nodeIntegration: true, contextIsolation: false` (`main.js`). That was
already loose; now that the AI executes injected scripts against arbitrary sites,
any renderer or guest-page compromise reaches full Node. Migrating to
`contextIsolation: true` plus a narrow `contextBridge` IPC surface is a large but
increasingly important change. Page text is already treated as untrusted in the
system prompt, but that is a mitigation, not a boundary.

## Conventions

- No comments explaining *what* code does — only *why*, for non-obvious constraints.
- Don't introduce a bundler/framework/TypeScript without discussing it first — this
  is intentionally a plain HTML/CSS/JS Electron app.
- Test UI changes by actually launching the app (see README "Running Locally"), not
  just by reading the diff — the webview/dashboard toggle and CSS layering issues in
  this codebase don't show up from static review.
- Don't touch the committed model/audio binaries' history without asking first.
