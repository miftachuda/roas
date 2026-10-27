/**
 * Tank Strapping & Engineering Calculations for LOC II
 * Volume, Barrels, Tonnage, and Flow Indicator Comparisons
 */

// 1 m3 = 6.28981077 US Barrels
export const M3_TO_BBL = 6.28981077;

/**
 * Calculate geometric volume in m3 from tank diameter (mm) and level (mm)
 */
export function calculateVolumeM3(tankDiaMm, levelMm) {
  if (!tankDiaMm || tankDiaMm <= 0 || levelMm == null || isNaN(levelMm)) return 0;
  const radiusM = (tankDiaMm / 2) / 1000;
  const levelM = Math.max(0, levelMm) / 1000;
  const areaM2 = Math.PI * Math.pow(radiusM, 2);
  return areaM2 * levelM;
}

/**
 * Convert m3 to Barrels
 */
export function m3ToBarrels(volumeM3) {
  if (!volumeM3 || volumeM3 <= 0) return 0;
  return volumeM3 * M3_TO_BBL;
}

/**
 * Convert Barrels to m3
 */
export function barrelsToM3(barrels) {
  if (!barrels || barrels <= 0) return 0;
  return barrels / M3_TO_BBL;
}

/**
 * Calculate Tonnage (Metric Ton) from Volume in m3 and SG (Specific Gravity)
 */
export function calculateTonnage(volumeM3, specificGravity) {
  const sg = Number(specificGravity) || 1.0;
  return (volumeM3 || 0) * sg;
}

/**
 * Compute 24h Daily Balance for a Tank
 */
export function computeTankDailyBalance(tank, rawStartLevel, rawEndLevel, rawStartTemp, rawEndTemp, customSg) {
  const diaMm = Number(tank.dia_mm) || 0;
  const heightMm = Number(tank.height_mm) || 12000;
  const sg = Number(customSg !== undefined && customSg !== null ? customSg : tank.sg) || 0.88;

  const startLevel = Number(rawStartLevel) || 0;
  const endLevel = Number(rawEndLevel) || 0;
  const deltaLevel = endLevel - startLevel;

  const startTemp = Number(rawStartTemp) || 0;
  const endTemp = Number(rawEndTemp) || 0;
  const deltaTemp = endTemp - startTemp;

  // Volumes
  const startVolM3 = calculateVolumeM3(diaMm, startLevel);
  const endVolM3 = calculateVolumeM3(diaMm, endLevel);
  const deltaVolM3 = endVolM3 - startVolM3;

  const startBbl = m3ToBarrels(startVolM3);
  const endBbl = m3ToBarrels(endVolM3);
  const deltaBbl = endBbl - startBbl;

  // Tonnages
  const startTonnage = calculateTonnage(startVolM3, sg);
  const endTonnage = calculateTonnage(endVolM3, sg);
  const deltaTonnage = endTonnage - startTonnage;

  // Capacity & Fill Percentage
  const maxVolM3 = calculateVolumeM3(diaMm, heightMm);
  const maxTonnage = calculateTonnage(maxVolM3, sg);
  const maxBbl = m3ToBarrels(maxVolM3);
  const fillPercentage = maxVolM3 > 0 ? (endVolM3 / maxVolM3) * 100 : 0;

  // Target boundaries
  const lowTarget = Number(tank.low_target) || 1200;
  const highTarget = Number(tank.high_target) || 11000;
  let levelStatus = 'normal';
  if (endLevel >= highTarget) levelStatus = 'high';
  else if (endLevel <= lowTarget && endLevel > 0) levelStatus = 'low';

  return {
    startLevel,
    endLevel,
    deltaLevel,
    startTemp,
    endTemp,
    deltaTemp,
    startVolM3,
    endVolM3,
    deltaVolM3,
    startBbl,
    endBbl,
    deltaBbl,
    startTonnage,
    endTonnage,
    deltaTonnage,
    maxVolM3,
    maxTonnage,
    maxBbl,
    fillPercentage: Math.min(100, Math.max(0, fillPercentage)),
    sg,
    levelStatus
  };
}

/**
 * Compare Tank Tonnage/Barrels with Correspondence PHD Flow Indicator
 */
export function computeFlowComparison(flowData, tankBalance, flowMapping) {
  if (!flowMapping?.flowTag) {
    return {
      hasFlow: false,
      flowTag: null,
      flowUnit: 'm3/h',
      flowDirection: 'inflow',
      flowTotalVolM3: null,
      flowTotalBbl: null,
      flowTotalTon: null,
      diffTon: null,
      diffBbl: null,
      variancePct: null,
      status: 'unmapped'
    };
  }

  const unit = flowMapping.flowUnit || 'm3/h';
  const direction = flowMapping.flowDirection || 'inflow'; // 'inflow' or 'outflow'
  const sg = tankBalance.sg || 0.88;
  const rawValue = Number(flowData?.dailyTotal ?? flowData?.avgRate) || 0;

  let flowTotalVolM3 = 0;
  let flowTotalTon = 0;
  let flowTotalBbl = 0;

  switch (unit) {
    case 'm3/h':
      // 24 hours integration of hourly rate
      flowTotalVolM3 = rawValue * 24;
      flowTotalBbl = m3ToBarrels(flowTotalVolM3);
      flowTotalTon = calculateTonnage(flowTotalVolM3, sg);
      break;
    case 'ton/h':
      flowTotalTon = rawValue * 24;
      flowTotalVolM3 = flowTotalTon / sg;
      flowTotalBbl = m3ToBarrels(flowTotalVolM3);
      break;
    case 'T/D':
      flowTotalTon = rawValue;
      flowTotalVolM3 = flowTotalTon / sg;
      flowTotalBbl = m3ToBarrels(flowTotalVolM3);
      break;
    case 'bpd':
      flowTotalBbl = rawValue;
      flowTotalVolM3 = barrelsToM3(flowTotalBbl);
      flowTotalTon = calculateTonnage(flowTotalVolM3, sg);
      break;
    case 'm3': // Totalizer counter
      flowTotalVolM3 = rawValue;
      flowTotalBbl = m3ToBarrels(flowTotalVolM3);
      flowTotalTon = calculateTonnage(flowTotalVolM3, sg);
      break;
    case 'ton':
      flowTotalTon = rawValue;
      flowTotalVolM3 = flowTotalTon / sg;
      flowTotalBbl = m3ToBarrels(flowTotalVolM3);
      break;
    case 'bbl':
      flowTotalBbl = rawValue;
      flowTotalVolM3 = barrelsToM3(flowTotalBbl);
      flowTotalTon = calculateTonnage(flowTotalVolM3, sg);
      break;
    default:
      flowTotalVolM3 = rawValue * 24;
      flowTotalBbl = m3ToBarrels(flowTotalVolM3);
      flowTotalTon = calculateTonnage(flowTotalVolM3, sg);
  }

  // Calculate Difference:
  // Expected magnitude vs Flow total
  const absTankDeltaTon = Math.abs(tankBalance.deltaTonnage);
  const absTankDeltaBbl = Math.abs(tankBalance.deltaBbl);

  // Signed expected delta based on flow direction
  const expectedTankDeltaTon = direction === 'inflow' ? flowTotalTon : -flowTotalTon;
  const diffTon = tankBalance.deltaTonnage - expectedTankDeltaTon;
  const diffBbl = tankBalance.deltaBbl - (direction === 'inflow' ? flowTotalBbl : -flowTotalBbl);

  const baseline = Math.max(absTankDeltaTon, flowTotalTon, 1);
  const variancePct = (Math.abs(absTankDeltaTon - flowTotalTon) / baseline) * 100;

  let status = 'good'; // < 3%
  if (variancePct > 10) status = 'critical'; // > 10%
  else if (variancePct > 3) status = 'warning'; // 3-10%

  return {
    hasFlow: true,
    flowTag: flowMapping.flowTag,
    flowUnit: unit,
    flowDirection: direction,
    flowTotalVolM3,
    flowTotalBbl,
    flowTotalTon,
    diffTon,
    diffBbl,
    variancePct,
    status
  };
}

/**
 * Format numbers cleanly
 */
export function formatNum(val, digits = 1) {
  if (val == null || isNaN(val)) return '-';
  return Number(val).toLocaleString('id-ID', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}
