import React, { useState } from 'react';
import { 
  X, 
  Server, 
  Database, 
  Flame, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  AlertCircle,
  Loader2,
  HardDrive
} from 'lucide-react';
import { checkPocketBaseHealth, DEFAULT_PB_URL, FALLBACK_PB_URL } from '../lib/pocketbase';

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetCustomOrder,
  onResetAllSettings
}) {
  if (!isOpen) return null;

  const [pbUrl, setPbUrl] = useState(settings.pbUrl || DEFAULT_PB_URL);
  const [phdUrl, setPhdUrl] = useState(settings.phdUrl || 'https://phd.miftachuda.my.id/GetData');
  const [useDemoMode, setUseDemoMode] = useState(Boolean(settings.useDemoMode));
  
  const [testingPb, setTestingPb] = useState(false);
  const [pbTestResult, setPbTestResult] = useState(null);

  const [testingPhd, setTestingPhd] = useState(false);
  const [phdTestResult, setPhdTestResult] = useState(null);

  const handleTestPocketBase = async () => {
    setTestingPb(true);
    setPbTestResult(null);
    try {
      const res = await checkPocketBaseHealth(pbUrl);
      setPbTestResult(res);
    } catch (err) {
      setPbTestResult({ ok: false, error: err.message });
    } finally {
      setTestingPb(false);
    }
  };

  const handleTestPhd = async () => {
    setTestingPhd(true);
    setPhdTestResult(null);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(phdUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{
          SampleInterval: 60000,
          TagName: ['41T101_P_LEVEL.PV'],
          StartTime: 'NOW-1H',
          EndTime: 'NOW'
        }]),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (res.ok) {
        setPhdTestResult({ ok: true, status: res.status });
      } else {
        setPhdTestResult({ ok: false, error: `HTTP ${res.status}` });
      }
    } catch (err) {
      setPhdTestResult({ ok: false, error: err.message });
    } finally {
      setTestingPhd(false);
    }
  };

  const handleSave = () => {
    onUpdateSettings({
      ...settings,
      pbUrl: pbUrl.trim(),
      phdUrl: phdUrl.trim(),
      useDemoMode
    });
    onClose();
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `loc2_tank_settings_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchor.click();
  };

  const handleImportJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        onUpdateSettings(parsed);
        alert('Settings successfully imported!');
        onClose();
      } catch (err) {
        alert('Failed to parse JSON file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Application Settings & Persistence
              </h2>
              <p className="text-xs text-slate-400">
                Manage PocketBase database, PHD endpoint, and demo mode
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

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          
          {/* PocketBase Configuration */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-400" />
                PocketBase Server URL
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPbUrl(DEFAULT_PB_URL)}
                  className="text-[10px] text-sky-400 hover:underline"
                >
                  Use Local (8090)
                </button>
                <span className="text-slate-600">|</span>
                <button
                  type="button"
                  onClick={() => setPbUrl(FALLBACK_PB_URL)}
                  className="text-[10px] text-sky-400 hover:underline"
                >
                  Use Cloud
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={pbUrl}
                onChange={(e) => setPbUrl(e.target.value)}
                placeholder="http://127.0.0.1:8090"
                className="flex-1 bg-slate-900 border border-slate-700 font-mono text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleTestPocketBase}
                disabled={testingPb}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                {testingPb && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>Test</span>
              </button>
            </div>

            {pbTestResult && (
              <div className={`p-2.5 rounded-xl border text-[11px] flex items-center gap-2 ${
                pbTestResult.ok 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}>
                {pbTestResult.ok ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Connected to PocketBase successfully! Collections will sync.</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Could not connect: {pbTestResult.error}. App will use localStorage cache.</span>
                  </>
                )}
              </div>
            )}

            <p className="text-[11px] text-slate-400">
              Stores flow mappings, custom order, and user preferences. Can run locally via <code className="bg-slate-900 px-1 py-0.5 rounded text-sky-300 font-mono">pocketbase.exe serve</code> or connect to network PocketBase.
            </p>
          </div>

          {/* PHD Server Configuration */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-sky-400" />
                PHD Server Endpoint URL
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPhdUrl('http://localhost:5232/GetData/')}
                  className="text-[10px] text-sky-400 hover:underline"
                >
                  Use Local (5232)
                </button>
                <span className="text-slate-600">|</span>
                <button
                  type="button"
                  onClick={() => setPhdUrl('https://phd.miftachuda.my.id/GetData')}
                  className="text-[10px] text-sky-400 hover:underline"
                >
                  Use Web Gateway
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={phdUrl}
                onChange={(e) => setPhdUrl(e.target.value)}
                placeholder="https://phd.miftachuda.my.id/GetData"
                className="flex-1 bg-slate-900 border border-slate-700 font-mono text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleTestPhd}
                disabled={testingPhd}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                {testingPhd && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>Test</span>
              </button>
            </div>

            {phdTestResult && (
              <div className={`p-2.5 rounded-xl border text-[11px] flex items-center gap-2 ${
                phdTestResult.ok 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}>
                {phdTestResult.ok ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>PHD Endpoint responded successfully!</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Connection failed: {phdTestResult.error}. (Tip: enable Demo Mode for testing).</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Plant Demo / Simulation Mode */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5 pr-4">
              <div className="font-bold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-indigo-400" />
                <span>Deterministic Plant Simulation Mode</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Generates realistic DCS 00:00 to 24:00 strapping numbers and flow rates for all LOC II 41T-1xx tanks when off-site or disconnected from DCS network.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input 
                type="checkbox" 
                checked={useDemoMode} 
                onChange={(e) => setUseDemoMode(e.target.checked)} 
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Backup / Export / Import Settings */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block">
              Backup & Settings Transfer
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportJson}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>Export JSON</span>
              </button>

              <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium flex items-center gap-1.5 transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Import JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJson}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={onResetCustomOrder}
                className="px-3 py-2 bg-slate-800/80 hover:bg-slate-800 text-slate-300 rounded-xl font-medium flex items-center gap-1.5 transition-colors ml-auto"
              >
                <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
                <span>Reset Custom Sort</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onResetAllSettings}
            className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-2 rounded-xl transition-colors"
          >
            Reset All to Default
          </button>

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
              <span>Save & Apply Settings</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
