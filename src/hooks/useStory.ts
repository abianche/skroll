import { useCallback, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { ChoiceView, Diagnostic, NodeView } from '../types';

export function useStory() {
  const [node, setNode] = useState<NodeView | null>(null);
  const [choices, setChoices] = useState<ChoiceView[]>([]);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const n = await invoke<NodeView>('get_current_node');
      const ch = await invoke<ChoiceView[]>('get_choices');
      setNode(n);
      setChoices(ch);
      setError(null);
    } catch (e) {
      setError(e?.toString?.() ?? String(e));
    }
  }, []);

  const loadFromContent = useCallback(
    async (editor: string) => {
      try {
        try {
          const diags = await invoke<Diagnostic[]>('validate_story', { storyJson: editor });
          setDiagnostics(diags);
        } catch (ve) {
          setDiagnostics([]);
          setError(ve?.toString?.() ?? String(ve));
          return false;
        }
        await invoke('load_story', { content: editor });
        await refresh();
        return true;
      } catch (e) {
        setError(e?.toString?.() ?? String(e));
        return false;
      }
    },
    [refresh]
  );

  const validateOnly = useCallback(async (editor: string) => {
    setError(null);
    try {
      const diags = await invoke<Diagnostic[]>('validate_story', { storyJson: editor });
      setDiagnostics(diags);
    } catch (e) {
      setDiagnostics([]);
      setError(e?.toString?.() ?? String(e));
    }
  }, []);

  const choose = useCallback(
    async (i: number) => {
      try {
        await invoke('choose', { index: i });
        await refresh();
      } catch (e) {
        setError(e?.toString?.() ?? String(e));
      }
    },
    [refresh]
  );

  const reset = useCallback(async () => {
    try {
      await invoke('reset');
      await refresh();
    } catch (e) {
      setError(e?.toString?.() ?? String(e));
    }
  }, [refresh]);

  return {
    node,
    choices,
    diagnostics,
    error,
    refresh,
    loadFromContent,
    validateOnly,
    choose,
    reset,
  };
}
