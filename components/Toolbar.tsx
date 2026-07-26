'use client';

import React from 'react';

interface ToolbarProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  selectedCount: number;
  multiSelect: boolean;
  onToggleMultiSelect: () => void;
  onGeneratePNG: () => void;
  onClearSelection: () => void;
}

export function Toolbar({
  theme, onToggleTheme, selectedCount, multiSelect, onToggleMultiSelect,
  onGeneratePNG, onClearSelection,
}: ToolbarProps) {
  const s = { backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' };
  const b = { backgroundColor: 'var(--bg-surface-hover)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' };

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b flex-wrap text-xs" style={s}>
      <span className="font-semibold mr-1 select-none" style={{ color: 'var(--text-primary)' }}>Teatro Plaza Norte</span>
      <div className="h-4 w-px mx-1" style={{ backgroundColor: 'var(--border-color)' }} />

      <button onClick={onToggleTheme} className="px-2 py-1 rounded border" style={b}
        title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
        {theme === 'dark' ? '\u263E' : '\u2600'}
      </button>

      <button onClick={onGeneratePNG} disabled={selectedCount === 0}
        className="px-2 py-1 rounded border font-medium disabled:opacity-30"
        style={{ backgroundColor: '#7c3aed', borderColor: '#6d28d9', color: '#fff' }}>
        PNG {selectedCount > 0 ? `(${selectedCount})` : ''}
      </button>

      <button onClick={onToggleMultiSelect} className={`px-2 py-1 rounded border font-medium ${multiSelect ? 'text-white' : ''}`}
        style={multiSelect ? { backgroundColor: '#7c3aed', borderColor: '#6d28d9', color: '#fff' } : b}>
        {multiSelect ? 'Multi ON' : 'Multi'}
      </button>

      {selectedCount > 0 && (
        <button onClick={onClearSelection} className="px-2 py-1 rounded border ml-auto" style={b}>
          Limpiar ({selectedCount})
        </button>
      )}
    </div>
  );
}
