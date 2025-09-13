import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppConfig, RecentEntry } from '../lib/config';
import {
  loadConfig as loadRawConfig,
  saveConfig as saveRawConfig,
  updateMRU as updateRawMRU,
} from '../lib/config';

export function useConfigState() {
  const [config, setConfig] = useState<AppConfig>({ autosave: false, recentFiles: [] });
  const configRef = useRef<AppConfig>(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const loadConfig = useCallback(async () => {
    const cfg = await loadRawConfig();
    setConfig(cfg);
    return cfg;
  }, []);

  const saveConfig = useCallback(async (next?: AppConfig) => {
    const cfg = next ?? configRef.current;
    await saveRawConfig(cfg);
  }, []);

  const updateMRU = useCallback((path: string): RecentEntry[] => {
    const next = updateRawMRU(configRef.current.recentFiles, path);
    setConfig({ ...configRef.current, lastFile: path, recentFiles: next });
    return next;
  }, []);

  return { config, setConfig, configRef, loadConfig, saveConfig, updateMRU };
}
