const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  
  // 창 제어
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  toggleAlwaysOnTop: () => ipcRenderer.send('toggle-always-on-top'),
  
  // 항상 위 상태 변경 리스너
  onAlwaysOnTopChanged: (callback) => {
    ipcRenderer.on('always-on-top-changed', (event, isOnTop) => callback(isOnTop));
  }
});