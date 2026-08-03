const videoElement = document.getElementById('inputVideo');
const canvasElement = document.getElementById('outputCanvas');
const canvasCtx = canvasElement.getContext('2d');
const instructionText = document.getElementById('instructionText');
const timerDisplay = document.getElementById('timerDisplay');
const pauseBtn = document.getElementById('pauseBtn');
const skipBtn = document.getElementById('skipBtn');
const backBtn = document.getElementById('backBtn');
const progressDots = [
    document.getElementById('dot1'),
    document.getElementById('dot2'),
    document.getElementById('dot3')
];

let isPaused = false;
let currentStepIndex = 0;
let stepTimer = 0; // in seconds
let lastFrameTime = Date.now();

// Constants (Tunable)
// Ratio = (Chin.y - Nose.y) / FaceWidthNormalized
// Normal face: Nose to Chin is ~ 0.4 - 0.5 of Face Width?
// Tuned estimates:
const DOWN_RATIO_THRESHOLD = 0.35;    // head down when ratio < 0.35
const NEUTRAL_RATIO_THRESHOLD = 0.40; // neutral when ratio > 0.40

// Steps Configuration
const steps = [
    {
        type: 'HOLD_DOWN',
        duration: 5,
        text: "Tilt your head forward to your chest, and hold.",
        check: (ratio) => ratio < DOWN_RATIO_THRESHOLD
    },
    {
        type: 'HOLD_NEUTRAL',
        duration: 3,
        text: "Return to neutral position, and hold.",
        check: (ratio) => ratio > NEUTRAL_RATIO_THRESHOLD
    },
    {
        type: 'HOLD_DOWN',
        duration: 5,
        text: "Tilt your head forward again, and hold.",
        check: (ratio) => ratio < DOWN_RATIO_THRESHOLD
    }
];

// Initialize State
function initStep() {
    if (currentStepIndex >= steps.length) {
        completeExercise();
        return;
    }
    const step = steps[currentStepIndex];
    instructionText.innerText = step.text;
    stepTimer = 0;
    updateTimerUI();

    // Update dots
    progressDots.forEach((d, i) => {
        d.classList.toggle('active', i === currentStepIndex);
        d.style.backgroundColor = (i < currentStepIndex) ? '#7fc8a9' : ''; // Completed dots
    });
}

function updateTimerUI() {
    if (currentStepIndex >= steps.length) return;
    const step = steps[currentStepIndex];
    timerDisplay.innerText = `${Math.floor(stepTimer)} / ${step.duration}s`;
}

function completeExercise() {
    instructionText.innerText = "✅ Completed! Great job.";
    timerDisplay.innerText = "";
    pauseBtn.style.display = 'none';
    skipBtn.innerText = "Done";
    // skipBtn.onclick = goBack; // Handled by event listener logic

    // Mark all dots
    progressDots.forEach(d => {
        d.classList.add('active');
        d.style.backgroundColor = '#7fc8a9';
    });
}

function goBack() {
    window.location.href = "index.html";
}

// MediaPipe Setup
const faceMesh = new FaceMesh({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
    }
});

faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

faceMesh.onResults(onResults);

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await faceMesh.send({ image: videoElement });
    },
    width: 640,
    height: 480
});

camera.start().catch(err => {
    console.error(err);
    instructionText.innerText = "Camera permission denied or not available.";
});

// Without this the camera can stay held by this page's MediaStream until the
// document is fully torn down, which is exactly the exclusive-lock race that
// makes the next getUserMedia call (back on the main scanner, or a re-visit
// of this exercise) fail with NotReadableError. Release it the moment the
// user navigates away, not whenever the browser gets around to it.
function releaseCamera() {
    try { camera.stop(); } catch (err) { /* already stopped */ }
    if (videoElement.srcObject) {
        videoElement.srcObject.getTracks().forEach((track) => track.stop());
        videoElement.srcObject = null;
    }
}
window.addEventListener("beforeunload", releaseCamera);

function onResults(results) {
    // Draw Camera Feed
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    let ratio = 0;
    let isCorrect = false;
    let debugStatus = "NO FACE";
    let debugColor = "red";

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];

        // Draw Mesh
        drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION,
            { color: '#e3e8e5', lineWidth: 1 });
        drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYE, { color: '#7fc8a9' });
        drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYEBROW, { color: '#7fc8a9' });
        drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYE, { color: '#7fc8a9' });
        drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYEBROW, { color: '#7fc8a9' });
        drawConnectors(canvasCtx, landmarks, FACEMESH_FACE_OVAL, { color: '#e3e8e5' });

        // Logic
        if (currentStepIndex < steps.length) {
            const nose = landmarks[1];
            const chin = landmarks[152];
            const leftCheek = landmarks[454];
            const rightCheek = landmarks[234];

            if (nose && chin && leftCheek && rightCheek) {
                // Calculate Scale-Invariant Metric
                const vertDist = chin.y - nose.y;
                const faceWidth = Math.abs(leftCheek.x - rightCheek.x); // Should be positive

                // Avoid division by zero
                if (faceWidth > 0.01) {
                    ratio = vertDist / faceWidth;
                }

                // Check Correctness
                const currentStep = steps[currentStepIndex];
                isCorrect = currentStep.check(ratio);

                debugStatus = isCorrect ? "CORRECT" : "NOT CORRECT";
                debugColor = isCorrect ? "#7fc8a9" : "orange";

                // Update Timer only if correct AND not paused
                if (isCorrect && !isPaused) {
                    const now = Date.now();
                    const delta = (now - lastFrameTime) / 1000;

                    if (delta < 0.5) {
                        stepTimer += delta;
                    }

                    if (stepTimer >= currentStep.duration) {
                        currentStepIndex++;
                        initStep();
                    } else {
                        updateTimerUI();
                    }
                }
            }
        } else {
            debugStatus = "DONE";
            debugColor = "#7fc8a9";
        }
    }

    // Always update lastFrameTime
    lastFrameTime = Date.now();

    // Debug Overlay
    canvasCtx.font = "bold 16px Inter, sans-serif";
    canvasCtx.fillStyle = debugColor;
    canvasCtx.fillText(`Status: ${debugStatus}`, 10, 30);

    canvasCtx.fillStyle = "white";
    canvasCtx.fillText(`Ratio: ${ratio.toFixed(3)}`, 10, 50);

    canvasCtx.restore();
}

// UI HANDLERS
pauseBtn.addEventListener('click', () => {
    isPaused = !isPaused;
    pauseBtn.innerText = isPaused ? "Resume" : "Pause";
});

skipBtn.addEventListener('click', () => {
    if (skipBtn.innerText === "Done") {
        goBack(); // Should allow going back
    } else {
        currentStepIndex++;
        initStep();
    }
});

backBtn.addEventListener('click', goBack);

// Start
initStep();
