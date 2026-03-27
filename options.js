// ============= SMART HEALTH - OPTIONS.JS =============

document.addEventListener("DOMContentLoaded", () => {
    loadSettings();
    
    // Save button with animation
    const saveBtn = document.getElementById("save");
    if (saveBtn) {
        saveBtn.addEventListener("click", async () => {
            await saveSettings();
            
            // Show toast notification
            const toast = document.getElementById("toast");
            if (toast) {
                toast.classList.add("show");
                setTimeout(() => {
                    toast.classList.remove("show");
                }, 3000);
            }
        });
    }
});

async function loadSettings() {
    const settings = await getSettings();

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
}

async function saveSettings() {
    const settings = {
        stand: parseInt(document.getElementById("stand").value) || 30,
        water: parseInt(document.getElementById("water").value) || 45,
        lunch: parseInt(document.getElementById("lunch").value) || 240,
        start: parseInt(document.getElementById("start").value) || 9,
        end: parseInt(document.getElementById("end").value) || 18
    };

    await chrome.storage.sync.set({ settings });
    
    console.log('Settings saved:', settings);
}

function getSettings() {
    return new Promise(resolve => {
        chrome.storage.sync.get(["settings"], res => {
            resolve(res.settings || {});
        });
    });
}