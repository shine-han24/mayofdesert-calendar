const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let isAlwaysOnTop = true;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,              // 프레임 없음
    transparent: true,         // 투명 배경
    alwaysOnTop: true,        // 항상 위
    resizable: true,          // 크기 조절 가능
    skipTaskbar: false,       // 작업표시줄에 표시
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: process.env.NODE_ENV === 'development', // 개발 모드에서만 devTools 허용
    },
  });

  // 개발 모드
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools(); // 다시 활성화
  } else {
    // 프로덕션 모드
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  // 항상 위 토글
  ipcMain.on('toggle-always-on-top', () => {
    isAlwaysOnTop = !isAlwaysOnTop;
    mainWindow.setAlwaysOnTop(isAlwaysOnTop);
    mainWindow.webContents.send('always-on-top-changed', isAlwaysOnTop);
  });

  // 창 최소화
  ipcMain.on('minimize-window', () => {
    mainWindow.minimize();
  });

  // 창 닫기
  ipcMain.on('close-window', () => {
    mainWindow.close();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});