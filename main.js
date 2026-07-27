const { app, BrowserWindow, ipcMain, dialog, screen } = require("electron");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

let pythonProcess = null;
let cursorPollInterval = null;

function startPythonServer() {
    const scriptPath = path.join(__dirname, "backend", "server.py");
    // Assuming 'python' is in PATH. If using venv, might need full path.
    pythonProcess = spawn("python", [scriptPath]);

    pythonProcess.stdout.on("data", (data) => {
        console.log(`Python: ${data}`);
    });

    pythonProcess.stderr.on("data", (data) => {
        console.error(`Python Error: ${data}`);
    });
}

function createWindow() {
    startPythonServer();

    const win = new BrowserWindow({
        width: 1400,
        height: 900,
        backgroundColor: "#1f2a24",
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
            webviewTag: true // Enabled for internal browsing
        },
    });

    win.loadFile("index.html");

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
