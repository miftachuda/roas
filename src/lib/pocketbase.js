import PocketBase from 'pocketbase';

const STORAGE_KEY = 'loc2_tank_spa_settings';
export const DEFAULT_PB_URL = 'http://127.0.0.1:8090';
export const FALLBACK_PB_URL = 'https://data.miftachuda.my.id';
export const SETTINGS_COLLECTION = 'loc2_tank_settings';

// Default initial state
export const defaultSettings = {
  pbUrl: DEFAULT_PB_URL,
  phdUrl: 'https://phd.miftachuda.my.id/GetData',
  useDemoMode: false,
  activeSort: 'biggest_delta', // 'biggest_delta' | 'name' | 'custom' | 'positive_delta' | 'negative_delta'
  sortDirection: 'desc',
  customOrder: [], // array of tank raw names
  flowMappings: {
    // Sensible defaults for known LOC II tanks:
    '41T116': { flowTag: '021FI_057.PV', flowUnit: 'm3/h', flowDirection: 'inflow', notes: 'LMO Rundown to 41T-116' },
    '41T115': { flowTag: '021FI_058.PV', flowUnit: 'm3/h', flowDirection: 'inflow', notes: 'SPO Rundown to 41T-115' },
    '41T117': { flowTag: '021FI_008.PV', flowUnit: 'm3/h', flowDirection: 'inflow', notes: 'MMO Product to Storage' },
    '41T121': { flowTag: '021FI_002.PV', flowUnit: 'm3/h', flowDirection: 'inflow', notes: 'Short Residue to Storage' },
    '35T002': { flowTag: '021FI_004.PV', flowUnit: 'm3/h', flowDirection: 'outflow', notes: 'Long Residue Charge to HVU-II' },
    '43T001': { flowTag: '021FI_004.PV', flowUnit: 'm3/h', flowDirection: 'outflow', notes: 'Long Residue Charge to HVU-II' },
  },
  customSg: {}, // tankId -> custom SG
};

let pbClient = null;

export function getPbClient(url) {
  const targetUrl = url || getStoredSettings().pbUrl || DEFAULT_PB_URL;
  if (!pbClient || pbClient.baseUrl !== targetUrl) {
    pbClient = new PocketBase(targetUrl);
    pbClient.autoCancellation(false);
  }
  return pbClient;
}

export function getStoredSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultSettings, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to parse localStorage settings:', e);
  }
  return { ...defaultSettings };
}

export function saveLocalSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

/**
 * Check PocketBase health status
 */
export async function checkPocketBaseHealth(url) {
  try {
    const pb = getPbClient(url);
    const health = await pb.health.check();
    return { ok: true, data: health, url: pb.baseUrl };
  } catch (err) {
    return { ok: false, error: err.message, url };
  }
}

/**
 * Load settings from PocketBase with fallback to localStorage
 */
export async function loadTankSettingsFromPocketBase(pbUrl) {
  const local = getStoredSettings();
  const pb = getPbClient(pbUrl || local.pbUrl);

  try {
    const health = await pb.health.check();
    if (!health) throw new Error('PocketBase health check failed');

    // Attempt to query the settings record
    // Look for record with identifier 'loc2_master_config'
    const records = await pb.collection(SETTINGS_COLLECTION).getList(1, 1, {
      sort: '-updated',
    });

    if (records.items.length > 0) {
      const remoteData = records.items[0];
      const merged = {
        ...local,
        id: remoteData.id,
        customOrder: remoteData.custom_order || local.customOrder,
        flowMappings: remoteData.flow_mappings || local.flowMappings,
        customSg: remoteData.custom_sg || local.customSg,
        activeSort: remoteData.active_sort || local.activeSort,
        sortDirection: remoteData.sort_direction || local.sortDirection,
      };
      saveLocalSettings(merged);
      return { settings: merged, source: 'pocketbase', recordId: remoteData.id };
    } else {
      // Record doesn't exist yet, try to create it
      try {
        const created = await pb.collection(SETTINGS_COLLECTION).create({
          config_name: 'loc2_master_config',
          custom_order: local.customOrder,
          flow_mappings: local.flowMappings,
          custom_sg: local.customSg,
          active_sort: local.activeSort,
          sort_direction: local.sortDirection,
        });
        local.id = created.id;
        saveLocalSettings(local);
        return { settings: local, source: 'pocketbase_created', recordId: created.id };
      } catch (createErr) {
        console.warn('PocketBase collection might not exist yet:', createErr);
      }
    }
  } catch (err) {
    console.info('Using local settings cache (PocketBase offline):', err.message);
  }

  return { settings: local, source: 'local' };
}

/**
 * Persist settings to both localStorage and PocketBase
 */
export async function saveTankSettingsToPocketBase(newSettings) {
  // Always update local cache first for instant UI response
  saveLocalSettings(newSettings);

  const pb = getPbClient(newSettings.pbUrl);
  try {
    const payload = {
      config_name: 'loc2_master_config',
      custom_order: newSettings.customOrder,
      flow_mappings: newSettings.flowMappings,
      custom_sg: newSettings.customSg,
      active_sort: newSettings.activeSort,
      sort_direction: newSettings.sortDirection,
    };

    if (newSettings.id) {
      await pb.collection(SETTINGS_COLLECTION).update(newSettings.id, payload);
    } else {
      const records = await pb.collection(SETTINGS_COLLECTION).getList(1, 1);
      if (records.items.length > 0) {
        newSettings.id = records.items[0].id;
        await pb.collection(SETTINGS_COLLECTION).update(records.items[0].id, payload);
      } else {
        const created = await pb.collection(SETTINGS_COLLECTION).create(payload);
        newSettings.id = created.id;
      }
      saveLocalSettings(newSettings);
    }
    return { ok: true, source: 'pocketbase' };
  } catch (err) {
    console.warn('Could not sync to PocketBase, saved locally:', err.message);
    return { ok: false, error: err.message, source: 'local' };
  }
}
