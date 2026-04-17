// --- UI Elements ---
const minimizeBtn = document.getElementById('minimize-btn');
const closeBtn = document.getElementById('close-btn');
const urlInput = document.getElementById('url-input');
const browserSelect = document.getElementById('browser-select');
const turboMode = document.getElementById('turbo-mode');
const pathDisplay = document.getElementById('path-display');
const selectFolderBtn = document.getElementById('select-folder-btn');
const startBtn = document.getElementById('start-btn');

const progressContainer = document.getElementById('progress-container');
const progressBarFill = document.getElementById('progress-bar-fill');
const progressPercent = document.getElementById('progress-percent');
const speedDisplay = document.getElementById('speed-display');
const statusText = document.getElementById('status-text');

// --- State ---
let selectedPath = '';
let isDownloading = false;

// --- Initial Setup ---
async function init() {
    const tools = await window.api.checkTools();
    updateToolIndicator('status-ffmpeg', tools.ffmpeg);
    updateToolIndicator('status-aria2c', tools.aria2c);
    updateToolIndicator('status-ytdlp', tools.ytdlp);
}

function updateToolIndicator(id, exists) {
    const el = document.getElementById(id);
    const dot = el.querySelector('.indicator');
    if (exists) {
        dot.classList.remove('bg-slate-500');
        dot.classList.add('bg-emerald-500');
        dot.classList.add('shadow-[0_0_8px_rgba(16,185,129,0.5)]');
    } else {
        dot.classList.remove('bg-slate-500');
        dot.classList.add('bg-rose-500');
    }
}

init();

// --- Window Controls ---
minimizeBtn.onclick = () => window.api.minimize();
closeBtn.onclick = () => window.api.close();

// --- Folder Selection ---
selectFolderBtn.onclick = async () => {
    const path = await window.api.selectFolder();
    if (path) {
        selectedPath = path;
        pathDisplay.innerText = path;
        pathDisplay.classList.remove('text-slate-400');
        pathDisplay.classList.add('text-indigo-300');
    }
};

// --- Start Download ---
startBtn.onclick = () => {
    const url = urlInput.value.trim();
    
    if (!url) {
        alert('Please enter a valid URL');
        return;
    }
    if (!selectedPath) {
        alert('Please select a destination folder');
        return;
    }

    if (isDownloading) return;

    // UI Feedback
    isDownloading = true;
    startBtn.disabled = true;
    startBtn.innerText = 'DOWNLOADING...';
    startBtn.classList.replace('bg-indigo-600', 'bg-slate-700');
    progressContainer.classList.remove('hidden');
    
    // Reset Progress
    updateProgress({ percentage: 0, speed: '0.00 MiB/s' });
    statusText.innerText = 'Connecting to server...';

    window.api.startDownload({
        url,
        savePath: selectedPath,
        browser: browserSelect.value,
        useAria: turboMode.checked
    });
};

// --- Progress Updates ---
window.api.onProgress((data) => {
    updateProgress(data);
});

window.api.onFinished((data) => {
    isDownloading = false;
    startBtn.disabled = false;
    startBtn.innerText = 'START DOWNLOAD';
    startBtn.classList.replace('bg-slate-700', 'bg-indigo-600');
    
    if (data.code === 0) {
        statusText.innerText = 'Download finished successfully!';
        statusText.classList.replace('text-slate-400', 'text-emerald-400');
        alert('Success: Video downloaded!');
    } else {
        statusText.innerText = `Download failed with code ${data.code}`;
        statusText.classList.replace('text-slate-400', 'text-rose-400');
        alert('Error: Sequential download failed. Check URL or Tool status.');
    }
});

window.api.onError((data) => {
    isDownloading = false;
    startBtn.disabled = false;
    startBtn.innerText = 'START DOWNLOAD';
    startBtn.classList.replace('bg-slate-700', 'bg-indigo-600');
    
    statusText.innerText = 'Error occurred during download.';
    statusText.classList.replace('text-slate-400', 'text-rose-400');
    alert(`Error: ${data.message}`);
});

function updateProgress(data) {
    const { percentage, speed } = data;
    progressPercent.innerText = `${percentage}%`;
    progressBarFill.style.width = `${percentage}%`;
    speedDisplay.innerText = speed || '0.00 MiB/s';
    statusText.innerText = 'Downloading fragments...';
}
