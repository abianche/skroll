type ElectronProcess = NodeJS.Process & {
  type?: "browser" | "renderer" | "worker";
};

export function isElectronMainProcess(): boolean {
  if (typeof process === "undefined") {
    return false;
  }

  const electronProcess = process as ElectronProcess;
  return Boolean(electronProcess.versions?.electron) && electronProcess.type === "browser";
}
