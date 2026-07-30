const { app, BrowserWindow, ipcMain, dialog, screen } = require("electron");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

let pythonProcess = null;
let cursorPollInterval = null;
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

function warnBackendMissing(win) {
    if (backendStartupWarningShown) return;
    backendStartupWarningShown = true;
    dialog.showMessageBox(win, {
        type: "warning",
        title: "Python backend not found",
        message: "AIVA Agentic Browser needs Python 3.11 with the packages in requirements.txt " +
            "for the AI assistant, face scanner, and posture tracking to work. Browsing still " +
            "works without it - install Python and restart the app to enable those features.",
        buttons: ["OK"]
    });
}

// Beta note: this still shells out to a system Python interpreter rather
// than a bundled/frozen one, so those features require the user's own
// Python 3.11 + requirements.txt install. Different Windows setups expose
// the interpreter as `python` or (Python launcher, more common on default
// python.org installs) `py`, so both are tried before giving up.
function startPythonServer(win) {
    const scriptPath = path.join(getBackendDir(), "server.py");
    tryLaunchPython(["python", "py"], scriptPath, win);
}

function tryLaunchPython(candidates, scriptPath, win) {
    if (!candidates.length) {
        console.error("Python Error: no working Python interpreter found (tried: python, py).");
        warnBackendMissing(win);
        return;
    }
    const [command, ...rest] = candidates;
    const child = spawn(command, [scriptPath]);
    let launched = false;
    let fallbackTried = false;
    const fallbackToNext = () => {
        if (fallbackTried) return;
        fallbackTried = true;
        tryLaunchPython(rest, scriptPath, win);
    };

    child.on("spawn", () => {
        launched = true;
        pythonProcess = child;
    });
    child.on("error", (err) => {
        if (err.code === "ENOENT") fallbackToNext();
        else console.error(`Python Error: ${err.message}`);
    });
    child.stdout.on("data", (data) => console.log(`Python: ${data}`));
    child.stderr.on("data", (data) => console.error(`Python Error: ${data}`));
    child.on("exit", (code) => {
        if (!launched && code !== 0) fallbackToNext();
    });
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1400,
        height: 900,
        backgroundColor: "#1f2a24",
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
            webviewTag: true // Enabled for internal browsing
        },
    });

    win.loadFile("index.html");
    startPythonServer(win);

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
