import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let vendorWindow;

function createVendorWindow() {
  vendorWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    title: "Maidah Vendor Portal - بوابة التراخيص",
    icon: path.join(__dirname, 'public', 'icon.ico'), 
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
    autoHideMenuBar: true,
  });

  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    // In dev, load the vendor.html served by Vite
    vendorWindow.loadURL('http://localhost:3000/vendor.html');
    vendorWindow.webContents.openDevTools();
  } else {
    // In production, load the built vendor.html file
    vendorWindow.loadFile(path.join(__dirname, 'dist', 'vendor.html'));
  }

  vendorWindow.on('closed', function () {
    vendorWindow = null;
  });
}

app.on('ready', createVendorWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (vendorWindow === null) {
    createVendorWindow();
  }
});