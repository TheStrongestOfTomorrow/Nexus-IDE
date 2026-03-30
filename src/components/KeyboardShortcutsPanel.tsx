import React, { useState, useMemo, useRef, useEffect } from "react";
import { X, Search, Keyboard } from "lucide-react";

interface KeyboardShortcutsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Shortcut {
  keys: string[];
  description: string;
}

interface ShortcutCategory {
  name: string;
  shortcuts: Shortcut[];
}

const shortcutCategories: ShortcutCategory[] = [
  {
    name: "File",
    shortcuts: [
      { keys: ["Ctrl", "N"], description: "New File" },
      { keys: ["Ctrl", "O"], description: "Open File" },
      { keys: ["Ctrl+K", "Ctrl+O"], description: "Open Folder" },
      { keys: ["Ctrl", "S"], description: "Save Workspace" },
      { keys: ["Ctrl+Shift", "E"], description: "Export as ZIP" },
      { keys: ["Ctrl", "W"], description: "Close Tab" },
    ],
  },
  {
    name: "Edit",
    shortcuts: [
      { keys: ["Ctrl", "F"], description: "Find" },
      { keys: ["Ctrl", "H"], description: "Find and Replace" },
      { keys: ["Shift+Alt", "F"], description: "Format Document" },
      { keys: ["Ctrl", "/"], description: "Toggle Comment" },
      { keys: ["Alt", "\u2191"], description: "Move Line Up" },
      { keys: ["Alt", "\u2193"], description: "Move Line Down" },
      { keys: ["Shift+Alt", "\u2193"], description: "Duplicate Line" },
    ],
  },
  {
    name: "View",
    shortcuts: [
      { keys: ["Ctrl", "B"], description: "Toggle Sidebar" },
      { keys: ["Ctrl", "`"], description: "Toggle Terminal" },
      { keys: ["Ctrl+Shift", "V"], description: "Toggle Preview" },
      { keys: ["Ctrl+Shift", "A"], description: "Toggle AI Assistant" },
      { keys: ["Ctrl+K", "Z"], description: "Toggle Zen Mode" },
      { keys: ["Ctrl+Shift", "M"], description: "Toggle Minimap" },
      { keys: ["Ctrl", "="], description: "Zoom In" },
      { keys: ["Ctrl", "-"], description: "Zoom Out" },
    ],
  },
  {
    name: "Navigation",
    shortcuts: [
      { keys: ["Ctrl", "P"], description: "Go to File" },
      { keys: ["Ctrl+Shift", "P"], description: "Command Palette" },
      { keys: ["Ctrl", "G"], description: "Go to Line" },
      { keys: ["Ctrl", "Tab"], description: "Next Tab" },
      { keys: ["Ctrl+Shift", "Tab"], description: "Previous Tab" },
    ],
  },
  {
    name: "Run",
    shortcuts: [
      { keys: ["F5"], description: "Run File" },
      { keys: ["Ctrl+Shift", "D"], description: "Toggle Debug" },
    ],
  },
];

function KeyBadge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center justify-center bg-[#333] text-[#ccc] px-2 py-0.5 rounded text-xs font-mono min-w-[24px] border border-[#444] shadow-[0_1px_0_1px_rgba(0,0,0,0.3)]">
      {text}
    </span>
  );
}

function KeyBinding({ shortcut }: { shortcut: Shortcut }) {
  return (
    <span className="inline-flex items-center gap-1 flex-shrink-0">
      {shortcut.keys.map((key, i) => (
        <span key={i} className="inline-flex items-center gap-1">
          <KeyBadge text={key} />
          {i < shortcut.keys.length - 1 && (
            <span className="text-[#666] text-xs mx-0.5">+</span>
          )}
        </span>
      ))}
    </span>
  );
}

const KeyboardShortcutsPanel: React.FC<KeyboardShortcutsPanelProps> = ({
  isOpen,
  onClose,
}) => {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return shortcutCategories;

    const query = search.toLowerCase().trim();
    return shortcutCategories
      .map((category) => ({
        ...category,
        shortcuts: category.shortcuts.filter(
          (s) =>
            s.description.toLowerCase().includes(query) ||
            s.keys.some((k) => k.toLowerCase().includes(query))
        ),
      }))
      .filter((category) => category.shortcuts.length > 0);
  }, [search]);

  const totalShortcuts = shortcutCategories.reduce(
    (acc, cat) => acc + cat.shortcuts.length,
    0
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Panel */}
      <div
        className="relative bg-[#252526] rounded-lg shadow-2xl border border-[#3c3c3c] w-full max-w-[600px] max-h-[70vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#3c3c3c] flex-shrink-0">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-[#858585]" />
            <h2 className="text-sm font-semibold text-[#cccccc] tracking-wide">
              Keyboard Shortcuts
            </h2>
            <span className="text-xs text-[#666] ml-1">
              {totalShortcuts} shortcuts
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-md text-[#858585] hover:text-[#cccccc] hover:bg-[#3c3c3c] transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="px-5 py-3 border-b border-[#3c3c3c] flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#666]" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shortcuts..."
              className="w-full bg-[#3c3c3c] border border-[#4c4c4c] rounded-md pl-9 pr-3 py-1.5 text-sm text-[#cccccc] placeholder-[#666] outline-none focus:border-[#007acc] transition-colors"
            />
          </div>
        </div>

        {/* Shortcuts List */}
        <div className="flex-1 overflow-y-auto">
          {filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#666]">
              <Search className="w-8 h-8 mb-3 opacity-50" />
              <p className="text-sm">No shortcuts found</p>
              <p className="text-xs mt-1 text-[#555]">
                Try a different search term
              </p>
            </div>
          ) : (
            filteredCategories.map((category) => (
              <div key={category.name}>
                {/* Category Header */}
                <div className="sticky top-0 bg-[#2d2d2d] px-5 py-1.5 border-b border-[#3c3c3c]">
                  <span className="text-xs font-semibold text-[#007acc] uppercase tracking-wider">
                    {category.name}
                  </span>
                  <span className="text-xs text-[#555] ml-2">
                    ({category.shortcuts.length})
                  </span>
                </div>

                {/* Shortcuts */}
                <div className="divide-y divide-[#2d2d2d]">
                  {category.shortcuts.map((shortcut) => (
                    <div
                      key={`${category.name}-${shortcut.description}`}
                      className="flex items-center justify-between px-5 py-2 hover:bg-[#2a2d2e] transition-colors group"
                    >
                      <span className="text-sm text-[#cccccc] group-hover:text-white transition-colors">
                        {shortcut.description}
                      </span>
                      <KeyBinding shortcut={shortcut} />
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2 border-t border-[#3c3c3c] flex-shrink-0 bg-[#1e1e1e]">
          <p className="text-xs text-[#555] text-center">
            Press{" "}
            <KeyBadge text="Esc" /> to close
          </p>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsPanel;
