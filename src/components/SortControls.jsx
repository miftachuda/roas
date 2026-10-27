import React from 'react';
import { 
  ArrowUpDown, 
  Search, 
  ArrowUpNarrowWide, 
  ArrowDownWideNarrow, 
  MoveVertical, 
  GripVertical,
  LayoutGrid, 
  Table as TableIcon,
  CheckCircle2,
  Filter
} from 'lucide-react';

export default function SortControls({
  activeSort,
  onSortChange,
  sortDirection,
  onToggleDirection,
  searchQuery,
  onSearchChange,
  filterCategory,
  onFilterChange,
  viewMode,
  onViewModeChange,
  unitPreference,
  onUnitPreferenceChange,
  isCustomSorting
}) {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 mb-6 shadow-md backdrop-blur-sm">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search tank (41T-101) or product (HVI, LMO, Slop)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 text-xs rounded-xl pl-9 pr-3.5 py-2.5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              ×
            </button>
          )}
        </div>

        {/* Primary Sort Mechanisms */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-sky-400" />
            Sort:
          </span>

          {/* Biggest Delta (Absolute) */}
          <button
            onClick={() => onSortChange('biggest_delta')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeSort === 'biggest_delta'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span>Biggest Δ</span>
            <span className="text-[10px] opacity-75">(Absolute)</span>
          </button>

          {/* Biggest Receipts (+) */}
          <button
            onClick={() => onSortChange('positive_delta')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeSort === 'positive_delta'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            + Receipts (In)
          </button>

          {/* Biggest Dispatches (-) */}
          <button
            onClick={() => onSortChange('negative_delta')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeSort === 'negative_delta'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            - Dispatches (Out)
          </button>

          {/* Tank Name */}
          <button
            onClick={() => onSortChange('name')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeSort === 'name'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Tank Name
          </button>

          {/* Custom Sorting */}
          <button
            onClick={() => onSortChange('custom')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeSort === 'custom'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-slate-800/80 text-purple-300 hover:bg-slate-800 hover:text-white border border-purple-500/20'
            }`}
          >
            <GripVertical className="w-3.5 h-3.5" />
            <span>Custom Sort</span>
            {activeSort === 'custom' && <span className="text-[10px] bg-purple-700/80 px-1 rounded">Reorderable</span>}
          </button>

          {/* Direction toggle button (for standard sorts) */}
          {activeSort !== 'custom' && (
            <button
              onClick={onToggleDirection}
              title={`Switch order (${sortDirection.toUpperCase()})`}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            >
              {sortDirection === 'asc' ? (
                <ArrowUpNarrowWide className="w-4 h-4 text-sky-400" />
              ) : (
                <ArrowDownWideNarrow className="w-4 h-4 text-sky-400" />
              )}
            </button>
          )}
        </div>

        {/* View Mode & Unit Controls */}
        <div className="flex items-center gap-2.5 self-end lg:self-auto">
          {/* Unit selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onUnitPreferenceChange('ton')}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                unitPreference === 'ton' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              TON
            </button>
            <button
              onClick={() => onUnitPreferenceChange('bbl')}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                unitPreference === 'bbl' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              BBL
            </button>
            <button
              onClick={() => onUnitPreferenceChange('m3')}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                unitPreference === 'm3' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              m³
            </button>
          </div>

          {/* View toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onViewModeChange('table')}
              title="Table view"
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('grid')}
              title="Card view"
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Filter Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs">
        <span className="text-[11px] uppercase tracking-wider text-slate-500 flex items-center gap-1 font-semibold">
          <Filter className="w-3 h-3" />
          Filter:
        </span>
        {[
          { id: 'all', label: 'All 67 Tanks' },
          { id: 'active', label: 'Active Movements (|Δ| > 10T)' },
          { id: 'receipts', label: 'Receipts (+)' },
          { id: 'dispatches', label: 'Dispatches (-)' },
          { id: 'with_flow', label: 'Mapped Flow Indicators' },
          { id: 'critical', label: 'Flow Discrepancy (>3%)' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => onFilterChange(f.id)}
            className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
              filterCategory === f.id
                ? 'bg-slate-800 text-sky-400 border border-sky-500/30 font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {f.label}
          </button>
        ))}

        {isCustomSorting && (
          <div className="ml-auto text-xs text-purple-300 bg-purple-950/40 border border-purple-800/40 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
            <span>Custom Sorting Active: use ▲ / ▼ buttons to arrange priority</span>
          </div>
        )}
      </div>
    </div>
  );
}
