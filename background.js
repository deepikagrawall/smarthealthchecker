// ================= GLOBAL FLAG =================
let timersStarted = false;


// ================= START TIMERS =================
async function startHealthTimers() {

  chrome.runtime.onStartup.addListener(async () => {

    const data = await chrome.storage.sync.get("timersOn");

    if (data.timersOn) {
        startHealthTimers();
    }
});

    console.log("🚀 Starting timers (only if not already running)");

    // Prevent duplicate alarms
    const alarms = await chrome.alarms.getAll();

    if (alarms.length > 0) {
        console.log("⚠️ Timers already exist, skipping restart");
        return;
    }

    chrome.alarms.create("stand", { periodInMinutes: 30 });
    chrome.alarms.create("water", { periodInMinutes: 45 });
    chrome.alarms.create("lunch", { delayInMinutes: 210 });
}


// ================= SYSTEM START TRIGGER =================

// 🔥 When Chrome/system starts
chrome.runtime.onStartup.addListener(() => {
    console.log("🖥️ System started → starting timers");
    startHealthTimers();
});

// 🔥 When extension installed or reloaded
chrome.runtime.onInstalled.addListener(() => {
    console.log("📦 Extension installed → starting timers");
    startHealthTimers();
});


// ================= NOTIFICATION HANDLER =================

chrome.alarms.onAlarm.addListener((alarm) => {

    if (alarm.name === "stand") {
        showNotification("🧍 Time to Stand!", "Stretch your body!");
    }

    if (alarm.name === "water") {
        showNotification("💧 Drink Water!", "Stay hydrated 💙");
    }

    if (alarm.name === "lunch") {
        showNotification("🍱 Lunch Time!", "Take a proper break");
    }
});


// ================= NOTIFICATION FUNCTION =================

function showNotification(title, message) {

    chrome.notifications.create({
        type: "basic",
        iconUrl: chrome.runtime.getURL("icon128.png"),
        title: title,
        message: message,
        priority: 2
    });

    console.log("🔔 Notification:", title);
}

// ================= MESSAGE HANDLER =================

chrome.runtime.onMessage.addListener(async (msg) => {

    if (msg.action === "startTimers") {

        await chrome.storage.sync.set({ timersOn: true });

        startHealthTimers();
    }

    if (msg.action === "stopTimers") {

        await chrome.storage.sync.set({ timersOn: false });

        chrome.alarms.clearAll();

        console.log("⛔ Timers stopped");
    }
});

// ================= STOP TIMERS =================

function stopHealthTimers() {

    console.log("⛔ Stopping timers");

    chrome.alarms.clearAll();

    timersStarted = false;
}