import React, { useState, useEffect, useRef } from 'react';
import { Palette, Save, RotateCcw, Plus, Trash2, Download, Upload } from 'lucide-react';

// ─── Color Variable Definitions ──────────────────────────────────────────────

interface ThemeColors {
  '--nexus-bg': string;
  '--nexus-sidebar': string;
  '--nexus-border': string;
  '--nexus-accent': string;
  '--nexus-text': string;
  '--nexus-text-muted': string;
  '--nexus-active-tab': string;
  '--nexus-inactive-tab': string;
  '--nexus-scrollbar': string;
  '--nexus-selection': string;
  '--nexus-hover': string;
  '--nexus-button': string;
  '--nexus-button-hover': string;
  '--nexus-input-bg': string;
  '--nexus-badge-bg': string;
  '--nexus-badge-text': string;
  '--nexus-success': string;
  '--nexus-warning': string;
  '--nexus-error': string;
  '--nexus-info': string;
}

type ThemeName = string;

interface SavedTheme {
  name: ThemeName;
  colors: ThemeColors;
  timestamp: number;
}

// ─── Built-in Presets ────────────────────────────────────────────────────────

const THEME_PRESETS: Record<string, ThemeColors> = {
  'Midnight Blue': {
    '--nexus-bg': '#1e1e1e',
    '--nexus-sidebar': '#252526',
    '--nexus-border': '#333333',
    '--nexus-accent': '#3b82f6',
    '--nexus-text': '#d4d4d4',
    '--nexus-text-muted': '#858585',
    '--nexus-active-tab': '#1e1e1e',
    '--nexus-inactive-tab': '#2d2d2d',
    '--nexus-scrollbar': '#424242',
    '--nexus-selection': '#264f78',
    '--nexus-hover': '#2a2d2e',
    '--nexus-button': '#3b82f6',
    '--nexus-button-hover': '#2563eb',
    '--nexus-input-bg': '#1e1e1e',
    '--nexus-badge-bg': '#3b82f620',
    '--nexus-badge-text': '#3b82f6',
    '--nexus-success': '#22c55e',
    '--nexus-warning': '#f59e0b',
    '--nexus-error': '#ef4444',
    '--nexus-info': '#3b82f6',
  },
  'One Dark Pro': {
    '--nexus-bg': '#282c34',
    '--nexus-sidebar': '#21252b',
    '--nexus-border': '#181a1f',
    '--nexus-accent': '#61afef',
    '--nexus-text': '#abb2bf',
    '--nexus-text-muted': '#5c6370',
    '--nexus-active-tab': '#282c34',
    '--nexus-inactive-tab': '#21252b',
    '--nexus-scrollbar': '#373c47',
    '--nexus-selection': '#3e4451',
    '--nexus-hover': '#2c313a',
    '--nexus-button': '#61afef',
    '--nexus-button-hover': '#4e96de',
    '--nexus-input-bg': '#282c34',
    '--nexus-badge-bg': '#61afef20',
    '--nexus-badge-text': '#61afef',
    '--nexus-success': '#98c379',
    '--nexus-warning': '#e5c07b',
    '--nexus-error': '#e06c75',
    '--nexus-info': '#61afef',
  },
  'Dracula': {
    '--nexus-bg': '#282a36',
    '--nexus-sidebar': '#21222c',
    '--nexus-border': '#44475a',
    '--nexus-accent': '#bd93f9',
    '--nexus-text': '#f8f8f2',
    '--nexus-text-muted': '#6272a4',
    '--nexus-active-tab': '#282a36',
    '--nexus-inactive-tab': '#21222c',
    '--nexus-scrollbar': '#44475a',
    '--nexus-selection': '#44475a',
    '--nexus-hover': '#2f3140',
    '--nexus-button': '#bd93f9',
    '--nexus-button-hover': '#a97bf0',
    '--nexus-input-bg': '#282a36',
    '--nexus-badge-bg': '#bd93f920',
    '--nexus-badge-text': '#bd93f9',
    '--nexus-success': '#50fa7b',
    '--nexus-warning': '#f1fa8c',
    '--nexus-error': '#ff5555',
    '--nexus-info': '#8be9fd',
  },
  'Solarized Dark': {
    '--nexus-bg': '#002b36',
    '--nexus-sidebar': '#073642',
    '--nexus-border': '#586e75',
    '--nexus-accent': '#268bd2',
    '--nexus-text': '#839496',
    '--nexus-text-muted': '#586e75',
    '--nexus-active-tab': '#002b36',
    '--nexus-inactive-tab': '#073642',
    '--nexus-scrollbar': '#586e75',
    '--nexus-selection': '#073642',
    '--nexus-hover': '#003543',
    '--nexus-button': '#268bd2',
    '--nexus-button-hover': '#2176b7',
    '--nexus-input-bg': '#002b36',
    '--nexus-badge-bg': '#268bd220',
    '--nexus-badge-text': '#268bd2',
    '--nexus-success': '#859900',
    '--nexus-warning': '#b58900',
    '--nexus-error': '#dc322f',
    '--nexus-info': '#268bd2',
  },
  'GitHub Dark': {
    '--nexus-bg': '#0d1117',
    '--nexus-sidebar': '#161b22',
    '--nexus-border': '#30363d',
    '--nexus-accent': '#58a6ff',
    '--nexus-text': '#c9d1d9',
    '--nexus-text-muted': '#8b949e',
    '--nexus-active-tab': '#0d1117',
    '--nexus-inactive-tab': '#161b22',
    '--nexus-scrollbar': '#484f58',
    '--nexus-selection': '#264f78',
    '--nexus-hover': '#1c2128',
    '--nexus-button': '#238636',
    '--nexus-button-hover': '#2ea043',
    '--nexus-input-bg': '#0d1117',
    '--nexus-badge-bg': '#58a6ff20',
    '--nexus-badge-text': '#58a6ff',
    '--nexus-success': '#3fb950',
    '--nexus-warning': '#d29922',
    '--nexus-error': '#f85149',
    '--nexus-info': '#58a6ff',
  },
  'VS Code Dark+': {
    '--nexus-bg': '#1f1f1f',
    '--nexus-sidebar': '#252526',
    '--nexus-border': '#3c3c3c',
    '--nexus-accent': '#007acc',
    '--nexus-text': '#d4d4d4',
    '--nexus-text-muted': '#858585',
    '--nexus-active-tab': '#1f1f1f',
    '--nexus-inactive-tab': '#2d2d2d',
    '--nexus-scrollbar': '#424242',
    '--nexus-selection': '#264f78',
    '--nexus-hover': '#2a2d2e',
    '--nexus-button': '#007acc',
    '--nexus-button-hover': '#006bb3',
    '--nexus-input-bg': '#1f1f1f',
    '--nexus-badge-bg': '#007acc20',
    '--nexus-badge-text': '#007acc',
    '--nexus-success': '#4ec9b0',
    '--nexus-warning': '#dcdcaa',
    '--nexus-error': '#f44747',
    '--nexus-info': '#007acc',
  },
  'Light': {
    '--nexus-bg': '#ffffff',
    '--nexus-sidebar': '#f3f3f3',
    '--nexus-border': '#e0e0e0',
    '--nexus-accent': '#005fb8',
    '--nexus-text': '#333333',
    '--nexus-text-muted': '#6e6e6e',
    '--nexus-active-tab': '#ffffff',
    '--nexus-inactive-tab': '#ececec',
    '--nexus-scrollbar': '#c1c1c1',
    '--nexus-selection': '#add6ff',
    '--nexus-hover': '#e8e8e8',
    '--nexus-button': '#005fb8',
    '--nexus-button-hover': '#004d96',
    '--nexus-input-bg': '#ffffff',
    '--nexus-badge-bg': '#005fb818',
    '--nexus-badge-text': '#005fb8',
    '--nexus-success': '#388a34',
    '--nexus-warning': '#bf8803',
    '--nexus-error': '#d1242f',
    '--nexus-info': '#005fb8',
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'nexus_custom_themes';
const ACTIVE_THEME_KEY = 'nexus_active_theme';

const DEFAULT_COLORS: ThemeColors = THEME_PRESETS['Midnight Blue'];

function loadCustomThemes(): SavedTheme[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function saveCustomThemes(themes: SavedTheme[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(themes));
}

function loadActiveTheme(): ThemeColors {
  // First check if there's a saved custom theme as active
  try {
    const activeName = localStorage.getItem(ACTIVE_THEME_KEY);
    if (activeName) {
      // Check if it's a preset
      if (THEME_PRESETS[activeName]) {
        return { ...THEME_PRESETS[activeName] };
      }
      // Check custom themes
      const customs = loadCustomThemes();
      const found = customs.find(t => t.name === activeName);
      if (found) return { ...found.colors };
    }
  } catch { /* ignore */ }

  // Fallback: read current CSS variables from the document
  const keys = Object.keys(DEFAULT_COLORS) as (keyof ThemeColors)[];
  const current: Partial<ThemeColors> = {};
  for (const key of keys) {
    const val = getComputedStyle(document.documentElement).getPropertyValue(key).trim();
    if (val) current[key] = val;
  }
  // Merge with defaults for any missing values
  return { ...DEFAULT_COLORS, ...current } as ThemeColors;
}

// ─── Friendly labels for CSS variable names ──────────────────────────────────

const COLOR_LABELS: Record<string, string> = {
  '--nexus-bg': 'Background',
  '--nexus-sidebar': 'Sidebar',
  '--nexus-border': 'Border',
  '--nexus-accent': 'Accent',
  '--nexus-text': 'Text',
  '--nexus-text-muted': 'Text Muted',
  '--nexus-active-tab': 'Active Tab',
  '--nexus-inactive-tab': 'Inactive Tab',
  '--nexus-scrollbar': 'Scrollbar',
  '--nexus-selection': 'Selection',
  '--nexus-hover': 'Hover',
  '--nexus-button': 'Button',
  '--nexus-button-hover': 'Button Hover',
  '--nexus-input-bg': 'Input Background',
  '--nexus-badge-bg': 'Badge Background',
  '--nexus-badge-text': 'Badge Text',
  '--nexus-success': 'Success',
  '--nexus-warning': 'Warning',
  '--nexus-error': 'Error',
  '--nexus-info': 'Info',
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function ThemeStudio() {
  const [colors, setColors] = useState<ThemeColors>(() => loadActiveTheme());
  const [customThemes, setCustomThemes] = useState<SavedTheme[]>(() => loadCustomThemes());
  const [activeThemeName, setActiveThemeName] = useState<string>(() => {
    return localStorage.getItem(ACTIVE_THEME_KEY) || 'Midnight Blue';
  });
  const [saveName, setSaveName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live preview: apply CSS variables whenever colors change
  useEffect(() => {
    Object.entries(colors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, [colors]);

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    setColors(prev => ({ ...prev, [key]: value }));
  };

  const applyTheme = (themeColors: ThemeColors, themeName: string) => {
    setColors({ ...themeColors });
    setActiveThemeName(themeName);
    localStorage.setItem(ACTIVE_THEME_KEY, themeName);
  };

  const resetTheme = () => {
    applyTheme(DEFAULT_COLORS, 'Midnight Blue');
  };

  const saveCustomTheme = () => {
    const name = saveName.trim();
    if (!name) return;

    const newTheme: SavedTheme = {
      name,
      colors: { ...colors },
      timestamp: Date.now(),
    };

    const updated = customThemes.filter(t => t.name !== name);
    updated.push(newTheme);
    setCustomThemes(updated);
    saveCustomThemes(updated);
    setActiveThemeName(name);
    localStorage.setItem(ACTIVE_THEME_KEY, name);
    setSaveName('');
    setShowSaveInput(false);
  };

  const deleteCustomTheme = (name: string) => {
    const updated = customThemes.filter(t => t.name !== name);
    setCustomThemes(updated);
    saveCustomThemes(updated);
    if (activeThemeName === name) {
      applyTheme(DEFAULT_COLORS, 'Midnight Blue');
    }
  };

  const loadCustomTheme = (theme: SavedTheme) => {
    applyTheme(theme.colors, theme.name);
  };

  const exportTheme = () => {
    const data = {
      name: activeThemeName,
      colors: { ...colors },
      exportedAt: new Date().toISOString(),
      version: '5.5.5',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-theme-${activeThemeName.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!data.colors || typeof data.colors !== 'object') {
          setImportError('Invalid theme file: missing colors object.');
          return;
        }
        // Validate that at least some known keys exist
        const keys = Object.keys(DEFAULT_COLORS) as (keyof ThemeColors)[];
        const importedColors: Partial<ThemeColors> = {};
        for (const key of keys) {
          if (data.colors[key] && typeof data.colors[key] === 'string') {
            importedColors[key] = data.colors[key];
          }
        }
        if (Object.keys(importedColors).length < 3) {
          setImportError('Invalid theme file: too few recognized color variables.');
          return;
        }

        const mergedColors = { ...DEFAULT_COLORS, ...importedColors } as ThemeColors;
        const themeName = data.name || file.name.replace(/\.json$/i, '');
        applyTheme(mergedColors, themeName);
        setImportError('');
      } catch {
        setImportError('Failed to parse theme file. Ensure it is valid JSON.');
      }
    };
    reader.readAsText(file);
    // Reset the file input so re-importing the same file works
    event.target.value = '';
  };

  return (
    <div className="p-4 bg-nexus-sidebar h-full overflow-y-auto">
      <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
        <Palette size={16} className="text-nexus-accent" />
        THEME STUDIO
      </h2>

      {/* ── Preset Themes ── */}
      <div className="mb-6">
        <h3 className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest mb-3">
          Theme Presets
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(THEME_PRESETS).map(([name, presetColors]) => (
            <button
              key={name}
              onClick={() => applyTheme(presetColors, name)}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                activeThemeName === name
                  ? 'border-nexus-accent bg-nexus-accent/10 shadow-md shadow-nexus-accent/10'
                  : 'border-nexus-border bg-nexus-bg hover:border-nexus-accent/40'
              }`}
            >
              <div className="flex gap-1 mb-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: presetColors['--nexus-bg'] }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: presetColors['--nexus-sidebar'] }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: presetColors['--nexus-accent'] }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: presetColors['--nexus-text'] }} />
              </div>
              <span className="text-[10px] font-bold text-white block leading-tight">{name}</span>
              {activeThemeName === name && (
                <span className="text-[8px] text-nexus-accent uppercase tracking-widest font-bold">Active</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Saved Custom Themes ── */}
      {customThemes.length > 0 && (
        <div className="mb-6">
          <h3 className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest mb-3">
            Saved Themes
          </h3>
          <div className="space-y-1.5">
            {customThemes.map((theme) => (
              <div
                key={theme.name}
                className={`flex items-center gap-2 p-2 rounded-lg border transition-all group cursor-pointer ${
                  activeThemeName === theme.name
                    ? 'border-nexus-accent bg-nexus-accent/10'
                    : 'border-nexus-border bg-nexus-bg hover:border-nexus-accent/40'
                }`}
                onClick={() => loadCustomTheme(theme)}
              >
                <div className="flex gap-0.5 flex-shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.colors['--nexus-bg'] }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.colors['--nexus-accent'] }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.colors['--nexus-text'] }} />
                </div>
                <span className="text-[10px] font-bold text-white flex-1 truncate">{theme.name}</span>
                {activeThemeName === theme.name && (
                  <span className="text-[8px] text-nexus-accent uppercase tracking-widest font-bold">Active</span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCustomTheme(theme.name);
                  }}
                  className="p-1 rounded text-nexus-text-muted hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete theme"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Color Editor ── */}
      <div className="mb-6">
        <h3 className="text-[10px] font-bold text-nexus-text-muted uppercase tracking-widest mb-3">
          Color Variables
        </h3>
        <div className="space-y-2.5">
          {(Object.entries(colors) as [keyof ThemeColors, string][]).map(([key, value]) => (
            <div key={key} className="flex flex-col gap-0.5">
              <label className="text-[9px] text-nexus-text-muted font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: value }} />
                {COLOR_LABELS[key] || key}
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={value}
                  onChange={(e) => handleColorChange(key, e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer bg-transparent border border-nexus-border p-0 flex-shrink-0"
                />
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleColorChange(key, e.target.value)}
                  className="flex-1 bg-nexus-bg border border-nexus-border rounded px-2 py-1 text-[10px] text-nexus-text font-mono outline-none focus:border-nexus-accent"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Save Theme ── */}
      <div className="mb-4">
        {showSaveInput ? (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Theme name..."
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveCustomTheme()}
              autoFocus
              className="w-full bg-nexus-bg border border-nexus-border rounded-lg px-3 py-2 text-xs outline-none focus:border-nexus-accent text-white font-mono"
            />
            <div className="flex gap-2">
              <button
                onClick={saveCustomTheme}
                disabled={!saveName.trim()}
                className="flex-1 bg-nexus-accent text-white py-1.5 rounded text-[10px] font-bold flex items-center justify-center gap-1.5 hover:bg-nexus-accent/80 disabled:opacity-50 transition-all uppercase tracking-widest"
              >
                <Save size={12} /> Save
              </button>
              <button
                onClick={() => { setShowSaveInput(false); setSaveName(''); }}
                className="px-3 bg-nexus-bg border border-nexus-border text-nexus-text-muted py-1.5 rounded text-[10px] font-bold hover:text-white transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowSaveInput(true)}
            className="w-full bg-nexus-bg border border-nexus-border text-nexus-text py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-2 hover:border-nexus-accent/40 hover:text-white transition-all uppercase tracking-widest"
          >
            <Plus size={14} /> Save Custom Theme
          </button>
        )}
      </div>

      {/* ── Action Buttons ── */}
      <div className="flex gap-2">
        <button
          onClick={resetTheme}
          className="flex-1 bg-nexus-bg border border-nexus-border text-nexus-text py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 hover:border-nexus-accent/40 hover:text-white transition-all"
        >
          <RotateCcw size={12} /> Reset
        </button>
        <button
          onClick={exportTheme}
          className="flex-1 bg-nexus-bg border border-nexus-border text-nexus-text py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 hover:border-nexus-accent/40 hover:text-white transition-all"
        >
          <Download size={12} /> Export
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 bg-nexus-bg border border-nexus-border text-nexus-text py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 hover:border-nexus-accent/40 hover:text-white transition-all"
        >
          <Upload size={12} /> Import
        </button>
      </div>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={importTheme}
        className="hidden"
      />

      {/* Import error message */}
      {importError && (
        <div className="mt-3 p-2 bg-red-900/20 border border-red-500/20 rounded-lg">
          <p className="text-[10px] text-red-400">{importError}</p>
        </div>
      )}
    </div>
  );
}
