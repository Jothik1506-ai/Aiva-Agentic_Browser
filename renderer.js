const dashboard = document.getElementById("dashboard");
const webWrap = document.getElementById("webWrap");
const searchInput = document.getElementById("searchInput");
const webview = document.getElementById("webview");
const urlBar = document.getElementById("urlBar");
const quickAppsContainer = document.querySelector(".quickApps");

// Buttons & Widgets
const weatherDataEl = document.getElementById("weatherData");
const stocksDataEl = document.getElementById("stocksData");
const newsDataEl = document.getElementById("newsData");
const videoEl = document.getElementById("selfieVideo");
const authStatus = document.getElementById("authStatus");
const faceScanStatus = document.querySelector(".faceScanStatus"); // Add selector
// const exerciseCountEl = document.getElementById("exerciseCount");
// const exerciseStatusEl = document.getElementById("exerciseStatus");
// const detectionBox = document.querySelector(".detectionBox");

const BACKEND_URL = "http://127.0.0.1:5001/api";

// ------------------- Phone Detection State -------------------
let phoneUsageSeconds = 0;
const phoneWarning = document.getElementById("phoneWarning");

// ------------------- Absence Detection State -------------------
let absenceSeconds = 0;
const absenceWarning = document.getElementById("absenceWarning");

// ------------------- Focus Mode Setup -------------------
let isFocusModeActive = localStorage.getItem("focusModeActive") === "true";

const BLOCKED_DOMAINS = [
    'facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'reddit.com',
    'twitch.tv', 'roblox.com', 'netflix.com', 'disneyplus.com', 'hulu.com',
    'steampowered.com', 'epicgames.com', 'poki.com', 'y8.com', 'friv.com'
];

const ALLOWED_EDUCATIONAL_DOMAINS = [
    'github.com', 'youtube.com', 'wikipedia.org', 'stackoverflow.com',
    'coursera.org', 'udemy.com', 'edx.org', 'khanacademy.org',
    'google.com', 'microsoft.com', 'apple.com', 'mdn.com', 'w3schools.com',
    'medium.com', 'freecodecamp.org'
];

// ------------------- Menu Shortcuts -------------------
// ------------------- Menu Shortcuts -------------------
const normalModeMenuShortcuts = [
    { name: 'Discord', url: 'https://discord.com', icon: 'https://www.google.com/s2/favicons?domain=discord.com&sz=64' },
    { name: 'Reddit', url: 'https://reddit.com', icon: 'https://www.google.com/s2/favicons?domain=reddit.com&sz=64' },
    { name: 'Twitch', url: 'https://twitch.tv', icon: 'https://www.google.com/s2/favicons?domain=twitch.tv&sz=64' },
    { name: 'GitHub', url: 'https://github.com', icon: 'https://www.google.com/s2/favicons?domain=github.com&sz=64' },
    { name: 'YouTube', url: 'https://youtube.com', icon: 'https://www.google.com/s2/favicons?domain=youtube.com&sz=64' },
    { name: 'Instagram', url: 'https://instagram.com', icon: 'https://www.google.com/s2/favicons?domain=instagram.com&sz=64' }
];

const focusModeMenuShortcuts = [
    { name: 'Sheets', url: 'https://sheets.google.com', icon: 'https://www.google.com/s2/favicons?domain=sheets.google.com&sz=64' },
    { name: 'Colab', url: 'https://colab.research.google.com', icon: 'https://www.google.com/s2/favicons?domain=colab.research.google.com&sz=64' },
    { name: 'Docs', url: 'https://docs.google.com', icon: 'https://www.google.com/s2/favicons?domain=docs.google.com&sz=64' },
    { name: 'Meet', url: 'https://meet.google.com', icon: 'https://www.google.com/s2/favicons?domain=meet.google.com&sz=64' },
    { name: 'Slides', url: 'https://slides.google.com', icon: 'https://www.google.com/s2/favicons?domain=slides.google.com&sz=64' },
    { name: 'Drive', url: 'https://drive.google.com', icon: 'https://www.google.com/s2/favicons?domain=drive.google.com&sz=64' }
];

function isUrlDistraction(url) {
    if (!isFocusModeActive) return false;
    const query = url.toLowerCase();

    // Check blocklist first (explicit blocks)
    if (BLOCKED_DOMAINS.some(blocked => query.includes(blocked))) return true;

    // Check allowlist (explicit allows)
    if (ALLOWED_EDUCATIONAL_DOMAINS.some(allowed => query.includes(allowed))) return false;

    // For general searches or URLs not in either list
    const educationalKeywords = ['learn', 'study', 'education', 'tutorial', 'course', 'science', 'math', 'knowledge', 'ai', 'dev', 'doc'];
    if (educationalKeywords.some(kw => query.includes(kw))) return false;

    // In search queries, if it's not explicitly blocked and doesn't look like a direct distraction URL, allow Google search
    if (!url.startsWith('http') && !url.includes('.')) return false;

    // Default: block unknown sites in strict focus mode
    return true;
}

function updateFocusModeUI() {
    const btn = document.getElementById("focusModeToggle");
    if (!btn) return;

    if (isFocusModeActive) {
        btn.classList.add("active");
        document.body.classList.add("focusModeActive");
        logStatus("Focus Mode Enable: Learning Mode ON!");
    } else {
        btn.classList.remove("active");
        document.body.classList.remove("focusModeActive");
        logStatus("Focus Mode Disabled");
    }
    // Re-render shortcuts to match mode
    renderShortcuts();
}

function toggleFocusMode() {
    isFocusModeActive = !isFocusModeActive;
    localStorage.setItem("focusModeActive", isFocusModeActive);
    updateFocusModeUI();

    // Update menu shortcuts if panel is open
    if (menuPanel && !menuPanel.classList.contains("hidden")) {
        renderMenuShortcuts();
    }
}

// Default Shortcuts
const defaultShortcuts = [
    { name: "Google", url: "https://google.com", icon: "https://www.google.com/s2/favicons?domain=google.com&sz=64" },
    { name: "Gemini", url: "https://gemini.google.com", icon: "https://www.gstatic.com/lamda/images/gemini_favicon_f069958c85030456e93de685481c559f160ea06b.png" },
    { name: "Drive", url: "https://drive.google.com", icon: "https://www.google.com/s2/favicons?domain=drive.google.com&sz=64" },
    { name: "YouTube", url: "https://youtube.com", icon: "https://www.google.com/s2/favicons?domain=youtube.com&sz=64" },
    { name: "Maps", url: "https://maps.google.com", icon: "https://www.google.com/s2/favicons?domain=maps.google.com&sz=64" },
    { name: "Photos", url: "https://photos.google.com", icon: "https://www.google.com/s2/favicons?domain=photos.google.com&sz=64" }
];

const educationalShortcuts = [
    { name: "Google", url: "https://google.com", icon: "https://www.google.com/s2/favicons?domain=google.com&sz=64" },
    { name: "YouTube", url: "https://youtube.com", icon: "https://www.google.com/s2/favicons?domain=youtube.com&sz=64" },
    { name: "GitHub", url: "https://github.com", icon: "https://www.google.com/s2/favicons?domain=github.com&sz=64" },
    { name: "Gemini", url: "https://gemini.google.com", icon: "https://www.gstatic.com/lamda/images/gemini_favicon_f069958c85030456e93de685481c559f160ea06b.png" },
    { name: "Wikipedia", url: "https://wikipedia.org", icon: "https://www.google.com/s2/favicons?domain=wikipedia.org&sz=64" }
];

// Shortcuts Logic
let customShortcuts = [];
try {
    const saved = localStorage.getItem("customShortcuts");
    if (saved) customShortcuts = JSON.parse(saved);
    if (!Array.isArray(customShortcuts)) customShortcuts = [];
} catch (e) {
    console.error("Error loading shortcuts:", e);
    customShortcuts = [];
}

function renderShortcuts() {
    if (!quickAppsContainer) return;
    quickAppsContainer.innerHTML = "";

    // Combine defaults and customs
    // Choose shortcuts based on Focus Mode
    let allShortcuts;
    if (isFocusModeActive) {
        allShortcuts = [...educationalShortcuts];
    } else {
        allShortcuts = [...defaultShortcuts, ...customShortcuts];
    }

    // Separate rendering for custom vs default to add remove logic only to custom

    // Render defaults (no remove button)
    const shortcutsToRender = isFocusModeActive ? educationalShortcuts : defaultShortcuts;
    shortcutsToRender.forEach(app => {
        const appBtn = createShortcutElement(app, false);
        quickAppsContainer.appendChild(appBtn);
    });

    // Render custom shortcuts (with remove button)
    if (!isFocusModeActive) {
        customShortcuts.forEach((app, index) => {
            const appBtn = createShortcutElement(app, true, index);
            quickAppsContainer.appendChild(appBtn);
        });
    }

    // Add "Add Shortcut" button ONLY if NOT in Focus Mode
    if (!isFocusModeActive) {
        const addBtn = document.createElement("div");
        addBtn.className = "appCircle addShortcutBtn";
        addBtn.title = "Add shortcut";

        const addIconContainer = document.createElement("div");
        addIconContainer.className = "iconContainer";
        addIconContainer.innerHTML = "<span>+</span>";

        addBtn.appendChild(addIconContainer);

        const addLabel = document.createElement("div");
        addLabel.className = "shortcutLabel";
        addLabel.innerText = "Add shortcut";
        addBtn.appendChild(addLabel);

        addBtn.onclick = (e) => {
            e.preventDefault();
            console.log("Add Shortcut Clicked");
            showShortcutModal();
        };
        quickAppsContainer.appendChild(addBtn);
    }
}


function createShortcutElement(app, isCustom, index) {
    const appBtn = document.createElement("div");
    appBtn.className = "appCircle";
    appBtn.title = app.name;

    const iconContainer = document.createElement("div");
    iconContainer.className = "iconContainer";

    const icon = document.createElement("img");
    icon.src = `https://www.google.com/s2/favicons?domain=${app.url}&sz=64`;
    icon.onerror = () => { if (app.icon) icon.src = app.icon; };

    iconContainer.appendChild(icon);
    appBtn.appendChild(iconContainer);

    const label = document.createElement("div");
    label.className = "shortcutLabel";
    label.innerText = app.name;
    appBtn.appendChild(label);

    appBtn.onclick = () => navigate(app.url);

    if (isCustom) {
        const removeBtn = document.createElement("div");
        removeBtn.className = "remoteShortcutBtn";
        removeBtn.innerHTML = "✕";
        removeBtn.title = "Remove shortcut";
        removeBtn.onclick = (e) => {
            e.stopPropagation(); // Prevent navigation
            removeShortcut(index);
        };
        appBtn.appendChild(removeBtn);
    }

    return appBtn;
}

function removeShortcut(index) {
    if (confirm("Are you sure you want to remove this shortcut?")) {
        customShortcuts.splice(index, 1);
        localStorage.setItem("customShortcuts", JSON.stringify(customShortcuts));
        renderShortcuts();
    }
}

// ------------------- Navigation -------------------
const statusDisplay = document.createElement("div");
statusDisplay.style.position = "fixed";
statusDisplay.style.bottom = "0";
statusDisplay.style.left = "0";
statusDisplay.style.background = "red";
statusDisplay.style.color = "white";
statusDisplay.style.padding = "5px";
statusDisplay.style.zIndex = "9999";
statusDisplay.style.display = "none"; // Hidden
document.body.appendChild(statusDisplay);

function logStatus(msg) {
    statusDisplay.innerText = msg;
    console.log(msg);
    // Temporary alert for critical errors
    if (msg.startsWith("Error")) alert(msg);
}

// ------------------- Navigation -------------------
async function navigate(query) {
    if (!query) return;

    // PRE-CHECK QUERY FOR FOCUS MODE
    if (isFocusModeActive && isUrlDistraction(query)) {
        alert("Focus Mode is ON. Distraction-related sites are blocked! 🛡️");
        logStatus("Focus Mode Blocked: " + query);
        return;
    }

    logStatus("Navigating to: " + query);
    try {
        let url = query;
        // Try backend for resolution
        try {
            const res = await fetch(`${BACKEND_URL}/resolve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: query })
            });
            if (res.ok) {
                const data = await res.json();
                url = data.url;
                logStatus("Resolved URL: " + url);
            }
        } catch (e) {
            logStatus("Backend failed, using fallback");
            if (query.includes(".") && !query.includes(" ")) {
                url = query.startsWith("http") ? query : "https://" + query;
            } else {
                url = "https://www.google.com/search?q=" + encodeURIComponent(query);
            }
        }

        // RE-CHECK RESOLVED URL FOR FOCUS MODE
        if (isFocusModeActive && isUrlDistraction(url)) {
            alert("Focus Mode is ON. This specific site is restricted! 🛡️");
            return;
        }

        dashboard.classList.add("hidden");
        webWrap.classList.remove("hidden");

        logStatus("Loading in Webview: " + url);
        webview.src = url;
        urlBar.value = url;

    } catch (err) {
        logStatus("Error in navigate: " + err);
    }
}

// Webview Events
webview.addEventListener('will-navigate', (event) => {
    if (isFocusModeActive && isUrlDistraction(event.url)) {
        // Stop navigation immediately logic happens before loading starts
        // We can't strictly preventDefault on will-navigate in all electrons, 
        // but we can immediately redirect or stop.
        // For Electron webview tag, this event is often not cancellable directly via event.preventDefault() 
        // in rendering process comfortably depending on version, but we can do a check.

        // Better approach: Check URL and if blocked, load a blocked page or stop.
        webview.stop();
        alert("Blocked by Focus Mode! 🛡️\n\nStay focused on your goals.");
        // dashboard could be shown or just stay on previous page
    }
});

webview.addEventListener('did-start-loading', () => {
    // Double check current URL just in case
    const currentUrl = webview.getURL();
    if (isFocusModeActive && isUrlDistraction(currentUrl)) {
        webview.stop();
        webview.goBack(); // Try to go back
        alert("Blocked by Focus Mode! 🛡️");
    }
    logStatus("Loading...");
});

webview.addEventListener('did-stop-loading', () => {
    logStatus("Ready");
    const url = webview.getURL();
    // Don't show about:blank in the URL bar
    if (url === 'about:blank') {
        urlBar.value = "";
    } else {
        urlBar.value = url;
    }
});
webview.addEventListener('did-navigate', (event) => {
    if (event.url === 'about:blank') {
        urlBar.value = "";
    } else {
        urlBar.value = event.url;
    }
});
webview.addEventListener('did-navigate-in-page', (event) => {
    if (event.url === 'about:blank') {
        urlBar.value = "";
    } else {
        urlBar.value = event.url;
    }
});

function showHome() {
    webWrap.classList.add("hidden");
    dashboard.classList.remove("hidden");
    webview.src = "about:blank";
}

// Navigation Handlers
document.getElementById("backBtn").onclick = () => {
    if (webview.canGoBack()) {
        webview.goBack();
    } else {
        showHome();
    }
};
document.getElementById("forwardBtn").onclick = () => { if (webview.canGoForward()) webview.goForward(); };
document.getElementById("reloadBtn").onclick = () => { webview.reload(); };

// Home/Settings Button
document.getElementById("homeBtn").onclick = showHome;
const floatingHomeBtn = document.getElementById("floatingHomeBtn");
if (floatingHomeBtn) floatingHomeBtn.onclick = showHome;

// Keep the webview's height in sync with the bottom bar's real rendered
// height so it never sits underneath (and swallows clicks meant for) the
// nav bar's buttons, including Home.
function syncBottomBarHeight() {
    const bar = document.getElementById("bottomBrowserBar");
    if (!bar) return;
    document.documentElement.style.setProperty("--bottom-bar-height", `${bar.offsetHeight}px`);
}
window.addEventListener("resize", syncBottomBarHeight);
window.addEventListener("DOMContentLoaded", syncBottomBarHeight);
syncBottomBarHeight();

// Extra Buttons (Placeholders)
// Extra Buttons (Placeholders)
const { ipcRenderer } = require('electron');

document.getElementById("cameraBtn").onclick = () => {
    logStatus("Capturing screenshot...");

    // Visual flash effect
    const flash = document.createElement("div");
    flash.style.position = "fixed";
    flash.style.top = "0";
    flash.style.left = "0";
    flash.style.width = "100vw";
    flash.style.height = "100vh";
    flash.style.backgroundColor = "white";
    flash.style.zIndex = "10000";
    flash.style.opacity = "0.7";
    flash.style.pointerEvents = "none";
    document.body.appendChild(flash);

    setTimeout(() => {
        flash.style.transition = "opacity 0.4s ease-out";
        flash.style.opacity = "0";
        setTimeout(() => flash.remove(), 400);
    }, 50);

    ipcRenderer.send('capture-screen');
};

ipcRenderer.on('screenshot-done', (event, response) => {
    if (response.success) {
        logStatus("Screenshot saved!");
        alert(`Screenshot captured and saved to: ${response.path}`);
    } else {
        logStatus("Screenshot failed: " + response.error);
        alert("Failed to capture screenshot: " + response.error);
    }
});
document.getElementById("downloadBtn").onclick = () => alert("Downloads clicked");
document.getElementById("layersBtn").onclick = () => alert("Extensions clicked");
// Menu Panel Logic
const menuBtn = document.getElementById("menuBtn");
const menuPanel = document.getElementById("menuPanel");
const closeMenuBtn = document.getElementById("closeMenuBtn");
const menuShortcutsGrid = document.getElementById("menuShortcutsGrid");

// Toggle Menu
menuBtn.onclick = () => {
    menuPanel.classList.toggle("hidden");
    if (!menuPanel.classList.contains("hidden")) {
        renderMenuShortcuts();
    }
};

// Close Menu
if (closeMenuBtn) {
    closeMenuBtn.onclick = () => {
        menuPanel.classList.add("hidden");
    };
}

// Close when clicking outside content
menuPanel.onclick = (e) => {
    if (e.target === menuPanel) {
        menuPanel.classList.add("hidden");
    }
};

// Close when pressing Escape
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !menuPanel.classList.contains("hidden")) {
        menuPanel.classList.add("hidden");
    }
});

// Health Care - Neck Exercise
const neckStartBtn = document.getElementById("neckStartBtn");
if (neckStartBtn) {
    neckStartBtn.addEventListener("click", () => {
        window.location.href = "neck.html";
    });
}

// Health Care - Meditation
const meditationStartBtn = document.getElementById("meditationStartBtn");
if (meditationStartBtn) {
    meditationStartBtn.addEventListener("click", () => {
        window.location.href = "meditation.html";
    });
}

// Health Care - Breathing
const breathingStartBtn = document.getElementById("breathingStartBtn");
if (breathingStartBtn) {
    breathingStartBtn.addEventListener("click", () => {
        window.location.href = "breathing.html";
    });
}

// Main Search Input
searchInput.onkeydown = (e) => {
    if (e.key === "Enter") {
        navigate(searchInput.value);
    }
}

// Gemini AI Button
const geminiSearchBtn = document.getElementById("geminiSearchBtn");
if (geminiSearchBtn) {
    geminiSearchBtn.onclick = () => {
        navigate("https://gemini.google.com");
    };
}

// Top URL Bar
urlBar.onkeydown = (e) => {
    if (e.key === "Enter") {
        navigate(urlBar.value);
    }
}

// ------------------- Shortcut Modal Logic -------------------
const shortcutModal = document.getElementById("shortcutModal");
const shortcutNameInput = document.getElementById("shortcutNameInput");
const shortcutUrlInput = document.getElementById("shortcutUrlInput");
const saveShortcutBtn = document.getElementById("saveShortcutBtn");
const cancelShortcutBtn = document.getElementById("cancelShortcutBtn");

function showShortcutModal() {
    shortcutModal.classList.remove("hidden");
    shortcutNameInput.value = "";
    shortcutUrlInput.value = "";
    shortcutNameInput.focus();
}

function hideShortcutModal() {
    shortcutModal.classList.add("hidden");
}

cancelShortcutBtn.onclick = hideShortcutModal;

saveShortcutBtn.onclick = () => {
    const name = shortcutNameInput.value.trim();
    let url = shortcutUrlInput.value.trim();

    if (!name || !url) {
        alert("Please provide both a name and a URL.");
        return;
    }

    // Basic URL cleaning
    if (!url.startsWith("http")) {
        url = "https://" + url;
    }

    customShortcuts.push({
        name: name,
        url: url,
        icon: `https://www.google.com/s2/favicons?domain=${url}&sz=64`
    });

    localStorage.setItem("customShortcuts", JSON.stringify(customShortcuts));
    renderShortcuts();
    hideShortcutModal();
};

// Close modal when clicking outside
shortcutModal.onclick = (e) => {
    if (e.target === shortcutModal) hideShortcutModal();
};

// ------------------- Backend Data -------------------

async function fetchData() {
    try {
        // Check Backend Status First
        fetch(`${BACKEND_URL.replace('/api', '')}/api/status`)
            .then(r => r.json())
            .then(data => {
                if (data.status === "running") {
                    const wellnessCard = document.getElementById("wellnessCard");
                    const remindersSuccess = document.getElementById("remindersSuccessContent");
                    const remindersError = document.getElementById("remindersErrorContent");
                    const faceError = document.getElementById("faceScanError");

                    if (wellnessCard) wellnessCard.classList.remove("errorState");
                    if (remindersSuccess) remindersSuccess.classList.remove("hidden");
                    if (remindersError) remindersError.classList.add("hidden");
                    if (faceError) faceError.classList.add("hidden");
                }
            })
            .catch(err => {
                console.error("Backend status check failed:", err);
            });

        // Weather
        fetch(`${BACKEND_URL}/weather`)
            .then(r => r.json())
            .then(data => {
                weatherDataEl.innerHTML = `
                    <div style="font-size:24px">${data.temp}</div>
                    <div>${data.condition}</div>
                `;
            });

        // Apps
        fetch(`${BACKEND_URL}/apps`)
            .then(r => r.json())
            .then(apps => {
                // If backend provides apps, we can use them as defaults if we want,
                // but for now let's stick to our local persistence for the "Add Shortcut" feel.
                // renderShortcuts already handles defaults + customs.
            });

        // News
        fetch(`${BACKEND_URL}/news`)
            .then(r => r.json())
            .then(data => {
                newsDataEl.innerHTML = data.map(n => `<div style="margin-bottom:5px; font-size:12px"><b>${n.source}</b>: ${n.title}</div>`).join("");
            });

        // Stocks (Mock)
        stocksDataEl.innerHTML = `
            <div style="color:#0f0">NVDA: $1483.50 (+2.5%)</div>
        `;


    } catch (e) {
        console.error("Backend error", e);
    }
}

// ------------------- Volume Monitor -------------------
let lastVolumeNotificationTime = 0;
let isVolumeCurrentlyHigh = false; // Track state for instant notification
const VOLUME_NOTIFICATION_INTERVAL = 2 * 60 * 1000; // Reduced to 2 minutes

async function checkVolumeStatus() {
    // Broadening check: If we are in the app, we check volume.
    try {
        const res = await fetch(`${BACKEND_URL}/health/volume`);
        const data = await res.json();
        console.log("Volume Check:", data); // Debug log

        if (data.status === "success") {
            if (data.is_high) {
                const now = Date.now();
                // Notify if it's the first time it goes high, OR if 15 mins have passed
                if (!isVolumeCurrentlyHigh || (now - lastVolumeNotificationTime > VOLUME_NOTIFICATION_INTERVAL)) {
                    showVolumeWarning(data.volume);
                    lastVolumeNotificationTime = now;
                }
                isVolumeCurrentlyHigh = true;
            } else {
                // Volume is low, reset state so it can notify "instantly" next time it goes high
                isVolumeCurrentlyHigh = false;
            }
        }
    } catch (e) {
    }
}

function showVolumeWarning(volume) {
    const container = document.getElementById("reminderContainer");
    if (!container) return;

    container.classList.remove("hidden");

    const card = document.createElement("div");
    card.className = "bottomReminderCard volume-alert";
    card.style.borderLeft = "4px solid #ff4444"; // Striking red accent
    card.style.background = "rgba(40, 20, 20, 0.95)"; // Darker reddish tint

    card.innerHTML = `
        <div class="icon">📢</div>
        <div class="text">
            <strong style="color:#ff6666">High Volume Warning</strong>
            <p>System volume is at ${volume}%. Please reduce it to protect your ears.</p>
        </div>
    `;

    container.appendChild(card);

    // Animate in
    setTimeout(() => card.classList.add("show"), 100);

    // Remove after 10 seconds
    setTimeout(() => {
        card.classList.remove("show");
        setTimeout(() => {
            card.remove();
            if (container.children.length === 0) container.classList.add("hidden");
        }, 500);
    }, 10000);
}

// ------------------- Startup Reminders -------------------
function showStartupReminders() {
    const container = document.getElementById("reminderContainer");
    if (!container) return;

    // Ensure container is visible to start receiving cards
    container.classList.remove("hidden");
    container.innerHTML = ""; // Clear any existing

    // Helper to schedule a reminder
    const scheduleReminder = (data, delayMs, durationMs) => {
        setTimeout(() => {
            const card = document.createElement("div");
            card.className = "bottomReminderCard";
            card.innerHTML = `
                <div class="icon">${data.icon}</div>
                <div class="text">
                    <strong>${data.title}</strong>
                    <p>${data.text}</p>
                </div>
            `;

            // Allow manual dismiss
            card.onclick = () => {
                card.style.opacity = "0";
                setTimeout(() => card.remove(), 300);
            };

            container.appendChild(card);

            // Auto-vanish after duration
            setTimeout(() => {
                if (card.parentNode) {
                    card.style.opacity = "0";
                    card.style.transform = "translateY(20px)"; // Slide down out
                    setTimeout(() => card.remove(), 500);
                }
            }, durationMs);

        }, delayMs);
    };

    // --- TIMELINE CONFIGURATION ---
    // User Request: Water at 30s (30000ms), last 8s.

    // 1. Posture (Immediate/Early check) - Let's put this early (e.g., 10s)
    scheduleReminder(
        { icon: "🧘", title: "Posture", text: "Correct your sitting position." },
        10000, // Delay: 10 seconds
        8000   // Duration: 8 seconds
    );

    // 2. Water (The specific request: "after browser there for 30 seconds")
    scheduleReminder(
        { icon: "💧", title: "Stay Hydrated", text: "Water break time!" },
        30000, // Delay: 30 seconds
        8000   // Duration: 8 seconds ("after that 8 seconds it should vanish")
    );

    // 3. Eye Care (Late check) - Let's put this after water (e.g., 50s)
    scheduleReminder(
        { icon: "👀", title: "Eye Care", text: "Look at something 20ft away." },
        50000, // Delay: 50 seconds
        8000   // Duration: 8 seconds
    );
}

// No interval for Apps/News to save bandwidth, only on load or reload


fetchData();
// No interval for Apps/News to save bandwidth, only on load or reload

// ------------------- Camera & CV -------------------
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoEl.srcObject = stream;
        setInterval(processFrame, 1000);
    } catch (err) {
        console.error("Error accessing camera", err);
        authStatus.innerText = "Camera Error";
    }
}

async function processFrame() {
    if (!videoEl.srcObject) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoEl, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg");

    try {
        const res = await fetch(`${BACKEND_URL}/analyze_face`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: dataUrl })
        });
        const data = await res.json();

        if (data.detected) {
            // Update UI with specific state
            if (faceScanStatus) {
                faceScanStatus.innerHTML = `<span class="eyeIcon">👁</span> Detected: <strong>${data.state}</strong> - ${data.details}`;

                // Style changes based on state
                if (data.state === "Yawning" || data.state === "Drowsy") {
                    faceScanStatus.style.color = "#ff4444"; // Red alert
                } else if (data.state === "Headache") {
                    faceScanStatus.style.color = "#ffbb33"; // Orange warning for tension
                } else if (data.state === "Head Shaking") {
                    faceScanStatus.style.color = "#7fc8a9"; // Light blue for movement
                } else if (data.state === "Stressed") {
                    faceScanStatus.style.color = "#ffbb33"; // Orange warning
                } else {
                    faceScanStatus.style.color = "#7fc8a9"; // Green good
                }
            }

            if (authStatus) {
                authStatus.innerHTML = `<span class="statusDot on" style="background:${data.state === 'Focused' ? '#7fc8a9' : '#ff4444'}"></span> ${data.state}`;
            }

            // --- PHONE DETECTION LOGIC ---
            if (data.using_phone) {
                // Increment timer (polling every 1s, so add 1s)
                phoneUsageSeconds += 1;
                console.log("Phone Detected! Duration:", phoneUsageSeconds);

                if (phoneUsageSeconds > 15) {
                    if (phoneWarning) phoneWarning.classList.remove("hidden");
                }
            } else {
                // Decay timer logic (Buffer against missed detections)
                // Instead of resetting to 0, decrement by 2 (or more) to allow short blips
                if (phoneUsageSeconds > 0) {
                    phoneUsageSeconds -= 2;
                    if (phoneUsageSeconds < 0) phoneUsageSeconds = 0;
                    console.log("Phone lost... decay:", phoneUsageSeconds);
                }

                // Hide warning only if we drop well below threshold to avoid flickering warning
                if (phoneUsageSeconds < 12) {
                    if (phoneWarning) phoneWarning.classList.add("hidden");
                }
            }

            // Reset absence timer if face is found
            absenceSeconds = 0;
            if (absenceWarning) absenceWarning.classList.add("hidden");

        } else {
            if (authStatus) authStatus.innerHTML = `<span class="statusDot"></span> Searching for face...`;
            // Reset phone timer if no face (cannot be using phone if not there? or maybe just reset to be safe)
            phoneUsageSeconds = 0;
            if (phoneWarning) phoneWarning.classList.add("hidden");

            // --- ABSENCE DETECTION LOGIC ---
            absenceSeconds += 1; // increments by 1s (polling interval)
            if (absenceSeconds > 9) {
                if (absenceWarning) absenceWarning.classList.remove("hidden");
            }
        }
    } catch (e) {
        // console.log("CV Error:", e);
    }
}

// ------------------- Camera & CV -------------------
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoEl.srcObject = stream;
        setInterval(processFrame, 1000);
    } catch (err) {
        console.error("Error accessing camera", err);
        authStatus.innerText = "Camera Error";
    }
}

startCamera();

// ------------------- AI CHATBOT FUNCTIONALITY -------------------
const aiChatPanel = document.getElementById("aiChatPanel");
const aiChatBtn = document.getElementById("aiChatBtn");
const closeChatBtn = document.getElementById("closeChatBtn");
const chatInput = document.getElementById("chatInput");
const sendChatBtn = document.getElementById("sendChatBtn");
const chatMessages = document.getElementById("chatMessages");

// Toggle chat panel
function toggleChatPanel() {
    aiChatPanel.classList.toggle("hidden");
    if (!aiChatPanel.classList.contains("hidden")) {
        chatInput.focus();
    }
}

// Open chat panel
aiChatBtn.onclick = toggleChatPanel;

// Close chat panel
closeChatBtn.onclick = () => {
    aiChatPanel.classList.add("hidden");
};

// Add message to chat
function addMessage(text, isUser = false) {
    const messageDiv = document.createElement("div");
    messageDiv.className = isUser ? "userMessage" : "aiMessage";

    const avatar = isUser ? "👤" : "🤖";
    const avatarClass = isUser ? "userAvatar" : "aiAvatar";

    messageDiv.innerHTML = `
        <div class="messageContent">
            <span class="${avatarClass}">${avatar}</span>
            <div class="messageText">${text}</div>
        </div>
    `;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Send message
async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Add user message
    addMessage(message, true);
    chatInput.value = "";

    // Show typing indicator
    const typingDiv = document.createElement("div");
    typingDiv.className = "aiMessage typing-indicator";
    typingDiv.id = "typingIndicator";
    typingDiv.innerHTML = `
        <div class="messageContent">
            <span class="aiAvatar">🤖</span>
            <div class="messageText">Typing...</div>
        </div>
    `;
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        // Call backend API
        const response = await fetch(`${BACKEND_URL}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: message })
        });

        const data = await response.json();

        // Remove typing indicator
        const indicator = document.getElementById("typingIndicator");
        if (indicator) indicator.remove();

        // Add AI response
        addMessage(data.response || "I'm here to help! How can I assist you?", false);

    } catch (error) {
        console.error("Chat error:", error);

        // Remove typing indicator
        const indicator = document.getElementById("typingIndicator");
        if (indicator) indicator.remove();

        // Fallback response
        const fallbackResponses = [
            "I'm here to help you with your wellness journey! What would you like to know?",
            "That's an interesting question! I can help you with wellness tips, exercise tracking, or general browsing assistance.",
            "I'm your AI wellness assistant. Feel free to ask me about health tips, exercises, or anything else!",
            "Great question! I'm designed to support your wellness goals. How can I assist you today?",
            "I'm always here to help! Whether it's about fitness, nutrition, or just browsing, I've got you covered."
        ];
        const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
        addMessage(randomResponse, false);
    }
}

// Send button click
sendChatBtn.onclick = sendMessage;

// Enter key to send
chatInput.onkeydown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
};

// Close chat panel when clicking outside
document.addEventListener("click", (e) => {
    if (!aiChatPanel.contains(e.target) && e.target !== aiChatBtn && !aiChatPanel.classList.contains("hidden")) {
        // Don't close if clicking inside the panel
        if (!e.target.closest(".aiChatPanel") && e.target !== aiChatBtn) {
            // aiChatPanel.classList.add("hidden");
        }
    }
});

// Initialize
renderShortcuts();
showStartupReminders();
fetchData();
setInterval(fetchData, 5000); // Keep checking backend status every 5 seconds
setInterval(checkVolumeStatus, 5000); // Check volume every 5 seconds for maximum responsiveness
setTimeout(checkVolumeStatus, 2000); // Initial check after startup


// ------------------- WALLPAPER CUSTOMIZATION -------------------
const browserBackground = document.getElementById("browserBackground");
const wallpaperPanel = document.getElementById("wallpaperPanel");
const closeWallpaperBtn = document.getElementById("closeWallpaperBtn");
const wallpaperOptions = document.querySelectorAll(".wallpaperOption");
const wallpaperUpload = document.getElementById("wallpaperUpload");
const uploadWallpaperBtn = document.getElementById("uploadWallpaperBtn");
const customizeBtn = document.getElementById("customizeBtn");

function setWallpaper(src) {
    if (isFocusModeActive) return; // Block changes if Focus Mode is active
    if (src === "default" || !src) {
        browserBackground.style.backgroundImage = "none";
        localStorage.removeItem("customWallpaper");
    } else {
        browserBackground.style.backgroundImage = `url('${src}')`;
        localStorage.setItem("customWallpaper", src);
    }

    // Update active state in grid
    wallpaperOptions.forEach(opt => {
        if (opt.dataset.bg === src) opt.classList.add("active");
        else opt.classList.remove("active");
    });
}

// Load saved wallpaper
const initialWallpaper = localStorage.getItem("customWallpaper");
if (initialWallpaper) setWallpaper(initialWallpaper);

// Toggle Panel
if (customizeBtn) customizeBtn.onclick = () => wallpaperPanel.classList.toggle("hidden");
closeWallpaperBtn.onclick = () => wallpaperPanel.classList.add("hidden");

// Option Clicks
wallpaperOptions.forEach(option => {
    option.addEventListener("click", () => {
        if (!option.id.includes("upload")) {
            setWallpaper(option.dataset.bg);
        }
    });
});

// Custom Upload
uploadWallpaperBtn.onclick = () => wallpaperUpload.click();
wallpaperUpload.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            setWallpaper(event.target.result);
        };
        reader.readAsDataURL(file);
    }
};

// ------------------- Focus Mode Init -------------------
const focusModeToggle = document.getElementById("focusModeToggle");
if (focusModeToggle) {
    focusModeToggle.onclick = toggleFocusMode;
    // Initial UI update
    updateFocusModeUI();
}

// ------------------- HEALTH & CARE SYSTEM -------------------
const healthCareBtn = document.getElementById("healthCareBtn");
const healthCareModal = document.getElementById("healthCareModal");
const closeHealthBtn = document.getElementById("closeHealthBtn");

if (healthCareBtn && healthCareModal && closeHealthBtn) {
    healthCareBtn.onclick = () => {
        healthCareModal.classList.remove("hidden");
    };

    closeHealthBtn.onclick = () => {
        healthCareModal.classList.add("hidden");
    };

    // Low-fi click outside to close
    healthCareModal.onclick = (e) => {
        if (e.target === healthCareModal) {
            healthCareModal.classList.add("hidden");
        }
    };
}

// ------------------- MENU PANEL SYSTEM -------------------
// (Variables declared earlier)

function renderMenuShortcuts() {
    if (!menuShortcutsGrid) return;

    menuShortcutsGrid.innerHTML = "";

    // Choose shortcuts based on Focus Mode
    const shortcuts = isFocusModeActive ? focusModeMenuShortcuts : normalModeMenuShortcuts;

    shortcuts.forEach(shortcut => {
        const shortcutEl = document.createElement("div");
        shortcutEl.className = "menuShortcut";

        // Check if icon is an URL (simple check)
        const isUrl = shortcut.icon.startsWith('http') || shortcut.icon.startsWith('data:');
        const iconContent = isUrl
            ? `<img src="${shortcut.icon}" alt="${shortcut.name}" class="menuIconImg">`
            : shortcut.icon;

        shortcutEl.innerHTML = `
            <div class="menuShortcutIcon">${iconContent}</div>
            <div class="menuShortcutLabel">${shortcut.name}</div>
        `;

        shortcutEl.onclick = () => {
            navigate(shortcut.url);
            menuPanel.classList.add("hidden");
        };

        menuShortcutsGrid.appendChild(shortcutEl);
    });
}


