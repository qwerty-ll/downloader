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

const toast = document.getElementById('toast');
const toastIcon = document.getElementById('toast-icon');
const toastMessage = document.getElementById('toast-message');

// --- State ---
let selectedPath = '';
let isDownloading = false;

// --- Initial Setup ---
async function init() {
    try {
        const tools = await window.api.checkTools();
        updateToolIndicator('status-ffmpeg', tools.ffmpeg);
        updateToolIndicator('status-aria2c', tools.aria2c);
        updateToolIndicator('status-ytdlp', tools.ytdlp);
    } catch (e) {
        showToast('Error checking tools', 'error');
    }
}

function updateToolIndicator(id, exists) {
    const el = document.getElementById(id);
    if (!el) return;
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

// --- Toast System ---
function showToast(message, type = 'info') {
    toastMessage.innerText = message;
    
    // Reset classes
    toastIcon.innerHTML = '';
    toastIcon.className = 'inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg ';
    
    if (type === 'success') {
        toastIcon.classList.add('bg-emerald-900', 'text-emerald-300');
        toastIcon.innerHTML = '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>';
    } else if (type === 'error') {
        toastIcon.classList.add('bg-rose-900', 'text-rose-300');
        toastIcon.innerHTML = '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>';
    } else {
        toastIcon.classList.add('bg-indigo-900', 'text-indigo-300');
        toastIcon.innerHTML = '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>';
    }

    toast.classList.replace('translate-y-24', 'translate-y-0');
    
    setTimeout(() => {
        toast.classList.replace('translate-y-0', 'translate-y-24');
    }, 4000);
}

// --- Folder Selection ---
selectFolderBtn.onclick = async () => {
    const path = await window.api.selectFolder();
    if (path) {
        selectedPath = path;
        pathDisplay.innerText = path;
        pathDisplay.classList.remove('text-slate-400');
        pathDisplay.classList.add('text-indigo-300');
        showToast('Destination folder updated', 'success');
    }
};

// --- Start Download ---
startBtn.onclick = () => {
    const url = urlInput.value.trim();
    
    if (!url) {
        showToast('Please enter a valid URL', 'error');
        return;
    }
    if (!selectedPath) {
        showToast('Please select a destination folder', 'error');
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
        showToast('Success: Video downloaded!', 'success');
    } else {
        statusText.innerText = `Download failed with code ${data.code}`;
        statusText.classList.replace('text-slate-400', 'text-rose-400');
        showToast('Download failed. Check URL or Tool status.', 'error');
    }
});

window.api.onError((data) => {
    isDownloading = false;
    startBtn.disabled = false;
    startBtn.innerText = 'START DOWNLOAD';
    startBtn.classList.replace('bg-slate-700', 'bg-indigo-600');
    
    statusText.innerText = 'Error occurred during download.';
    statusText.classList.replace('text-slate-400', 'text-rose-400');
    showToast(`Error: ${data.message}`, 'error');
});

window.api.onLog((message) => {
    // Show detailed logs in status text for technical insight
    if (message.length > 5) {
        statusText.innerText = message.substring(0, 100) + (message.length > 100 ? '...' : '');
    }
    console.log('yt-dlp log:', message);
});

function updateProgress(data) {
    const { percentage, speed } = data;
    progressPercent.innerText = `${percentage}%`;
    progressBarFill.style.width = `${percentage}%`;
    speedDisplay.innerText = speed || '0.00 MiB/s';
    statusText.innerText = 'Downloading fragments...';
}
