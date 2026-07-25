'use client';

import React from 'react';
import { GRID_SIZES } from '@/lib/seat-layout';
import type { AccessibilityType } from '@/types/seat';

interface ToolbarProps {
  editMode: boolean;
  onToggleEditMode: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  gridSize: number;
  onGridSizeChange: (size: number) => void;
  selectedCount: number;
  onAlignSelected: () => void;
  onResetPositions: () => void;
  onExport: () => void;
  onImport: () => void;
  onWhatsAppCopy: () => void;
  accessibilityType: AccessibilityType;
  onAccessibilityChange: (type: AccessibilityType) => void;
  onClearSelection: () => void;
}

export function Toolbar({
  editMode,
  onToggleEditMode,
  showGrid,
  onToggleGrid,
  gridSize,
  onGridSizeChange,
  selectedCount,
  onAlignSelected,
  onResetPositions,
  onExport,
  onImport,
  onWhatsAppCopy,
  accessibilityType,
  onAccessibilityChange,
  onClearSelection,
}: ToolbarProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 border-b border-gray-700 flex-wrap text-xs">
      <span className="text-gray-400 font-semibold mr-1">Teatro Plaza Norte</span>
      <div className="h-4 w-px bg-gray-600 mx-1" />

      <button
        onClick={onToggleEditMode}
        className={`px-2 py-1 rounded border transition-colors ${
          editMode
            ? 'bg-yellow-600 border-yellow-500 text-white'
            : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
        }`}
      >
        {editMode ? 'Modo edición ON' : 'Modo edición'}
      </button>

      {editMode && (
        <>
          <button
            onClick={onToggleGrid}
            className={`px-2 py-1 rounded border transition-colors ${
              showGrid
                ? 'bg-blue-700 border-blue-500 text-white'
                : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Malla {showGrid ? 'ON' : 'OFF'}
          </button>

          <select
            value={gridSize}
            onChange={(e) => onGridSizeChange(Number(e.target.value))}
            className="bg-gray-800 border border-gray-600 rounded px-1 py-1 text-gray-200"
          >
            {GRID_SIZES.map((s) => (
              <option key={s} value={s}>
                Grid {s}px
              </option>
            ))}
          </select>

          <select
            value={accessibilityType}
            onChange={(e) => onAccessibilityChange(e.target.value as AccessibilityType)}
            className="bg-gray-800 border border-gray-600 rounded px-1 py-1 text-gray-200"
          >
            <option value="normal">Normal</option>
            <option value="accessible-seat">Accesible (A)</option>
            <option value="wheelchair-space">Silla ruedas (W)</option>
            <option value="companion-seat">Acompañante (C)</option>
          </select>

          <button
            onClick={onAlignSelected}
            disabled={selectedCount === 0}
            className="px-2 py-1 rounded bg-gray-800 border border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-30"
          >
            Alinear
          </button>

          <button
            onClick={onResetPositions}
            disabled={selectedCount === 0}
            className="px-2 py-1 rounded bg-gray-800 border border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-30"
          >
            Reset posición
          </button>
        </>
      )}

      <div className="h-4 w-px bg-gray-600 mx-1" />

      <button
        onClick={onWhatsAppCopy}
        disabled={selectedCount === 0}
        className="px-2 py-1 rounded bg-green-700 border border-green-600 text-white hover:bg-green-600 disabled:opacity-30"
      >
        WhatsApp {selectedCount > 0 ? `(${selectedCount})` : ''}
      </button>

      <button
        onClick={onExport}
        className="px-2 py-1 rounded bg-gray-800 border border-gray-600 text-gray-300 hover:bg-gray-700"
      >
        Exportar JSON
      </button>

      <button
        onClick={onImport}
        className="px-2 py-1 rounded bg-gray-800 border border-gray-600 text-gray-300 hover:bg-gray-700"
      >
        Importar JSON
      </button>

      {selectedCount > 0 && (
        <button
          onClick={onClearSelection}
          className="px-2 py-1 rounded bg-gray-800 border border-gray-600 text-gray-400 hover:bg-gray-700 ml-auto"
        >
          Limpiar selección ({selectedCount})
        </button>
      )}

      {editMode && (
        <span className="text-gray-500 text-[10px] ml-auto">
          Flechas = mover | Shift+Flechas = mover ×3 | Esc = limpiar
        </span>
      )}
    </div>
  );
}
