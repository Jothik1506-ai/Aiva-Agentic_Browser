const { app, BrowserWindow, ipcMain, dialog, screen } = require("electron");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { autoUpdater } = require("electron-updater");

let pythonProcess = null;
let cursorPollInterval = null;
let updateCheckInterval = null;
let backendStartupWarningShown = false;

// In a packaged build, __dirname points inside app.asar - the backend can't
// run its server.py or read its model files from in there, so it ships as
// an extraResource instead (see package.json "build.extraResources") and
// gets addressed via resourcesPath.
function getBackendDir() {
    return app.isPackaged
        ? path.join(process.resourcesPath, "backend")
        : path.join(__dirname, "backend");
}

function warnBackendMissing(win, detail) {
    if (backendStartupWarningShown) return;
    backendStartupWarningShown = true;
    dialog.showMessageBox(win, {
        type: "warning",
        title: "Python backend not found",
        message: "AIVA Agentic Browser needs Python 3.11 with the packages in requirements.txt " +
            "for the AI assistant, face scanner, and posture tracking to work. Browsing still " +
            "works without it - install Python and restart the app to enable those features." +
            (detail ? `\n\nLast error: ${detail}` : ""),
        buttons: ["OK"]
    });
}

// A grace period, not a one-shot check: `python` on PATH can point at a venv
// that starts fine but then dies a moment later on a missing import (e.g. a
// stray venv without mediapipe installed). The old code treated the OS
// successfully starting *any* process as final success and never tried the
// next candidate in that case - so on a machine where `python` resolves to a
// broken environment, the one interpreter that would have actually worked
// (`py`) was never attempted. Only a clean exit after the grace window, or
// staying up past it, counts as "this interpreter is fine."
const PYTHON_STARTUP_GRACE_MS = 4000;

// Beta note: this still shells out to a system Python interpreter rather
// than a bundled/frozen one, so those features require the user's own
// Python 3.11 + requirements.txt install. Different Windows setups expose
// the interpreter as `python` or (Python launcher, more common on default
// python.org installs) `py`, so both are tried before giving up.
function startPythonServer(win) {
    const scriptPath = path.join(getBackendDir(), "server.py");
    tryLaunchPython(["python", "py"], scriptPath, win);
}

function tryLaunchPython(candidates, scriptPath, win, lastError) {
    if (!candidates.length) {
        console.error("Python Error: no working Python interpreter found (tried: python, py).");
        warnBackendMissing(win, lastError);
        return;
    }
    const [command, ...rest] = candidates;
    const child = spawn(command, [scriptPath]);
    const startedAt = Date.now();
    let settledPastGrace = false;
    let fallbackTried = false;
    let lastStderr = "";

    const fallbackToNext = (detail) => {
        if (fallbackTried) return;
        fallbackTried = true;
        tryLaunchPython(rest, scriptPath, win, detail || lastStderr || undefined);
    };

    child.on("spawn", () => {
        pythonProcess = child;
        setTimeout(() => { settledPastGrace = true; }, PYTHON_STARTUP_GRACE_MS);
    });
    child.on("error", (err) => {
        if (err.code === "ENOENT") fallbackToNext(`"${command}" is not on PATH.`);
        else console.error(`Python Error: ${err.message}`);
    });
    child.stdout.on("data", (data) => console.log(`Python: ${data}`));
    child.stderr.on("data", (data) => {
        const text = data.toString();
        lastStderr = text.trim().split("\n").pop() || lastStderr;
        console.error(`Python Error: ${text}`);
    });
    child.on("exit", (code) => {
        if (code === 0) return; // deliberate shutdown, not a startup failure
        if (!settledPastGrace) {
            fallbackToNext(lastStderr || `"${command}" exited with code ${code}.`);
        } else {
            console.error(`Python process ("${command}") exited unexpectedly after startup, code ${code}.`);
        }
    });
}

const UPDATE_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

// Checked against the GitHub Releases feed electron-builder writes into every
// build's latest.yml: once at startup, then daily for sessions left running.
//
// The user is asked before anything is downloaded (autoDownload = false), so
// nothing large moves over their connection unprompted and the restart is
// always their choice. autoInstallOnAppQuit stays on as the safety net: if
// they download and then just close the app, it still lands.
//
// Do NOT set autoUpdater.channel here. It is not "which .yml feed to read" -
// it is the *prerelease channel name* (alpha/beta/...), matched against the
// prerelease component of each release tag. Setting it to "latest" matched
// nothing (no tag has a "-latest.N" suffix), so every check died with
// "No published versions on GitHub". Left unset, electron-updater derives the
// channel from the running version: a 0.1.0-beta.2 build looks for newer beta
// *and* stable releases, and a stable build only takes stable ones.
function initAutoUpdate(win) {
    if (!app.isPackaged) return; // dev runs aren't a real release to check against

    const send = (channel, payload) => {
        if (win.isDestroyed() || win.webContents.isDestroyed()) return;
        win.webContents.send(channel, payload);
    };

    try {
        autoUpdater.autoDownload = false;
        autoUpdater.autoInstallOnAppQuit = true;

        autoUpdater.on("error", (err) => {
            const message = err == null ? "Unknown updater error" : err.message;
            console.error("AutoUpdater error:", message);
            send("update-error", { message });
        });
        autoUpdater.on("update-available", (info) => {
            console.log("Update available:", info.version);
            send("update-available", { version: info.version, releaseDate: info.releaseDate || null });
        });
        autoUpdater.on("download-progress", (progress) => {
            send("update-download-progress", { percent: Math.round(progress.percent || 0) });
        });
        autoUpdater.on("update-downloaded", (info) => {
            console.log("Update downloaded:", info.version);
            send("update-downloaded", { version: info.version });
        });

        ipcMain.on("update-download", () => {
            autoUpdater.downloadUpdate().catch((err) => {
                console.error("Update download failed:", err.message);
                send("update-error", { message: err.message });
            });
        });
        // Let the IPC call return before the app tears itself down, otherwise
        // quitAndInstall can race the renderer still finishing this tick.
        ipcMain.on("update-install", () => {
            setImmediate(() => autoUpdater.quitAndInstall());
        });

        const check = () => autoUpdater.checkForUpdates().catch((err) => {
            console.error("AutoUpdater check failed:", err.message);
        });

        // The renderer owns the prompt, so don't check until it can receive it.
        win.webContents.once("did-finish-load", check);
        updateCheckInterval = setInterval(check, UPDATE_CHECK_INTERVAL_MS);
    } catch (err) {
        console.error("AutoUpdater setup failed:", err.message);
    }
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1400,
        height: 900,
        backgroundColor: "#1f2a24",
        frame: false,
        icon: path.join(__dirname, "assets", "app-icon.ico"),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
            webviewTag: true // Enabled for internal browsing
        },
    });

    win.loadFile("index.html");
    startPythonServer(win);
    initAutoUpdate(win);

    // Custom top bar replaces the native title bar, so the renderer needs
    // IPC hooks for the window controls it now draws itself, and needs to
    // know the real maximize state to show the right icon.
    ipcMain.on("window-minimize", () => win.minimize());
    ipcMain.on("window-maximize-toggle", () => {
        if (win.isMaximized()) win.unmaximize();
        else win.maximize();
    });
    ipcMain.on("window-close", () => win.close());

    const sendMaximizedState = () => {
        if (!win.isDestroyed()) win.webContents.send("window-maximized-state", win.isMaximized());
    };
    win.on("maximize", sendMaximizedState);
    win.on("unmaximize", sendMaximizedState);

    cursorPollInterval = setInterval(() => {
        if (win.isDestroyed() || win.webContents.isDestroyed()) return;
        const cursor = screen.getCursorScreenPoint();
        const bounds = win.getBounds();
        win.webContents.send("browser-cursor-position", {
            x: cursor.x - bounds.x,
            y: cursor.y - bounds.y,
            width: bounds.width,
            height: bounds.height
        });
    }, 80);

    win.on("closed", () => {
        if (cursorPollInterval) {
            clearInterval(cursorPollInterval);
            cursorPollInterval = null;
        }
        if (updateCheckInterval) {
            clearInterval(updateCheckInterval);
            updateCheckInterval = null;
        }
    });

    // Screenshot Capture Listener
    ipcMain.on('capture-screen', async (event) => {
        try {
            const image = await win.capturePage();
            const filePath = path.join(app.getPath('downloads'), `aiva-agentic-browser-screenshot-${Date.now()}.png`);

            fs.writeFile(filePath, image.toPNG(), (err) => {
                if (err) {
                    console.error("Save failed:", err);
                    event.reply('screenshot-done', { success: false, error: err.message });
                } else {
                    console.log("Screenshot saved to:", filePath);
                    event.reply('screenshot-done', { success: true, path: filePath });
                }
            });
        } catch (e) {
            console.error("Capture failed:", e);
            event.reply('screenshot-done', { success: false, error: e.message });
        }
    });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
    if (pythonProcess) pythonProcess.kill();
    if (process.platform !== "darwin") app.quit();
});

app.on("will-quit", () => {
    if (pythonProcess) pythonProcess.kill();
});
