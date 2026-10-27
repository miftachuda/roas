import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Activity, 
  Scale, 
  ArrowRightLeft,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { formatNum } from '../utils/tankCalculations';

export default function MetricsOverview({ tankBalances, flowComparisons }) {
  // Aggregate stats
  const totalTanks = tankBalances.length;
  
  let totalStartTon = 0;
  let totalEndTon = 0;
  let totalStartBbl = 0;
  let totalEndBbl = 0;
  let activeMovementCount = 0;
  let receivingCount = 0;
  let dischargingCount = 0;

  tankBalances.forEach(item => {
    totalStartTon += item.balance.startTonnage;
    totalEndTon += item.balance.endTonnage;
    totalStartBbl += item.balance.startBbl;
    totalEndBbl += item.balance.endBbl;

    const deltaTon = item.balance.deltaTonnage;
    if (Math.abs(deltaTon) >= 10) {
      activeMovementCount++;
      if (deltaTon > 0) receivingCount++;
      else dischargingCount++;
    }
  });

  const netDeltaTon = totalEndTon - totalStartTon;
  const netDeltaBbl = totalEndBbl - totalStartBbl;

  // Flow comparisons summary
  let mappedFlowCount = 0;
  let goodMatchCount = 0;
  let warningCount = 0;

  Object.values(flowComparisons || {}).forEach(c => {
    if (c.hasFlow) {
      mappedFlowCount++;
      if (c.status === 'good') goodMatchCount++;
      else warningCount++;
    }
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      
      {/* 1. Total Tanks */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-medium">LOC II Tanks</span>
          <Layers className="w-4 h-4 text-sky-400" />
        </div>
        <div>
          <div className="text-xl font-bold text-white font-mono">{totalTanks}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            <span className="text-emerald-400 font-semibold">{activeMovementCount}</span> moving (Δ &gt; 10T)
          </div>
        </div>
      </div>

      {/* 2. Start Inventory (00:00) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-medium">Start Tonnage (00:00)</span>
          <Scale className="w-4 h-4 text-slate-400" />
        </div>
        <div>
          <div className="text-xl font-bold text-white font-mono">{formatNum(totalStartTon, 0)} <span className="text-xs font-normal text-slate-400">TON</span></div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
            {formatNum(totalStartBbl, 0)} bbl
          </div>
        </div>
      </div>

      {/* 3. End Inventory (24:00) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-medium">End Tonnage (24:00)</span>
          <Scale className="w-4 h-4 text-slate-400" />
        </div>
        <div>
          <div className="text-xl font-bold text-white font-mono">{formatNum(totalEndTon, 0)} <span className="text-xs font-normal text-slate-400">TON</span></div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
            {formatNum(totalEndBbl, 0)} bbl
          </div>
        </div>
      </div>

      {/* 4. Net 24h Plant Delta Tonnage */}
      <div className={`border rounded-xl p-3.5 flex flex-col justify-between shadow-sm ${
        netDeltaTon >= 0 
          ? 'bg-emerald-950/20 border-emerald-800/40' 
          : 'bg-amber-950/20 border-amber-800/40'
      }`}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-slate-300">Net Delta (24h)</span>
          {netDeltaTon >= 0 ? (
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          ) : (
            <TrendingDown className="w-4 h-4 text-amber-400" />
          )}
        </div>
        <div>
          <div className={`text-xl font-bold font-mono ${netDeltaTon >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {netDeltaTon > 0 ? `+${formatNum(netDeltaTon, 0)}` : formatNum(netDeltaTon, 0)} <span className="text-xs font-normal">TON</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
            {netDeltaBbl > 0 ? `+${formatNum(netDeltaBbl, 0)}` : formatNum(netDeltaBbl, 0)} bbl
          </div>
        </div>
      </div>

      {/* 5. Inflow vs Outflow tanks */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-medium">Operation Balance</span>
          <Activity className="w-4 h-4 text-sky-400" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-emerald-400 font-mono text-sm font-bold">
              <span>+{receivingCount}</span>
              <span className="text-[10px] text-slate-400 uppercase font-sans">In</span>
            </div>
            <span className="text-slate-600">/</span>
            <div className="flex items-center gap-1 text-amber-400 font-mono text-sm font-bold">
              <span>-{dischargingCount}</span>
              <span className="text-[10px] text-slate-400 uppercase font-sans">Out</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {totalTanks - activeMovementCount} static tanks
          </div>
        </div>
      </div>

      {/* 6. Flow Indicator Correspondence Status */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-medium">PHD Flow Sync</span>
          <ArrowRightLeft className="w-4 h-4 text-sky-400" />
        </div>
        <div>
          <div className="text-xl font-bold text-white font-mono">
            {mappedFlowCount} <span className="text-xs font-normal text-slate-400">mapped</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
            <span className="text-emerald-400 font-medium">✓ {goodMatchCount} match</span>
            {warningCount > 0 && <span className="text-amber-400 font-medium">! {warningCount} dev</span>}
          </div>
        </div>
      </div>

    </div>
  );
}
