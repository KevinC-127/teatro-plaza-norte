'use client';

import React, { useRef } from 'react';

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
  onExport: () => void;
  onImport: (json: string) => void;
  onGenerateSummary: () => void;
  pdfBoletaNum: string;
  onChangeBoletaNum: (v: string) => void;
}

export function Toolbar({
  theme, onToggleTheme, selectedCount, multiSelect, onToggleMultiSelect,
  onGeneratePNG, onGenerateFullMap, onClearSelection,
  customers, selectedCustomer, onSelectCustomer, onGeneratePDF,
  onExport, onImport, onGenerateSummary,
  pdfBoletaNum, onChangeBoletaNum,
}: ToolbarProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const s = { backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' };
  const b = { backgroundColor: 'var(--bg-surface-hover)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => { onImport(reader.result as string); };
    reader.readAsText(f);
    e.target.value = '';
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b flex-wrap text-xs" style={s}>
      <span className="font-semibold mr-1 select-none" style={{ color: 'var(--text-primary)' }}>Teatro Plaza Norte</span>
      <div className="h-4 w-px mx-1" style={{ backgroundColor: 'var(--border-color)' }} />

      <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFile} />

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

      <button onClick={onExport} className="px-2 py-1 rounded border font-medium" style={b}>
        Exportar
      </button>
      <button onClick={() => fileRef.current?.click()} className="px-2 py-1 rounded border font-medium" style={b}>
        Importar
      </button>

      <button onClick={onGenerateSummary} className="px-2 py-1 rounded border font-medium"
        style={{ backgroundColor: '#0891b2', borderColor: '#0e7490', color: '#fff' }}>
        Resumen
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
          <input type="text" inputMode="numeric" value={pdfBoletaNum}
            onChange={e => onChangeBoletaNum(e.target.value)}
            className="w-12 px-1 py-1 rounded border text-xs text-center"
            style={{ backgroundColor: 'var(--bg-surface-hover)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            title="Numero de boleta" />
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
