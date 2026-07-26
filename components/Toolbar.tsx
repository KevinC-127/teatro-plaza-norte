'use client';

import React from 'react';
import { GRID_SIZES } from '@/lib/seat-layout';
import type { AccessibilityType } from '@/types/seat';

interface ToolbarProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  editMode: boolean;
  onToggleEditMode: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  gridSize: number;
  onGridSizeChange: (size: number) => void;
  selectedCount: number;
  onAlignSelected: () => void;
  onResetPositions: () => void;
  onWhatsAppCopy: () => void;
  onGeneratePNG: () => void;
  accessibilityType: AccessibilityType;
  onAccessibilityChange: (type: AccessibilityType) => void;
  onClearSelection: () => void;
}

export function Toolbar({
  theme,
  onToggleTheme,
  editMode,
  onToggleEditMode,
  showGrid,
  onToggleGrid,
  gridSize,
  onGridSizeChange,
  selectedCount,
  onAlignSelected,
  onResetPositions,
  onWhatsAppCopy,
  onGeneratePNG,
  accessibilityType,
  onAccessibilityChange,
  onClearSelection,
}: ToolbarProps) {
  const surfaceStyle = {
    backgroundColor: 'var(--bg-surface)',
    borderColor: 'var(--border-color)',
  };

  const btnBase = {
    backgroundColor: 'var(--bg-surface-hover)',
    borderColor: 'var(--border-color)',
    color: 'var(--text-secondary)',
  };

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 border-b flex-wrap text-xs"
      style={surfaceStyle}
    >
      <span className="font-semibold mr-1 select-none" style={{ color: 'var(--text-primary)' }}>
        Teatro Plaza Norte
      </span>
      <div className="h-4 w-px mx-1" style={{ backgroundColor: 'var(--border-color)' }} />

      <button
        onClick={onToggleTheme}
        className="px-2 py-1 rounded border transition-colors"
        style={btnBase}
        title={`Tema: ${theme === 'dark' ? 'oscuro' : 'claro'}`}
      >
        {theme === 'dark' ? '\u263E' : '\u2600'}
      </button>

      <button
        onClick={onToggleEditMode}
        className={`px-2 py-1 rounded border transition-colors font-medium ${
          editMode ? 'text-white' : ''
        }`}
        style={
          editMode
            ? { backgroundColor: '#ca8a04', borderColor: '#a16207', color: '#fff' }
            : btnBase
        }
      >
        {editMode ? 'Editando' : 'Modo edición'}
      </button>

      {editMode && (
        <>
          <button
            onClick={onToggleGrid}
            className="px-2 py-1 rounded border transition-colors"
            style={
              showGrid
                ? { backgroundColor: '#2563eb', borderColor: '#1d4ed8', color: '#fff' }
                : btnBase
            }
          >
            Malla {showGrid ? 'ON' : 'OFF'}
          </button>

          <select
            value={gridSize}
            onChange={(e) => onGridSizeChange(Number(e.target.value))}
            className="rounded px-1 py-1 text-xs"
            style={{
              backgroundColor: 'var(--bg-surface-hover)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
            }}
          >
            {GRID_SIZES.map((s) => (
              <option key={s} value={s}>Grid {s}px</option>
            ))}
          </select>

          <select
            value={accessibilityType}
            onChange={(e) => onAccessibilityChange(e.target.value as AccessibilityType)}
            className="rounded px-1 py-1 text-xs"
            style={{
              backgroundColor: 'var(--bg-surface-hover)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
            }}
          >
            <option value="normal">Normal</option>
            <option value="accessible-seat">Accesible (A)</option>
            <option value="wheelchair-space">Silla ruedas (W)</option>
            <option value="companion-seat">Acompañante (C)</option>
          </select>

          <button onClick={onAlignSelected} disabled={selectedCount === 0}
            className="px-2 py-1 rounded border transition-colors disabled:opacity-30"
            style={btnBase}>Alinear</button>

          <button onClick={onResetPositions} disabled={selectedCount === 0}
            className="px-2 py-1 rounded border transition-colors disabled:opacity-30"
            style={btnBase}>Reset posición</button>

          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            | Clic en canvas = agregar butaca
          </span>
        </>
      )}

      <div className="h-4 w-px mx-1" style={{ backgroundColor: 'var(--border-color)' }} />

      <button
        onClick={onWhatsAppCopy}
        disabled={selectedCount === 0}
        className="px-2 py-1 rounded border font-medium transition-colors disabled:opacity-30"
        style={{ backgroundColor: '#16a34a', borderColor: '#15803d', color: '#fff' }}
      >
        WhatsApp {selectedCount > 0 ? `(${selectedCount})` : ''}
      </button>

      <button
        onClick={onGeneratePNG}
        disabled={selectedCount === 0}
        className="px-2 py-1 rounded border font-medium transition-colors disabled:opacity-30"
        style={{ backgroundColor: '#7c3aed', borderColor: '#6d28d9', color: '#fff' }}
      >
        Generar PNG {selectedCount > 0 ? `(${selectedCount})` : ''}
      </button>

      {selectedCount > 0 && (
        <button onClick={onClearSelection} className="px-2 py-1 rounded border transition-colors ml-auto" style={btnBase}>
          Limpiar ({selectedCount})
        </button>
      )}

      {editMode && (
        <span className="ml-auto text-[10px]" style={{ color: 'var(--text-muted)' }}>
          Flechas = mover | Shift+Flechas = x3 | Esc = limpiar
        </span>
      )}
    </div>
  );
}
