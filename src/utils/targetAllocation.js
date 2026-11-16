/** آستانهٔ هشدار انحراف از هدف (درصد مطلق) */
export const TARGET_DRIFT_ALERT_THRESHOLD = 5;

export function sumTargetPercents(targetAllocation) {
  if (!targetAllocation || typeof targetAllocation !== 'object') return 0;
  return Object.values(targetAllocation).reduce(
    (sum, value) => sum + (Number(value) || 0),
    0
  );
}

export function isTargetAllocationValid(targetAllocation, classIds) {
  if (!classIds.length) return false;
  if (!targetAllocation || typeof targetAllocation !== 'object') return false;

  const hasAll = classIds.every((id) => {
    const value = targetAllocation[id];
    return value != null && Number(value) >= 0;
  });
  if (!hasAll) return false;

  const sum = sumTargetPercents(targetAllocation);
  return Math.abs(sum - 100) < 0.05;
}

export function buildTargetDriftRows(assetClasses, targetAllocation, classTotals, portfolioTotal) {
  if (!isTargetAllocationValid(
    targetAllocation,
    assetClasses.map((c) => c.id)
  )) {
    return { rows: [], alerts: [], isActive: false };
  }

  const totalByClassId = new Map(classTotals.map((c) => [c.id, c]));

  const rows = assetClasses.map((assetClass) => {
    const totals = totalByClassId.get(assetClass.id);
    const currentPercent = totals?.percent ?? 0;
    const currentValue = totals?.total ?? 0;
    const targetPercent = Number(targetAllocation[assetClass.id]) || 0;
    const targetValue = portfolioTotal > 0 ? (portfolioTotal * targetPercent) / 100 : 0;
    const driftPercent = currentPercent - targetPercent;
    const gapValue = targetValue - currentValue;

    return {
      id: assetClass.id,
      name: assetClass.name,
      targetPercent,
      currentPercent,
      driftPercent,
      gapValue,
      currentValue,
      targetValue,
    };
  });

  const alerts = rows.filter(
    (row) => Math.abs(row.driftPercent) >= TARGET_DRIFT_ALERT_THRESHOLD
  );

  return { rows, alerts, isActive: true };
}