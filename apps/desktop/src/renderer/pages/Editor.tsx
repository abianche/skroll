import { ScriptEditorView } from "../features/script-editor/ScriptEditorView";
import { useScriptEditorController } from "../features/script-editor/useScriptEditorController";

export function EditorPage() {
  const controller = useScriptEditorController();

  return (
    <ScriptEditorView
      filePath={controller.filePath}
      text={controller.text}
      isDirty={controller.isDirty}
      isCompiling={controller.isCompiling}
      diagnostics={controller.diagnostics}
      parseError={controller.parseError}
      preview={controller.preview}
      previewError={controller.previewError}
      isSaveModalOpen={controller.isSaveModalOpen}
      pendingSavePath={controller.pendingSavePath}
      saveError={controller.saveError}
      isSaving={controller.isSaving}
      onChangeText={controller.handleChangeText}
      onRequestSave={controller.requestSave}
      onRequestSaveAs={controller.requestSaveAs}
      onCloseSaveModal={controller.closeSaveModal}
      onUpdatePendingSavePath={controller.updatePendingSavePath}
      onSubmitSave={controller.submitSave}
      onChoose={controller.choose}
      onResetPreview={controller.resetPreview}
    />
  );
}
