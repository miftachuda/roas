import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  ArrowRightLeft, 
  Check, 
  Trash2, 
  Tag as TagIcon,
  HelpCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { phdTagCatalog } from '../data/phd_flow_tags';

export default function FlowMappingModal({
  isOpen,
  onClose,
  tank,
  currentMapping,
  onSaveMapping,
  onRemoveMapping
}) {
  if (!isOpen || !tank) return null;

  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState(currentMapping?.flowTag || '');
  const [flowUnit, setFlowUnit] = useState(currentMapping?.flowUnit || 'm3/h');
  const [flowDirection, setFlowDirection] = useState(currentMapping?.flowDirection || 'inflow');
  const [notes, setNotes] = useState(currentMapping?.notes || '');

  // Filter catalog
  const filteredTags = useMemo(() => {
    if (!search.trim()) {
      // Default to flow tags from catalog
      return phdTagCatalog.slice(0, 40);
    }
    const q = search.toLowerCase();
    return phdTagCatalog.filter(t => 
      t.tagname.toLowerCase().includes(q) || 
      (t.desc && t.desc.toLowerCase().includes(q))
    ).slice(0, 50);
  }, [search]);

  const handleSave = () => {
    if (!selectedTag.trim()) {
      alert('Please select or enter a PHD tag name.');
      return;
    }
    onSaveMapping(tank.id, {
      flowTag: selectedTag.trim(),
      flowUnit,
      flowDirection,
      notes: notes.trim()
    });
    onClose();
  };

  const handleRemove = () => {
    onRemoveMapping(tank.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Map Flow Indicator: <span className="text-sky-400 font-mono">{tank.tank}</span>
              </h2>
              <p className="text-xs text-slate-400">
                {tank.product} • Ø{(tank.dia_mm / 1000).toFixed(1)}m • SG {tank.sg}
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

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Selected Tag summary */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Active Correspondence Tag
            </label>
            <div className="flex items-center gap-2">
              <input 
                type="text"
                placeholder="e.g. 021FI_057.PV"
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 text-sm font-mono text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              {selectedTag && (
                <button
                  onClick={() => setSelectedTag('')}
                  className="px-2.5 py-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Unit & Direction Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Flow Unit */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Flow Rate / Totalizer Unit
              </label>
              <select
                value={flowUnit}
                onChange={(e) => setFlowUnit(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="m3/h">m³/h (Hourly rate × 24h)</option>
                <option value="ton/h">ton/h (Hourly rate × 24h)</option>
                <option value="T/D">T/D (Metric Tons per day)</option>
                <option value="bpd">bpd (Barrels per day)</option>
                <option value="m3">m³ (Totalizer cumulative)</option>
                <option value="ton">Ton (Totalizer cumulative)</option>
                <option value="bbl">Barrels (Totalizer cumulative)</option>
              </select>
            </div>

            {/* Expected Movement Direction */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Flow Direction
              </label>
              <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setFlowDirection('inflow')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all ${
                    flowDirection === 'inflow' 
                      ? 'bg-emerald-600 text-white font-bold' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Inflow (Receipt)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFlowDirection('outflow')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all ${
                    flowDirection === 'outflow' 
                      ? 'bg-amber-600 text-white font-bold' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5 text-amber-300" />
                  <span>Outflow (Feed)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Description / Transfer Note
            </label>
            <input
              type="text"
              placeholder="e.g. LMO Rundown from HVU-II C-101"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Searchable PHD Tag Library */}
          <div className="pt-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Select from PHD Tag Catalog (2,000+ Tags)
            </label>
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tag (021FI..., FQ..., Rundown, Residue)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl pl-8 pr-3 py-2 text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 border border-slate-800 rounded-xl p-1 bg-slate-950/60">
              {filteredTags.map((t) => (
                <div
                  key={t.tagname}
                  onClick={() => setSelectedTag(t.tagname)}
                  className={`p-2 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors ${
                    selectedTag === t.tagname
                      ? 'bg-sky-600/30 border border-sky-500/50 text-white'
                      : 'hover:bg-slate-800/80 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <TagIcon className="w-3 h-3 text-sky-400 shrink-0" />
                    <span className="font-mono font-bold text-sky-300">{t.tagname}</span>
                    <span className="text-[11px] text-slate-400 truncate max-w-[280px]">
                      {t.desc || 'No description'}
                    </span>
                  </div>
                  {selectedTag === t.tagname && (
                    <Check className="w-4 h-4 text-sky-400 shrink-0 ml-2" />
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          {currentMapping?.flowTag ? (
            <button
              onClick={handleRemove}
              className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Unmap Flow Tag</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-white px-3.5 py-2 rounded-xl hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-xl shadow-lg shadow-sky-600/30 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save & Sync to PocketBase</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
