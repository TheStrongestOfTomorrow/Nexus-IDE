import React, { useEffect, useRef } from 'react';
import MonacoEditor, { loader } from '@monaco-editor/react';
import { FileNode } from '../hooks/useFileSystem';
import { GoogleGenAI } from '@google/genai';
import { Play, Bug, Sparkles, Layout } from 'lucide-react';
import { socketService } from '../services/socketService';
import FormattingService from '../services/formattingService';

interface EditorProps {
  activeFile: FileNode | null;
  onChange: (id: string, content: string) => void;
  extensions?: any[];
  apiKeys?: Record<string, string>;
  onToggleTerminal?: () => void;
}

export default function Editor({ activeFile, onChange, extensions = [], apiKeys = {}, onToggleTerminal }: EditorProps) {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  const handleFormat = async () => {
    if (activeFile) {
      const formatted = await FormattingService.formatCode(activeFile.content, activeFile.language);
      onChange(activeFile.id, formatted);
    }
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Register Inline Completions (Ghost Text)
    monaco.languages.registerInlineCompletionsProvider(activeFile?.language || 'javascript', {
      provideInlineCompletions: async (model: any, position: any) => {
        const apiKey = apiKeys['gemini'];
        if (!apiKey) return;

        const textBefore = model.getValueInRange({
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        });

        try {
          const genAI = new GoogleGenAI({ apiKey });
          const model = genAI.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `You are an AI code autocomplete engine. Complete the following code snippet. Return ONLY the next 1-2 lines of code. Do not include markdown formatting.\n\nCode:\n${textBefore}`,
            config: { temperature: 0.1, maxOutputTokens: 50 }
          });
          const response = await model;
          const text = response.text || '';

          return {
            items: [{
              insertText: text,
              range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column)
            }]
          };
        } catch (err) {
          return { items: [] };
        }
      },
      freeInlineCompletions: () => {}
    });

    // Register Code Lens
    monaco.languages.registerCodeLensProvider(activeFile?.language || 'javascript', {
      provideCodeLenses: (model: any) => {
        const lenses: any[] = [];
        const lines = model.getLineCount();
        
        for (let i = 1; i <= lines; i++) {
          const lineContent = model.getLineContent(i);
          if (lineContent.includes('function') || lineContent.includes('=>') || lineContent.includes('class ')) {
            lenses.push({
              range: new monaco.Range(i, 1, i, 1),
              id: `ai-explain-${i}`,
              command: {
                id: 'nexus.ai.explain',
                title: '✨ AI: Explain',
                arguments: [lineContent]
              }
            });
            lenses.push({
              range: new monaco.Range(i, 1, i, 1),
              id: `ai-refactor-${i}`,
              command: {
                id: 'nexus.ai.refactor',
                title: '🛠️ AI: Refactor',
                arguments: [lineContent]
              }
            });
          }
        }
        return { lenses, dispose: () => {} };
      }
    });

    // Add commands for Code Lens
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyE, () => {
      // Trigger AI explain for current selection or line
    });

    // Load themes from extensions
    extensions.forEach(async (ext) => {
      if (ext.enabled && ext.url.endsWith('.json')) {
        try {
          const response = await fetch(ext.url);
          const themeData = await response.json();
          monaco.editor.defineTheme(ext.name, themeData);
          monaco.editor.setTheme(ext.name);
        } catch (err) {
          console.error(`Failed to load theme ${ext.name}:`, err);
        }
      }
    });
  };
  const handleRun = () => {
    if (activeFile) {
      socketService.send({
        type: 'run-file',
        filename: activeFile.name,
        content: activeFile.content,
        language: activeFile.language
      });
      if (onToggleTerminal) onToggleTerminal();
    }
  };

  if (!activeFile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#1e1e1e] text-[#cccccc]">
        <div className="text-center">
          <h2 className="text-2xl font-light mb-2">Nexus IDE</h2>
          <p className="text-gray-500">Select a file to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1e1e1e]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-[#1e1e1e]">
        <span className="text-sm text-[#cccccc] font-mono">{activeFile.name}</span>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleFormat}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#3c3c3c] hover:bg-[#444] text-gray-300 rounded text-[11px] font-bold transition-colors"
            title="Format Code"
          >
            <Layout size={12} />
            Format
          </button>
          <button 
            onClick={handleRun}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition-colors"
            title="Run File"
          >
            <Play size={12} />
            Run
          </button>
          <button 
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#3c3c3c] hover:bg-[#444] text-gray-300 rounded text-[11px] font-bold transition-colors"
            title="Debug File"
          >
            <Bug size={12} />
            Debug
          </button>
        </div>
      </div>
      <div className="flex-1 relative">
        <MonacoEditor
          height="100%"
          language={activeFile.language}
          theme="vs-dark"
          value={activeFile.content}
          onChange={(value) => onChange(activeFile.id, value || '')}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: 'on',
            padding: { top: 16 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
          }}
        />
      </div>
    </div>
  );
}
