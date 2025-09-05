import { useState } from 'react';
import reactLogo from './assets/react.svg';
import { invoke } from '@tauri-apps/api/core';
import './App.css';

function App() {
  const [greetMsg, setGreetMsg] = useState('');
  const [name, setName] = useState('');
  const [validationMsg, setValidationMsg] = useState<string>('');

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke('greet', { name }));
  }

  async function validateSample() {
    const sample = `{
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
    try {
      const result: unknown = await invoke('validate_story', {
        storyJson: sample,
      });
      if (Array.isArray(result) && result.length === 0) {
        setValidationMsg('No diagnostics — story is valid ✅');
      } else {
        setValidationMsg(JSON.stringify(result, null, 2));
      }
    } catch (e: any) {
      setValidationMsg(`Validation error: ${e?.toString?.() ?? e}`);
    }
  }

  async function validateBroken() {
    const broken = `{
      "variables": { "hasKey": false, "courage": 0 },
      "start": "intro",
      "nodes": [
        { "id":"intro","text":"You wake up.","choices":[
          {"text":"Go missing","next":"missing-node"}
        ]}
      ]
    }`;
    try {
      const result: unknown = await invoke('validate_story', {
        storyJson: broken,
      });
      setValidationMsg(JSON.stringify(result, null, 2));
    } catch (e: any) {
      setValidationMsg(`Validation error: ${e?.toString?.() ?? e}`);
    }
  }

  return (
    <main className="container">
      <h1>Welcome to Tauri + React</h1>

      <div className="row">
        <a href="https://vite.dev" target="_blank">
          <img src="/vite.svg" className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <p>Click on the Tauri, Vite, and React logos to learn more.</p>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="submit">Greet</button>
      </form>
      <p>{greetMsg}</p>

      <div className="row" style={{ marginTop: 16, gap: 8 }}>
        <button type="button" onClick={validateSample}>
          Validate Sample Story
        </button>
        <button type="button" onClick={validateBroken}>
          Validate Broken Story
        </button>
      </div>
      {validationMsg && (
        <pre style={{ textAlign: 'left', whiteSpace: 'pre-wrap' }}>{validationMsg}</pre>
      )}
    </main>
  );
}

export default App;
