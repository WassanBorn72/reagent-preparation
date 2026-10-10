const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

test('desktop clipboard, PDF saving, cancellation and sender validation', async () => {
  const handlers = {}, writes = [];
  const entry = path.resolve(__dirname, '../index.html');
  let canceled = false, clipboardData;
  const sender = { mainFrame: {}, getURL: () => pathToFileURL(entry).href };
  const window = {
    webContents: {
      printToPDF: async options => { assert.equal(options.pageSize, 'A4'); return Buffer.from('%PDF-test'); },
      print: (options, callback) => { assert.equal(options.silent, false); callback(true); }
    }
  };
  class BrowserWindow {
    constructor() { this.webContents = { setWindowOpenHandler() {}, on() {}, session: { setPermissionRequestHandler() {} } }; }
    once() {}
    loadFile() {}
    static fromWebContents(value) { return value === sender ? window : null; }
  }
  const electron = {
    app: { whenReady: () => ({ then: fn => fn() }), on() {} },
    BrowserWindow,
    ipcMain: { handle: (name, fn) => { handlers[name] = fn; } },
    clipboard: { write: value => { clipboardData = value; } },
    dialog: { showSaveDialog: async () => ({ canceled, filePath: '/tmp/recipe.pdf' }) }
  };
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../desktop/main.js'), 'utf8'), {
    require: name => name === 'electron' ? electron : name === 'node:fs/promises' ? { writeFile: async (...args) => writes.push(args) } : require(name),
    __dirname: path.resolve(__dirname, '../desktop'), process
  });
  const event = { sender, senderFrame: sender.mainFrame };
  handlers['copy-table'](event, '<table></table>', 'table');
  assert.equal(clipboardData.html, '<table></table>');
  assert.equal(clipboardData.text, 'table');
  assert.throws(() => handlers['copy-table']({ ...event, senderFrame: {} }, 'html', 'text'));
  assert.throws(() => handlers['copy-table'](event, {}, 'text'));
  assert.equal(await handlers['save-pdf'](event), true);
  assert.equal(writes[0][0], '/tmp/recipe.pdf');
  assert.equal(writes[0][1].toString(), '%PDF-test');
  canceled = true;
  assert.equal(await handlers['save-pdf'](event), false);
  assert.equal(writes.length, 1);
  assert.equal(await handlers['print-recipe'](event), true);
});
