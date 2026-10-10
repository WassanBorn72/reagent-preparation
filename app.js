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
  $('result').hidden = true; $('error').textContent = '';
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
document.querySelector('main').addEventListener('input', event => { if (event.target.id !== 'import') changed(); });
document.querySelector('main').addEventListener('change', event => { if (event.target.tagName === 'SELECT') changed(); });
$('calculate').onclick = () => {
  $('result').hidden = true;
  try {
    const data = read(), factor = { mL: 1, 'µL': .001, L: 1000 }[data.volumeUnit];
    const result = ReagentCalculator.calculate(data.rows.map(row => ({ ...row, stock: row.stock.trim() === '' ? NaN : Number(row.stock), target: row.target.trim() === '' ? NaN : Number(row.target) })), Number(data.total) * factor);
    const heading = document.createElement('p'); heading.textContent = `${data.name || '調製レシピ'} — 最終容量 ${formatVolume(result.totalMl)}`;
    const table = document.createElement('table');
    const append = (name, detail, amount, total = false) => {
      const tr = document.createElement('tr'); if (total) tr.className = 'total';
      [name, detail, amount].forEach((text, index) => { const td = document.createElement('td'); td.textContent = text; if (index === 2) td.className = 'amount'; tr.append(td); }); table.append(tr);
    };
    result.results.forEach(row => append(row.name, `${row.stock} ${row.stockUnit} → ${row.target} ${row.targetUnit}`, formatVolume(row.volumeMl)));
    append(data.solvent || '溶媒', '定容に必要な目安量', formatVolume(result.solventMl), true);
    $('result-content').replaceChildren(heading, table); $('result').hidden = false; $('error').textContent = '';
  } catch (error) { $('error').textContent = error.message; }
};
$('print').onclick = () => window.print();
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
