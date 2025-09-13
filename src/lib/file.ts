import { open, save as saveDialog, message, confirm } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile, exists } from '@tauri-apps/plugin-fs';

export async function pickOpenJson(): Promise<string | null> {
  const picked = await open({
    multiple: false,
    directory: false,
    filters: [{ name: 'JSON', extensions: ['json'] }],
  });
  if (typeof picked === 'string') return picked;
  return null;
}

export async function pickSaveJson(suggestedName = 'story.json'): Promise<string | null> {
  const path = await saveDialog({
    defaultPath: suggestedName,
    filters: [{ name: 'JSON', extensions: ['json'] }],
  });
  return path ?? null;
}

export async function readFile(path: string): Promise<string> {
  return await readTextFile(path);
}

export async function writeFile(path: string, content: string): Promise<void> {
  await writeTextFile(path, content);
}

export async function fileExists(path: string): Promise<boolean> {
  return await exists(path);
}

export async function confirmDiscardChanges(): Promise<boolean> {
  return await confirm('You have unsaved changes. Discard them?', {
    kind: 'warning',
    okLabel: 'Discard',
  });
}

export async function showError(err: unknown) {
  await message(err?.toString?.() ?? String(err), { kind: 'error', title: 'Error' });
}
