import React, { useState, useEffect } from 'react';
import { Palette, Save, RotateCcw } from 'lucide-react';

export default function ThemeStudio() {
  const [colors, setColors] = useState({
    '--nexus-bg': '#1e1e1e',
    '--nexus-sidebar': '#252526',
    '--nexus-border': '#333333',
    '--nexus-accent': '#3b82f6',
    '--nexus-text': '#d4d4d4',
    '--nexus-text-muted': '#858585'
  });

  useEffect(() => {
    Object.entries(colors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, [colors]);

  const handleColorChange = (key: string, value: string) => {
    setColors(prev => ({ ...prev, [key]: value }));
  };

  const resetTheme = () => {
    setColors({
      '--nexus-bg': '#1e1e1e',
      '--nexus-sidebar': '#252526',
      '--nexus-border': '#333333',
      '--nexus-accent': '#3b82f6',
      '--nexus-text': '#d4d4d4',
      '--nexus-text-muted': '#858585'
    });
  };

  return (
    <div className="p-4 bg-nexus-sidebar h-full overflow-y-auto">
      <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
        <Palette size={16} className="text-nexus-accent" />
        THEME STUDIO
      </h2>
      
      <div className="space-y-4">
        {Object.entries(colors).map(([key, value]) => (
          <div key={key} className="flex flex-col gap-1">
            <label className="text-[10px] text-nexus-text-muted font-mono">{key}</label>
            <div className="flex gap-2">
              <input 
                type="color" 
                value={value} 
                onChange={(e) => handleColorChange(key, e.target.value)}
                className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
              />
              <input 
                type="text" 
                value={value} 
                onChange={(e) => handleColorChange(key, e.target.value)}
                className="flex-1 bg-nexus-bg border border-nexus-border rounded px-2 text-xs text-nexus-text font-mono"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-2">
        <button className="flex-1 bg-nexus-accent text-white py-2 rounded text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90">
          <Save size={14} /> SAVE THEME
        </button>
        <button onClick={resetTheme} className="px-3 bg-nexus-bg border border-nexus-border text-nexus-text py-2 rounded hover:bg-white/5">
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
}
