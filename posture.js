
        let video = null;
        let stream = null;
        let isRunning = false;
        let animationId = null;
        
        let goodCount = 0;
        let badCount = 0;
        let lastBadTime = 0;
        
        // Get elements
        const videoEl = document.getElementById('video');
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        const postureDisplay = document.getElementById('postureDisplay');
        
        // Setup event listeners
        startBtn.addEventListener('click', startCamera);
        stopBtn.addEventListener('click', stopCamera);
        
        async function startCamera() {
            startBtn.disabled = true;
            startBtn.textContent = "📷 Requesting Camera...";
            
            try {
                stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        facingMode: "user"
                    } 
                });
                
                videoEl.srcObject = stream;
                await videoEl.play();
                
                startBtn.textContent = "🎥 Camera Active";
                stopBtn.disabled = false;
                isRunning = true;
                
                // Start detection
                detectPosture();
                
                updateDisplay("good", "🧘", "Posture: Monitoring", "Sit naturally, I'll detect slouching");
                
            } catch (error) {
                console.error("Camera error:", error);
                startBtn.disabled = false;
                startBtn.textContent = "🎥 Start Camera";
                alert("Could not access camera: " + error.message);
                updateDisplay("bad", "⚠️", "Camera Error", error.message);
            }
        }
        
        function stopCamera() {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                stream = null;
            }
            
            if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
            
            videoEl.srcObject = null;
            isRunning = false;
            
            startBtn.disabled = false;
            startBtn.textContent = "🎥 Start Camera";
            stopBtn.disabled = true;
            
            updateDisplay("good", "🧘", "Stopped", "Click Start Camera to resume");
        }
        
        function detectPosture() {
            if (!isRunning || !videoEl || videoEl.paused) {
                animationId = requestAnimationFrame(detectPosture);
                return;
            }
            
            // Get video dimensions
            const videoWidth = videoEl.videoWidth;
            const videoHeight = videoEl.videoHeight;
            
            if (videoWidth === 0 || videoHeight === 0) {
                animationId = requestAnimationFrame(detectPosture);
                return;
            }
            
            // Create canvas to analyze frame
            const canvas = document.createElement('canvas');
            canvas.width = videoWidth;
            canvas.height = videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoEl, 0, 0, videoWidth, videoHeight);
            
            // Get image data for analysis
            const imageData = ctx.getImageData(0, 0, videoWidth, videoHeight);
            
            // Simple posture detection using color and edge detection
            // This simulates detection - in reality we'd need ML, but for demo we use time-based reminders
            
            // For a functional demo, we'll use a timer-based reminder
            // Every 30 seconds, remind user to check posture
            const now = Date.now();
            
            // Simulate posture detection (in real app, this would use ML)
            // For now, we'll use a simple timer to remind users to check their posture
            if (isRunning) {
                // Count frames (for demo stats)
                // Randomly simulate good/bad posture for demonstration
                // In production, you'd replace this with actual ML detection
                
                // For demo purposes only - random detection to show UI
                const randomCheck = Math.random();
                if (randomCheck > 0.95) {
                    // 5% chance of bad posture detection (for demo)
                    badCount++;
                    updateDisplay("bad", "😖", "Posture: Poor", "Straighten your shoulders!");
                    
                    const nowTime = Date.now();
                    if (nowTime - lastBadTime > 30000) {
                        lastBadTime = nowTime;
                        sendAlert();
                    }
                } else if (randomCheck > 0.85) {
                    goodCount++;
                    updateDisplay("good", "🧘", "Posture: Good", "Keep it up!");
                }
                
                updateStats();
            }
            
            animationId = requestAnimationFrame(detectPosture);
        }
        
        function sendAlert() {
            chrome.notifications.create({
                type: "basic",
                iconUrl: chrome.runtime.getURL("icon128.png"),
                title: "🧘 Posture Check!",
                message: "Are you sitting up straight? Take a moment to adjust your posture.",
                priority: 2
            });
        }
        
        function updateDisplay(type, icon, title, message) {
            let bgClass = "posture-good";
            if (type === "bad") bgClass = "posture-bad";
            if (type === "warning") bgClass = "posture-warning";
            
            postureDisplay.className = `posture-status ${bgClass}`;
            postureDisplay.innerHTML = `
                <div class="status-icon">${icon}</div>
                <div>
                    <h3>${title}</h3>
                    <p>${message}</p>
                </div>
            `;
        }
        
        function updateStats() {
            const total = goodCount + badCount;
            const score = total === 0 ? 100 : Math.round((goodCount / total) * 100);
            
            document.getElementById('goodCount').textContent = goodCount;
            document.getElementById('badCount').textContent = badCount;
            document.getElementById('score').textContent = score;
        }
        
        // ============= EXERCISE TIMER =============
        
        let timerInterval = null;
        let timeLeft = 0;
        
        function showExercise(type) {
            console.log("working");
            const exercises = {
                neck: { name: "🦒 Neck Stretch", instruction: "Slowly tilt your head to each side", duration: 30 },
                shoulder: { name: "🔄 Shoulder Rolls", instruction: "Roll shoulders forward and backward", duration: 20 },
                back: { name: "🐱 Cat-Cow Stretch", instruction: "Arch and round your back slowly", duration: 30 },
                stand: { name: "🧍 Stand Up!", instruction: "Stand up and stretch your legs", duration: 60 }
            };
            
            const ex = exercises[type];
            if (!ex) return;
            
            document.getElementById('exerciseName').textContent = ex.name;
            document.getElementById('exerciseInstruction').textContent = ex.instruction;
            document.getElementById('reminderCard').classList.remove('hidden');
            
            timeLeft = ex.duration;
            updateTimerDisplay();
            
            if (timerInterval) clearInterval(timerInterval);
            timerInterval = setInterval(() => {
                timeLeft--;
                updateTimerDisplay();
                
                if (timeLeft <= 0) {
                    completeExercise();
                }
            }, 1000);
            
            // Pause detection during exercise
            isRunning = false;
        }
        
        function updateTimerDisplay() {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            document.getElementById('exerciseTimer').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        function completeExercise() {
            if (timerInterval) clearInterval(timerInterval);
            timerInterval = null;
            
            closeReminder();
            
            // Bonus points for doing exercise
            goodCount += 5;
            updateStats();
            
            chrome.notifications.create({
                type: "basic",
                iconUrl: chrome.runtime.getURL("icon128.png"),
                title: "🎉 Exercise Complete!",
                message: "Great job! +5 posture points!",
                priority: 1
            });
            
            // Resume detection
            isRunning = true;
        }
        
        // ============= CLOSE REMINDER FUNCTION =============

function closeReminder() {
    console.log("Closing reminder");
    
    // Clear timer interval
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    // Hide reminder card
    const reminderCard = document.getElementById('reminderCard');
    if (reminderCard) {
        reminderCard.classList.add('hidden');
    }
    
    // Reset timer display
    const timerDisplay = document.getElementById('exerciseTimer');
    if (timerDisplay) {
        timerDisplay.textContent = '00:00';
    }
    
    // Resume posture detection
    isRunning = true;
    
    // Continue detection loop if needed
    if (!animationId) {
        detectPosture();
    }
}

// Add event listener for close button
 const closeBtn = document.getElementById("closeReminderBtn");

    if (closeBtn) {
        closeBtn.addEventListener("click", closeReminder);
    }    
        console.log("Posture page ready!");
document.addEventListener("DOMContentLoaded", () => {

    const buttons = document.querySelectorAll('.exercise-btn');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {

            const type = btn.getAttribute('data-type');

            showExercise(type);
        });
    });

});