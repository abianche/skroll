import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './App.css';

type ChoiceView = { text: string; next: string };
type NodeView = { id: string; text: string; end: boolean };

const SAMPLE = `{
  "variables": { "hasKey": false, "courage": 0 },
  "start": "intro",
  "nodes": [
    { "id":"intro","text":"You wake up.","choices":[
      {"text":"Search","next":"search"},
      {"text":"Knock","next":"knock"}
    ]},
    { "id":"search","text":"You find a key.","set":{"hasKey":true},"choices":[
      {"text":"Back","next":"door"}
    ]},
    { "id":"knock","text":"Silence. Courage +1.","inc":{"courage":1},"choices":[
      {"text":"Back","next":"door"}
    ]},
    { "id":"door","text":"A locked door.","choices":[
      {"text":"Use key","if":"hasKey == true","next":"open"},
      {"text":"Force it","if":"courage >= 2","next":"force"},
      {"text":"Keep knocking","next":"knock"}
    ]},
    { "id":"open","text":"Freedom.","end":true },
    { "id":"force","text":"Broken latch. Freedom.","end":true }
  ]
}`;

function App() {
  const [editor, setEditor] = useState<string>(SAMPLE);
  const [node, setNode] = useState<NodeView | null>(null);
  const [choices, setChoices] = useState<ChoiceView[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      const n = (await invoke('get_current_node')) as NodeView;
      const ch = (await invoke('get_choices')) as ChoiceView[];
      setNode(n);
      setChoices(ch);
      setError(null);
    } catch (e) {
      setError(e?.toString?.() ?? String(e));
    }
  }

  async function load() {
    try {
      await invoke('load_story', { content: editor });
      await refresh();
    } catch (e) {
      setError(e?.toString?.() ?? String(e));
    }
  }

  async function choose(i: number) {
    try {
      await invoke('choose', { index: i });
      await refresh();
    } catch (e) {
      setError(e?.toString?.() ?? String(e));
    }
  }

  async function reset() {
    try {
      await invoke('reset');
      await refresh();
    } catch (e) {
      setError(e?.toString?.() ?? String(e));
    }
  }

  // Auto-load sample on first run for convenience
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main
      className="container"
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        justifyContent: 'flex-start',
        gap: 16,
      }}
    >
      <section style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h2>Editor</h2>
        <textarea
          value={editor}
          onChange={(e) => setEditor(e.currentTarget.value)}
          style={{ flex: 1, minHeight: 300, fontFamily: 'monospace' }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load}>Load Story</button>
        </div>
      </section>

      <section style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h2>Preview Player</h2>
        {error && <div style={{ color: 'red' }}>Error: {error}</div>}
        <div style={{ flex: 1, border: '1px solid #ccc', padding: 12, borderRadius: 6 }}>
          {node ? (
            <div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: '#999' }}>{node.id}</div>
                <div style={{ fontSize: 16 }}>{node.text}</div>
              </div>
              {node.end ? (
                <div style={{ fontWeight: 600 }}>The End</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {choices.map((c, i) => (
                    <button key={i} onClick={() => choose(i)}>
                      {c.text}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>Load a story to begin.</div>
          )}
        </div>
        <div>
          <button onClick={reset}>Reset</button>
        </div>
      </section>
    </main>
  );
}

export default App;
