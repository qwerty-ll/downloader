const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Window control
  minimize: () => ipcRenderer.send('window-minimize'),
  close: () => ipcRenderer.send('window-close'),

  // Tools check
  checkTools: () => ipcRenderer.invoke('check-tools'),

  // Folder selection
  selectFolder: () => ipcRenderer.invoke('select-folder'),

  // Download control
  startDownload: (data) => ipcRenderer.send('start-download', data),

  // Events from Main process
  onProgress: (callback) => ipcRenderer.on('download-progress', (event, data) => callback(data)),
  onFinished: (callback) => ipcRenderer.on('download-finished', (event, data) => callback(data)),
  onError: (callback) => ipcRenderer.on('download-error', (event, data) => callback(data)),
  onLog: (callback) => ipcRenderer.on('download-log', (event, data) => callback(data)),
});
