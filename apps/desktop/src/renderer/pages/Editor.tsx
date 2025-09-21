import { useNavigate } from "react-router";

import { EditorView } from "../features/editor/EditorView";
import { useEditorController } from "../features/editor/useEditorController";

export function EditorPage() {
  const navigate = useNavigate();
  const controller = useEditorController();
  const { startEngine } = controller;

  return (
    <EditorView
      controller={controller}
      onPlay={async () => {
        const success = await startEngine();
        if (success) {
          navigate("/player");
        }
      }}
    />
  );
}
