import React from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  Minus, 
  Sliders, 
  Info, 
  ArrowRightLeft,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { formatNum } from '../utils/tankCalculations';

export default function TankCardView({
  tanks,
  unitPreference,
  onOpenFlowModal,
  onOpenTankDetail,
  isCustomSorting,
  onMoveTankOrder
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {tanks.map((item, index) => {
        const { tank, balance, flowComparison } = item;
        const deltaTon = balance.deltaTonnage;
        const deltaBbl = balance.deltaBbl;
        const deltaL = balance.deltaLevel;

        const isReceiving = deltaTon > 5;
        const isDischarging = deltaTon < -5;

        const fillHeightPct = balance.fillPercentage;

        return (
          <div 
            key={tank.id} 
            className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg hover:border-slate-700 transition-all flex flex-col justify-between relative overflow-hidden group"
          >
            {/* Header / Reorder */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-white bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-700">
                    {tank.tank}
                  </span>
                  {isCustomSorting && (
                    <div className="flex items-center gap-0.5 bg-slate-950 px-1.5 py-0.5 rounded border border-purple-500/30">
                      <button
                        onClick={() => onMoveTankOrder(index, -1)}
                        disabled={index === 0}
                        className="hover:text-white disabled:opacity-20 text-purple-400"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[11px] font-bold text-purple-400 font-mono">{index + 1}</span>
                      <button
                        onClick={() => onMoveTankOrder(index, 1)}
                        disabled={index === tanks.length - 1}
                        className="hover:text-white disabled:opacity-20 text-purple-400"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <h3 className="text-xs font-semibold text-slate-200 mt-1 truncate max-w-[170px]" title={tank.product}>
                  {tank.product || 'UNSPECIFIED'}
                </h3>
              </div>

              {/* Delta Badge */}
              <div className={`px-2.5 py-1 rounded-xl text-right font-mono border ${
                isReceiving 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                  : isDischarging 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                  : 'bg-slate-800/80 border-slate-700 text-slate-300'
              }`}>
                <div className="text-[10px] uppercase font-sans font-semibold tracking-wider opacity-75">
                  Δ Tonnage
                </div>
                <div className="text-sm font-bold">
                  {deltaTon > 0 ? `+${formatNum(deltaTon, 1)}` : formatNum(deltaTon, 1)} <span className="text-[10px] font-normal">T</span>
                </div>
              </div>
            </div>

            {/* Level graphic & metrics */}
            <div className="grid grid-cols-3 gap-2 items-center bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 mb-3">
              {/* Mini vertical tank gauge */}
              <div className="flex flex-col items-center">
                <div className="h-20 w-8 bg-slate-900 border border-slate-700 rounded-lg relative overflow-hidden flex flex-col justify-end">
                  {/* High Target line */}
                  <div 
                    className="absolute w-full border-t border-dashed border-red-500/80 z-10" 
                    style={{ bottom: `${(Number(tank.high_target || 11000) / Number(tank.height_mm || 12000)) * 100}%` }}
                    title="High Target"
                  />
                  {/* Liquid fill */}
                  <div 
                    className={`w-full transition-all duration-500 ${
                      isReceiving ? 'bg-gradient-to-t from-emerald-600 to-sky-500' : 'bg-gradient-to-t from-sky-600 to-sky-400'
                    }`}
                    style={{ height: `${fillHeightPct}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-400 mt-1">{fillHeightPct.toFixed(0)}% full</span>
              </div>

              {/* Start & End Level */}
              <div className="col-span-2 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-[10px]">00:00:</span>
                  <span className="font-semibold text-slate-200">{formatNum(balance.startLevel, 0)} mm</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-[10px]">24:00:</span>
                  <span className="font-bold text-white">{formatNum(balance.endLevel, 0)} mm</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                  <span className="text-[10px] text-slate-500">Δ Level:</span>
                  <span className={`font-bold flex items-center gap-0.5 ${
                    deltaL > 0 ? 'text-emerald-400' : deltaL < 0 ? 'text-amber-400' : 'text-slate-400'
                  }`}>
                    {deltaL > 0 && <ArrowUp className="w-3 h-3" />}
                    {deltaL < 0 && <ArrowDown className="w-3 h-3" />}
                    {deltaL === 0 && <Minus className="w-3 h-3" />}
                    {deltaL > 0 ? `+${formatNum(deltaL, 0)}` : formatNum(deltaL, 0)} mm
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span className="text-[10px]">Δ Barrels:</span>
                  <span className="font-semibold text-sky-400">{deltaBbl > 0 ? `+${formatNum(deltaBbl, 0)}` : formatNum(deltaBbl, 0)} bbl</span>
                </div>
              </div>
            </div>

            {/* PHD Flow Indicator Comparison Cardlet */}
            <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80 mb-3 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <ArrowRightLeft className="w-3 h-3 text-sky-400" />
                  PHD Flow Meter
                </span>
                {flowComparison.hasFlow && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                    flowComparison.status === 'good'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  }`}>
                    {flowComparison.variancePct.toFixed(1)}% var
                  </span>
                )}
              </div>

              {flowComparison.hasFlow ? (
                <div>
                  <div className="font-mono text-[11px] text-sky-300 font-bold truncate">
                    {flowComparison.flowTag}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-0.5">
                    <span>Flow: {formatNum(flowComparison.flowTotalTon, 0)} Ton</span>
                    <span className={Math.abs(flowComparison.diffTon) < 50 ? 'text-emerald-400' : 'text-amber-400'}>
                      Diff: {formatNum(flowComparison.diffTon, 0)} T
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => onOpenFlowModal(tank)}
                  className="w-full text-center py-1 text-[11px] text-slate-500 hover:text-sky-400 hover:bg-slate-900 border border-dashed border-slate-800 rounded transition-colors"
                >
                  + Assign PHD Flow Tag
                </button>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
              <button
                onClick={() => onOpenFlowModal(tank)}
                className="text-[11px] text-slate-400 hover:text-sky-400 flex items-center gap-1 transition-colors"
              >
                <Sliders className="w-3 h-3" />
                <span>Configure Flow</span>
              </button>
              <button
                onClick={() => onOpenTankDetail(tank, balance, flowComparison)}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <Info className="w-3 h-3" />
                <span>Strapping Details</span>
              </button>
            </div>

          </div>
        );
      })}
    </div>
  );
}
