import React from 'react';
import { 
  Database, 
  RefreshCw, 
  Settings as SettingsIcon, 
  Calendar, 
  SlidersHorizontal,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Server
} from 'lucide-react';

export default function Header({
  selectedDate,
  onDateChange,
  isAutoPrevDay,
  onResetToPrevDay,
  onRefresh,
  loading,
  pbStatus,
  isSimulation,
  onOpenSettings,
  windowLabel
}) {
  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 lg:px-8 py-3.5 shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-600 via-sky-500 to-emerald-400 p-0.5 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Database className="w-5 h-5 text-sky-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                LOC II Tank Daily Balance
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30">
                  SPA
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <span>Pertamina Lube Oil Complex II</span>
              <span className="text-slate-600">•</span>
              <span>24h Strapping (00:00 - 24:00)</span>
            </p>
          </div>
        </div>

        {/* Operational Date Window Selector */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300">
            <Calendar className="w-4 h-4 text-sky-400" />
            <span className="font-medium hidden sm:inline">Operating Day:</span>
          </div>

          <input 
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 text-white text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all cursor-pointer font-mono"
          />

          <button
            onClick={onResetToPrevDay}
            title="Auto-select completed 24h operational day"
            className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              isAutoPrevDay 
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>Prev Day (00-24)</span>
            {isAutoPrevDay && <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />}
          </button>

          <span className="text-slate-700 hidden sm:inline">|</span>

          {/* Window badge */}
          <div className="text-[11px] font-mono text-slate-400 px-2 py-1 bg-slate-900/60 rounded border border-slate-800/60 hidden md:block">
            {windowLabel}
          </div>
        </div>

        {/* Action Controls & Statuses */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          {/* PocketBase status badge */}
          <div 
            title={pbStatus?.ok ? `PocketBase connected (${pbStatus.url})` : `PocketBase offline - using local storage cache`}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
              pbStatus?.ok 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">PB:</span>
            <span className="font-mono text-[11px]">{pbStatus?.ok ? 'Connected' : 'Local Cache'}</span>
          </div>

          {/* Simulation / Live Badge */}
          {isSimulation && (
            <div 
              title="Currently showing deterministic plant simulation data"
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300"
            >
              <Flame className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span className="text-[11px] font-medium hidden sm:inline">Sim Mode</span>
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 active:scale-95 text-white text-xs font-semibold shadow-md shadow-sky-600/30 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Fetching...' : 'Fetch 00-24'}</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            title="Configure PocketBase & PHD Connections"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
}
