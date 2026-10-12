const { app, BrowserWindow, ipcMain, nativeImage, screen, Tray, Menu } = require('electron');
const path = require('node:path');

app.setName('DOST');

let mainWindow;
let reminderWindow;
let tray;
let isQuitting = false;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 720,
    minWidth: 760,
    minHeight: 600,
    title: 'DOST',
    backgroundColor: '#102447',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/bridge.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/incubation.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createReminderWindow() {
  if (reminderWindow && !reminderWindow.isDestroyed()) return reminderWindow;

  const workArea = screen.getPrimaryDisplay().workArea;
  const width = 390;
  const height = 176;
  const margin = 18;

  reminderWindow = new BrowserWindow({
    x: workArea.x + margin,
    y: workArea.y + workArea.height - height - margin,
    width,
    height,
    title: 'DOST companion',
    transparent: true,
    frame: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    skipTaskbar: true,
    hasShadow: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/bridge.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  reminderWindow.setAlwaysOnTop(true, 'floating');
  reminderWindow.loadFile(path.join(__dirname, '../renderer/overlay.html'));
  reminderWindow.once('ready-to-show', () => {
    if (reminderWindow && !reminderWindow.isDestroyed()) reminderWindow.showInactive();
  });
  reminderWindow.once('closed', () => {
    reminderWindow = null;
  });
  return reminderWindow;
}

function showReminderPreview() {
  const window = createReminderWindow();
  if (window.webContents.isLoading() === false) window.showInactive();
}

function createTray() {
  const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="10" fill="#76d6b0"/><path d="M5 21c0-6 4-11 11-11s11 5 11 11c0 3-3 5-11 5S5 24 5 21Z" fill="#eafff6"/><circle cx="12" cy="19" r="1.5" fill="#24465f"/><circle cx="20" cy="19" r="1.5" fill="#24465f"/><path d="M13 22q3 2 6 0" fill="none" stroke="#24465f" stroke-linecap="round"/></svg>`;
  tray = new Tray(nativeImage.createFromDataURL(`data:image/svg+xml;charset=UTF-8,${encodeURIComponent(iconSvg)}`));
  tray.setToolTip('DOST — your desk companion');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Open DOST', click: () => showMainWindow() },
    { label: 'Show companion preview', click: () => showReminderPreview() },
    { type: 'separator' },
    { label: 'Quit DOST', click: () => app.quit() }
  ]));
  tray.on('double-click', () => showMainWindow());
}

function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) createMainWindow();
  mainWindow.show();
  mainWindow.focus();
}

ipcMain.on('dost:show-reminder-preview', () => showReminderPreview());
ipcMain.on('dost:dismiss-reminder', (_event, action) => {
  if (!['ok', 'cross'].includes(action)) return;
  if (reminderWindow && !reminderWindow.isDestroyed()) reminderWindow.hide();
});

app.whenReady().then(() => {
  createTray();
  createMainWindow();
  app.on('activate', () => showMainWindow());
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  // DOST stays available in the Windows tray until the user chooses Quit.
});
