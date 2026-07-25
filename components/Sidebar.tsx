'use client';

import React, { useState } from 'react';
import type { Seat, SeatStatus, AccessibilityType } from '@/types/seat';
import { getAccessibilityLabel, getStatusLabel, getBlockLabel } from '@/lib/seat-layout';

interface SidebarProps {
  singleSeat: Seat | null;
  selectedCount: number;
  onUpdateSeat: (changes: Partial<Seat>) => void;
  onUpdateSelected: (changes: Partial<Seat>) => void;
  onApplyStatus: (status: SeatStatus) => void;
  onApplyColor: (color: string) => void;
  onApplyReservation: (name: string) => void;
  onClearReservation: () => void;
  onApplyAccessibility: (type: AccessibilityType) => void;
  onRenameRow: (block: Seat['block'], oldLabel: string, newLabel: string) => void;
  onRenumberRow: (block: Seat['block'], rowLabel: string, startAt: number) => void;
  onAlignSelected: () => void;
  onResetPositions: () => void;
  editMode: boolean;
  gridSize: number;
}

const STATUS_OPTIONS: { value: SeatStatus; label: string; color: string }[] = [
  { value: 'free', label: 'Sin reservar', color: '#e5e7eb' },
  { value: 'pending', label: 'Pendiente', color: '#f59e0b' },
  { value: 'reserved', label: 'Reservado', color: '#ef4444' },
];

const PRESET_COLORS = [
  '#e5e7eb', '#f59e0b', '#ef4444', '#eab308', '#22c55e',
  '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
];

const ACCESSIBILITY_OPTIONS: { value: AccessibilityType; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'accessible-seat', label: 'Accesible (A)' },
  { value: 'wheelchair-space', label: 'Silla ruedas (W)' },
  { value: 'companion-seat', label: 'Acompañante (C)' },
];

export function Sidebar({
  singleSeat,
  selectedCount,
  onUpdateSeat,
  onUpdateSelected,
  onApplyStatus,
  onApplyColor,
  onApplyReservation,
  onClearReservation,
  onApplyAccessibility,
  onRenameRow,
  onRenumberRow,
  onAlignSelected,
  onResetPositions,
  editMode,
  gridSize,
}: SidebarProps) {
  const [renameOld, setRenameOld] = useState('');
  const [renameNew, setRenameNew] = useState('');
  const [renumberBlock, setRenumberBlock] = useState<Seat['block']>('center-left');
  const [renumberRow, setRenumberRowLabel] = useState('');
  const [renumberStart, setRenumberStart] = useState(1);
  const [reserveName, setReserveName] = useState('');
  const [colorInput, setColorInput] = useState('#e5e7eb');

  return (
    <div className="w-72 bg-gray-900 border-l border-gray-700 p-3 overflow-y-auto text-xs flex flex-col gap-3">
      <h2 className="text-gray-300 font-semibold text-sm border-b border-gray-700 pb-1">
        {singleSeat
          ? `Butaca ${singleSeat.block} ${singleSeat.rowLabel}-${singleSeat.seatNumber}`
          : selectedCount > 1
          ? `${selectedCount} butacas seleccionadas`
          : 'Sin selección'}
      </h2>

      {singleSeat && (
        <div className="flex flex-col gap-2">
          <h3 className="text-gray-400 font-medium">Detalle individual</h3>
          <div className="grid grid-cols-2 gap-1 text-gray-300">
            <span className="text-gray-500">Bloque:</span>
            <span>{getBlockLabel(singleSeat.block)}</span>
            <span className="text-gray-500">Fila:</span>
            <span>{singleSeat.rowLabel}</span>
            <span className="text-gray-500">Asiento:</span>
            <span>{singleSeat.seatNumber}</span>
            <span className="text-gray-500">Estado:</span>
            <span>{getStatusLabel(singleSeat.status)}</span>
            <span className="text-gray-500">Accesibilidad:</span>
            <span>{getAccessibilityLabel(singleSeat.accessibilityType)}</span>
            <span className="text-gray-500">Reservado:</span>
            <span>{singleSeat.reservedFor || '-'}</span>
          </div>

          <label className="text-gray-400 text-[10px]">Notas</label>
          <textarea
            value={singleSeat.notes}
            onChange={(e) => onUpdateSeat({ notes: e.target.value })}
            className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-200 text-[10px] resize-none h-12"
          />

          {editMode && (
            <>
              <div className="flex gap-2">
                <label className="text-gray-400 text-[10px]">X</label>
                <input
                  type="number"
                  value={singleSeat.x}
                  onChange={(e) => onUpdateSeat({ x: Number(e.target.value) })}
                  className="bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-gray-200 w-16 text-[10px]"
                />
                <label className="text-gray-400 text-[10px]">Y</label>
                <input
                  type="number"
                  value={singleSeat.y}
                  onChange={(e) => onUpdateSeat({ y: Number(e.target.value) })}
                  className="bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-gray-200 w-16 text-[10px]"
                />
              </div>
              <span className="text-gray-500 text-[9px]">
                Grid: {gridSize}px | Seed: {singleSeat.seedX},{singleSeat.seedY}
              </span>
            </>
          )}
        </div>
      )}

      {selectedCount > 0 && (
        <div className="flex flex-col gap-2 border-t border-gray-700 pt-2">
          <h3 className="text-gray-400 font-medium">Edición masiva ({selectedCount})</h3>

          <label className="text-gray-400 text-[10px]">Estado</label>
          <div className="flex gap-1">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onApplyStatus(opt.value)}
                className="flex-1 px-1 py-1 rounded border border-gray-600 text-[10px] hover:opacity-80"
                style={{ backgroundColor: opt.color, color: opt.value === 'free' ? '#333' : '#fff' }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <label className="text-gray-400 text-[10px]">Color</label>
          <div className="flex gap-1 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => onApplyColor(c)}
                className="w-5 h-5 rounded border border-gray-600 hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex gap-1">
            <input
              type="color"
              value={colorInput}
              onChange={(e) => setColorInput(e.target.value)}
              className="w-8 h-6 rounded border border-gray-600 bg-transparent cursor-pointer"
            />
            <button
              onClick={() => onApplyColor(colorInput)}
              className="px-2 py-0.5 rounded bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600 text-[10px]"
            >
              Aplicar color
            </button>
          </div>

          <label className="text-gray-400 text-[10px]">Accesibilidad</label>
          <div className="flex flex-wrap gap-1">
            {ACCESSIBILITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onApplyAccessibility(opt.value)}
                className="px-2 py-1 rounded bg-gray-800 border border-gray-600 text-gray-300 hover:bg-gray-700 text-[10px]"
              >
                {opt.label}
              </button>
            ))}
          </div>

          <label className="text-gray-400 text-[10px]">Reservado para</label>
          <div className="flex gap-1">
            <input
              type="text"
              value={reserveName}
              onChange={(e) => setReserveName(e.target.value)}
              placeholder="Nombre..."
              className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-200 text-[10px]"
            />
            <button
              onClick={() => {
                onApplyReservation(reserveName);
                setReserveName('');
              }}
              className="px-2 py-1 rounded bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600 text-[10px]"
            >
              Asignar
            </button>
          </div>
          <button
            onClick={onClearReservation}
            className="px-2 py-1 rounded bg-gray-800 border border-gray-600 text-gray-400 hover:bg-gray-700 text-[10px]"
          >
            Limpiar reservación
          </button>

          {editMode && (
            <>
              <button
                onClick={onAlignSelected}
                className="px-2 py-1 rounded bg-gray-800 border border-gray-600 text-gray-300 hover:bg-gray-700 text-[10px]"
              >
                Alinear selección
              </button>
              <button
                onClick={onResetPositions}
                className="px-2 py-1 rounded bg-gray-800 border border-gray-600 text-gray-300 hover:bg-gray-700 text-[10px]"
              >
                Reset posición
              </button>
            </>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2 border-t border-gray-700 pt-2">
        <h3 className="text-gray-400 font-medium">Renombrar fila</h3>
        <div className="flex gap-1">
          <input
            type="text"
            value={renameOld}
            onChange={(e) => setRenameOld(e.target.value)}
            placeholder="Actual (ej: A)"
            className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-200 text-[10px]"
          />
          <input
            type="text"
            value={renameNew}
            onChange={(e) => setRenameNew(e.target.value)}
            placeholder="Nuevo (ej: B)"
            className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-200 text-[10px]"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {(['left', 'center-left', 'center-right', 'right'] as const).map((block) => (
            <button
              key={block}
              onClick={() => {
                if (renameOld && renameNew) onRenameRow(block, renameOld, renameNew);
              }}
              className="px-2 py-0.5 rounded bg-gray-800 border border-gray-600 text-gray-300 hover:bg-gray-700 text-[10px]"
            >
              {block}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-gray-700 pt-2">
        <h3 className="text-gray-400 font-medium">Renumerar fila</h3>
        <div className="flex gap-1">
          <select
            value={renumberBlock}
            onChange={(e) => setRenumberBlock(e.target.value as Seat['block'])}
            className="bg-gray-800 border border-gray-600 rounded px-1 py-1 text-gray-200 text-[10px]"
          >
            <option value="left">left</option>
            <option value="center-left">center-left</option>
            <option value="center-right">center-right</option>
            <option value="right">right</option>
          </select>
          <input
            type="text"
            value={renumberRow}
            onChange={(e) => setRenumberRowLabel(e.target.value)}
            placeholder="Fila (ej: A)"
            className="w-16 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-200 text-[10px]"
          />
        </div>
        <div className="flex gap-1">
          <label className="text-gray-400 text-[10px] self-center">Desde</label>
          <input
            type="number"
            value={renumberStart}
            onChange={(e) => setRenumberStart(Number(e.target.value))}
            className="w-16 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-200 text-[10px]"
          />
          <button
            onClick={() => onRenumberRow(renumberBlock, renumberRow, renumberStart)}
            className="px-2 py-0.5 rounded bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600 text-[10px]"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}
