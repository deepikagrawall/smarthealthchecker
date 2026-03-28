// ============= SMART HEALTH BACKGROUND SCRIPT =============
// Works with all features: Timers, Notifications, Daily Reports, EmailJS

console.log('🧠 Smart Health Background Script Loaded');

// ============= EMAILJS CONFIGURATION =============
const EMAILJS_CONFIG = {
    serviceId: 'service_bvruyrm',
    templateId: 'template_xtu50c6',
    userId: '1AtOSQaVWciOyvZ41'
};

// ============= GLOBAL FLAGS =============
let timersStarted = false;

// ============= INITIALIZATION =============

chrome.runtime.onInstalled.addListener(async () => {
    console.log('📦 Extension installed - setting up');
    await initializeStorage();
    
    const data = await chrome.storage.sync.get("timersOn");
    if (data.timersOn) {
        await startHealthTimers();
    }
    
    await scheduleDailyReport();
    console.log('✅ All systems initialized');
});

chrome.runtime.onStartup.addListener(async () => {
    console.log('🖥️ Chrome started - checking timers');
    const data = await chrome.storage.sync.get("timersOn");
    if (data.timersOn) {
        await startHealthTimers();
    }
});

// ============= STORAGE INITIALIZATION =============

async function initializeStorage() {
    const stats = await getStats();
    if (!stats || Object.keys(stats).length === 0) {
        await chrome.storage.sync.set({ stats: { stand: 0, water: 0, lunch: 0 } });
        console.log('Stats initialized');
    }
    
    const settings = await getSettings();
    if (!settings || Object.keys(settings).length === 0) {
        await chrome.storage.sync.set({ 
            settings: {
                stand: 30,
                water: 45,
                lunch: 240,
                start: 9,
                end: 18,
                emailNotifications: false,
                userEmail: '',
                notifyDayBefore: true,
                notifySameDay: true,
                dailyReportEnabled: true,
                reportHour: 18,
                autoReset: true
            }
        });
        console.log('Settings initialized');
    }
    
    const streakData = await getStreakData();
    if (!streakData || Object.keys(streakData).length === 0) {
        await chrome.storage.sync.set({ 
            streakData: { 
                currentStreak: 0, 
                longestStreak: 0,
                achievements: [],
                lastActiveDate: null,
                perfectDays: 0
            }
        });
        console.log('Streak data initialized');
    }
}

// ============= TIMER FUNCTIONS =============

async function startHealthTimers() {
    console.log("🚀 Starting health timers...");
    await chrome.alarms.clearAll();
    
    const settings = await getSettings();
    chrome.alarms.create("stand", { periodInMinutes: settings.stand || 30 });
    chrome.alarms.create("water", { periodInMinutes: settings.water || 45 });
    chrome.alarms.create("lunch", { periodInMinutes: settings.lunch || 240 });
    
    timersStarted = true;
    console.log(`✅ Timers started: Stand:${settings.stand}m, Water:${settings.water}m, Lunch:${settings.lunch}m`);
}

async function stopHealthTimers() {
    console.log("⛔ Stopping all timers");
    await chrome.alarms.clearAll();
    timersStarted = false;
}

// ============= NOTIFICATION HANDLER =============

chrome.alarms.onAlarm.addListener(async (alarm) => {
    console.log('⏰ Alarm triggered:', alarm.name);
    
    const settings = await getSettings();
    const now = new Date();
    const currentHour = now.getHours();
    const workStart = settings.start || 9;
    const workEnd = settings.end || 18;
    
    if (currentHour < workStart || currentHour >= workEnd) {
        console.log('Outside work hours, skipping notification');
        return;
    }
    
    if (alarm.name === "stand") {
        await showNotification("🧍 Time to Stand!", "Stretch your body and take a 2-minute walk!");
    }
    if (alarm.name === "water") {
        await showNotification("💧 Drink Water!", "Stay hydrated! Your brain needs it.");
    }
    if (alarm.name === "lunch") {
        await showNotification("🍱 Lunch Time!", "Take a proper break and eat a healthy meal.");
    }
    if (alarm.name === "dailyReport") {
        await sendDailyReport();
    }
});

async function showNotification(title, message) {
    try {
        await chrome.notifications.create({
            type: "basic",
            iconUrl: chrome.runtime.getURL("icon128.png"),
            title: title,
            message: message,
            priority: 2,
            requireInteraction: true
        });
        console.log("🔔 Notification sent:", title);
    } catch (error) {
        console.error("Notification error:", error);
    }
}

// ============= MESSAGE HANDLER =============

// ============= FIXED MESSAGE HANDLER =============

// ============= COMPLETE FIXED MESSAGE HANDLER =============

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    console.log('📨 Message received:', msg.action, msg);
    
    // Handle each action with proper async response
    const handleAction = async () => {
        switch (msg.action) {
            case "startTimers":
                await chrome.storage.sync.set({ timersOn: true });
                await startHealthTimers();
                return { success: true };
                
            case "stopTimers":
                await chrome.storage.sync.set({ timersOn: false });
                await stopHealthTimers();
                return { success: true };
                
            case "sendTestReport":
                await sendDailyReport();
                return { success: true };
                
            case "sendTestEmailJS":
                const settings = await getSettings();
                if (!settings.userEmail) {
                    return { success: false, error: 'No email configured' };
                }
                const result = await sendTestEmailJS(settings.userEmail);
                return { success: result };
                
            case "rescheduleReport":
                await scheduleDailyReport();
                return { success: true };
                
            case "getSettings":
                const settingsData = await getSettings();
                return { settings: settingsData };
                
            case "getStats":
                const statsData = await getStats();
                return { stats: statsData };
                
            default:
                return { success: false, error: 'Unknown action: ' + msg.action };
        }
    };
    
    // Execute and send response
    handleAction().then(response => {
        console.log('📨 Sending response for', msg.action, response);
        sendResponse(response);
    }).catch(error => {
        console.error('❌ Error handling', msg.action, error);
        sendResponse({ success: false, error: error.message });
    });
    
    return true; // Keep channel open for async response
});
// ============= EMAILJS FUNCTIONS =============

// ============= FIXED EMAILJS FUNCTIONS =============

async function sendEmailViaEmailJS(to, subject, templateParams) {
    console.log("📧 Sending email via EmailJS to:", to);
    
    // Validate email
    if (!to || !to.includes('@')) {
        console.error('❌ Invalid email address:', to);
        return false;
    }
    
    try {
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                service_id: EMAILJS_CONFIG.serviceId,
                template_id: EMAILJS_CONFIG.templateId,
                user_id: EMAILJS_CONFIG.userId,
                template_params: {
                    email: to,  // CRITICAL: Must match variable in your EmailJS template
                    subject: subject,
                    ...templateParams
                }
            })
        });
        
        const responseText = await response.text();
        console.log('EmailJS response:', responseText);
        
        if (response.ok) {
            console.log('✅ Email sent successfully via EmailJS');
            return true;
        } else {
            console.error('❌ EmailJS error:', responseText);
            return false;
        }
    } catch (error) {
        console.error('❌ Failed to send email:', error);
        return false;
    }
}

async function sendTestEmailJS(to) {
    console.log("📧 Sending test email to:", to);
    
    if (!to || !to.includes('@')) {
        console.error('❌ Invalid email:', to);
        return false;
    }
    
    const templateParams = {
        to_email: to,  // CRITICAL: This must match the variable in your EmailJS template
        date: new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        }),
        score: 85,
        water: 6,
        stand: 4,
        lunch: 2,
        waterProgress: 75,
        standProgress: 66,
        lunchProgress: 66,
        streak: 5,
        longestStreak: 12,
        insights: "<ul><li>✅ This is a test email from Smart Health Extension</li><li>🎉 EmailJS integration is working!</li><li>💪 You'll receive daily wellness reports automatically</li></ul>"
    };
    
    return await sendEmailViaEmailJS(to, '🧠 Smart Health - Test Email', templateParams);
}

// ============= DAILY PROGRESS EMAIL REPORT =============

async function scheduleDailyReport() {
    const settings = await getSettings();
    if (!settings.dailyReportEnabled) {
        console.log('Daily reports disabled');
        return;
    }
    
    const reportHour = settings.reportHour || 18;
    await chrome.alarms.clear('dailyReport');
    chrome.alarms.create('dailyReport', {
        when: getNextReportTime(reportHour),
        periodInMinutes: 24 * 60
    });
    console.log(`📅 Daily report scheduled for ${reportHour}:00`);
}

function getNextReportTime(hour) {
    const now = new Date();
    const reportTime = new Date();
    reportTime.setHours(hour, 0, 0, 0);
    if (reportTime <= now) {
        reportTime.setDate(reportTime.getDate() + 1);
    }
    return reportTime.getTime();
}

async function sendDailyReport() {
    console.log('📧 Generating daily report...');
    
    const settings = await getSettings();
    if (!settings.dailyReportEnabled) {
        console.log('Daily reports disabled');
        return;
    }
    
    if (!settings.userEmail) {
        console.log('No email configured');
        return;
    }
    
    console.log('Sending report to:', settings.userEmail);
    
    const now = new Date();
    await chrome.storage.sync.set({ lastReportSent: now.toISOString() });
    
    const stats = await getStats();
    const streakData = await getStreakData();
    
    const waterGoal = 8;
    const standGoal = 6;
    const lunchGoal = 3;
    
    const waterProgress = Math.min(100, ((stats.water || 0) / waterGoal) * 100);
    const standProgress = Math.min(100, ((stats.stand || 0) / standGoal) * 100);
    const lunchProgress = Math.min(100, ((stats.lunch || 0) / lunchGoal) * 100);
    const overallScore = Math.round((waterProgress + standProgress + lunchProgress) / 3);
    
    const insights = [];
    if (stats.water >= waterGoal) insights.push("<li>💧 Great job hitting your water goal!</li>");
    else if (stats.water >= waterGoal * 0.75) insights.push(`<li>💧 Almost there! Need ${waterGoal - (stats.water || 0)} more glasses</li>`);
    else insights.push("<li>💧 Try to drink more water tomorrow</li>");
    
    if (stats.stand >= standGoal) insights.push("<li>🧍 Excellent stand break consistency!</li>");
    else if (stats.stand >= standGoal * 0.75) insights.push(`<li>🧍 Close to stand goal! ${standGoal - (stats.stand || 0)} more breaks</li>`);
    else insights.push("<li>🧍 Take more stand breaks</li>");
    
    if (stats.lunch >= lunchGoal) insights.push("<li>🍱 Perfect meal tracking!</li>");
    else if (stats.lunch >= lunchGoal * 0.75) insights.push("<li>🍱 One more meal to hit your goal</li>");
    else insights.push("<li>🍱 Don't skip meals</li>");
    
    const dateStr = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    // CRITICAL: Include to_email in templateParams
    const templateParams = {
        to_email: settings.userEmail,  // This MUST be included
        date: dateStr,
        score: overallScore,
        water: stats.water || 0,
        stand: stats.stand || 0,
        lunch: stats.lunch || 0,
        waterProgress: Math.round(waterProgress),
        standProgress: Math.round(standProgress),
        lunchProgress: Math.round(lunchProgress),
        streak: streakData.currentStreak || 0,
        longestStreak: streakData.longestStreak || 0,
        insights: `<ul>${insights.join('')}</ul>`
    };
    
    console.log('Sending with params:', templateParams);
    
    const emailSent = await sendEmailViaEmailJS(
        settings.userEmail,
        `📊 Daily Wellness Report - ${dateStr}`,
        templateParams
    );
    
    if (emailSent) {
        await chrome.notifications.create('email-triggered', {
            type: "basic",
            iconUrl: chrome.runtime.getURL("icon128.png"),
            title: "📧 Daily Report Sent",
            message: `Your wellness report has been sent to ${settings.userEmail}`,
            priority: 1
        });
        console.log('✅ Daily report email sent');
        
        if (settings.autoReset !== false) {
            await chrome.storage.sync.set({ stats: { stand: 0, water: 0, lunch: 0 } });
            console.log('Daily stats reset');
        }
    } else {
        console.log('❌ EmailJS failed');
        // Fallback to mailto
        await fallbackToMailto(settings.userEmail, dateStr, templateParams);
    }
}

// Fallback method (opens email client)
async function fallbackToMailto(email, dateStr, params) {
    const subject = `📊 Daily Wellness Report - ${dateStr}`;
    const body = `
        🧠 Smart Health Report - ${dateStr}
        
        Overall Score: ${params.score}%
        
        💧 Water: ${params.water}/8 (${params.waterProgress}%)
        🧍 Stand: ${params.stand}/6 (${params.standProgress}%)
        🍱 Lunch: ${params.lunch}/3 (${params.lunchProgress}%)
        
        🔥 Streak: ${params.streak} days
        
        🤖 AI Insights:
        ${params.insights.replace(/<[^>]*>/g, '').replace(/li/g, '•').replace(/ul/g, '')}
        
        Keep building healthy habits! You're doing great 💪
        ---
        Sent from Smart Health Extension
    `;
    
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    await chrome.tabs.create({ url: mailtoUrl });
    console.log('📧 Mailto fallback opened');
}
// ============= HELPER FUNCTIONS =============

async function getStats() {
    return new Promise(resolve => {
        chrome.storage.sync.get(["stats"], res => {
            resolve(res.stats || { stand: 0, water: 0, lunch: 0 });
        });
    });
}

async function getSettings() {
    return new Promise(resolve => {
        chrome.storage.sync.get(["settings"], res => {
            resolve(res.settings || {});
        });
    });
}

async function getStreakData() {
    return new Promise(resolve => {
        chrome.storage.sync.get(["streakData"], res => {
            resolve(res.streakData || { currentStreak: 0, longestStreak: 0, achievements: [] });
        });
    });
}

console.log('✅ Smart Health background script ready!');