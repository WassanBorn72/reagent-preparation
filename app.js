const $ = id => document.getElementById(id);
const unitNames = Object.keys(ReagentCalculator.units);
const key = 'reagent-calculator-v1';
function addRow(data = { name: '', stock: '', stockUnit: 'mM', target: '', targetUnit: 'mM' }) {
  const tr = document.createElement('tr');
  for (const [field, label] of [['name','試薬名'],['stock','ストック濃度'],['stockUnit','ストック単位'],['target','最終濃度'],['targetUnit','最終単位']]) {
    const td = document.createElement('td');
    const input = document.createElement(field.endsWith('Unit') ? 'select' : 'input');
    input.dataset.field = field; input.setAttribute('aria-label', label);
    if (field.endsWith('Unit')) unitNames.forEach(unit => input.add(new Option(unit, unit)));
    else if (field !== 'name') { input.type = 'number'; input.min = '0'; input.step = 'any'; }
    input.value = data[field]; td.append(input); tr.append(td);
  }
  const td = document.createElement('td'), button = document.createElement('button');
  button.textContent = '削除'; button.type = 'button'; button.setAttribute('aria-label', 'この試薬を削除');
  button.onclick = () => { tr.remove(); changed(); }; td.append(button); tr.append(td); $('rows').append(tr);
}
function read() {
  return { name: $('recipe-name').value, total: $('total').value, volumeUnit: $('volume-unit').value, solvent: $('solvent').value,
    rows: [...$('rows').children].map(tr => Object.fromEntries([...tr.querySelectorAll('[data-field]')].map(input => [input.dataset.field, input.value]))) };
}
function changed() {
  $('result').hidden = true; $('error').textContent = ''; $('output-status').textContent = '';
  try { localStorage.setItem(key, JSON.stringify(read())); } catch { $('storage-status').textContent = '自動保存できません。入力をファイルに保存してください。'; }
}
function load(data) {
  if (!data || !Array.isArray(data.rows) || data.rows.length > 200 || !['mL','µL','L'].includes(data.volumeUnit) || typeof data.total !== 'string' || typeof data.name !== 'string' || typeof data.solvent !== 'string' || !data.rows.every(row => row && typeof row.name === 'string' && ['string','number'].includes(typeof row.stock) && ['string','number'].includes(typeof row.target) && unitNames.includes(row.stockUnit) && unitNames.includes(row.targetUnit))) throw new Error('入力ファイルの形式が正しくありません。');
  $('recipe-name').value = data.name; $('total').value = data.total; $('volume-unit').value = data.volumeUnit; $('solvent').value = data.solvent;
  $('rows').replaceChildren(); data.rows.forEach(addRow);
}
function formatVolume(ml) {
  const number = value => Number(value.toPrecision(6)).toLocaleString('ja-JP', { maximumSignificantDigits: 6 });
  return ml !== 0 && ml < 1 ? `${number(ml * 1000)} µL` : `${number(ml)} mL`;
}
$('add').onclick = () => { addRow(); changed(); };
document.querySelector('main').addEventListener('input', event => { if (!event.target.closest('#stock-library') && event.target.id !== 'import') changed(); });
document.querySelector('main').addEventListener('change', event => { if (event.target.tagName === 'SELECT' && !event.target.closest('#stock-library')) changed(); });
$('calculate').onclick = () => {
  $('result').hidden = true;
  try {
    const data = read(), factor = { mL: 1, 'µL': .001, L: 1000 }[data.volumeUnit];
    const result = ReagentCalculator.calculate(data.rows.map(row => ({ ...row, stock: row.stock.trim() === '' ? NaN : Number(row.stock), target: row.target.trim() === '' ? NaN : Number(row.target) })), Number(data.total) * factor);
    const heading = document.createElement('p'); heading.textContent = `${data.name || '調製レシピ'} — 最終容量 ${formatVolume(result.totalMl)}`;
    const table = document.createElement('table');
    const header = table.createTHead().insertRow();
    ['試薬名', 'ストック濃度', '最終濃度', '添加量'].forEach(text => { const th = document.createElement('th'); th.scope = 'col'; th.textContent = text; header.append(th); });
    const body = table.createTBody();
    const append = (name, stock, target, amount, total = false) => {
      const tr = document.createElement('tr'); if (total) tr.className = 'total';
      [name, stock, target, amount].forEach((text, index) => { const td = document.createElement('td'); td.textContent = text; if (index === 3) td.className = 'amount'; tr.append(td); }); body.append(tr);
    };
    result.results.forEach(row => append(row.name, `${row.stock} ${row.stockUnit}`, `${row.target} ${row.targetUnit}`, formatVolume(row.volumeMl)));
    append(data.solvent || '溶媒', '—', '定容（目安）', formatVolume(result.solventMl), true);
    const note = document.createElement('p'); note.className = 'notebook-note'; note.textContent = '溶媒量は目安。各ストックを加え、溶媒で記載の最終容量に定容する。';
    $('result-content').replaceChildren(heading, table, note); $('result').hidden = false; $('error').textContent = '';
  } catch (error) { $('error').textContent = error.message; }
};
$('print').onclick = async () => {
  try { if (window.desktop) await window.desktop.print(); else window.print(); }
  catch { $('output-status').textContent = '印刷できませんでした。PDFまたはHTML保存をお試しください。'; }
};
$('export').onclick = () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(read(), null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = 'reagent-recipe.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
};
$('import').onchange = async event => {
  try { const file = event.target.files[0]; if (!file) return; if (file.size > 1024 * 1024) throw new Error('入力ファイルは1 MB以下にしてください。'); load(JSON.parse(await file.text())); changed(); }
  catch (error) { $('error').textContent = error.message; }
  finally { event.target.value = ''; }
};
try { const saved = localStorage.getItem(key); if (saved) load(JSON.parse(saved)); } catch { $('storage-status').textContent = '保存済み入力を読み込めませんでした。'; }
if (!$('rows').children.length) {
  addRow({ name: 'Tris-HCl', stock: '1', stockUnit: 'M', target: '50', targetUnit: 'mM' });
  addRow({ name: 'NaCl', stock: '5', stockUnit: 'M', target: '150', targetUnit: 'mM' });
}

// Stock library is independent of the current recipe and survives restarts.
const stockKey = 'reagent-stocks-v1';
let stocks = [];
unitNames.forEach(unit => $('stock-unit').add(new Option(unit, unit)));
function validateStocks(data) {
  if (!Array.isArray(data) || data.length > 200 || !data.every(row => row && typeof row.name === 'string' && row.name.trim() && Number.isFinite(row.stock) && row.stock > 0 && unitNames.includes(row.stockUnit))) throw new Error('ストック一覧の形式が正しくありません。最大200件、濃度は正の数で登録してください。');
  return data.map(row => ({ name: row.name.trim(), stock: row.stock, stockUnit: row.stockUnit }));
}
function persistStocks(next) {
  const validated = validateStocks(next);
  // Only change the list after durable storage succeeds.
  localStorage.setItem(stockKey, JSON.stringify(validated));
  stocks = validated; renderStocks();
}
function renderStocks() {
  $('stock-list').replaceChildren();
  if (!stocks.length) { $('stock-list').textContent = '登録されたストックはありません。'; return; }
  stocks.forEach((stock, index) => {
    const item = document.createElement('div'); item.className = 'stock-item';
    const add = document.createElement('button'); add.type = 'button'; add.textContent = `＋ ${stock.name} (${stock.stock} ${stock.stockUnit})`;
    add.onclick = () => { addRow({ ...stock, target: '', targetUnit: stock.stockUnit }); changed(); $('rows').lastElementChild.querySelector('[data-field=target]').focus(); $('stock-status').textContent = `${stock.name}を追加しました。最終濃度を入力してください。`; };
    const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '登録を削除'; remove.setAttribute('aria-label', `${stock.name}の登録を削除`);
    remove.onclick = () => { try { persistStocks(stocks.filter((_, i) => i !== index)); $('stock-status').textContent = '登録を削除しました。'; } catch { $('stock-status').textContent = '保存できないため削除しませんでした。'; } };
    item.append(add, remove); $('stock-list').append(item);
  });
}
$('stock-form').onsubmit = event => {
  event.preventDefault();
  try {
    const stock = validateStocks([{ name: $('stock-name').value, stock: Number($('stock-concentration').value), stockUnit: $('stock-unit').value }])[0];
    if (stocks.some(row => row.name === stock.name && row.stock === stock.stock && row.stockUnit === stock.stockUnit)) throw new Error('同じストックは登録済みです。');
    persistStocks([...stocks, stock]); $('stock-status').textContent = 'ストックを登録しました。'; $('stock-form').reset();
  } catch (error) { $('stock-status').textContent = error.name === 'QuotaExceededError' || error.name === 'SecurityError' ? '自動保存できないため登録できません。保存可能なブラウザまたはデスクトップ版でお試しください。' : error.message; }
};
function downloadFile(content, type, name) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$('stock-export').onclick = () => downloadFile(JSON.stringify(stocks, null, 2), 'application/json', 'reagent-stocks.json');
$('stock-import').onchange = async event => {
  try {
    const file = event.target.files[0]; if (!file) return;
    if (file.size > 1024 * 1024) throw new Error('入力ファイルは1 MB以下にしてください。');
    const imported = validateStocks(JSON.parse(await file.text()));
    const next = [...stocks];
    imported.forEach(stock => { if (!next.some(row => row.name === stock.name && row.stock === stock.stock && row.stockUnit === stock.stockUnit)) next.push(stock); });
    persistStocks(next); $('stock-status').textContent = 'ストック一覧を追加しました（同じ登録は重複させません）。';
  } catch (error) { $('stock-status').textContent = `読み込めませんでした：${error.message}`; }
  finally { event.target.value = ''; }
};
try { const saved = localStorage.getItem(stockKey); if (saved) stocks = validateStocks(JSON.parse(saved)); } catch { $('stock-status').textContent = '保存済みストックを読み込めませんでした。バックアップから復元してください。'; }
renderStocks();

function notebookTable() {
  const content = $('result-content').cloneNode(true);
  content.querySelectorAll('th,td').forEach(cell => { cell.style.cssText = 'border:1px solid #555;padding:6px 10px;text-align:left;'; });
  const table = content.querySelector('table'); table.style.cssText = 'border-collapse:collapse;width:100%;font-size:12px;';
  const note = content.querySelector('.notebook-note');
  const text = [...$('result-content').querySelectorAll('tr')].map(row => [...row.cells].map(cell => cell.textContent.replace(/[\t\r\n]+/g, ' ')).join('\t')).join('\n');
  return { html: content.innerHTML, text: `${$('result-content').querySelector('p').textContent}\n${text}\n${note.textContent}` };
}
$('copy-table').onclick = async () => {
  try {
    const { html, text } = notebookTable();
    if (window.desktop) await window.desktop.copyTable(html, text);
    else if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([text], { type: 'text/plain' }) })]);
    else throw new Error('Clipboard unavailable');
    $('output-status').textContent = '表をコピーしました。実験ノートやWord等に貼り付けてください（貼り付け先によっては文字列になります）。';
  } catch { $('output-status').textContent = 'コピーできませんでした。表をHTML保存して、そのファイルから表をコピーしてください。'; }
};
$('save-table').onclick = () => {
  const { html } = notebookTable();
  downloadFile(`<!doctype html><html lang="ja"><meta charset="utf-8"><title>調製レシピ</title><body>${html}</body></html>`, 'text/html;charset=utf-8', 'reagent-table.html');
  $('output-status').textContent = '表をHTMLファイルに出力しました。ブラウザで開いて印刷・コピーできます。';
};
$('pdf').onclick = async () => {
  try {
    if (window.desktop) $('output-status').textContent = await window.desktop.savePdf() ? 'PDFを保存しました。' : 'PDF保存をキャンセルしました。';
    else { $('output-status').textContent = '印刷画面で「PDFに保存」を選択してください。'; window.print(); }
  } catch { $('output-status').textContent = 'PDF保存に失敗しました。HTML保存をお試しください。'; }
};
