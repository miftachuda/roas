import React, { useState } from 'react';
import { 
  X, 
  Database, 
  Scale, 
  ArrowRightLeft, 
  TrendingUp, 
  TrendingDown, 
  Sliders,
  Check,
  AlertTriangle,
  Info
} from 'lucide-react';
import { formatNum } from '../utils/tankCalculations';

export default function TankDetailModal({
  isOpen,
  onClose,
  tank,
  balance,
  flowComparison,
  onSaveCustomSg
}) {
  if (!isOpen || !tank || !balance) return null;

  const [sgInput, setSgInput] = useState(balance.sg.toString());
  const [editingSg, setEditingSg] = useState(false);

  const diaM = (tank.dia_mm / 1000).toFixed(3);
  const heightM = (tank.height_mm / 1000).toFixed(3);
  const radiusM = (tank.dia_mm / 2 / 1000).toFixed(4);
  const areaM2 = (Math.PI * Math.pow(tank.dia_mm / 2 / 1000, 2)).toFixed(3);

  const deltaTon = balance.deltaTonnage;
  const isReceiving = deltaTon > 0;

  const handleSaveSg = () => {
    const val = parseFloat(sgInput);
    if (isNaN(val) || val <= 0 || val > 2.0) {
      alert('Please enter a valid Specific Gravity (e.g. 0.88)');
      return;
    }
    onSaveCustomSg(tank.id, val);
    setEditingSg(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xl font-bold text-white bg-slate-800 px-3 py-1 rounded-xl border border-slate-700">
              {tank.tank}
            </span>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {tank.product || 'Unspecified Product'}
              </h2>
              <p className="text-xs text-slate-400">
                LOC II Storage Tank • Raw Identifier: <span className="font-mono text-slate-300">{tank.raw_name}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          
          {/* Key 24-Hour Balance Summary */}
          <div className="grid grid-cols-3 gap-3">
            {/* Start */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">00:00 Balance</span>
              <div className="text-base font-bold font-mono text-white">
                {formatNum(balance.startTonnage, 1)} <span className="text-xs font-normal text-slate-400">TON</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-1 space-y-0.5">
                <div>Level: <span className="text-slate-200 font-medium">{formatNum(balance.startLevel, 0)} mm</span></div>
                <div>Temp: <span className="text-slate-200 font-medium">{balance.startTemp.toFixed(1)} °C</span></div>
                <div>Vol: <span className="text-slate-200 font-medium">{formatNum(balance.startBbl, 0)} bbl</span></div>
              </div>
            </div>

            {/* End */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">24:00 Balance</span>
              <div className="text-base font-bold font-mono text-white">
                {formatNum(balance.endTonnage, 1)} <span className="text-xs font-normal text-slate-400">TON</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-1 space-y-0.5">
                <div>Level: <span className="text-white font-bold">{formatNum(balance.endLevel, 0)} mm</span></div>
                <div>Temp: <span className="text-white font-bold">{balance.endTemp.toFixed(1)} °C</span></div>
                <div>Vol: <span className="text-white font-bold">{formatNum(balance.endBbl, 0)} bbl</span></div>
              </div>
            </div>

            {/* Delta */}
            <div className={`p-3.5 rounded-2xl border ${
              isReceiving 
                ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' 
                : 'bg-amber-950/20 border-amber-800/40 text-amber-300'
            }`}>
              <span className="text-[11px] font-semibold block mb-1">24h Net Movement (Δ)</span>
              <div className="text-base font-bold font-mono">
                {deltaTon > 0 ? `+${formatNum(deltaTon, 1)}` : formatNum(deltaTon, 1)} <span className="text-xs font-normal">TON</span>
              </div>
              <div className="text-[11px] font-mono mt-1 space-y-0.5">
                <div>Δ Level: <span className="font-bold">{balance.deltaLevel > 0 ? `+${formatNum(balance.deltaLevel, 0)}` : formatNum(balance.deltaLevel, 0)} mm</span></div>
                <div>Δ Temp: <span className="font-medium">{balance.deltaTemp > 0 ? `+${balance.deltaTemp.toFixed(1)}` : balance.deltaTemp.toFixed(1)} °C</span></div>
                <div>Δ Barrels: <span className="font-bold">{balance.deltaBbl > 0 ? `+${formatNum(balance.deltaBbl, 0)}` : formatNum(balance.deltaBbl, 0)} bbl</span></div>
              </div>
            </div>
          </div>

          {/* Strapping & Geometry */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span>Tank Strapping Parameters</span>
              <span className="text-[11px] font-mono font-normal text-sky-400">{balance.fillPercentage.toFixed(1)}% Capacity</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-mono">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Diameter (Ø)</span>
                <span className="text-white font-bold">{diaM} m</span>
                <span className="text-slate-500 block text-[10px]">({tank.dia_mm} mm)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Height (H)</span>
                <span className="text-white font-bold">{heightM} m</span>
                <span className="text-slate-500 block text-[10px]">({tank.height_mm} mm)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Base Cross Area (A)</span>
                <span className="text-white font-bold">{areaM2} m²</span>
                <span className="text-slate-500 block text-[10px]">π × ({radiusM})²</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Max Capacity</span>
                <span className="text-white font-bold">{formatNum(balance.maxTonnage, 0)} T</span>
                <span className="text-slate-500 block text-[10px]">({formatNum(balance.maxBbl, 0)} bbl)</span>
              </div>
            </div>

            {/* Target Boundaries */}
            <div className="grid grid-cols-4 gap-2 text-[10px] text-center pt-2 border-t border-slate-800 font-mono">
              <div>
                <span className="text-slate-500 block">Min Level</span>
                <span className="text-slate-300 font-semibold">{tank.min_level} mm</span>
              </div>
              <div>
                <span className="text-amber-500 block">Low Target</span>
                <span className="text-amber-400 font-semibold">{tank.low_target} mm</span>
              </div>
              <div>
                <span className="text-emerald-500 block">High Target</span>
                <span className="text-emerald-400 font-semibold">{tank.high_target} mm</span>
              </div>
              <div>
                <span className="text-red-500 block">Max Safe Level</span>
                <span className="text-red-400 font-semibold">{tank.max_level} mm</span>
              </div>
            </div>
          </div>

          {/* Specific Gravity (SG) Settings */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block">
                Specific Gravity (SG / Density)
              </span>
              <p className="text-[11px] text-slate-400">
                Master default: <code className="font-mono text-sky-300">{tank.sg}</code>
              </p>
            </div>
            
            {editingSg ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.0001"
                  value={sgInput}
                  onChange={(e) => setSgInput(e.target.value)}
                  className="w-24 bg-slate-900 border border-slate-700 text-xs font-mono text-white rounded-lg px-2.5 py-1.5 focus:outline-none"
                />
                <button
                  onClick={handleSaveSg}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingSg(false)}
                  className="px-2 py-1.5 text-slate-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-white bg-slate-900 px-3 py-1 rounded-xl border border-slate-800">
                  {balance.sg.toFixed(4)}
                </span>
                <button
                  onClick={() => setEditingSg(true)}
                  className="text-xs text-sky-400 hover:underline"
                >
                  Edit SG
                </button>
              </div>
            )}
          </div>

          {/* PHD Tags & Correspondence Flow Comparison */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <ArrowRightLeft className="w-4 h-4 text-sky-400" />
              <span>PHD DCS Tags & Flow Comparison</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Level Tag (PHD)</span>
                <span className="text-sky-300 font-bold">{tank.tag_level || 'None'}</span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Temperature Tag (PHD)</span>
                <span className="text-sky-300 font-bold">{tank.tag_temp || 'None'}</span>
              </div>
            </div>

            {flowComparison.hasFlow ? (
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px]">Flow Meter Tag: </span>
                    <span className="font-mono font-bold text-sky-400">{flowComparison.flowTag}</span>
                    <span className="text-[10px] text-slate-500 ml-1.5">({flowComparison.flowUnit}, {flowComparison.flowDirection})</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    flowComparison.status === 'good'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  }`}>
                    {flowComparison.variancePct.toFixed(2)}% Discrepancy
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] font-mono pt-1 border-t border-slate-800">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Tank Strapping Movement</span>
                    <span className="text-white font-bold">{formatNum(Math.abs(deltaTon), 1)} Ton</span>
                    <span className="text-slate-400 block text-[10px]">({formatNum(Math.abs(balance.deltaBbl), 0)} bbl)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Flow Total Integrated</span>
                    <span className="text-white font-bold">{formatNum(flowComparison.flowTotalTon, 1)} Ton</span>
                    <span className="text-slate-400 block text-[10px]">({formatNum(flowComparison.flowTotalBbl, 0)} bbl)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Difference</span>
                    <span className={`font-bold ${Math.abs(flowComparison.diffTon) < 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {formatNum(flowComparison.diffTon, 1)} Ton
                    </span>
                    <span className="text-slate-400 block text-[10px]">({formatNum(flowComparison.diffBbl, 0)} bbl)</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 italic">
                No correspondence flow indicator currently mapped for this tank. Use "Configure Flow" to assign a tag from PHD.
              </p>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
