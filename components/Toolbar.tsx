'use client';

import React from 'react';

interface ToolbarProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  selectedCount: number;
  multiSelect: boolean;
  onToggleMultiSelect: () => void;
  onGeneratePNG: () => void;
  onGenerateFullMap: () => void;
  onClearSelection: () => void;
  customers: string[];
  selectedCustomer: string | null;
  onSelectCustomer: (name: string | null) => void;
  onGeneratePDF: () => void;
}

export function Toolbar({
  theme, onToggleTheme, selectedCount, multiSelect, onToggleMultiSelect,
  onGeneratePNG, onGenerateFullMap, onClearSelection,
  customers, selectedCustomer, onSelectCustomer, onGeneratePDF,
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

      <button onClick={onGenerateFullMap} className="px-2 py-1 rounded border font-medium"
        style={{ backgroundColor: '#059669', borderColor: '#047857', color: '#fff' }}>
        Mapa PNG
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

      {customers.length > 0 && (
        <>
          <div className="h-4 w-px mx-1" style={{ backgroundColor: 'var(--border-color)' }} />
          <select value={selectedCustomer || ''} onChange={e => onSelectCustomer(e.target.value || null)}
            className="px-2 py-1 rounded border text-xs max-w-[130px]"
            style={{
              ...b,
              color: 'var(--text-primary)',
              backgroundImage: 'none',
            }}>
            <option value="">Cliente...</option>
            {customers.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={onGeneratePDF} disabled={!selectedCustomer}
            className="px-2 py-1 rounded border font-medium disabled:opacity-30"
            style={{ backgroundColor: '#dc2626', borderColor: '#b91c1c', color: '#fff' }}>
            PDF Boleta
          </button>
        </>
      )}

      {selectedCount > 0 && (
        <button onClick={onClearSelection} className="px-2 py-1 rounded border ml-auto" style={b}>
          Limpiar ({selectedCount})
        </button>
      )}
    </div>
  );
}
