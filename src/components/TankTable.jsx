import React from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  ArrowRight, 
  Sliders, 
  Info, 
  ArrowRightLeft, 
  ChevronUp, 
  ChevronDown,
  CheckCircle,
  AlertTriangle,
  Minus
} from 'lucide-react';
import { formatNum } from '../utils/tankCalculations';

export default function TankTable({
  tanks,
  unitPreference,
  onOpenFlowModal,
  onOpenTankDetail,
  isCustomSorting,
  onMoveTankOrder
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950/90 text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-800 sticky top-0 z-10">
              <th className="py-3 px-3 w-12 text-center">#</th>
              <th className="py-3 px-4 min-w-[140px]">Tank / Product</th>
              <th className="py-3 px-3 text-center">SG</th>
              <th className="py-3 px-3 text-right">00:00 Level</th>
              <th className="py-3 px-3 text-right">24:00 Level</th>
              <th className="py-3 px-3 text-right">Δ Level (mm)</th>
              <th className="py-3 px-3 text-right">00:00 Temp</th>
              <th className="py-3 px-3 text-right">24:00 Temp</th>
              <th className="py-3 px-4 text-right">Start ({unitPreference.toUpperCase()})</th>
              <th className="py-3 px-4 text-right">End ({unitPreference.toUpperCase()})</th>
              <th className="py-3 px-4 text-right bg-slate-950/95 font-bold text-sky-400">
                Δ Tonnage (Ton)
              </th>
              <th className="py-3 px-3 text-right font-medium text-slate-300">
                Δ Volume (bbl)
              </th>
              <th className="py-3 px-4 min-w-[180px] bg-slate-950/90 text-sky-300">
                PHD Flow Comparison
              </th>
              <th className="py-3 px-3 text-center w-20">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {tanks.length === 0 ? (
              <tr>
                <td colSpan="14" className="py-12 text-center text-slate-500">
                  No tanks matched the filter criteria.
                </td>
              </tr>
            ) : (
              tanks.map((item, index) => {
                const { tank, balance, flowComparison } = item;
                const deltaTon = balance.deltaTonnage;
                const deltaBbl = balance.deltaBbl;
                const deltaL = balance.deltaLevel;

                const isReceiving = deltaTon > 5;
                const isDischarging = deltaTon < -5;

                // Value by unit preference
                let startDisplayVal = balance.startTonnage;
                let endDisplayVal = balance.endTonnage;
                if (unitPreference === 'bbl') {
                  startDisplayVal = balance.startBbl;
                  endDisplayVal = balance.endBbl;
                } else if (unitPreference === 'm3') {
                  startDisplayVal = balance.startVolM3;
                  endDisplayVal = balance.endVolM3;
                }

                return (
                  <tr 
                    key={tank.id} 
                    className="hover:bg-slate-800/50 transition-colors group"
                  >
                    {/* Rank / Custom Sort Ordering controls */}
                    <td className="py-2.5 px-2 text-center text-slate-500 font-mono text-[11px]">
                      {isCustomSorting ? (
                        <div className="flex items-center justify-center gap-0.5">
                          <button
                            onClick={() => onMoveTankOrder(index, -1)}
                            disabled={index === 0}
                            title="Move Up"
                            className="p-1 hover:text-white disabled:opacity-20 hover:bg-slate-800 rounded"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-bold text-purple-400">{index + 1}</span>
                          <button
                            onClick={() => onMoveTankOrder(index, 1)}
                            disabled={index === tanks.length - 1}
                            title="Move Down"
                            className="p-1 hover:text-white disabled:opacity-20 hover:bg-slate-800 rounded"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        index + 1
                      )}
                    </td>

                    {/* Tank & Product */}
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-white text-[13px] bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700/80">
                          {tank.tank}
                        </span>
                        <div className="overflow-hidden">
                          <p className="font-medium text-slate-200 truncate max-w-[130px]" title={tank.product}>
                            {tank.product || 'UNSPECIFIED'}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            Ø{(tank.dia_mm / 1000).toFixed(1)}m × H{(tank.height_mm / 1000).toFixed(1)}m
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* SG */}
                    <td className="py-2.5 px-3 text-center font-mono text-slate-300">
                      {balance.sg.toFixed(4)}
                    </td>

                    {/* Level 00:00 */}
                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                      {formatNum(balance.startLevel, 0)}
                    </td>

                    {/* Level 24:00 */}
                    <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-100">
                      {formatNum(balance.endLevel, 0)}
                    </td>

                    {/* Δ Level (mm) */}
                    <td className="py-2.5 px-3 text-right font-mono">
                      <div className="flex items-center justify-end gap-1">
                        {deltaL > 0 && <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />}
                        {deltaL < 0 && <ArrowDown className="w-3.5 h-3.5 text-amber-400" />}
                        {deltaL === 0 && <Minus className="w-3.5 h-3.5 text-slate-500" />}
                        <span className={`font-semibold ${
                          deltaL > 0 ? 'text-emerald-400' : deltaL < 0 ? 'text-amber-400' : 'text-slate-400'
                        }`}>
                          {deltaL > 0 ? `+${formatNum(deltaL, 0)}` : formatNum(deltaL, 0)}
                        </span>
                      </div>
                    </td>

                    {/* Temp 00:00 */}
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                      {balance.startTemp.toFixed(1)}°
                    </td>

                    {/* Temp 24:00 */}
                    <td className="py-2.5 px-3 text-right font-mono text-slate-200">
                      {balance.endTemp.toFixed(1)}°
                    </td>

                    {/* Start Volume/Ton */}
                    <td className="py-2.5 px-4 text-right font-mono text-slate-400">
                      {formatNum(startDisplayVal, 0)}
                    </td>

                    {/* End Volume/Ton */}
                    <td className="py-2.5 px-4 text-right font-mono font-medium text-slate-200">
                      {formatNum(endDisplayVal, 0)}
                    </td>

                    {/* Highlighted Delta Tonnage (Ton) */}
                    <td className="py-2.5 px-4 text-right font-mono font-bold bg-slate-950/40">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className={`text-[13px] px-2 py-0.5 rounded ${
                          isReceiving 
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold' 
                            : isDischarging 
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold' 
                            : 'text-slate-400 font-normal'
                        }`}>
                          {deltaTon > 0 ? `+${formatNum(deltaTon, 1)}` : formatNum(deltaTon, 1)}
                        </span>
                      </div>
                    </td>

                    {/* Δ Volume (bbl) */}
                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                      {deltaBbl > 0 ? `+${formatNum(deltaBbl, 0)}` : formatNum(deltaBbl, 0)}
                    </td>

                    {/* PHD Flow Indicator Comparison */}
                    <td className="py-2.5 px-4 bg-slate-950/30">
                      {flowComparison.hasFlow ? (
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-mono text-[11px] text-sky-300 font-semibold truncate max-w-[110px]" title={flowComparison.flowTag}>
                              {flowComparison.flowTag}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                              flowComparison.status === 'good'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : flowComparison.status === 'warning'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-red-500/15 text-red-400 border border-red-500/30'
                            }`}>
                              {flowComparison.variancePct.toFixed(1)}% var
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                            <span>Flow: {formatNum(flowComparison.flowTotalTon, 0)} T ({formatNum(flowComparison.flowTotalBbl, 0)} bbl)</span>
                            <span className={Math.abs(flowComparison.diffTon) < 50 ? 'text-emerald-400' : 'text-amber-400'}>
                              Diff: {formatNum(flowComparison.diffTon, 0)} T
                            </span>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => onOpenFlowModal(tank)}
                          className="text-[11px] text-slate-500 hover:text-sky-400 transition-colors flex items-center gap-1 border border-dashed border-slate-700/80 hover:border-sky-500 px-2 py-1 rounded"
                        >
                          <ArrowRightLeft className="w-3 h-3" />
                          <span>+ Map PHD Flow</span>
                        </button>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onOpenFlowModal(tank)}
                          title="Configure correspondence flow indicator"
                          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-sky-400 transition-colors"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenTankDetail(tank, balance, flowComparison)}
                          title="View strapping & calculation details"
                          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* Table Footer info */}
      <div className="px-4 py-3 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
        <span>Showing {tanks.length} LOC II tanks</span>
        <span className="font-mono">Formula: Volume (m³) = π × (D/2)² × Level | Tonnage = Volume × SG | Barrels = Volume × 6.2898</span>
      </div>
    </div>
  );
}
