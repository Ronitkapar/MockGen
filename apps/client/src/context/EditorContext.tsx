import React, { useRef, useCallback } from 'react';
import * as monaco from 'monaco-editor';
import { EditorContext } from './EditorContextDef';

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const [activeFile, setActiveFile] = React.useState<string | null>('src/App.jsx');

    const registerEditor = useCallback((editor: monaco.editor.IStandaloneCodeEditor) => {
        editorRef.current = editor;
    }, []);

    const applyPatch = useCallback((targetFile: string, newCode: string) => {
        const editor = editorRef.current;
        if (!editor) {
            console.error('Editor instance not found');
            return;
        }

        // 1. Ensure we are editing the correct file (Logic to switch tabs would go here)
        // For MVP, we assume the user is looking at the file or we warn them.
        if (activeFile !== targetFile && !targetFile.endsWith(activeFile || '')) {
            console.warn(`Patch targets ${targetFile} but ${activeFile} is open.`);
            // In a full app, we would programmatically switch the file here.
        }

        const model = editor.getModel();
        if (!model) return;

        // 2. Push an Undo Stop so the user can Ctrl+Z the AI's changes
        editor.pushUndoStop();

        // 3. Execute the Edit
        // We replace the full range. A more advanced version would use diffs.
        editor.executeEdits('ai-patch', [
            {
                range: model.getFullModelRange(),
                text: newCode,
                forceMoveMarkers: true,
            },
        ]);

        // 4. Push another Undo Stop to seal the transaction
        editor.pushUndoStop();

        // 5. Format the document (Optional, nice to have)
        editor.getAction('editor.action.formatDocument')?.run();

        console.log(`Patch applied to ${targetFile}`);
    }, [activeFile]);

    return (
        <EditorContext.Provider value={{ registerEditor, applyPatch, activeFile, setActiveFile }}>
            {children}
        </EditorContext.Provider>
    );
};
