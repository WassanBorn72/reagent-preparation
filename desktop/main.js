const { app, BrowserWindow, ipcMain, clipboard, dialog } = require('electron');
const fs = require('node:fs/promises');
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
      preload: path.join(__dirname, 'preload.js'),
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
  function recipeWindow(event) {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window || event.senderFrame !== event.sender.mainFrame || event.sender.getURL() !== pathToFileURL(entry).href) throw new Error('Invalid sender');
    return window;
  }
  ipcMain.handle('copy-table', (event, html, text) => {
    recipeWindow(event);
    if (typeof html !== 'string' || typeof text !== 'string' || html.length > 2000000 || text.length > 1000000) throw new Error('Invalid table');
    clipboard.write({ html, text });
  });
  ipcMain.handle('save-pdf', async event => {
    const window = recipeWindow(event);
    const result = await dialog.showSaveDialog(window, { title: '調製レシピをPDF保存', defaultPath: 'reagent-recipe.pdf', filters: [{ name: 'PDF', extensions: ['pdf'] }] });
    if (result.canceled) return false;
    const pdf = await window.webContents.printToPDF({ printBackground: true, pageSize: 'A4' });
    await fs.writeFile(result.filePath, pdf);
    return true;
  });
  ipcMain.handle('print-recipe', async event => {
    const window = recipeWindow(event);
    return new Promise((resolve, reject) => window.webContents.print({ silent: false, printBackground: true }, (success, reason) => success ? resolve(true) : reject(new Error(reason))));
  });
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
