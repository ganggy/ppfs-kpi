import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PPFS_INDICATORS, PPFSIndicator } from './ppfsIndicators.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SETTINGS_FILE = path.resolve(__dirname, './data/ppfsSettings.json');

export interface IndicatorConfig {
  indicatorId: string;
  code: string;
  title: string;
  shortName: string;
  category: string;
  enabled: boolean;
  disabledReason?: string;
  unitPrice: number;
  defaultUnitPrice: number;
  updatedAt?: string;
}

export type IndicatorSettingsMap = Record<string, IndicatorConfig>;

export class PPFSSettingsService {
  private static settingsCache: IndicatorSettingsMap | null = null;

  // Initialize or read settings from JSON file
  static getSettings(): IndicatorSettingsMap {
    if (this.settingsCache) {
      return this.settingsCache;
    }

    try {
      if (fs.existsSync(SETTINGS_FILE)) {
        const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Merge with existing indicators to ensure any newly added indicators are present
        const merged: IndicatorSettingsMap = {};
        for (const ind of PPFS_INDICATORS) {
          const existing = parsed[ind.id];
          merged[ind.id] = {
            indicatorId: ind.id,
            code: ind.code,
            title: ind.title,
            shortName: ind.shortName,
            category: ind.category,
            enabled: existing?.enabled !== undefined ? existing.enabled : true,
            disabledReason: existing?.disabledReason || (existing?.enabled === false ? 'โรงพยาบาลมีศักยภาพไม่เพียงพอ' : ''),
            unitPrice: typeof existing?.unitPrice === 'number' ? existing.unitPrice : ind.unitPrice,
            defaultUnitPrice: ind.unitPrice,
            updatedAt: existing?.updatedAt,
          };
        }
        this.settingsCache = merged;
        return merged;
      }
    } catch (err) {
      console.error('⚠️ [PPFS Settings] Error reading settings file, building default:', err);
    }

    // Default settings: all enabled with standard unit prices
    const defaults: IndicatorSettingsMap = {};
    for (const ind of PPFS_INDICATORS) {
      defaults[ind.id] = {
        indicatorId: ind.id,
        code: ind.code,
        title: ind.title,
        shortName: ind.shortName,
        category: ind.category,
        enabled: true,
        disabledReason: '',
        unitPrice: ind.unitPrice,
        defaultUnitPrice: ind.unitPrice,
      };
    }

    this.settingsCache = defaults;
    this.persistToFile(defaults);
    return defaults;
  }

  // Save new settings
  static saveSettings(newSettings: Record<string, Partial<IndicatorConfig>>): IndicatorSettingsMap {
    const current = this.getSettings();
    const updated: IndicatorSettingsMap = { ...current };
    const now = new Date().toISOString();

    for (const [id, patch] of Object.entries(newSettings)) {
      if (updated[id]) {
        updated[id] = {
          ...updated[id],
          enabled: patch.enabled !== undefined ? Boolean(patch.enabled) : updated[id].enabled,
          disabledReason: patch.disabledReason !== undefined ? patch.disabledReason : updated[id].disabledReason,
          unitPrice: typeof patch.unitPrice === 'number' && !isNaN(patch.unitPrice) && patch.unitPrice >= 0 
            ? patch.unitPrice 
            : updated[id].unitPrice,
          updatedAt: now,
        };
      }
    }

    this.settingsCache = updated;
    this.persistToFile(updated);
    return updated;
  }

  // Reset all to default NHSO rates and enabled
  static resetToDefaults(): IndicatorSettingsMap {
    const defaults: IndicatorSettingsMap = {};
    const now = new Date().toISOString();
    for (const ind of PPFS_INDICATORS) {
      defaults[ind.id] = {
        indicatorId: ind.id,
        code: ind.code,
        title: ind.title,
        shortName: ind.shortName,
        category: ind.category,
        enabled: true,
        disabledReason: '',
        unitPrice: ind.unitPrice,
        defaultUnitPrice: ind.unitPrice,
        updatedAt: now,
      };
    }
    this.settingsCache = defaults;
    this.persistToFile(defaults);
    return defaults;
  }

  // Get effective indicators array with updated prices and enabled states
  static getEffectiveIndicators(filterEnabledOnly: boolean = false): (PPFSIndicator & { enabled: boolean; disabledReason: string; defaultUnitPrice: number })[] {
    const settings = this.getSettings();
    const list = PPFS_INDICATORS.map((ind) => {
      const cfg = settings[ind.id];
      const isEnabled = cfg ? cfg.enabled : true;
      const effectivePrice = cfg && typeof cfg.unitPrice === 'number' ? cfg.unitPrice : ind.unitPrice;
      const reason = cfg?.disabledReason || '';
      return {
        ...ind,
        unitPrice: effectivePrice,
        enabled: isEnabled,
        disabledReason: reason,
        defaultUnitPrice: ind.unitPrice,
      };
    });

    if (filterEnabledOnly) {
      return list.filter((item) => item.enabled);
    }
    return list;
  }

  // Get a single indicator with effective price & enabled state
  static getEffectiveIndicatorById(id: string): (PPFSIndicator & { enabled: boolean; disabledReason: string; defaultUnitPrice: number }) | undefined {
    const list = this.getEffectiveIndicators(false);
    return list.find((item) => item.id === id);
  }

  // Write settings to disk
  private static persistToFile(data: IndicatorSettingsMap) {
    try {
      const dir = path.dirname(SETTINGS_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`💾 [PPFS Settings] Settings saved successfully to ${SETTINGS_FILE}`);
    } catch (err) {
      console.error('⚠️ [PPFS Settings] Failed to persist settings to disk:', err);
    }
  }
}
