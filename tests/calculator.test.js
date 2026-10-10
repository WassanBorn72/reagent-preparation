const { test } = require('node:test');
const assert = require('node:assert/strict');
const { calculate } = require('../calculator.js');
const row = (stock = 1, target = 50, stockUnit = 'M', targetUnit = 'mM') => ({ name: '試薬', stock, target, stockUnit, targetUnit });
test('100 mLのバッファーのストック量と溶媒量', () => {
  const result = calculate([row(), row(5,150)],100);
  assert.deepEqual(result.results.map(r => r.volumeMl), [5,3]);
  assert.equal(result.solventMl,92);
});
test('質量濃度とw/v百分率の換算', () => { assert.equal(calculate([row(10,1,'% (w/v)','mg/mL')],100).results[0].volumeMl,1); });
test('体積百分率と倍率', () => {
  assert.equal(calculate([row(100,70,'% (v/v)','% (v/v)')],10).results[0].volumeMl,7);
  assert.equal(calculate([row(10,1,'×','×')],100).results[0].volumeMl,10);
});
test('µM換算と微量調製', () => { assert.ok(Math.abs(calculate([row(1,10,'mM','µM')],.1).results[0].volumeMl - .001) < 1e-12); });
test('0濃度と全容量ストック', () => {
  assert.equal(calculate([row(1,0)],100).solventMl,100);
  assert.equal(calculate([row(1,1,'M','M')],100).solventMl,0);
});
test('不可能な組成と異種単位を拒否', () => {
  for (const rows of [[row(1,2,'M','M')],[row(1,1,'M','mg/mL')],[row(1,600),row(1,600)],[row(0)],[row(1,NaN)],[row(1,-1)],[]]) assert.throws(() => calculate(rows,100));
  for (const volume of [0,-1,NaN,Infinity]) assert.throws(() => calculate([row()],volume));
});
