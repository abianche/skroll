import path from "node:path";
import type { RecentStore } from "./types";
import { getAppDataDir } from "./app-data";
import { readJsonFile, writeJsonFile } from "./json";

const RECENT_FILE = "recent.json";
const RECENT_LIMIT = 10;

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
