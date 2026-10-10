(function (root) {
  const units = { M: ['molar', 1], mM: ['molar', 1e-3], 'µM': ['molar', 1e-6], 'mg/mL': ['mass', 1], 'g/L': ['mass', 1], 'µg/mL': ['mass', 1e-3], '% (w/v)': ['mass', 10], '% (v/v)': ['volume', 1], '×': ['fold', 1] };
  function calculate(rows, totalMl) {
    if (!Number.isFinite(totalMl) || totalMl <= 0) throw new Error('最終容量は0より大きい数値にしてください。');
    if (!rows.length) throw new Error('試薬を1つ以上追加してください。');
    const results = rows.map(row => {
      const stock = units[row.stockUnit], target = units[row.targetUnit];
      if (!row.name.trim()) throw new Error('試薬名を入力してください。');
      if (!stock || !target || stock[0] !== target[0]) throw new Error(`${row.name}: ストックと最終濃度の単位の種類を合わせてください。`);
      if (!Number.isFinite(row.stock) || row.stock <= 0 || !Number.isFinite(row.target) || row.target < 0) throw new Error(`${row.name}: ストック濃度は正の数、最終濃度は0以上にしてください。`);
      const ratio = row.target * target[1] / (row.stock * stock[1]);
      if (ratio > 1 + 1e-12) throw new Error(`${row.name}: 最終濃度がストック濃度を超えています。`);
      return { ...row, volumeMl: ratio * totalMl };
    });
    const usedMl = results.reduce((sum, row) => sum + row.volumeMl, 0);
    if (usedMl > totalMl + totalMl * 1e-12) throw new Error('必要なストック量の合計が最終容量を超えています。濃度または組成を見直してください。');
    return { results, totalMl, solventMl: Math.max(0, totalMl - usedMl) };
  }
  root.ReagentCalculator = { calculate, units };
  if (typeof module !== 'undefined') module.exports = root.ReagentCalculator;
})(typeof globalThis !== 'undefined' ? globalThis : window);
