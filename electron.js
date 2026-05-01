
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
// Fix: Import default then destructure for ESM compatibility
import pkg from 'electron-updater';
const { autoUpdater } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  // Determine icon path based on environment
  // In Dev: inside public folder
  // In Prod: Vite copies public assets to dist folder
  const isDev = process.env.NODE_ENV === 'development';
  const iconPath = isDev 
    ? path.join(__dirname, 'public', 'icon.ico') 
    : path.join(__dirname, 'dist', 'icon.ico');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    title: "نظام إدارة المبيعات",
    icon: iconPath, 
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // For simple communication
      webSecurity: false // Allow loading local resources if needed
    },
    autoHideMenuBar: true, // Hide default menu bar for cleaner POS look
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built html file
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // --- Auto Updater Events ---
  mainWindow.once('ready-to-show', () => {
    // Check for updates immediately when window is ready
    // In dev, this might error if not configured, so we usually wrap it
    if (!isDev) {
        try {
            autoUpdater.checkForUpdatesAndNotify();
        } catch (e) {
            console.log('Update check skipped in dev or error:', e);
        }
    }
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// Auto Updater Listeners
autoUpdater.on('update-available', () => {
  if(mainWindow) mainWindow.webContents.send('update_available');
});

autoUpdater.on('update-downloaded', () => {
  if(mainWindow) mainWindow.webContents.send('update_downloaded');
});

// IPC Handler to restart app
ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
