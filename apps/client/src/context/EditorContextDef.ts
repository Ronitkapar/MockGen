import { createContext } from 'react';
import * as monaco from 'monaco-editor';

export interface EditorContextType {
    registerEditor: (editor: monaco.editor.IStandaloneCodeEditor) => void;
    applyPatch: (targetFile: string, newCode: string) => void;
    activeFile: string | null;
    setActiveFile: (fileName: string) => void;
}

export const EditorContext = createContext<EditorContextType | null>(null);
