import React, { useEffect, useRef } from 'react';
import MonacoEditor, { loader } from '@monaco-editor/react';

// Configure Monaco loader
loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs'
  }
});

// Handle loader errors
loader.init().catch(error => {
  console.error('Monaco initialization: error:', error);
});

import { FileNode } from '../hooks/useFileSystem';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Play, Bug, Sparkles, Wand2, ChevronRight } from 'lucide-react';
import { socketService } from '../services/socketService';
import FormattingService from '../services/formattingService';

// ─── Editor Settings (localStorage-backed) ────────────────────────────────────

const SETTINGS_KEY = 'nexus_editor_settings_v2';

interface EditorSettings {
  showMinimap: boolean;
  wordWrap: boolean;
  fontSize: number;
  fontFamily: string;
  tabSize: number;
}

function getEditorSettings(): EditorSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return {
    showMinimap: true,
    wordWrap: true,
    fontSize: 13,
    fontFamily: "'JetBrains Mono', monospace",
    tabSize: 2,
  };
}

// ─── Editor Props ─────────────────────────────────────────────────────────────

interface EditorProps {
  file: FileNode | null;
  onChange: (content: string) => void;
  extensions?: any[];
  apiKeys?: Record<string, string>;
  onToggleTerminal?: () => void;
  showMinimap?: boolean;
  wordWrap?: boolean;
  fontSize?: number;
  fontFamily?: string;
  hideBreadcrumbs?: boolean;
}

// ─── Editor Component ─────────────────────────────────────────────────────────

export default function Editor({
  file,
  onChange,
  extensions = [],
  apiKeys = {},
  onToggleTerminal,
  showMinimap: showMinimapProp,
  wordWrap: wordWrapProp,
  fontSize: fontSizeProp,
  fontFamily: fontFamilyProp,
  hideBreadcrumbs = false,
}: EditorProps) {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  // Resolve settings: props override localStorage defaults
  const settings = getEditorSettings();
  const showMinimap = showMinimapProp !== undefined ? showMinimapProp : settings.showMinimap;
  const wordWrap = wordWrapProp !== undefined ? wordWrapProp : settings.wordWrap;
  const fontSize = fontSizeProp || settings.fontSize;
  const fontFamily = fontFamilyProp || settings.fontFamily;

  const handleFormat = async () => {
    if (file) {
      const formatted = await FormattingService.formatCode(file.content, file.language);
      onChange(formatted);
    }
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Register Inline Completions (Ghost Text)
    monaco.languages.registerInlineCompletionsProvider(file?.language || 'javascript', {
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
          const genAI = new GoogleGenerativeAI(apiKey);
          const aiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
          const result = await aiModel.generateContent(`You are an AI code autocomplete engine. Complete the following code snippet. Return ONLY the next 1-2 lines of code. Do not include markdown formatting.\n\nCode:\n${textBefore}`);
          const response = result.response;
          const text = response.text() || '';

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
    monaco.languages.registerCodeLensProvider(file?.language || 'javascript', {
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
    (async () => {
      for (const ext of extensions) {
        if (ext.enabled && ext.url.endsWith('.json')) {
          try {
            const response = await fetch(ext.url);
            const themeData = await response.json();
            monaco.editor.defineTheme(ext.name, themeData);
            monaco.setTheme(ext.name);
          } catch (err) {
            console.error(`Failed to load theme ${ext.name}:`, err);
          }
        }
      }
    })();
  };
  const handleRun = () => {
    if (file) {
      // Check if we have a real server connection for code execution
      const isStaticHost = window.location.host.includes('github.io') || 
                          window.location.host.includes('vercel.app') || 
                          window.location.host.includes('netlify.app');
      if (isStaticHost && file.language !== 'html') {
        // On static hosting, server-side execution isn't available
        if (onToggleTerminal) onToggleTerminal();
        return;
      }
      socketService.send({
        type: 'run-file',
        filename: file.name,
        content: file.content,
        language: file.language
      });
      if (onToggleTerminal) onToggleTerminal();
    }
  };

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center bg-nexus-bg text-nexus-text-muted">
        <div className="text-center">
          <h2 className="text-2xl font-light mb-2">Nexus IDE 5.4.0</h2>
          <p className="text-xs">Select a file to start editing</p>
        </div>
      </div>
    );
  }

  // Build file path breadcrumbs
  const filePathParts = file.name.split('/');
  const breadcrumbs = filePathParts.map((part, i) => ({
    name: part,
    isLast: i === filePathParts.length - 1,
  }));

  return (
    <div className="flex-1 flex flex-col h-full bg-nexus-bg">
      {/* ─── Toolbar ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 bg-nexus-sidebar border-b border-nexus-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-nexus-accent" />
          <span className="text-xs text-nexus-text font-mono tracking-tight">{file.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleFormat}
            className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold transition-colors shadow-sm"
            title="Format Code"
          >
            <Wand2 size={10} />
            FORMAT
          </button>
          <button 
            onClick={handleRun}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition-colors shadow-sm"
            title="Run File"
          >
            <Play size={10} />
            RUN
          </button>
          <button 
            className="flex items-center gap-1.5 px-3 py-1 bg-nexus-border hover:bg-nexus-border/80 text-nexus-text rounded text-[10px] font-bold transition-colors"
            title="Debug File"
          >
            <Bug size={10} />
            DEBUG
          </button>
        </div>
      </div>

      {/* ─── Breadcrumbs ──────────────────────────────────────────── */}
      {!hideBreadcrumbs && filePathParts.length > 1 && (
        <div className="flex items-center h-6 px-4 bg-nexus-bg border-b border-nexus-border/50 flex-shrink-0 overflow-hidden">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <ChevronRight size={12} className="mx-1 text-gray-600 flex-shrink-0" />
              )}
              <span
                className="text-[11px] truncate hover:text-nexus-text cursor-pointer transition-colors"
                style={{ color: crumb.isLast ? '#e0e0e0' : '#888' }}
              >
                {crumb.name}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* ─── Monaco Editor ────────────────────────────────────────── */}
      <div className="flex-1 relative">
        <MonacoEditor
          height="100%"
          language={file.language}
          theme="vs-dark"
          value={file.content}
          onChange={(value) => onChange(value || '')}
          onMount={handleEditorDidMount}
          options={{
            // v5.3.0 improvements
            minimap: { enabled: showMinimap },
            wordWrap: wordWrap ? 'on' : 'off' as any,
            fontSize,
            fontFamily,
            ...({ 'bracketPairColorization.enabled': true } as any),
            ...({ 'editor.stickyScroll.enabled': true } as any),
            ...({ 'editor.guides.indentation': true } as any),
            ...({ 'editor.autoClosingBrackets': 'always' } as any),
            ...({ 'editor.autoClosingQuotes': 'always' } as any),
            ...({ 'editor.autoIndent': 'full' } as any),
            // Existing settings
            padding: { top: 16 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            lineNumbersMinChars: 4,
            glyphMargin: true,
            folding: true,
            renderLineHighlight: 'all',
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              useShadows: false,
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10
            }
          }}
        />
      </div>
    </div>
  );
}
