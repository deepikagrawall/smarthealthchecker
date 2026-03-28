// ============= SMART HEALTH - FIXED POPUP.JS =============

let timerInterval = null;
let nextReminderTime = null;
let currentReminderType = null;
let lastNotificationSent = {}; // Track when last notification was sent

document.addEventListener("DOMContentLoaded", async () => {
    console.log('Smart Health popup loaded');
    
    // Load all data
    await loadStats();
    await loadTimerState();
    await startTimerCountdown();
    
    // Setup event listeners
    setupEventListeners();

    const postureBtn = document.getElementById("postureBtn");
    if (postureBtn) {
        postureBtn.addEventListener("click", () => {
            console.log("Posture button clicked - opening posture page");
            try {
                chrome.tabs.create({ 
                    url: chrome.runtime.getURL("posture.html"),
                    active: true 
                });
            } catch (error) {
                console.error("Error opening posture page:", error);
                alert("Could not open posture page. Please check if posture.html exists.");
            }
        });
    }
});

// ============= TIMER FUNCTIONS =============

async function startTimerCountdown() {
    // Clear existing interval
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    // Get settings and timer state
    const settings = await getSettings();
    const timersOn = await getTimerState();
    
    if (!timersOn) {
        updateCountdownDisplay('--:--:--', '⏸️ Timers are OFF', 0);
        return;
    }
    
    // Get last reminder times
    const lastReminders = await getLastReminders();
    const now = new Date();
    const workStart = settings.start || 9;
    const workEnd = settings.end || 18;
    const currentHour = now.getHours();
    
    // Check if within work hours
    if (currentHour < workStart || currentHour >= workEnd) {
        updateCountdownDisplay('--:--:--', '💤 Outside work hours', 0);
        return;
    }
    
    // Calculate next reminder for each type
    const intervals = {
        water: (settings.water || 45) * 60 * 1000,
        stand: (settings.stand || 30) * 60 * 1000,
        lunch: (settings.lunch || 240) * 60 * 1000
    };
    
    let soonestTime = null;
    let soonestType = null;
    
    for (const [type, interval] of Object.entries(intervals)) {
        const lastTime = lastReminders[type] ? new Date(lastReminders[type]) : new Date(now.getTime() - interval);
        const nextTime = new Date(lastTime.getTime() + interval);
        
        // If next time is in the past, reset it to now
        if (nextTime <= now) {
            // Mark that this reminder is due but don't auto-increment
            soonestTime = now;
            soonestType = type;
            break;
        }
        
        if (!soonestTime || nextTime < soonestTime) {
            soonestTime = nextTime;
            soonestType = type;
        }
    }
    
    if (soonestTime && soonestType) {
        // Check if reminder is due now
        if (soonestTime <= now) {
            // Check if we already sent a notification for this reminder recently
            const lastNotif = lastNotificationSent[soonestType] || 0;
            const timeSinceLastNotif = Date.now() - lastNotif;
            
            // Only send notification if it's been at least 5 minutes since last one
            if (timeSinceLastNotif > 5 * 60 * 1000) {
                updateCountdownDisplay('00:00:00', `⏰ ${getReminderName(soonestType)} due now! Click +`, 100);
                sendReminderNotification(soonestType);
                lastNotificationSent[soonestType] = Date.now();
                
                // Auto-increment after notification (only once)
                await incrementStat(soonestType);
            } else {
                updateCountdownDisplay('00:00:00', `✅ ${getReminderName(soonestType)} logged recently`, 100);
            }
            
            // Restart after 3 seconds to get next reminder
            setTimeout(() => {
                startTimerCountdown();
            }, 3000);
            return;
        }
        
        nextReminderTime = soonestTime;
        currentReminderType = soonestType;
        
        // Update countdown every second
        timerInterval = setInterval(() => {
            updateCountdown(soonestTime, soonestType);
        }, 1000);
        
        // Initial update
        updateCountdown(soonestTime, soonestType);
    }
}

function updateCountdown(targetTime, type) {
    const now = new Date();
    const diff = targetTime - now;
    
    if (diff <= 0) {
        // Reminder is due - restart timer to handle it
        clearInterval(timerInterval);
        startTimerCountdown();
        return;
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Calculate progress based on interval
    const interval = getIntervalForType(type);
    const lastReminders = getLastReminderForTypeSync(type);
    const elapsed = interval - diff;
    const progress = Math.min(100, Math.max(0, (elapsed / interval) * 100));
    
    updateCountdownDisplay(timeString, `Next: ${getReminderName(type)} in ${formatTimeRemaining(diff)}`, progress);
}

function formatTimeRemaining(ms) {
    const minutes = Math.floor(ms / (1000 * 60));
    if (minutes < 1) return 'less than a minute';
    if (minutes === 1) return '1 minute';
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour';
    return `${hours} hours`;
}

function getIntervalForType(type) {
    return new Promise(async (resolve) => {
        const settings = await getSettings();
        const intervals = {
            water: (settings.water || 45) * 60 * 1000,
            stand: (settings.stand || 30) * 60 * 1000,
            lunch: (settings.lunch || 240) * 60 * 1000
        };
        resolve(intervals[type]);
    });
}

function getLastReminderForTypeSync(type) {
    return new Date().getTime() - getIntervalForTypeSync(type);
}

function getIntervalForTypeSync(type) {
    const intervals = {
        water: 45 * 60 * 1000,
        stand: 30 * 60 * 1000,
        lunch: 240 * 60 * 1000
    };
    return intervals[type] || 30 * 60 * 1000;
}

function updateCountdownDisplay(time, message, progress) {
    const countdownEl = document.getElementById('countdown');
    const nextTypeEl = document.getElementById('nextReminderType');
    const progressFill = document.getElementById('progressFill');
    
    if (countdownEl) countdownEl.textContent = time;
    if (nextTypeEl) nextTypeEl.textContent = message;
    if (progressFill) progressFill.style.width = `${progress}%`;
}

function getReminderName(type) {
    const names = {
        water: '💧 Drink Water',
        stand: '🧍 Stand Up',
        lunch: '🍱 Eat Meal'
    };
    return names[type] || type;
}

function sendReminderNotification(type) {
    const titles = {
        water: '💧 Time to Hydrate!',
        stand: '🧍 Time to Stand!',
        lunch: '🍱 Time to Eat!'
    };
    
    const messages = {
        water: 'Drink a glass of water to stay hydrated and focused.',
        stand: 'Take a 5-minute standing break to improve circulation.',
        lunch: 'Don\'t skip your meal! Fuel your body for the afternoon.'
    };
    
    chrome.notifications.create({
        type: "basic",
        iconUrl: chrome.runtime.getURL("icon128.png"),
        title: titles[type] || 'Reminder!',
        message: messages[type] || 'Time for a healthy habit!',
        priority: 2,
        requireInteraction: true
    }).catch(e => console.log('Notification error:', e));
}

// ============= LOAD FUNCTIONS =============

async function loadStats() {
    const stats = await getStats();
    
    const standEl = document.getElementById("stand");
    const waterEl = document.getElementById("water");
    const lunchEl = document.getElementById("lunch");
    const scoreEl = document.getElementById("score");
    const aiTipEl = document.getElementById("aiTip");
    
    if (standEl) standEl.textContent = stats.stand || 0;
    if (waterEl) waterEl.textContent = stats.water || 0;
    if (lunchEl) lunchEl.textContent = stats.lunch || 0;
    
    const score = calculateScore(stats);
    if (scoreEl) scoreEl.textContent = score;
    if (aiTipEl) aiTipEl.textContent = generateAITip(stats);
}

async function loadTimerState() {
    const data = await chrome.storage.sync.get("timersOn");
    let isOn = data.timersOn === true;
    
    const toggleBtn = document.getElementById("toggleBtn");
    if (toggleBtn) {
        updateButton(toggleBtn, isOn);
    }
}

// ============= SETUP EVENT LISTENERS =============

function setupEventListeners() {
    // Reset button
    const resetBtn = document.getElementById("reset");
    if (resetBtn) {
        resetBtn.addEventListener("click", async () => {
            if (confirm('Reset all stats to zero?')) {
                await chrome.storage.sync.set({
                    stats: { stand: 0, water: 0, lunch: 0 },
                    lastReminders: {}
                });
                lastNotificationSent = {};
                await loadStats();
                if (timerInterval) clearInterval(timerInterval);
                await startTimerCountdown();
                showNotification('Reset', 'All stats have been reset to zero');
            }
        });
    }
    
    // Settings button
    const settingsBtn = document.getElementById("settingsBtn");
    if (settingsBtn) {
        settingsBtn.addEventListener("click", () => {
            chrome.runtime.openOptionsPage();
        });
    }
    
    // Test notification button
    const testBtn = document.getElementById("testBtn");
    if (testBtn) {
        testBtn.addEventListener("click", async () => {
            try {
                await chrome.notifications.create({
                    type: "basic",
                    iconUrl: chrome.runtime.getURL("icon128.png"),
                    title: "✅ Smart Health",
                    message: "Notifications are working! Stay hydrated 💧",
                    priority: 2
                });
                alert('✅ Test notification sent! Check your system notifications.');
            } catch (e) {
                console.error("Notification error:", e);
                alert('⚠️ Notification failed. Make sure notifications are enabled in Chrome settings.');
            }
        });
    }
    
    // Toggle timer button
    const toggleBtn = document.getElementById("toggleBtn");
    if (toggleBtn) {
        toggleBtn.addEventListener("click", async () => {
            const data = await chrome.storage.sync.get("timersOn");
            let isOn = data.timersOn === true;
            isOn = !isOn;
            
            await chrome.storage.sync.set({ timersOn: isOn });
            updateButton(toggleBtn, isOn);
            
            // Send message to background
            chrome.runtime.sendMessage({
                action: isOn ? "startTimers" : "stopTimers"
            });
            
            // Restart countdown
            if (timerInterval) clearInterval(timerInterval);
            await startTimerCountdown();
            
            showNotification(
                isOn ? 'Timers ON' : 'Timers OFF',
                isOn ? 'You will receive hourly reminders' : 'Reminders are disabled'
            );
        });
    }
    
    // Increment buttons
    setupIncrementButtons();
}

function setupIncrementButtons() {
    // Stand buttons
    const standBtn = document.getElementById("standBtn");
    const standMinus = document.getElementById("standMinus");
    
    if (standBtn) {
        standBtn.addEventListener("click", async () => {
            await incrementStat('stand');
            await loadStats();
            showNotification('Standing Break', '✅ Great job taking a stand break!');
        });
    }
    
    if (standMinus) {
        standMinus.addEventListener("click", async () => {
            await decrementStat('stand');
            await loadStats();
        });
    }
    
    // Water buttons
    const waterBtn = document.getElementById("waterBtn");
    const waterMinus = document.getElementById("waterMinus");
    
    if (waterBtn) {
        waterBtn.addEventListener("click", async () => {
            await incrementStat('water');
            await loadStats();
            showNotification('Water Intake', '💧 Stay hydrated! +1 glass of water');
        });
    }
    
    if (waterMinus) {
        waterMinus.addEventListener("click", async () => {
            await decrementStat('water');
            await loadStats();
        });
    }
    
    // Lunch buttons
    const lunchBtn = document.getElementById("lunchBtn");
    const lunchMinus = document.getElementById("lunchMinus");
    
    if (lunchBtn) {
        lunchBtn.addEventListener("click", async () => {
            await incrementStat('lunch');
            await loadStats();
            showNotification('Meal Tracked', '🍱 Good job eating a healthy meal!');
        });
    }
    
    if (lunchMinus) {
        lunchMinus.addEventListener("click", async () => {
            await decrementStat('lunch');
            await loadStats();
        });
    }
}

// ============= STAT FUNCTIONS =============

async function incrementStat(type) {
    const stats = await getStats();
    stats[type] = (stats[type] || 0) + 1;
    await chrome.storage.sync.set({ stats });
    
    // Record last reminder time for this activity
    const lastReminders = await getLastReminders();
    lastReminders[type] = new Date().toISOString();
    await chrome.storage.sync.set({ lastReminders });
    
    // Clear notification tracking for this type
    lastNotificationSent[type] = 0;
    
    // Restart countdown
    if (timerInterval) clearInterval(timerInterval);
    await startTimerCountdown();
}

async function decrementStat(type) {
    const stats = await getStats();
    stats[type] = Math.max(0, (stats[type] || 0) - 1);
    await chrome.storage.sync.set({ stats });
}

async function getStats() {
    return new Promise(resolve => {
        chrome.storage.sync.get(["stats"], res => {
            resolve(res.stats || { stand: 0, water: 0, lunch: 0 });
        });
    });
}

async function getLastReminders() {
    return new Promise(resolve => {
        chrome.storage.sync.get(["lastReminders"], res => {
            resolve(res.lastReminders || {});
        });
    });
}

async function getTimerState() {
    const data = await chrome.storage.sync.get("timersOn");
    return data.timersOn === true;
}

async function getSettings() {
    return new Promise(resolve => {
        chrome.storage.sync.get(["settings"], res => {
            resolve(res.settings || { stand: 30, water: 45, lunch: 240, start: 9, end: 18 });
        });
    });
}

// ============= UI HELPER FUNCTIONS =============

function updateButton(btn, isOn) {
    if (isOn) {
        btn.textContent = "🟢 Timers ON";
        btn.className = "toggle-btn on";
    } else {
        btn.textContent = "🔴 Timers OFF";
        btn.className = "toggle-btn off";
    }
}

function showNotification(title, message) {
    chrome.notifications.create({
        type: "basic",
        iconUrl: chrome.runtime.getURL("icon128.png"),
        title: title,
        message: message,
        priority: 1
    }).catch(e => console.log('Notification error:', e));
}

// ============= SCORE & AI FUNCTIONS =============

function calculateScore(stats) {
    let score = 0;
    score += Math.min(40, (stats.water || 0) * 5);
    score += Math.min(30, (stats.stand || 0) * 5);
    score += Math.min(30, (stats.lunch || 0) * 10);
    return Math.min(100, score);
}

function generateAITip(stats) {
    const water = stats.water || 0;
    const stand = stats.stand || 0;
    const lunch = stats.lunch || 0;
    
    if (water < 4) {
        return "💧 Drink more water! Aim for 8 glasses today.";
    }
    
    if (stand < 3) {
        return "🧍 Time to stand up! Take a 5-minute break every hour.";
    }
    
    if (lunch === 0) {
        return "🍱 Don't skip meals! A healthy lunch boosts productivity.";
    }
    
    if (water >= 8 && stand >= 6 && lunch >= 3) {
        return "🏆 PERFECT DAY! You're crushing it! Keep this momentum!";
    }
    
    if (water >= 6 && stand >= 4 && lunch >= 2) {
        return "🌟 Great progress! You're on track for a perfect day!";
    }
    
    return "🔥 Keep going! Small healthy habits add up to big results!";
}

// Add to setupEventListeners()
document.getElementById("sendReportBtn")?.addEventListener("click", async () => {
    const settings = await getSettings();
    if (!settings.userEmail || !settings.emailNotifications) {
        alert('❌ Please enable email notifications in settings first');
        return;
    }
    
    const btn = document.getElementById("sendReportBtn");
    const originalText = btn.textContent;
    btn.textContent = "📧 Sending...";
    btn.disabled = true;
    
    chrome.runtime.sendMessage({ action: 'sendTestReport' }, (response) => {
        btn.textContent = originalText;
        btn.disabled = false;
        alert(response?.success ? '✅ Report sent!' : '⚠️ Could not send report');
    });
});