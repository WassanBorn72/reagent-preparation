const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('desktop', {
  copyTable: (html, text) => ipcRenderer.invoke('copy-table', html, text),
  savePdf: () => ipcRenderer.invoke('save-pdf'),
  print: () => ipcRenderer.invoke('print-recipe')
});
