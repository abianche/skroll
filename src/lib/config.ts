import { appConfigDir, join } from '@tauri-apps/api/path';
import { exists, readTextFile, writeTextFile, mkdir } from '@tauri-apps/plugin-fs';

export type RecentEntry = { path: string; lastOpenedAt: number };
export type AppConfig = {
  autosave: boolean;
  recentFiles: RecentEntry[];
  lastFile?: string;
};

const CONFIG_FILE = 'config.json';

async function ensureConfigDir(): Promise<string> {
  const dir = await appConfigDir();
  // Ensure the directory exists (BaseDirectory is not used for absolute path)
  await mkdir(dir, { recursive: true });
  return dir;
}

async function configPath(): Promise<string> {
  const dir = await ensureConfigDir();
  return await join(dir, CONFIG_FILE);
}

export async function loadConfig(): Promise<AppConfig> {
  try {
    const path = await configPath();
    if (!(await exists(path))) {
      return { autosave: false, recentFiles: [] };
    }
    const txt = await readTextFile(path);
    const parsed = JSON.parse(txt) as Partial<AppConfig>;
    return {
      autosave: !!parsed.autosave,
      recentFiles: Array.isArray(parsed.recentFiles) ? (parsed.recentFiles as RecentEntry[]) : [],
      lastFile: parsed.lastFile,
    };
  } catch {
    return { autosave: false, recentFiles: [] };
  }
}

export async function saveConfig(cfg: AppConfig): Promise<void> {
  const path = await configPath();
  const ordered: AppConfig = {
    autosave: !!cfg.autosave,
    recentFiles: (cfg.recentFiles || [])
      .filter((e) => !!e && typeof e.path === 'string')
      .slice(0, 10),
    lastFile: cfg.lastFile,
  };
  await writeTextFile(path, JSON.stringify(ordered, null, 2));
}

export function updateMRU(list: RecentEntry[], filePath: string): RecentEntry[] {
  const now = Date.now();
  const deduped = list.filter((e) => e.path !== filePath);
  deduped.unshift({ path: filePath, lastOpenedAt: now });
  return deduped.slice(0, 10);
}
