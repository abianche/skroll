import { useEffect, useRef, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Flex } from '@mantine/core';
import {
  pickOpenJson,
  pickSaveJson,
  readFile,
  writeFile,
  fileExists,
  confirmDiscardChanges,
  showError,
} from './lib/file';
import { useConfigState } from './hooks/useConfigState';
import { useStory } from './hooks/useStory';
import { useAppMenu } from './menu/useAppMenu';
import { EditorPane } from './components/EditorPane';
import { PlayerPane } from './components/PlayerPane';
import { SAMPLE } from './defaultStory';
import type { NodeView } from './types';

const appWindow = getCurrentWindow();

function App() {
  const [editor, setEditor] = useState<string>(SAMPLE);
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [autosave, setAutosave] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  const autosaveTimer = useRef<number | null>(null);
  const isDirtyRef = useRef<boolean>(false);
  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  const { config, setConfig, configRef, loadConfig, saveConfig, updateMRU } = useConfigState();
  const { node, choices, diagnostics, error, loadFromContent, validateOnly, choose, reset } =
    useStory();

  async function load() {
    const ok = await loadFromContent(editor);
    if (ok) setIsDirty(false);
  }

  // Auto-load sample on first run for convenience
  useEffect(() => {
    (async () => {
      // Load config and optionally reopen last file
      const cfg = await loadConfig();
      setConfig(cfg);
      setAutosave(!!cfg.autosave);
      if (cfg.lastFile && (await fileExists(cfg.lastFile))) {
        try {
          const content = await readFile(cfg.lastFile);
          setEditor(content);
          setCurrentFilePath(cfg.lastFile);
          await load();
        } catch {
          // If reopening fails, ignore and keep sample
        }
      } else {
        await load();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Application menu
  const menu = useAppMenu(autosave, {
    onOpen: async () => {
      try {
        if (isDirtyRef.current) {
          const discard = await confirmDiscardChanges();
          if (!discard) return;
        }
        const path = await pickOpenJson();
        if (!path) return;
        const content = await readFile(path);
        setEditor(content);
        setCurrentFilePath(path);
        await load();
        const nextList = updateMRU(path);
        await saveConfig();
        await menu.rebuildRecent(nextList, handleOpenRecent, handleClearRecent);
      } catch (e) {
        await showError(e);
      }
    },
    onSave: async () => {
      await handleSave();
    },
    onSaveAs: async () => {
      await handleSaveAs();
    },
    onReset: async () => {
      await reset();
    },
    onToggleAutosave: async (next) => {
      setAutosave(next);
      const nextCfg = { ...configRef.current, autosave: next };
      setConfig(nextCfg);
      await saveConfig();
    },
  });

  async function handleOpenRecent(path: string) {
    try {
      if (isDirtyRef.current) {
        const discard = await confirmDiscardChanges();
        if (!discard) return;
      }
      if (!(await fileExists(path))) {
        const pruned = configRef.current.recentFiles.filter((e) => e.path !== path);
        setConfig({ ...configRef.current, recentFiles: pruned });
        await saveConfig();
        await menu.rebuildRecent(pruned, handleOpenRecent, handleClearRecent);
        return;
      }
      const text = await readFile(path);
      setEditor(text);
      setCurrentFilePath(path);
      await load();
      const nextList = updateMRU(path);
      await saveConfig();
      await menu.rebuildRecent(nextList, handleOpenRecent, handleClearRecent);
    } catch (e) {
      await showError(e);
    }
  }

  async function handleClearRecent() {
    const empty: typeof config.recentFiles = [];
    setConfig({ ...configRef.current, recentFiles: empty });
    await saveConfig();
    await menu.rebuildRecent(empty, handleOpenRecent, handleClearRecent);
  }

  // Keep Recent Files menu in sync with config changes
  useEffect(() => {
    (async () => {
      await menu.rebuildRecent(config.recentFiles, handleOpenRecent, handleClearRecent);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.recentFiles]);

  // Handle window close: prompt to save if dirty
  useEffect(() => {
    const unlisten = appWindow.onCloseRequested(async (event) => {
      if (!isDirty) return;
      event.preventDefault();
      const discard = await confirmDiscardChanges();
      if (discard) await appWindow.close();
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, [isDirty]);

  async function handleSave(): Promise<void> {
    try {
      const path = currentFilePath ?? (await pickSaveJson('story.json'));
      if (!path) return;
      await writeFile(path, prettyOrRaw(editor));
      setCurrentFilePath(path);
      setIsDirty(false);
      const nextList = updateMRU(path);
      await saveConfig();
      await menu.rebuildRecent(nextList, handleOpenRecent, handleClearRecent);
    } catch (e) {
      await showError(e);
    }
  }

  async function handleSaveAs(): Promise<void> {
    try {
      const path = await pickSaveJson('story.json');
      if (!path) return;
      await writeFile(path, prettyOrRaw(editor));
      setCurrentFilePath(path);
      setIsDirty(false);
      const nextList = updateMRU(path);
      await saveConfig();
      await menu.rebuildRecent(nextList, handleOpenRecent, handleClearRecent);
    } catch (e) {
      await showError(e);
    }
  }

  // Debounced autosave
  useEffect(() => {
    if (!autosave || !currentFilePath) return;
    if (!isDirty) return;
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(() => {
      handleSave();
    }, 1200);
    return () => {
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, autosave, currentFilePath, isDirty]);

  function prettyOrRaw(json: string): string {
    try {
      return JSON.stringify(JSON.parse(json), null, 2);
    } catch {
      return json;
    }
  }

  return (
    <Flex gap="md" align="stretch" justify="flex-start" p="10vh">
      <EditorPane
        editor={editor}
        onChange={(val) => {
          setEditor(val);
          setIsDirty(true);
        }}
        onLoadClick={load}
        onValidateClick={() => validateOnly(editor)}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        diagnostics={diagnostics}
      />
      <PlayerPane
        node={node as NodeView | null}
        choices={choices}
        error={error}
        onChoose={choose}
        onReset={reset}
      />
    </Flex>
  );
}

export default App;
