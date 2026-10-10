const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const entry = path.join(__dirname, '..', 'index.html');

function createWindow() {
  const window = new BrowserWindow({
    title: '試薬作成計算ソフト',
    width: 1150,
    height: 850,
    minWidth: 640,
    minHeight: 480,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event, url) => {
    if (url !== pathToFileURL(entry).href) event.preventDefault();
  });
  window.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  window.once('ready-to-show', () => window.show());
  window.loadFile(entry);
}

app.whenReady().then(() => {
  // JSON exports use a native Save As dialog rather than a browser download tab.
  app.on('web-contents-created', (_event, contents) => {
    contents.session.on('will-download', (_downloadEvent, item) => {
      item.setSaveDialogOptions({ title: '入力を保存', defaultPath: path.join(app.getPath('documents'), item.getFilename()) });
    });
  });
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
