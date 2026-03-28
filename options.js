// ============= SMART HEALTH - OPTIONS.JS =============

// Global variable for current settings
let currentSettings = {};

document.addEventListener("DOMContentLoaded", async () => {
    console.log('Options page loaded');
    
    try {
        // Load all settings
        await loadAllSettings();
        
        // Setup event listeners
        setupEventListeners();
        
        // Initialize toggles
        initToggles();
        
        // Initialize live previews
        initLivePreviews();
        
        console.log('Options page initialized successfully');
    } catch (error) {
        console.error('Error initializing options page:', error);
    }
});

// ============= LOAD SETTINGS =============

async function loadAllSettings() {
    try {
        const settings = await getSettings();
        currentSettings = settings;
        
        // Load interval settings
        const standInput = document.getElementById("stand");
        const waterInput = document.getElementById("water");
        const lunchInput = document.getElementById("lunch");
        const startInput = document.getElementById("start");
        const endInput = document.getElementById("end");
        
        if (standInput) standInput.value = settings.stand || 30;
        if (waterInput) waterInput.value = settings.water || 45;
        if (lunchInput) lunchInput.value = settings.lunch || 240;
        if (startInput) startInput.value = settings.start || 9;
        if (endInput) endInput.value = settings.end || 18;
        
        // Update display values
        const standDisplay = document.getElementById("standDisplay");
        const waterDisplay = document.getElementById("waterDisplay");
        const lunchDisplay = document.getElementById("lunchDisplay");
        const startTimePreview = document.getElementById("startTimePreview");
        const endTimePreview = document.getElementById("endTimePreview");
        
        if (standDisplay) standDisplay.textContent = settings.stand || 30;
        if (waterDisplay) waterDisplay.textContent = settings.water || 45;
        if (lunchDisplay) lunchDisplay.textContent = settings.lunch || 240;
        
        function formatTime(hour) {
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const hour12 = hour % 12 || 12;
            return `${hour12}:00 ${ampm}`;
        }
        
        if (startTimePreview) startTimePreview.textContent = formatTime(settings.start || 9);
        if (endTimePreview) endTimePreview.textContent = formatTime(settings.end || 18);
        
        // Load report settings
        loadReportSettings(settings);
        
        // Update email status UI
        updateEmailStatusUI(settings);
        
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

function loadReportSettings(settings) {
    try {
        const dailyReportEnabled = document.getElementById('dailyReportEnabled');
        const reportHour = document.getElementById('reportHour');
        const autoReset = document.getElementById('autoReset');
        const emailNotifications = document.getElementById('emailNotifications');
        const userEmail = document.getElementById('userEmail');
        
        if (dailyReportEnabled) dailyReportEnabled.checked = settings.dailyReportEnabled !== false;
        if (reportHour) reportHour.value = settings.reportHour || 18;
        if (autoReset) autoReset.checked = settings.autoReset !== false;
        if (emailNotifications) emailNotifications.checked = settings.emailNotifications || false;
        if (userEmail) userEmail.value = settings.userEmail || '';
    } catch (error) {
        console.error('Error loading report settings:', error);
    }
}

// ============= EMAIL STATUS UI =============

function updateEmailStatusUI(settings) {
    try {
        const dot = document.getElementById('emailStatusDot');
        const text = document.getElementById('emailStatusText');
        const reportText = document.getElementById('reportStatusText');
        const reportIcon = document.getElementById('reportStatusIcon');
        const emailjsStatusText = document.getElementById('emailjsStatusText');
        
        if (!dot) return;
        
        if (settings && settings.userEmail) {
            dot.style.background = '#4caf50';
            if (text) text.innerHTML = `✅ ${settings.userEmail}`;
            if (reportText && settings.dailyReportEnabled) {
                reportText.innerHTML = `Daily report will be sent to ${settings.userEmail} at ${settings.reportHour || 18}:00`;
                if (reportIcon) reportIcon.innerHTML = '📅';
            } else if (reportText) {
                reportText.innerHTML = `Email configured: ${settings.userEmail} | Daily reports: OFF`;
                if (reportIcon) reportIcon.innerHTML = '⏸️';
            }
            if (emailjsStatusText) emailjsStatusText.innerHTML = '✅ EmailJS ready - emails will send automatically';
        } else {
            dot.style.background = '#ff9800';
            if (text) text.innerHTML = '⚠️ No email configured. Enter your email above.';
            if (reportText) reportText.innerHTML = 'Enter your email to receive daily reports';
            if (reportIcon) reportIcon.innerHTML = '✉️';
            if (emailjsStatusText) emailjsStatusText.innerHTML = '⚠️ Enter your email to enable automatic reports';
        }
    } catch (error) {
        console.error('Error updating email status UI:', error);
    }
}

// ============= LIVE PREVIEWS =============

function initLivePreviews() {
    try {
        // Stand interval preview
        const standInput = document.getElementById('stand');
        if (standInput) {
            standInput.addEventListener('input', () => {
                const display = document.getElementById('standDisplay');
                if (display) display.textContent = standInput.value;
            });
        }
        
        // Water interval preview
        const waterInput = document.getElementById('water');
        if (waterInput) {
            waterInput.addEventListener('input', () => {
                const display = document.getElementById('waterDisplay');
                if (display) display.textContent = waterInput.value;
            });
        }
        
        // Lunch interval preview
        const lunchInput = document.getElementById('lunch');
        if (lunchInput) {
            lunchInput.addEventListener('input', () => {
                const display = document.getElementById('lunchDisplay');
                if (display) display.textContent = lunchInput.value;
            });
        }
        
        // Start time preview
        const startInput = document.getElementById('start');
        if (startInput) {
            startInput.addEventListener('input', () => {
                const preview = document.getElementById('startTimePreview');
                if (preview) preview.textContent = formatTime(startInput.value);
            });
        }
        
        // End time preview
        const endInput = document.getElementById('end');
        if (endInput) {
            endInput.addEventListener('input', () => {
                const preview = document.getElementById('endTimePreview');
                if (preview) preview.textContent = formatTime(endInput.value);
            });
        }
    } catch (error) {
        console.error('Error initializing live previews:', error);
    }
}

function formatTime(hour) {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:00 ${ampm}`;
}

// ============= SAVE SETTINGS =============

async function saveAllSettings() {
    try {
        // Get all values
        const standInput = document.getElementById("stand");
        const waterInput = document.getElementById("water");
        const lunchInput = document.getElementById("lunch");
        const startInput = document.getElementById("start");
        const endInput = document.getElementById("end");
        const emailNotifications = document.getElementById("emailNotifications");
        const dailyReportEnabled = document.getElementById("dailyReportEnabled");
        const reportHourSelect = document.getElementById("reportHour");
        const autoResetCheck = document.getElementById("autoReset");
        const userEmailInput = document.getElementById("userEmail");
        
        const stand = standInput ? parseInt(standInput.value) || 30 : 30;
        const water = waterInput ? parseInt(waterInput.value) || 45 : 45;
        const lunch = lunchInput ? parseInt(lunchInput.value) || 240 : 240;
        const start = startInput ? parseInt(startInput.value) || 9 : 9;
        const end = endInput ? parseInt(endInput.value) || 18 : 18;
        const emailNotificationsValue = emailNotifications ? emailNotifications.checked : false;
        const dailyReportEnabledValue = dailyReportEnabled ? dailyReportEnabled.checked : false;
        const reportHour = reportHourSelect ? parseInt(reportHourSelect.value) || 18 : 18;
        const autoReset = autoResetCheck ? autoResetCheck.checked !== false : true;
        const userEmail = userEmailInput ? userEmailInput.value.trim() : '';
        
        // Validate email
        if (userEmail && !isValidEmail(userEmail)) {
            alert('❌ Please enter a valid email address');
            return;
        }
        
        const newSettings = {
            ...currentSettings,
            stand, water, lunch, start, end,
            emailNotifications: emailNotificationsValue,
            dailyReportEnabled: dailyReportEnabledValue,
            reportHour: reportHour,
            autoReset: autoReset,
            userEmail: userEmail
        };
        
        await chrome.storage.sync.set({ settings: newSettings });
        currentSettings = newSettings;
        
        // Update UI
        updateEmailStatusUI(newSettings);
        
        // Show toast notification
        const toast = document.getElementById("toast");
        if (toast) {
            toast.classList.add("show");
            setTimeout(() => {
                toast.classList.remove("show");
            }, 3000);
        }
        
        // Reschedule report
        chrome.runtime.sendMessage({ action: 'rescheduleReport' });
        
        alert('✅ Settings saved successfully!');
        
    } catch (error) {
        console.error('Error saving settings:', error);
        alert('❌ Error saving settings. Please try again.');
    }
}

// ============= TEST FUNCTIONS =============

async function testReport() {
    try {
        const settings = await getSettings();
        if (!settings.userEmail) {
            alert('❌ Please enter your email address first');
            return;
        }
        
        const testBtn = document.getElementById('testReportBtn');
        if (!testBtn) return;
        
        const originalText = testBtn.textContent;
        testBtn.textContent = '📧 Sending...';
        testBtn.disabled = true;
        
        chrome.runtime.sendMessage({ action: 'sendTestReport' }, () => {
            testBtn.textContent = originalText;
            testBtn.disabled = false;
            alert('✅ Test report sent! Check your email (or email client).');
        });
    } catch (error) {
        console.error('Error sending test report:', error);
        alert('❌ Error sending test report');
    }
}

// In options.js, when sending messages, add error handling
async function testEmailJS() {
    const settings = await getSettings();
    if (!settings.userEmail) {
        alert('❌ Please enter your email address first');
        return;
    }
    
    const testBtn = document.getElementById('testEmailJSBtn');
    const originalText = testBtn.textContent;
    testBtn.textContent = '🚀 Sending...';
    testBtn.disabled = true;
    
    chrome.runtime.sendMessage({ action: 'sendTestEmailJS' }, (response) => {
        testBtn.textContent = originalText;
        testBtn.disabled = false;
        
        if (chrome.runtime.lastError) {
            console.error('Runtime error:', chrome.runtime.lastError);
            alert('❌ Error: ' + chrome.runtime.lastError.message);
        } else if (response && response.success) {
            alert(`✅ Test email sent to ${settings.userEmail}!`);
        } else {
            alert('❌ EmailJS failed: ' + (response?.error || 'Unknown error'));
        }
    });
}

// ============= TOGGLE SWITCHES =============

function initToggles() {
    try {
        const toggles = document.querySelectorAll('input[type="checkbox"]');
        toggles.forEach(toggle => {
            // Update initial style
            const slider = toggle.nextElementSibling;
            if (slider && slider.tagName === 'SPAN') {
                slider.style.backgroundColor = toggle.checked ? '#667eea' : 'rgba(255,255,255,0.2)';
            }
            
            // Add change listener
            toggle.addEventListener('change', () => {
                const sliderSpan = toggle.nextElementSibling;
                if (sliderSpan && sliderSpan.tagName === 'SPAN') {
                    sliderSpan.style.backgroundColor = toggle.checked ? '#667eea' : 'rgba(255,255,255,0.2)';
                }
            });
        });
    } catch (error) {
        console.error('Error initializing toggles:', error);
    }
}

// ============= HELPER FUNCTIONS =============

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

async function getSettings() {
    return new Promise(resolve => {
        chrome.storage.sync.get(["settings"], res => {
            resolve(res.settings || {});
        });
    });
}

// ============= SETUP EVENT LISTENERS =============

function setupEventListeners() {
    try {
        // Main Save button
        const saveBtn = document.getElementById("save");
        if (saveBtn) {
            saveBtn.addEventListener("click", async (e) => {
                e.preventDefault();
                await saveAllSettings();
            });
        }
        
        // Save all email settings button
        const saveEmailSettings = document.getElementById("saveEmailSettings");
        if (saveEmailSettings) {
            saveEmailSettings.addEventListener("click", async (e) => {
                e.preventDefault();
                await saveAllSettings();
            });
        }
        
        // Test report button
        const testReportBtn = document.getElementById("testReportBtn");
        if (testReportBtn) {
            testReportBtn.addEventListener("click", async (e) => {
                e.preventDefault();
                await testReport();
            });
        }
        
        // Test EmailJS button
        const testEmailJSBtn = document.getElementById("testEmailJSBtn");
        if (testEmailJSBtn) {
            testEmailJSBtn.addEventListener("click", async (e) => {
                e.preventDefault();
                await testEmailJS();
            });
        }
        
        // Real-time email validation
        const userEmailInput = document.getElementById("userEmail");
        if (userEmailInput) {
            userEmailInput.addEventListener("input", () => {
                const dot = document.getElementById('emailStatusDot');
                const text = document.getElementById('emailStatusText');
                const email = userEmailInput.value.trim();
                
                if (email && isValidEmail(email)) {
                    if (dot) dot.style.background = '#4caf50';
                    if (text) text.innerHTML = `✏️ ${email} (click Save to confirm)`;
                } else if (email) {
                    if (dot) dot.style.background = '#f44336';
                    if (text) text.innerHTML = '⚠️ Invalid email format';
                } else {
                    if (dot) dot.style.background = '#ff9800';
                    if (text) text.innerHTML = '⚠️ No email configured. Enter your email above.';
                }
            });
        }
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}


    // Live preview for interval values
    const standInput = document.getElementById('stand');
    const waterInput = document.getElementById('water');
    const lunchInput = document.getElementById('lunch');
    const startInput = document.getElementById('start');
    const endInput = document.getElementById('end');
    
    if (standInput) {
      standInput.addEventListener('input', () => {
        document.getElementById('standDisplay').textContent = standInput.value;
      });
    }
    
    if (waterInput) {
      waterInput.addEventListener('input', () => {
        document.getElementById('waterDisplay').textContent = waterInput.value;
      });
    }
    
    if (lunchInput) {
      lunchInput.addEventListener('input', () => {
        document.getElementById('lunchDisplay').textContent = lunchInput.value;
      });
    }
    
    function formatTime(hour) {
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:00 ${ampm}`;
    }
    
    if (startInput) {
      startInput.addEventListener('input', () => {
        document.getElementById('startTimePreview').textContent = formatTime(startInput.value);
      });
    }
    
    if (endInput) {
      endInput.addEventListener('input', () => {
        document.getElementById('endTimePreview').textContent = formatTime(endInput.value);
      });
    }
