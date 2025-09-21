import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

type RecentStore = {
  files: string[];
};

const RECENT_FILE = "recent.json";
const RECENT_LIMIT = 10;

function resolveAppDataBase(): string {
  if (process.platform === "win32") {
    return process.env.APPDATA ?? path.join(os.homedir(), "AppData", "Roaming");
  }
  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support");
  }
  return path.join(os.homedir(), ".config");
}

export async function getAppDataDir(appName = "Skroll"): Promise<string> {
  const base = resolveAppDataBase();
  const target = path.join(base, appName);
  await fs.mkdir(target, { recursive: true });
  return target;
}

export async function readJsonFile<T>(filePath: string): Promise<T> {
  const contents = await fs.readFile(filePath, "utf-8");
  return JSON.parse(contents) as T;
}

export async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function normalizeRecentList(entries: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const entry of entries) {
    const normalized = path.resolve(entry);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      output.push(normalized);
    }
    if (output.length >= RECENT_LIMIT) {
      break;
    }
  }
  return output;
}

async function readRecentStore(dir: string): Promise<RecentStore> {
  try {
    const data = await readJsonFile<RecentStore>(path.join(dir, RECENT_FILE));
    if (Array.isArray(data.files)) {
      return { files: normalizeRecentList(data.files) };
    }
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== "ENOENT") {
      throw error;
    }
  }
  return { files: [] };
}

export async function addRecent(filePath: string): Promise<void> {
  const dir = await getAppDataDir();
  const store = await readRecentStore(dir);
  const normalized = normalizeRecentList([filePath, ...store.files]);
  const next: RecentStore = { files: normalized.slice(0, RECENT_LIMIT) };
  await writeJsonFile(path.join(dir, RECENT_FILE), next);
}

export async function listRecent(): Promise<string[]> {
  const dir = await getAppDataDir();
  const store = await readRecentStore(dir);
  return store.files;
}
