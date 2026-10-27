/**
 * Service to fetch historical 24h data (00:00 - 24:00) from PHD
 * (Process History Database) or simulate realistic plant data.
 */

import { parseOperationalDayRange } from '../utils/dateUtils';

/**
 * Fetch 24-hour snapshot and flow data from PHD HTTP server
 */
export async function fetchPhdOperationalData(dateString, tanks, flowMappings, phdUrl, useDemoMode = false) {
  const range = parseOperationalDayRange(dateString);

  if (useDemoMode) {
    return generateSimulatedData(range, tanks, flowMappings);
  }

  // Collect all unique tag names needed
  const tagSet = new Set();
  tanks.forEach(tank => {
    if (tank.tag_level) tagSet.add(tank.tag_level);
    if (tank.tag_temp) tagSet.add(tank.tag_temp);
  });

  Object.values(flowMappings || {}).forEach(mapping => {
    if (mapping?.flowTag) tagSet.add(mapping.flowTag);
  });

  const tagList = Array.from(tagSet);

  const payload = [
    {
      SampleInterval: 3600000, // 1 hour intervals across 24h
      GetEnum: false,
      ResampleMethod: 'Around',
      MinimumConfidence: 0,
      MaxRows: 100,
      TimeFormat: 6,
      ReductionData: 'snapshot',
      TagName: tagList,
      StartTime: range.serverStart,
      EndTime: range.serverEnd,
      OutputTimeFormat: 6,
      EventSequence: 0
    }
  ];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(phdUrl || 'https://phd.miftachuda.my.id/GetData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`PHD server responded with status: ${response.status}`);
    }

    const rawData = await response.json();
    return parsePhdResponse(rawData, range, tanks, flowMappings);
  } catch (err) {
    console.warn(`PHD connection failed (${err.message}). Falling back to plant data simulation.`);
    const simulated = generateSimulatedData(range, tanks, flowMappings);
    simulated.isSimulation = true;
    simulated.errorNotice = `PHD Server unreachable (${err.message}). Displaying simulated operational data for ${range.dateString}.`;
    return simulated;
  }
}

/**
 * Parse actual PHD server response into tank start/end values and flow totals
 */
function parsePhdResponse(phdData, range, tanks, flowMappings) {
  // phdData is array of { TagName, TimeStamp: [], Value: [], Status: 0 }
  const dataByTag = {};
  if (Array.isArray(phdData)) {
    phdData.forEach(item => {
      if (item.TagName) {
        dataByTag[item.TagName.trim()] = item;
      }
    });
  }

  const tankResults = {};
  const flowResults = {};

  // Parse flow tags first
  Object.entries(flowMappings || {}).forEach(([tankId, mapping]) => {
    if (!mapping?.flowTag) return;
    const tagObj = dataByTag[mapping.flowTag];
    if (tagObj && Array.isArray(tagObj.Value) && tagObj.Value.length > 0) {
      const validVals = tagObj.Value.filter(v => typeof v === 'number' && !isNaN(v) && v > -999);
      if (validVals.length > 0) {
        // If flow is rate (m3/h, ton/h): average rate
        const sum = validVals.reduce((a, b) => a + b, 0);
        const avg = sum / validVals.length;
        flowResults[mapping.flowTag] = {
          avgRate: avg,
          dailyTotal: avg * 24, // default 24h integral
          samples: validVals.length,
          startVal: validVals[0],
          endVal: validVals[validVals.length - 1],
        };
      }
    }
  });

  // Parse tanks
  tanks.forEach(tank => {
    const levelObj = dataByTag[tank.tag_level];
    const tempObj = dataByTag[tank.tag_temp];

    let startLevel = 0;
    let endLevel = 0;
    let startTemp = 30.0;
    let endTemp = 30.0;

    if (levelObj && Array.isArray(levelObj.Value) && levelObj.Value.length > 0) {
      const validLevels = levelObj.Value.filter(v => typeof v === 'number' && !isNaN(v) && v >= 0);
      if (validLevels.length > 0) {
        startLevel = validLevels[0];
        endLevel = validLevels[validLevels.length - 1];
      }
    }

    if (tempObj && Array.isArray(tempObj.Value) && tempObj.Value.length > 0) {
      const validTemps = tempObj.Value.filter(v => typeof v === 'number' && !isNaN(v) && v > -50);
      if (validTemps.length > 0) {
        startTemp = validTemps[0];
        endTemp = validTemps[validTemps.length - 1];
      }
    }

    tankResults[tank.id] = {
      startLevel,
      endLevel,
      startTemp,
      endTemp,
    };
  });

  return {
    isSimulation: false,
    dateRange: range,
    tanks: tankResults,
    flows: flowResults,
    fetchTime: new Date().toISOString()
  };
}

/**
 * Generate deterministic, realistic plant data for demonstration/offline evaluation
 */
function generateSimulatedData(range, tanks, flowMappings) {
  // Use date string as seed for determinism
  let seed = 0;
  for (let i = 0; i < range.dateString.length; i++) {
    seed = (seed * 31 + range.dateString.charCodeAt(i)) % 1000000;
  }

  function pseudoRand(mod = 1000) {
    seed = (seed * 9301 + 49297) % 233280;
    return (seed / 233280) * mod;
  }

  const tankResults = {};
  const flowResults = {};

  tanks.forEach(tank => {
    const maxL = tank.max_level || tank.height_mm || 12000;
    const minL = tank.min_level || 300;
    const midL = (maxL + minL) / 2;

    // Realistic starting level between 30% and 80% capacity
    const startLevel = Math.round(minL + (maxL - minL) * (0.35 + (pseudoRand(45) / 100)));

    // Categorize tank activity:
    // ~25% filling tanks (positive delta)
    // ~25% discharging/transfer tanks (negative delta)
    // ~50% holding/static tanks (slight thermal expansion delta)
    const mode = Math.floor(pseudoRand(10));
    let deltaLevel = 0;

    if (mode <= 2) {
      // Receipt / Filling tank: +500 to +3800 mm
      deltaLevel = Math.round(500 + pseudoRand(3200));
    } else if (mode <= 5) {
      // Dispatch / Suction tank: -400 to -3500 mm
      deltaLevel = -Math.round(400 + pseudoRand(3000));
    } else {
      // Idle / settling tank with slight reading jitter (+/- 2 to 15 mm)
      deltaLevel = Math.round((pseudoRand(30) - 15));
    }

    let endLevel = startLevel + deltaLevel;
    if (endLevel > maxL - 200) endLevel = maxL - 200;
    if (endLevel < minL + 100) endLevel = minL + 100;

    // Realistic temperatures: heavy products 40-75C, lights 30-45C
    let baseTemp = 35.0;
    if (tank.product.includes('ASPHALT') || tank.product.includes('RESIDU')) {
      baseTemp = 60.0 + pseudoRand(15);
    } else if (tank.product.includes('HVI') || tank.product.includes('RAFFINATE')) {
      baseTemp = 42.0 + pseudoRand(12);
    } else {
      baseTemp = 32.0 + pseudoRand(8);
    }

    const startTemp = parseFloat(baseTemp.toFixed(1));
    const endTemp = parseFloat((baseTemp + (pseudoRand(4) - 2)).toFixed(1));

    tankResults[tank.id] = {
      startLevel,
      endLevel,
      startTemp,
      endTemp
    };
  });

  // Simulate flow indicators to closely match mapped tank deltas
  Object.entries(flowMappings || {}).forEach(([tankId, mapping]) => {
    if (!mapping?.flowTag) return;
    const tank = tanks.find(t => t.id === tankId);
    if (!tank) return;

    const tankData = tankResults[tankId];
    const diaM = tank.dia_mm / 1000;
    const area = Math.PI * Math.pow(diaM / 2, 2);
    const deltaM3 = Math.abs(tankData.endLevel - tankData.startLevel) / 1000 * area;
    
    // Flow meter typically differs slightly from tank strapping by 1-4%
    const drift = 0.97 + (pseudoRand(6) / 100);
    const simulatedFlowM3 = deltaM3 * drift;
    const avgRate = simulatedFlowM3 / 24;

    flowResults[mapping.flowTag] = {
      avgRate: parseFloat(avgRate.toFixed(2)),
      dailyTotal: parseFloat(simulatedFlowM3.toFixed(2)),
      samples: 24,
      startVal: parseFloat(avgRate.toFixed(2)),
      endVal: parseFloat((avgRate * 1.02).toFixed(2))
    };
  });

  return {
    isSimulation: true,
    dateRange: range,
    tanks: tankResults,
    flows: flowResults,
    fetchTime: new Date().toISOString()
  };
}
