'use client';

import React from 'react';

interface ToolbarProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  editMode: boolean;
  onToggleEditMode: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  selectedCount: number;
  onAlignSelected: () => void;
  onResetPositions: () => void;
  onWhatsAppCopy: () => void;
  onGeneratePNG: () => void;
  onClearSelection: () => void;
}

export function Toolbar({
  theme, onToggleTheme, editMode, onToggleEditMode,
  showGrid, onToggleGrid, selectedCount,
  onAlignSelected, onResetPositions,
  onWhatsAppCopy, onGeneratePNG, onClearSelection,
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

      <button onClick={onToggleEditMode} className={`px-2 py-1 rounded border font-medium ${editMode ? 'text-white' : ''}`}
        style={editMode ? { backgroundColor: '#ca8a04', borderColor: '#a16207', color: '#fff' } : b}>
        {editMode ? 'Editando' : 'Editar'}
      </button>

      {editMode && (
        <>
          <button onClick={onToggleGrid} className="px-2 py-1 rounded border font-medium"
            style={showGrid ? { backgroundColor: '#2563eb', borderColor: '#1d4ed8', color: '#fff' } : b}>
            Malla {showGrid ? 'ON' : 'OFF'}
          </button>
          <button onClick={onAlignSelected} disabled={selectedCount === 0}
            className="px-2 py-1 rounded border disabled:opacity-30" style={b}>Alinear</button>
          <button onClick={onResetPositions} disabled={selectedCount === 0}
            className="px-2 py-1 rounded border disabled:opacity-30" style={b}>Reset</button>
        </>
      )}

      <div className="h-4 w-px mx-1" style={{ backgroundColor: 'var(--border-color)' }} />

      <button onClick={onWhatsAppCopy} disabled={selectedCount === 0}
        className="px-2 py-1 rounded border font-medium disabled:opacity-30"
        style={{ backgroundColor: '#16a34a', borderColor: '#15803d', color: '#fff' }}>
        WhatsApp {selectedCount > 0 ? `(${selectedCount})` : ''}
      </button>
      <button onClick={onGeneratePNG} disabled={selectedCount === 0}
        className="px-2 py-1 rounded border font-medium disabled:opacity-30"
        style={{ backgroundColor: '#7c3aed', borderColor: '#6d28d9', color: '#fff' }}>
        PNG {selectedCount > 0 ? `(${selectedCount})` : ''}
      </button>

      {selectedCount > 0 && (
        <button onClick={onClearSelection} className="px-2 py-1 rounded border ml-auto" style={b}>
          Limpiar ({selectedCount})
        </button>
      )}

      {editMode && (
        <span className="ml-auto text-[10px]" style={{ color: 'var(--text-muted)' }}>
          Ctrl+click = multiselect | Flechas = mover | Esc = limpiar
        </span>
      )}
    </div>
  );
}
