const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const readline = require('readline');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    frame: false, // Frameless window
    backgroundColor: '#0f172a', // Tailwind bg-slate-900
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile('index.html');

  // Open the DevTools if needed:
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// --- IPC Handlers ---

// Handle window controls
ipcMain.on('window-minimize', () => {
  mainWindow.minimize();
});

ipcMain.on('window-close', () => {
  mainWindow.close();
});

// Check if tools (ffmpeg, aria2c) are available
ipcMain.handle('check-tools', async () => {
  const check = (cmd) => {
    return new Promise((resolve) => {
      const command = process.platform === 'win32' ? `where ${cmd}` : `which ${cmd}`;
      exec(command, (error) => {
        resolve(!error);
      });
    });
  };

  return {
    ffmpeg: await check('ffmpeg'),
    aria2c: await check('aria2c'),
    ytdlp: await check('yt-dlp')
  };
});

// Folder selection dialog
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

// Download logic
ipcMain.on('start-download', (event, { url, savePath, browser, useAria }) => {
  const args = [
    url,
    '-f', 'bestvideo+bestaudio/best',
    '--merge-output-format', 'mp4',
    '--no-warnings',
    '--newline', // Important for parsing
    '-o', path.join(savePath, '%(title)s.%(ext)s')
  ];

  if (browser && browser !== 'none') {
    args.push('--cookies-from-browser', browser);
  }

  if (useAria) {
    args.push('--downloader', 'aria2c');
    args.push('--downloader-args', 'aria2c:-x 4 -s 4 -k 5M');
    // Important: ensure progress is still outputted when using external downloader
    args.push('--compat-options', 'no-external-downloader-progress');
  }

  const downloadProcess = spawn('yt-dlp', args);

  const rl = readline.createInterface({
    input: downloadProcess.stdout,
    terminal: false
  });

  rl.on('line', (line) => {
    // Regex to match [download] 10.0% of 100.00MiB at 1.50MiB/s ETA 01:00
    const progressMatch = line.match(/\[download\]\s+(\d+\.?\d*)%\s+of\s+.*?\s+at\s+(.*?)\s+ETA/);
    if (progressMatch) {
      const percentage = progressMatch[1];
      const speed = progressMatch[2];
      mainWindow.webContents.send('download-progress', { percentage, speed });
    }
  });

  downloadProcess.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
    // Optional: send warning to UI
  });

  downloadProcess.on('close', (code) => {
    mainWindow.webContents.send('download-finished', { code });
  });

  downloadProcess.on('error', (err) => {
    mainWindow.webContents.send('download-error', { message: err.message });
  });
});
