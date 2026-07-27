const dashboard = document.getElementById("dashboard");
const webWrap = document.getElementById("webWrap");
const searchInput = document.getElementById("searchInput");
let webview = document.getElementById("webview");
const urlBar = document.getElementById("urlBar");
const quickAppsContainer = document.querySelector(".quickApps");
const browserSidebar = document.getElementById("browserSidebar");
const sidebarPinnedList = document.getElementById("sidebarPinnedList");
const sidebarTabsList = document.getElementById("sidebarTabsList");
const activeWorkspaceName = document.getElementById("activeWorkspaceName");

// Buttons & Widgets
const weatherDataEl = document.getElementById("weatherData");
const stocksDataEl = document.getElementById("stocksData");
const newsDataEl = document.getElementById("newsData");
const videoEl = document.getElementById("selfieVideo");
const authStatus = document.getElementById("authStatus");
const faceScanStatus = document.querySelector(".faceScanStatus"); // Add selector
const faceScannerIdle = document.getElementById("faceScannerIdle");
const toggleFaceScannerBtn = document.getElementById("toggleFaceScannerBtn");
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
async function getPageContent() {
    try {
        return await webview.executeJavaScript("document.body.innerText");
    } catch (error) {
        console.warn("Unable to read current page:", error);
        return null;
    }
}

function waitForWebviewLoad(timeoutMs = 15000) {
    const targetWebview = webview;
    return new Promise((resolve) => {
        let settled = false;
        const finish = (result) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            targetWebview.removeEventListener("did-stop-loading", onStop);
            targetWebview.removeEventListener("did-fail-load", onFail);
            resolve(result);
        };
        const onStop = () => finish({ success: true, url: targetWebview.getURL() });
        const onFail = (event) => {
            if (event.isMainFrame === false) return;
            finish({
                success: false,
                url: event.validatedURL || targetWebview.getURL(),
                error: event.errorDescription || "Page failed to load"
            });
        };
        const timeout = setTimeout(() => {
            finish({ success: false, url: targetWebview.getURL(), error: "Page load timed out" });
        }, timeoutMs);

        targetWebview.addEventListener("did-stop-loading", onStop);
        targetWebview.addEventListener("did-fail-load", onFail);
    });
}

async function navigate(query) {
    if (!query) return { success: false, error: "No navigation target was provided." };
    ensureActiveSidebarTab();

    // PRE-CHECK QUERY FOR FOCUS MODE
    if (isFocusModeActive && isUrlDistraction(query)) {
        alert("Focus Mode is ON. Distraction-related sites are blocked! 🛡️");
        logStatus("Focus Mode Blocked: " + query);
        return { success: false, error: "Navigation was blocked by Focus Mode." };
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
            return { success: false, error: "The resolved URL was blocked by Focus Mode.", url };
        }

        dashboard.classList.add("hidden");
        webWrap.classList.remove("hidden");

        logStatus("Loading in Webview: " + url);
        webview.src = url;
        urlBar.value = url;
        updateActiveTabMetadata({ url });
        return await waitForWebviewLoad();

    } catch (err) {
        logStatus("Error in navigate: " + err);
        return { success: false, error: String(err) };
    }
}

const SIDEBAR_TABS_STORAGE_KEY = "aivaSidebarTabs";
const SIDEBAR_ACTIVE_TAB_KEY = "aivaSidebarActiveTab";
const SIDEBAR_WORKSPACE_KEY = "aivaSidebarWorkspace";
const SIDEBAR_COLLAPSED_KEY = "aivaSidebarCollapsed";
const SIDEBAR_WIDTH_KEY = "aivaSidebarWidth";
const SIDEBAR_WORKSPACES = {
    personal: "Personal",
    work: "Work",
    research: "Research"
};

let sidebarTabs = [];
let activeSidebarTabId = null;
let activeSidebarWorkspace = localStorage.getItem(SIDEBAR_WORKSPACE_KEY) || "personal";

function createTabId() {
    return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getSidebarTab(tabId) {
    return sidebarTabs.find((tab) => tab.id === tabId) || null;
}

function getDisplayTitle(url) {
    if (!url || url === "about:blank") return "New Tab";
    try {
        return new URL(url).hostname.replace(/^www\./, "") || url;
    } catch {
        return url;
    }
}

function getFallbackFavicon(url) {
    try {
        const domain = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
    } catch {
        return "assets/home_icon.png";
    }
}

function createTabWebview(tabId) {
    const view = document.createElement("webview");
    view.className = "webview hidden";
    view.dataset.tabId = tabId;
    view.setAttribute("allowpopups", "");
    webWrap.appendChild(view);
    return view;
}

function registerSidebarTab(metadata, existingView = null) {
    const tab = {
        id: metadata.id || createTabId(),
        url: metadata.url || "about:blank",
        title: metadata.title || getDisplayTitle(metadata.url),
        favicon: metadata.favicon || "",
        pinned: Boolean(metadata.pinned),
        workspace: SIDEBAR_WORKSPACES[metadata.workspace] ? metadata.workspace : activeSidebarWorkspace,
        view: existingView || null
    };

    tab.view = existingView || createTabWebview(tab.id);
    tab.view.dataset.tabId = tab.id;
    attachWebviewEvents(tab.view, tab.id);
    sidebarTabs.push(tab);
    if (tab.url !== "about:blank") tab.view.src = tab.url;
    return tab;
}

function createSidebarTab(url = "about:blank", options = {}) {
    const tab = registerSidebarTab({
        id: createTabId(),
        url,
        title: options.title || getDisplayTitle(url),
        pinned: Boolean(options.pinned),
        workspace: options.workspace || activeSidebarWorkspace
    });
    persistSidebarState();
    if (options.activate !== false) selectSidebarTab(tab.id);
    else renderSidebarTabs();
    return tab;
}

function ensureActiveSidebarTab() {
    let tab = getSidebarTab(activeSidebarTabId);
    if (!tab) tab = createSidebarTab("about:blank", { activate: true });
    webview = tab.view;
    return tab;
}

function selectSidebarTab(tabId) {
    const tab = getSidebarTab(tabId);
    if (!tab) return;

    activeSidebarTabId = tab.id;
    activeSidebarWorkspace = tab.workspace;
    webview = tab.view;

    sidebarTabs.forEach((candidate) => {
        candidate.view.classList.toggle("hidden", candidate.id !== tab.id);
    });

    if (tab.url === "about:blank") {
        webWrap.classList.add("hidden");
        dashboard.classList.remove("hidden");
        urlBar.value = "";
    } else {
        dashboard.classList.add("hidden");
        webWrap.classList.remove("hidden");
        urlBar.value = tab.url;
    }

    persistSidebarState();
    renderSidebarTabs();
}

function closeSidebarTab(tabId) {
    const index = sidebarTabs.findIndex((tab) => tab.id === tabId);
    if (index === -1) return;

    const [closedTab] = sidebarTabs.splice(index, 1);
    closedTab.view.remove();

    if (activeSidebarTabId === tabId) {
        const workspaceTabs = sidebarTabs.filter((tab) => tab.workspace === activeSidebarWorkspace);
        const replacement = workspaceTabs[Math.min(index, workspaceTabs.length - 1)] || workspaceTabs[0];
        if (replacement) {
            selectSidebarTab(replacement.id);
        } else {
            createSidebarTab("about:blank", { workspace: activeSidebarWorkspace, activate: true });
        }
    } else {
        persistSidebarState();
        renderSidebarTabs();
    }
}

function updateActiveTabMetadata(updates) {
    const tab = getSidebarTab(activeSidebarTabId);
    if (!tab) return;
    Object.assign(tab, updates);
    if (updates.url && (!updates.title || tab.title === "New Tab")) {
        tab.title = getDisplayTitle(updates.url);
    }
    persistSidebarState();
    renderSidebarTabs();
}

function togglePinForActiveTab() {
    const tab = getSidebarTab(activeSidebarTabId);
    if (!tab || tab.url === "about:blank") return;
    tab.pinned = !tab.pinned;
    persistSidebarState();
    renderSidebarTabs();
}

function switchSidebarWorkspace(workspace) {
    if (!SIDEBAR_WORKSPACES[workspace]) return;
    activeSidebarWorkspace = workspace;
    localStorage.setItem(SIDEBAR_WORKSPACE_KEY, workspace);
    const workspaceTabs = sidebarTabs.filter((tab) => tab.workspace === workspace);
    const target = workspaceTabs.find((tab) => tab.id === activeSidebarTabId)
        || workspaceTabs.find((tab) => tab.pinned)
        || workspaceTabs[0];
    if (target) selectSidebarTab(target.id);
    else createSidebarTab("about:blank", { workspace, activate: true });
}

let currentContextTabId = null;
const ctxMenu = document.getElementById("customContextMenu");

document.addEventListener("click", () => {
    if (ctxMenu) ctxMenu.classList.remove("show");
});

if (ctxMenu) {
    document.getElementById("ctxPinTab").onclick = () => {
        const tab = getSidebarTab(currentContextTabId);
        if (tab) { tab.pinned = true; persistSidebarState(); renderSidebarTabs(); }
    };
    document.getElementById("ctxUnpinTab").onclick = () => {
        const tab = getSidebarTab(currentContextTabId);
        if (tab) { tab.pinned = false; persistSidebarState(); renderSidebarTabs(); }
    };
    document.getElementById("ctxDuplicateTab").onclick = () => {
        const tab = getSidebarTab(currentContextTabId);
        if (tab) createSidebarTab(tab.url, { activate: true, workspace: tab.workspace });
    };
    document.getElementById("ctxCloseTab").onclick = () => {
        closeSidebarTab(currentContextTabId);
    };
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.sidebarTabItem:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function setupDragAndDrop(container, isPinnedTarget) {
    container.ondragover = (e) => {
        e.preventDefault();
        const draggable = document.querySelector(".dragging");
        if (!draggable) return;
        
        const afterElement = getDragAfterElement(container, e.clientY);
        container.querySelectorAll(".sidebarTabItem").forEach(item => {
            item.classList.remove("drag-over", "drag-over-bottom");
        });

        if (afterElement) {
            afterElement.classList.add("drag-over");
        } else {
            const lastChild = container.lastElementChild;
            if(lastChild && lastChild.classList.contains("sidebarTabItem")) {
                lastChild.classList.add("drag-over-bottom");
            }
        }
    };

    container.ondragleave = () => {
        container.querySelectorAll(".sidebarTabItem").forEach(item => {
            item.classList.remove("drag-over", "drag-over-bottom");
        });
    };

    container.ondrop = (e) => {
        e.preventDefault();
        container.querySelectorAll(".sidebarTabItem").forEach(item => {
            item.classList.remove("drag-over", "drag-over-bottom");
        });

        const tabId = e.dataTransfer.getData("text/plain");
        const draggedTab = getSidebarTab(tabId);
        if (!draggedTab) return;

        draggedTab.pinned = isPinnedTarget;
        const afterElement = getDragAfterElement(container, e.clientY);
        
        if (afterElement) {
            container.insertBefore(document.querySelector(".dragging"), afterElement);
        } else {
            container.appendChild(document.querySelector(".dragging"));
        }

        const workspaceTabs = sidebarTabs.filter(t => t.workspace === activeSidebarWorkspace);
        const otherTabs = sidebarTabs.filter(t => t.workspace !== activeSidebarWorkspace);
        
        const newWorkspaceOrder = [];
        sidebarPinnedList.querySelectorAll(".sidebarTabItem").forEach(el => {
            const t = workspaceTabs.find(t => t.id === el.dataset.tabId);
            if(t) newWorkspaceOrder.push(t);
        });
        sidebarTabsList.querySelectorAll(".sidebarTabItem").forEach(el => {
            const t = workspaceTabs.find(t => t.id === el.dataset.tabId);
            if(t) newWorkspaceOrder.push(t);
        });

        sidebarTabs.length = 0;
        sidebarTabs.push(...otherTabs, ...newWorkspaceOrder);

        persistSidebarState();
        renderSidebarTabs();
    };
}

function createSidebarTabItem(tab) {
    const item = document.createElement("div");
    item.className = `sidebarTabItem${tab.id === activeSidebarTabId ? " active" : ""}`;
    item.title = tab.title;
    item.dataset.tabId = tab.id;
    item.draggable = true;

    item.onclick = () => selectSidebarTab(tab.id);
    item.oncontextmenu = (event) => {
        event.preventDefault();
        currentContextTabId = tab.id;
        if(ctxMenu) {
            ctxMenu.style.left = `${event.clientX}px`;
            ctxMenu.style.top = `${event.clientY}px`;
            ctxMenu.classList.add("show");
            document.getElementById("ctxPinTab").style.display = tab.pinned ? "none" : "block";
            document.getElementById("ctxUnpinTab").style.display = tab.pinned ? "block" : "none";
        }
    };

    item.ondragstart = (e) => {
        e.dataTransfer.setData("text/plain", tab.id);
        item.classList.add("dragging");
    };
    item.ondragend = () => {
        item.classList.remove("dragging");
    };

    const favicon = document.createElement("img");
    favicon.className = "sidebarTabFavicon";
    favicon.src = tab.favicon || getFallbackFavicon(tab.url);
    favicon.alt = "";
    favicon.onerror = () => {
        favicon.onerror = null;
        favicon.src = "assets/home_icon.png";
    };

    const label = document.createElement("span");
    label.className = "sidebarTabLabel";
    label.textContent = tab.title || getDisplayTitle(tab.url);

    const closeButton = document.createElement("button");
    closeButton.className = "sidebarTabClose";
    closeButton.type = "button";
    closeButton.title = "Close tab";
    closeButton.textContent = "×";
    closeButton.onclick = (event) => {
        event.stopPropagation();
        closeSidebarTab(tab.id);
    };

    item.append(favicon, label, closeButton);
    return item;
}

function renderSidebarTabList(container, tabs, emptyLabel) {
    container.replaceChildren();
    if (!tabs.length) {
        const empty = document.createElement("div");
        empty.className = "sidebarEmptyState";
        empty.textContent = emptyLabel;
        container.appendChild(empty);
        return;
    }
    tabs.forEach((tab) => container.appendChild(createSidebarTabItem(tab)));
}

function renderSidebarTabs() {
    const workspaceTabs = sidebarTabs.filter((tab) => tab.workspace === activeSidebarWorkspace);
    renderSidebarTabList(sidebarPinnedList, workspaceTabs.filter((tab) => tab.pinned), "Pin a tab to keep it here");
    renderSidebarTabList(sidebarTabsList, workspaceTabs.filter((tab) => !tab.pinned), "No open tabs");

    setupDragAndDrop(sidebarPinnedList, true);
    setupDragAndDrop(sidebarTabsList, false);

    activeWorkspaceName.textContent = SIDEBAR_WORKSPACES[activeSidebarWorkspace];
    document.querySelectorAll(".workspaceButton").forEach((button) => {
        button.classList.toggle("active", button.dataset.workspace === activeSidebarWorkspace);
    });
    const activeTab = getSidebarTab(activeSidebarTabId);
    document.getElementById("pinCurrentTabBtn").textContent = activeTab?.pinned ? "−" : "＋";
}

function persistSidebarState() {
    const serializableTabs = sidebarTabs.map(({ view, ...tab }) => tab);
    localStorage.setItem(SIDEBAR_TABS_STORAGE_KEY, JSON.stringify(serializableTabs));
    if (activeSidebarTabId) localStorage.setItem(SIDEBAR_ACTIVE_TAB_KEY, activeSidebarTabId);
    localStorage.setItem(SIDEBAR_WORKSPACE_KEY, activeSidebarWorkspace);
}

function initializeSidebar() {
    const storedCollapsed = true;
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, "true");
    document.body.classList.toggle("sidebarCollapsed", storedCollapsed);
    const collapseSidebarBtn = document.getElementById("collapseSidebarBtn");
    const updateSidebarModeButton = (collapsed) => {
        collapseSidebarBtn.textContent = collapsed ? "»" : "«";
        collapseSidebarBtn.title = collapsed ? "Pin sidebar open" : "Use auto-hide sidebar";
        collapseSidebarBtn.setAttribute("aria-label", collapseSidebarBtn.title);
    };
    updateSidebarModeButton(storedCollapsed);

    const storedWidth = Number(localStorage.getItem(SIDEBAR_WIDTH_KEY));
    if (storedWidth >= 220 && storedWidth <= 420) {
        document.documentElement.style.setProperty("--sidebar-width", `${storedWidth}px`);
        document.documentElement.style.setProperty("--sidebar-expanded-width", `${storedWidth}px`);
    }

    let storedTabs = [];
    try {
        storedTabs = JSON.parse(localStorage.getItem(SIDEBAR_TABS_STORAGE_KEY) || "[]");
        if (!Array.isArray(storedTabs)) storedTabs = [];
    } catch {
        storedTabs = [];
    }

    if (storedTabs.length) {
        storedTabs.forEach((metadata, index) => {
            registerSidebarTab(metadata, index === 0 ? webview : null);
        });
        const storedActiveId = localStorage.getItem(SIDEBAR_ACTIVE_TAB_KEY);
        const target = getSidebarTab(storedActiveId)
            || sidebarTabs.find((tab) => tab.workspace === activeSidebarWorkspace)
            || sidebarTabs[0];
        selectSidebarTab(target.id);
    } else {
        const firstTab = registerSidebarTab({
            id: createTabId(),
            url: "about:blank",
            title: "New Tab",
            workspace: activeSidebarWorkspace
        }, webview);
        selectSidebarTab(firstTab.id);
    }

    document.querySelectorAll(".favoriteTile").forEach((tile) => {
        tile.onclick = () => {
            const activeTab = getSidebarTab(activeSidebarTabId);
            if (activeTab?.url === "about:blank") navigate(tile.dataset.url);
            else createSidebarTab(tile.dataset.url, { activate: true });
        };
    });
    document.querySelectorAll(".workspaceButton").forEach((button) => {
        button.onclick = () => switchSidebarWorkspace(button.dataset.workspace);
    });
    document.getElementById("newTabBtn").onclick = () => {
        createSidebarTab("about:blank", { activate: true });
        urlBar.focus();
    };
    document.getElementById("pinCurrentTabBtn").onclick = togglePinForActiveTab;
    collapseSidebarBtn.onclick = () => {
        const collapsed = document.body.classList.toggle("sidebarCollapsed");
        if (!collapsed) document.body.classList.remove("sidebarHoverExpanded");
        updateSidebarModeButton(collapsed);
    };

    let hoverTimeout;
    ipcRenderer.on("browser-cursor-position", (_event, position) => {
        if (!document.body.classList.contains("sidebarCollapsed")) {
            document.body.classList.remove("sidebarHoverExpanded");
            return;
        }
        const expandedWidth = Number.parseFloat(
            getComputedStyle(document.documentElement).getPropertyValue("--sidebar-expanded-width")
        ) || 276;
        const isExpanded = document.body.classList.contains("sidebarHoverExpanded");
        
        // Use a much narrower activation boundary if not expanded yet (e.g. 10px near the edge)
        // If expanded, use the full expandedWidth + buffer
        const activationBoundary = isExpanded ? expandedWidth + 20 : 15;
        const insideWindow = position.y >= 0 && position.y <= position.height;
        const shouldExpand = insideWindow && position.x >= 0 && position.x <= activationBoundary;

        if (shouldExpand) {
            clearTimeout(hoverTimeout);
            document.body.classList.add("sidebarHoverExpanded");
        } else if (isExpanded) {
            clearTimeout(hoverTimeout);
            hoverTimeout = setTimeout(() => {
                document.body.classList.remove("sidebarHoverExpanded");
            }, 300); // 300ms delay before collapsing
        }
    });

    browserSidebar.addEventListener("focusin", () => {
        if (document.body.classList.contains("sidebarCollapsed")) {
            clearTimeout(hoverTimeout);
            document.body.classList.add("sidebarHoverExpanded");
        }
    });

    const resizeHandle = document.getElementById("sidebarResizeHandle");
    resizeHandle.onpointerdown = (event) => {
        if (document.body.classList.contains("sidebarCollapsed")) return;
        event.preventDefault();
        resizeHandle.setPointerCapture(event.pointerId);
        document.body.classList.add("is-resizing");
    };
    let resizeAnimationFrame;
    resizeHandle.onpointermove = (event) => {
        if (!resizeHandle.hasPointerCapture(event.pointerId)) return;
        if (resizeAnimationFrame) cancelAnimationFrame(resizeAnimationFrame);
        
        resizeAnimationFrame = requestAnimationFrame(() => {
            const width = Math.min(420, Math.max(220, event.clientX));
            document.documentElement.style.setProperty("--sidebar-width", `${width}px`);
            document.documentElement.style.setProperty("--sidebar-expanded-width", `${width}px`);
            localStorage.setItem(SIDEBAR_WIDTH_KEY, String(width));
        });
    };
    resizeHandle.onpointerup = (event) => {
        if (resizeHandle.hasPointerCapture(event.pointerId)) {
            resizeHandle.releasePointerCapture(event.pointerId);
        }
        document.body.classList.remove("is-resizing");
    };

    document.addEventListener("keydown", (event) => {
        if (event.ctrlKey && event.key.toLowerCase() === "t") {
            event.preventDefault();
            createSidebarTab("about:blank", { activate: true });
            urlBar.focus();
        }
        if (event.ctrlKey && event.key.toLowerCase() === "w") {
            event.preventDefault();
            closeSidebarTab(activeSidebarTabId);
        }
    });

    renderSidebarTabs();
}

function attachWebviewEvents(view, tabId) {
    view.addEventListener("will-navigate", (event) => {
        if (isFocusModeActive && isUrlDistraction(event.url)) {
            view.stop();
            alert("Blocked by Focus Mode! 🛡️\n\nStay focused on your goals.");
        }
    });

    view.addEventListener("did-start-loading", () => {
        const currentUrl = view.getURL();
        if (isFocusModeActive && isUrlDistraction(currentUrl)) {
            view.stop();
            if (view.canGoBack()) view.goBack();
            alert("Blocked by Focus Mode! 🛡️");
        }
        if (tabId === activeSidebarTabId) logStatus("Loading...");
    });

    view.addEventListener("did-stop-loading", () => {
        const tab = getSidebarTab(tabId);
        if (!tab) return;
        const url = view.getURL() || tab.url;
        tab.url = url;
        tab.title = url === "about:blank" ? "New Tab" : (view.getTitle() || getDisplayTitle(url));
        if (tabId === activeSidebarTabId) {
            logStatus("Ready");
            urlBar.value = url === "about:blank" ? "" : url;
        }
        persistSidebarState();
        renderSidebarTabs();
    });

    const updateNavigatedUrl = (event) => {
        const tab = getSidebarTab(tabId);
        if (!tab) return;
        tab.url = event.url;
        if (tabId === activeSidebarTabId) {
            urlBar.value = event.url === "about:blank" ? "" : event.url;
        }
        persistSidebarState();
        renderSidebarTabs();
    };

    view.addEventListener("did-navigate", updateNavigatedUrl);
    view.addEventListener("did-navigate-in-page", updateNavigatedUrl);
    view.addEventListener("page-title-updated", (event) => {
        const tab = getSidebarTab(tabId);
        if (!tab || !event.title || tab.url === "about:blank") return;
        tab.title = event.title;
        persistSidebarState();
        renderSidebarTabs();
    });
    view.addEventListener("page-favicon-updated", (event) => {
        const tab = getSidebarTab(tabId);
        if (!tab || !event.favicons?.length) return;
        tab.favicon = event.favicons[0];
        persistSidebarState();
        renderSidebarTabs();
    });
}

function showHome() {
    const activeTab = getSidebarTab(activeSidebarTabId);
    if (!activeTab || activeTab.url !== "about:blank") {
        createSidebarTab("about:blank", { activate: true });
        return;
    }
    selectSidebarTab(activeTab.id);
    urlBar.focus();
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
let faceScannerStream = null;
let faceScannerInterval = null;
let faceScannerActive = false;
let faceFrameInFlight = false;
let faceAnalysisController = null;

async function startFaceScanner() {
    if (faceScannerActive || faceScannerStream) return;
    toggleFaceScannerBtn.disabled = true;
    toggleFaceScannerBtn.textContent = "Starting…";
    authStatus.innerHTML = '<span class="statusDot"></span> Requesting camera…';

    try {
        faceScannerStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 } },
            audio: false
        });
        videoEl.srcObject = faceScannerStream;
        await videoEl.play();
        faceScannerActive = true;
        videoEl.classList.remove("hidden");
        faceScannerIdle.classList.add("hidden");
        toggleFaceScannerBtn.textContent = "Stop Face Scanner";
        toggleFaceScannerBtn.classList.add("active");
        authStatus.innerHTML = '<span class="statusDot on"></span> Scanner active';
        faceScanStatus.innerHTML = '<span class="eyeIcon">👁</span> Analyzing facial expressions';
        faceScanStatus.style.color = "";
        faceScannerInterval = setInterval(processFrame, 1000);
        processFrame();
    } catch (err) {
        console.error("Error accessing camera", err);
        if (faceScannerStream) {
            faceScannerStream.getTracks().forEach((track) => track.stop());
        }
        faceScannerStream = null;
        videoEl.srcObject = null;
        authStatus.innerHTML = '<span class="statusDot error"></span> Camera unavailable';
        faceScanStatus.innerHTML = '<span class="eyeIcon">👁</span> Allow camera access to use face analysis';
        toggleFaceScannerBtn.textContent = "Try Again";
    } finally {
        toggleFaceScannerBtn.disabled = false;
    }
}

function stopFaceScanner() {
    faceScannerActive = false;
    faceFrameInFlight = false;
    if (faceScannerInterval) {
        clearInterval(faceScannerInterval);
        faceScannerInterval = null;
    }
    if (faceAnalysisController) {
        faceAnalysisController.abort();
        faceAnalysisController = null;
    }
    if (faceScannerStream) {
        faceScannerStream.getTracks().forEach((track) => track.stop());
        faceScannerStream = null;
    }
    videoEl.pause();
    videoEl.srcObject = null;
    videoEl.classList.add("hidden");
    faceScannerIdle.classList.remove("hidden");
    toggleFaceScannerBtn.textContent = "Start Face Scanner";
    toggleFaceScannerBtn.classList.remove("active");
    authStatus.innerHTML = '<span class="statusDot"></span> Scanner off';
    faceScanStatus.innerHTML = '<span class="eyeIcon">👁</span> Face analysis is paused';
    faceScanStatus.style.color = "";
    phoneUsageSeconds = 0;
    absenceSeconds = 0;
    if (phoneWarning) phoneWarning.classList.add("hidden");
    if (absenceWarning) absenceWarning.classList.add("hidden");
}

async function processFrame() {
    if (!faceScannerActive || faceFrameInFlight || !videoEl.srcObject || !videoEl.videoWidth) return;
    faceFrameInFlight = true;

    const canvas = document.createElement("canvas");
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoEl, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg");

    const analysisController = new AbortController();
    faceAnalysisController = analysisController;
    try {
        const res = await fetch(`${BACKEND_URL}/analyze_face`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: dataUrl }),
            signal: analysisController.signal
        });
        const data = await res.json();
        if (!faceScannerActive) return;

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
        if (e.name !== "AbortError") console.warn("Face analysis failed:", e);
    } finally {
        if (faceAnalysisController === analysisController) faceAnalysisController = null;
        faceFrameInFlight = false;
    }
}

toggleFaceScannerBtn.onclick = () => {
    if (faceScannerActive) stopFaceScanner();
    else startFaceScanner();
};

window.addEventListener("beforeunload", stopFaceScanner);

// ------------------- AI CHATBOT FUNCTIONALITY -------------------
const aiChatPanel = document.getElementById("aiChatPanel");
const aiChatBtn = document.getElementById("aiChatBtn");
const closeChatBtn = document.getElementById("closeChatBtn");
const chatInput = document.getElementById("chatInput");
const sendChatBtn = document.getElementById("sendChatBtn");
const chatMessages = document.getElementById("chatMessages");
const stopAgentBtn = document.getElementById("stopAgentBtn");
const agentStatus = document.getElementById("agentStatus");
const MAX_AGENT_STEPS = 8;
let activeChatController = null;
let agentRunCancelled = false;

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
function addMessage(text, isUser = false, usingPage = false) {
    const messageDiv = document.createElement("div");
    messageDiv.className = isUser ? "userMessage" : "aiMessage";

    const avatar = isUser ? "👤" : "🤖";
    const avatarClass = isUser ? "userAvatar" : "aiAvatar";

    const content = document.createElement("div");
    content.className = "messageContent";

    const avatarSpan = document.createElement("span");
    avatarSpan.className = avatarClass;
    avatarSpan.textContent = avatar;

    const messageBody = document.createElement("div");
    messageBody.className = "messageBody";

    const messageText = document.createElement("div");
    messageText.className = "messageText";
    messageText.textContent = text;

    messageBody.appendChild(messageText);
    if (usingPage) {
        const contextTag = document.createElement("div");
        contextTag.className = "pageContextTag";
        contextTag.textContent = "📄 using current page";
        messageBody.appendChild(contextTag);
    }

    content.append(avatarSpan, messageBody);
    messageDiv.appendChild(content);

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addAgentAction(text) {
    const actionDiv = document.createElement("div");
    actionDiv.className = "agentActionMessage";
    actionDiv.textContent = `⚙ ${text}`;
    chatMessages.appendChild(actionDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function setAgentStatus(text = "") {
    agentStatus.textContent = text;
    agentStatus.classList.toggle("hidden", !text);
}

function setAgentRunning(running) {
    chatInput.disabled = running;
    sendChatBtn.disabled = running;
    stopAgentBtn.classList.toggle("hidden", !running);
    if (!running) chatInput.focus();
}

function describeToolCall(toolCall) {
    const labels = {
        read_page: "Reading the current page",
        get_current_url: "Checking the current URL",
        go_back: "Going back",
        go_forward: "Going forward",
        reload_page: "Reloading the current page"
    };
    if (toolCall.name === "navigate") {
        return `Opening ${toolCall.arguments?.target || "the requested page"}`;
    }
    return labels[toolCall.name] || `Running ${toolCall.name}`;
}

async function attachCurrentPageContext(requestBody) {
    delete requestBody.page_context;
    delete requestBody.page_url;

    if (webWrap.classList.contains("hidden")) return false;

    const pageContext = await getPageContent();
    if (!pageContext) return false;

    requestBody.page_context = pageContext;
    requestBody.page_url = webview.getURL();
    return true;
}

async function executeBrowserTool(name, args = {}) {
    switch (name) {
        case "navigate":
            return await navigate(args.target);
        case "read_page": {
            const content = await getPageContent();
            if (content === null) {
                return { success: false, error: "The current page could not be read." };
            }
            return {
                success: true,
                url: webview.getURL(),
                content: content.slice(0, 8000),
                truncated: content.length > 8000
            };
        }
        case "get_current_url":
            return { success: true, url: webview.getURL() || "about:blank" };
        case "go_back": {
            if (!webview.canGoBack()) {
                return { success: false, error: "There is no previous page in browser history." };
            }
            const loadResult = waitForWebviewLoad();
            webview.goBack();
            return await loadResult;
        }
        case "go_forward": {
            if (!webview.canGoForward()) {
                return { success: false, error: "There is no next page in browser history." };
            }
            const loadResult = waitForWebviewLoad();
            webview.goForward();
            return await loadResult;
        }
        case "reload_page": {
            const loadResult = waitForWebviewLoad();
            webview.reload();
            return await loadResult;
        }
        default:
            return { success: false, error: `Unsupported browser tool: ${name}` };
    }
}

// Send message
async function sendMessage() {
    if (activeChatController) return;

    const message = chatInput.value.trim();
    if (!message) return;

    addMessage(message, true);
    chatInput.value = "";

    const requestBody = { query: message, tool_history: [] };
    let usingPageContext = false;
    activeChatController = new AbortController();
    agentRunCancelled = false;
    setAgentRunning(true);

    try {
        usingPageContext = await attachCurrentPageContext(requestBody);

        for (let step = 0; step < MAX_AGENT_STEPS; step++) {
            if (agentRunCancelled) throw new DOMException("Task stopped", "AbortError");

            setAgentStatus(step === 0 ? "Aiva is thinking…" : `Aiva is planning step ${step + 1}…`);
            const response = await fetch(`${BACKEND_URL}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
                signal: activeChatController.signal
            });

            if (!response.ok) {
                throw new Error(`Chat request failed with status ${response.status}`);
            }

            const data = await response.json();
            if (data.status !== "tool_call") {
                addMessage(data.response || "I'm here to help! How can I assist you?", false, usingPageContext);
                return;
            }

            if (!Array.isArray(data.tool_calls) || data.tool_calls.length === 0) {
                throw new Error("The assistant returned an empty tool request.");
            }

            for (const toolCall of data.tool_calls) {
                if (agentRunCancelled) throw new DOMException("Task stopped", "AbortError");

                const actionDescription = describeToolCall(toolCall);
                setAgentStatus(`${actionDescription}…`);
                addAgentAction(actionDescription);

                const result = await executeBrowserTool(toolCall.name, toolCall.arguments);
                requestBody.tool_history.push({
                    tool_call_id: toolCall.id,
                    name: toolCall.name,
                    arguments: toolCall.arguments || {},
                    result: JSON.stringify(result)
                });
            }

            usingPageContext = (await attachCurrentPageContext(requestBody)) || usingPageContext;
        }

        addMessage(`I stopped after ${MAX_AGENT_STEPS} steps to avoid an accidental loop.`, false, usingPageContext);

    } catch (error) {
        if (error.name === "AbortError" || agentRunCancelled) {
            addMessage("Task stopped.", false, usingPageContext);
        } else {
            console.error("Chat error:", error);
            addMessage(`I couldn't complete that task: ${error.message}`, false, usingPageContext);
        }
    } finally {
        activeChatController = null;
        setAgentStatus("");
        setAgentRunning(false);
    }
}

stopAgentBtn.onclick = () => {
    if (!activeChatController) return;
    agentRunCancelled = true;
    setAgentStatus("Stopping…");
    activeChatController.abort();
    try {
        webview.stop();
    } catch (error) {
        console.warn("Unable to stop the current page load:", error);
    }
};

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
initializeSidebar();
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


