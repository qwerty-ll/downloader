const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
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

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

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

// Helper to get tool path (local bin or system PATH)
function getToolPath(toolName) {
    const isWin = process.platform === 'win32';
    const ext = isWin ? '.exe' : '';
    const localPath = path.join(__dirname, '..', 'bin', toolName + ext);
    
    if (fs.existsSync(localPath)) {
        return localPath;
    }
    return toolName; // Fallback to system PATH
}

// Check if tools (ffmpeg, aria2c) are available
ipcMain.handle('check-tools', async () => {
  const check = (cmd) => {
    return new Promise((resolve) => {
      const isWin = process.platform === 'win32';
      const ext = isWin ? '.exe' : '';
      const localPath = path.join(__dirname, '..', 'bin', cmd + ext);

      if (fs.existsSync(localPath)) {
          resolve(true);
          return;
      }

      const command = isWin ? `where ${cmd}` : `which ${cmd}`;
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

let currentDownloadProcess = null;

// Download logic
ipcMain.on('start-download', (event, { url, savePath, browser, useAria, customName }) => {
  const sender = event.sender;
  
  // Use custom name or default to yt-dlp title template
  const fileNameTemplate = customName ? `${customName}.%(ext)s` : '%(title)s.%(ext)s';
  const outputPath = path.join(savePath, fileNameTemplate);

  const args = [
    url,
    '-f', 'bestvideo+bestaudio/best',
    '--merge-output-format', 'mp4',
    '--no-warnings',
    '--newline',
    '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    '-o', outputPath
  ];

  if (browser && browser !== 'none') {
    args.push('--cookies-from-browser', browser);
  }

  if (useAria) {
    args.push('--downloader', 'aria2c');
    args.push('--downloader-args', 'aria2c:-x 4 -s 4 -k 5M');
    args.push('--compat-options', 'no-external-downloadergress');
  }

  currentDownloadProcess = spawn(getToolPath('yt-dlp'), args);

  const rl = readline.createInterface({
    input: currentDownloadProcess.stdout,
    terminal: false
  });

  rl.on('line', (line) => {
    if (sender.isDestroyed()) return;

    const progressMatch = line.match(/\[download\]\s+(\d+\.?\d*)%\s+of\s+.*?\s+at\s+(.*?)\s+ETA/);
    if (progressMatch) {
      const percentage = progressMatch[1];
      const speed = progressMatch[2];
      sender.send('download-progress', { percentage, speed });
    } else if (line.includes('[download]')) {
       sender.send('download-log', line);
    }
  });

  currentDownloadProcess.stderr.on('data', (data) => {
    const message = data.toString();
    console.error(`stderr: ${message}`);
    if (!sender.isDestroyed()) {
      sender.send('download-log', message);
    }
  });

  currentDownloadProcess.on('close', (code) => {
    currentDownloadProcess = null;
    if (!sender.isDestroyed()) {
      sender.send('download-finished', { code });
    }
  });

  currentDownloadProcess.on('error', (err) => {
    currentDownloadProcess = null;
    if (!sender.isDestroyed()) {
      sender.send('download-error', { message: err.message });
    }
  });
});

// Cancel download
ipcMain.on('cancel-download', () => {
  if (currentDownloadProcess) {
    currentDownloadProcess.kill('SIGTERM'); // Graceful kill
    currentDownloadProcess = null;
  }
});
