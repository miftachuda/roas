import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import MetricsOverview from './components/MetricsOverview';
import SortControls from './components/SortControls';
import TankTable from './components/TankTable';
import TankCardView from './components/TankCardView';
import FlowMappingModal from './components/FlowMappingModal';
import SettingsModal from './components/SettingsModal';
import TankDetailModal from './components/TankDetailModal';

import { loc2TanksMaster } from './data/loc2_tanks_master';
import { getInitialOperationalDate, parseOperationalDayRange } from './utils/dateUtils';
import { computeTankDailyBalance, computeFlowComparison } from './utils/tankCalculations';
import { 
  getStoredSettings, 
  loadTankSettingsFromPocketBase, 
  saveTankSettingsToPocketBase, 
  checkPocketBaseHealth,
  defaultSettings
} from './lib/pocketbase';
import { fetchPhdOperationalData } from './services/phdService';

export default function App() {
  // 1. Operational Day Window (00:00 to 24:00)
  // Rule: "if time fetch is not yet 24 use prev day"
  const [selectedDate, setSelectedDate] = useState(() => getInitialOperationalDate());
  const isAutoPrevDay = selectedDate === getInitialOperationalDate();

  // 2. Settings & PocketBase State
  const [settings, setSettings] = useState(() => getStoredSettings());
  const [pbStatus, setPbStatus] = useState({ ok: false, url: settings.pbUrl });

  // 3. UI Filters & Preferences
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all'); // all, active, receipts, dispatches, with_flow, critical
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [unitPreference, setUnitPreference] = useState('ton'); // 'ton' | 'bbl' | 'm3'
  const [activeSort, setActiveSort] = useState(settings.activeSort || 'biggest_delta');
  const [sortDirection, setSortDirection] = useState(settings.sortDirection || 'desc');
  const [customOrder, setCustomOrder] = useState(settings.customOrder || []);

  // 4. Raw Fetched Plant Data
  const [plantData, setPlantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorNotice, setErrorNotice] = useState(null);

  // 5. Modals
  const [flowModalTank, setFlowModalTank] = useState(null);
  const [detailModalItem, setDetailModalItem] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Load Settings from PocketBase on initial mount
  useEffect(() => {
    let isMounted = true;

    async function initSettings() {
      // Health check first
      const health = await checkPocketBaseHealth(settings.pbUrl);
      if (isMounted) setPbStatus(health);

      // Load remote settings if available
      const result = await loadTankSettingsFromPocketBase(settings.pbUrl);
      if (isMounted && result?.settings) {
        setSettings(result.settings);
        if (result.settings.activeSort) setActiveSort(result.settings.activeSort);
        if (result.settings.sortDirection) setSortDirection(result.settings.sortDirection);
        if (result.settings.customOrder?.length) setCustomOrder(result.settings.customOrder);
      }
    }

    initSettings();
    return () => { isMounted = false; };
  }, []);

  // Fetch 24-hour Tank Data from PHD whenever date or settings change
  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorNotice(null);
    try {
      const data = await fetchPhdOperationalData(
        selectedDate,
        loc2TanksMaster,
        settings.flowMappings,
        settings.phdUrl,
        settings.useDemoMode
      );
      setPlantData(data);
      if (data.errorNotice) {
        setErrorNotice(data.errorNotice);
      }
    } catch (err) {
      console.error('Fetch failed:', err);
      setErrorNotice(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, settings.flowMappings, settings.phdUrl, settings.useDemoMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Compute calculated balances and flow comparisons for all 67 LOC II tanks
  const allTankBalances = useMemo(() => {
    if (!plantData?.tanks) return [];

    return loc2TanksMaster.map((tank) => {
      const raw = plantData.tanks[tank.id] || {
        startLevel: tank.min_level || 1000,
        endLevel: tank.min_level || 1000,
        startTemp: 35.0,
        endTemp: 35.0
      };

      const customSg = settings.customSg?.[tank.id];
      const balance = computeTankDailyBalance(
        tank,
        raw.startLevel,
        raw.endLevel,
        raw.startTemp,
        raw.endTemp,
        customSg
      );

      const mapping = settings.flowMappings?.[tank.id];
      const flowData = mapping?.flowTag ? plantData.flows?.[mapping.flowTag] : null;
      const flowComparison = computeFlowComparison(flowData, balance, mapping);

      return {
        tank,
        balance,
        flowComparison
      };
    });
  }, [plantData, settings.customSg, settings.flowMappings]);

  // Handle Sort Change & Persistence
  const handleSortChange = (newSort) => {
    setActiveSort(newSort);
    // If switching to positive_delta or negative_delta or biggest_delta, default to desc
    let newDir = sortDirection;
    if (newSort === 'biggest_delta' || newSort === 'positive_delta') newDir = 'desc';
    if (newSort === 'negative_delta') newDir = 'asc'; // most negative first
    setSortDirection(newDir);

    const updated = {
      ...settings,
      activeSort: newSort,
      sortDirection: newDir
    };
    setSettings(updated);
    saveTankSettingsToPocketBase(updated);
  };

  const handleToggleDirection = () => {
    const nextDir = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(nextDir);
    const updated = {
      ...settings,
      sortDirection: nextDir
    };
    setSettings(updated);
    saveTankSettingsToPocketBase(updated);
  };

  // Reorder tanks in Custom Sort Mode
  const handleMoveTankOrder = (index, direction) => {
    // Current visible order or fallback to existing customOrder
    const currentOrderIds = customOrder.length === loc2TanksMaster.length
      ? [...customOrder]
      : allTankBalances.map(item => item.tank.id);

    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= currentOrderIds.length) return;

    // Swap
    const temp = currentOrderIds[index];
    currentOrderIds[index] = currentOrderIds[targetIndex];
    currentOrderIds[targetIndex] = temp;

    setCustomOrder(currentOrderIds);
    const updated = {
      ...settings,
      customOrder: currentOrderIds,
      activeSort: 'custom'
    };
    setSettings(updated);
    saveTankSettingsToPocketBase(updated);
  };

  // Reset custom sort order
  const handleResetCustomOrder = () => {
    const naturalIds = [...loc2TanksMaster].map(t => t.id);
    setCustomOrder(naturalIds);
    const updated = { ...settings, customOrder: naturalIds };
    setSettings(updated);
    saveTankSettingsToPocketBase(updated);
  };

  // Flow mapping update
  const handleSaveFlowMapping = (tankId, mapping) => {
    const updatedMappings = {
      ...settings.flowMappings,
      [tankId]: mapping
    };
    const updated = {
      ...settings,
      flowMappings: updatedMappings
    };
    setSettings(updated);
    saveTankSettingsToPocketBase(updated);
  };

  const handleRemoveFlowMapping = (tankId) => {
    const updatedMappings = { ...settings.flowMappings };
    delete updatedMappings[tankId];
    const updated = {
      ...settings,
      flowMappings: updatedMappings
    };
    setSettings(updated);
    saveTankSettingsToPocketBase(updated);
  };

  // Custom SG update
  const handleSaveCustomSg = (tankId, sgValue) => {
    const updatedSg = {
      ...settings.customSg,
      [tankId]: sgValue
    };
    const updated = {
      ...settings,
      customSg: updatedSg
    };
    setSettings(updated);
    saveTankSettingsToPocketBase(updated);
  };

  // Reset all settings
  const handleResetAllSettings = () => {
    if (window.confirm('Reset all tank mappings and sort settings to initial defaults?')) {
      setSettings(defaultSettings);
      setActiveSort(defaultSettings.activeSort);
      setCustomOrder([]);
      saveTankSettingsToPocketBase(defaultSettings);
    }
  };

  // Sorting & Filtering Pipeline
  const displayedTanks = useMemo(() => {
    let result = [...allTankBalances];

    // 1. Text Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(item => 
        item.tank.tank.toLowerCase().includes(q) ||
        item.tank.raw_name.toLowerCase().includes(q) ||
        item.tank.product.toLowerCase().includes(q) ||
        (item.flowComparison.flowTag && item.flowComparison.flowTag.toLowerCase().includes(q))
      );
    }

    // 2. Category Tab Filter
    if (filterCategory === 'active') {
      result = result.filter(item => Math.abs(item.balance.deltaTonnage) >= 10);
    } else if (filterCategory === 'receipts') {
      result = result.filter(item => item.balance.deltaTonnage > 5);
    } else if (filterCategory === 'dispatches') {
      result = result.filter(item => item.balance.deltaTonnage < -5);
    } else if (filterCategory === 'with_flow') {
      result = result.filter(item => item.flowComparison.hasFlow);
    } else if (filterCategory === 'critical') {
      result = result.filter(item => item.flowComparison.hasFlow && item.flowComparison.status !== 'good');
    }

    // 3. Sorting Mechanism
    if (activeSort === 'custom') {
      const orderMap = new Map();
      customOrder.forEach((id, idx) => orderMap.set(id, idx));
      result.sort((a, b) => {
        const orderA = orderMap.has(a.tank.id) ? orderMap.get(a.tank.id) : 9999;
        const orderB = orderMap.has(b.tank.id) ? orderMap.get(b.tank.id) : 9999;
        return orderA - orderB;
      });
    } else if (activeSort === 'biggest_delta') {
      // Sort by absolute delta tonnage
      result.sort((a, b) => {
        const diff = Math.abs(b.balance.deltaTonnage) - Math.abs(a.balance.deltaTonnage);
        return sortDirection === 'desc' ? diff : -diff;
      });
    } else if (activeSort === 'positive_delta') {
      // Highest positive delta first
      result.sort((a, b) => {
        const diff = b.balance.deltaTonnage - a.balance.deltaTonnage;
        return sortDirection === 'desc' ? diff : -diff;
      });
    } else if (activeSort === 'negative_delta') {
      // Highest negative delta (most negative) first
      result.sort((a, b) => {
        const diff = a.balance.deltaTonnage - b.balance.deltaTonnage;
        return sortDirection === 'asc' ? diff : -diff;
      });
    } else if (activeSort === 'name') {
      // Natural alphanumeric tank name sort
      result.sort((a, b) => {
        const comp = a.tank.tank.localeCompare(b.tank.tank, undefined, { numeric: true, sensitivity: 'base' });
        return sortDirection === 'asc' ? comp : -comp;
      });
    }

    return result;
  }, [allTankBalances, searchQuery, filterCategory, activeSort, sortDirection, customOrder]);

  const rangeInfo = parseOperationalDayRange(selectedDate);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      
      {/* App Header */}
      <Header
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        isAutoPrevDay={isAutoPrevDay}
        onResetToPrevDay={() => setSelectedDate(getInitialOperationalDate())}
        onRefresh={fetchData}
        loading={loading}
        pbStatus={pbStatus}
        isSimulation={plantData?.isSimulation}
        onOpenSettings={() => setSettingsOpen(true)}
        windowLabel={rangeInfo.windowLabel}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        
        {/* Notice Banner (if any) */}
        {errorNotice && (
          <div className="mb-5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="font-semibold">Notice:</span> {errorNotice}
            </span>
            <button 
              onClick={() => setErrorNotice(null)}
              className="text-amber-400 hover:text-white font-bold ml-3"
            >
              ✕
            </button>
          </div>
        )}

        {/* 1. Metrics & Inventory Summary */}
        <MetricsOverview
          tankBalances={allTankBalances}
          flowComparisons={allTankBalances.map(t => t.flowComparison)}
        />

        {/* 2. Sorting & Filtering Controls */}
        <SortControls
          activeSort={activeSort}
          onSortChange={handleSortChange}
          sortDirection={sortDirection}
          onToggleDirection={handleToggleDirection}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterCategory={filterCategory}
          onFilterChange={setFilterCategory}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          unitPreference={unitPreference}
          onUnitPreferenceChange={setUnitPreference}
          isCustomSorting={activeSort === 'custom'}
        />

        {/* 3. Main Data View (Table or Grid) */}
        {viewMode === 'table' ? (
          <TankTable
            tanks={displayedTanks}
            unitPreference={unitPreference}
            onOpenFlowModal={(tank) => setFlowModalTank(tank)}
            onOpenTankDetail={(tank, balance, flowComparison) => setDetailModalItem({ tank, balance, flowComparison })}
            isCustomSorting={activeSort === 'custom'}
            onMoveTankOrder={handleMoveTankOrder}
          />
        ) : (
          <TankCardView
            tanks={displayedTanks}
            unitPreference={unitPreference}
            onOpenFlowModal={(tank) => setFlowModalTank(tank)}
            onOpenTankDetail={(tank, balance, flowComparison) => setDetailModalItem({ tank, balance, flowComparison })}
            isCustomSorting={activeSort === 'custom'}
            onMoveTankOrder={handleMoveTankOrder}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        <p>Pertamina Refinery LOC II Inventory & Flow Sync • Config & Mappings Persisted via PocketBase</p>
      </footer>

      {/* Modals */}
      {flowModalTank && (
        <FlowMappingModal
          isOpen={Boolean(flowModalTank)}
          onClose={() => setFlowModalTank(null)}
          tank={flowModalTank}
          currentMapping={settings.flowMappings?.[flowModalTank.id]}
          onSaveMapping={handleSaveFlowMapping}
          onRemoveMapping={handleRemoveFlowMapping}
        />
      )}

      {detailModalItem && (
        <TankDetailModal
          isOpen={Boolean(detailModalItem)}
          onClose={() => setDetailModalItem(null)}
          tank={detailModalItem.tank}
          balance={detailModalItem.balance}
          flowComparison={detailModalItem.flowComparison}
          onSaveCustomSg={handleSaveCustomSg}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          settings={settings}
          onUpdateSettings={(newSettings) => {
            setSettings(newSettings);
            saveTankSettingsToPocketBase(newSettings);
          }}
          onResetCustomOrder={handleResetCustomOrder}
          onResetAllSettings={handleResetAllSettings}
        />
      )}

    </div>
  );
}
