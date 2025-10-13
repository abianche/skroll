import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

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
