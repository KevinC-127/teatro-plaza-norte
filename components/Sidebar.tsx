'use client';

import React, { useState } from 'react';
import type { Seat, SeatStatus, AccessibilityType, SeatBlock } from '@/types/seat';
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
  onRenameRow: (block: SeatBlock, oldLabel: string, newLabel: string) => void;
  onRenumberRow: (block: SeatBlock, rowLabel: string, startAt: number) => void;
  onAlignSelected: () => void;
  onResetPositions: () => void;
  editMode: boolean;
  gridSize: number;
}

const STATUS_OPTIONS: { value: SeatStatus; label: string; color: string }[] = [
  { value: 'free', label: 'Sin reservar', color: '#e2e4e9' },
  { value: 'pending', label: 'Pendiente', color: '#f59e0b' },
  { value: 'reserved', label: 'Reservado', color: '#ef4444' },
];

const PRESET_COLORS = [
  '#e2e4e9', '#f59e0b', '#ef4444', '#eab308', '#22c55e',
  '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
];

const ACCESSIBILITY_OPTIONS: { value: AccessibilityType; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'accessible-seat', label: 'Accesible (A)' },
  { value: 'wheelchair-space', label: 'Silla ruedas (W)' },
  { value: 'companion-seat', label: 'Acompañante (C)' },
];

const BLOCKS: SeatBlock[] = ['left', 'center', 'right'];

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
  const [renumberBlock, setRenumberBlock] = useState<SeatBlock>('center');
  const [renumberRow, setRenumberRowLabel] = useState('');
  const [renumberStart, setRenumberStart] = useState(1);
  const [reserveName, setReserveName] = useState('');
  const [colorInput, setColorInput] = useState('#e2e4e9');

  const surfaceStyle = {
    backgroundColor: 'var(--bg-surface)',
    borderColor: 'var(--border-color)',
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-surface-hover)',
    borderColor: 'var(--border-color)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
  };

  const btnStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-surface-hover)',
    borderColor: 'var(--border-color)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-color)',
  };

  return (
    <div
      className="w-72 border-l p-3 overflow-y-auto text-xs flex flex-col gap-3"
      style={surfaceStyle}
    >
      <h2
        className="font-semibold text-sm border-b pb-1"
        style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
      >
        {singleSeat
          ? `${getBlockLabel(singleSeat.block)} ${singleSeat.rowLabel}-${singleSeat.seatNumber}`
          : selectedCount > 1
          ? `${selectedCount} butacas`
          : 'Sin selección'}
      </h2>

      {singleSeat && (
        <div className="flex flex-col gap-2">
          <h3 style={{ color: 'var(--text-secondary)' }} className="font-medium">Detalle</h3>
          <div className="grid grid-cols-2 gap-1" style={{ color: 'var(--text-primary)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Bloque:</span>
            <span>{getBlockLabel(singleSeat.block)}</span>
            <span style={{ color: 'var(--text-muted)' }}>Fila:</span>
            <span>{singleSeat.rowLabel}</span>
            <span style={{ color: 'var(--text-muted)' }}>Asiento:</span>
            <span>{singleSeat.seatNumber}</span>
            <span style={{ color: 'var(--text-muted)' }}>Estado:</span>
            <span>{getStatusLabel(singleSeat.status)}</span>
            <span style={{ color: 'var(--text-muted)' }}>Accesibilidad:</span>
            <span>{getAccessibilityLabel(singleSeat.accessibilityType)}</span>
            <span style={{ color: 'var(--text-muted)' }}>Reservado:</span>
            <span>{singleSeat.reservedFor || '-'}</span>
          </div>

          <label style={{ color: 'var(--text-muted)', fontSize: 10 }}>Notas</label>
          <textarea
            value={singleSeat.notes}
            onChange={(e) => onUpdateSeat({ notes: e.target.value })}
            className="rounded px-2 py-1 resize-none h-12"
            style={{ ...inputStyle, fontSize: 10 }}
          />

          {editMode && (
            <>
              <div className="flex gap-2 items-center">
                <label style={{ color: 'var(--text-muted)', fontSize: 10 }}>X</label>
                <input
                  type="number"
                  value={singleSeat.x}
                  onChange={(e) => onUpdateSeat({ x: Number(e.target.value) })}
                  className="rounded px-1 py-0.5 w-16"
                  style={{ ...inputStyle, fontSize: 10 }}
                />
                <label style={{ color: 'var(--text-muted)', fontSize: 10 }}>Y</label>
                <input
                  type="number"
                  value={singleSeat.y}
                  onChange={(e) => onUpdateSeat({ y: Number(e.target.value) })}
                  className="rounded px-1 py-0.5 w-16"
                  style={{ ...inputStyle, fontSize: 10 }}
                />
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: 9 }}>
                Grid: {gridSize}px | Seed: {singleSeat.seedX},{singleSeat.seedY}
              </span>
            </>
          )}
        </div>
      )}

      {selectedCount > 0 && (
        <div className="flex flex-col gap-2 pt-2" style={{ borderTop: `1px solid var(--border-color)` }}>
          <h3 style={{ color: 'var(--text-secondary)' }} className="font-medium">Edición masiva ({selectedCount})</h3>

          <label style={{ color: 'var(--text-muted)', fontSize: 10 }}>Estado</label>
          <div className="flex gap-1">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onApplyStatus(opt.value)}
                className="flex-1 px-1 py-1 rounded text-[10px] font-medium hover:opacity-85 transition-opacity"
                style={{
                  backgroundColor: opt.color,
                  color: opt.value === 'free' ? '#374151' : '#fff',
                  border: '1px solid rgba(0,0,0,0.15)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <label style={{ color: 'var(--text-muted)', fontSize: 10 }}>Color</label>
          <div className="flex gap-1 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => onApplyColor(c)}
                className="w-5 h-5 rounded border hover:scale-110 transition-transform"
                style={{ backgroundColor: c, borderColor: 'rgba(0,0,0,0.2)' }}
              />
            ))}
          </div>
          <div className="flex gap-1">
            <input
              type="color"
              value={colorInput}
              onChange={(e) => setColorInput(e.target.value)}
              className="w-7 h-5 rounded border cursor-pointer"
              style={{ borderColor: 'var(--border-color)' }}
            />
            <button
              onClick={() => onApplyColor(colorInput)}
              className="px-2 py-0.5 rounded text-[10px]"
              style={btnStyle}
            >
              Aplicar
            </button>
          </div>

          <label style={{ color: 'var(--text-muted)', fontSize: 10 }}>Accesibilidad</label>
          <div className="flex flex-wrap gap-1">
            {ACCESSIBILITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onApplyAccessibility(opt.value)}
                className="px-2 py-1 rounded text-[10px]"
                style={btnStyle}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <label style={{ color: 'var(--text-muted)', fontSize: 10 }}>Reservado para</label>
          <div className="flex gap-1">
            <input
              type="text"
              value={reserveName}
              onChange={(e) => setReserveName(e.target.value)}
              placeholder="Nombre..."
              className="flex-1 rounded px-2 py-1"
              style={{ ...inputStyle, fontSize: 10 }}
            />
            <button
              onClick={() => { onApplyReservation(reserveName); setReserveName(''); }}
              className="px-2 py-1 rounded text-[10px]"
              style={btnStyle}
            >
              Asignar
            </button>
          </div>
          <button
            onClick={onClearReservation}
            className="px-2 py-1 rounded text-[10px]"
            style={btnStyle}
          >
            Limpiar reservación
          </button>

          {editMode && (
            <>
              <button onClick={onAlignSelected} className="px-2 py-1 rounded text-[10px]" style={btnStyle}>
                Alinear selección
              </button>
              <button onClick={onResetPositions} className="px-2 py-1 rounded text-[10px]" style={btnStyle}>
                Reset posición
              </button>
            </>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2 pt-2" style={{ borderTop: `1px solid var(--border-color)` }}>
        <h3 style={{ color: 'var(--text-secondary)' }} className="font-medium">Renombrar fila</h3>
        <div className="flex gap-1">
          <input
            type="text"
            value={renameOld}
            onChange={(e) => setRenameOld(e.target.value)}
            placeholder="Actual (ej: A)"
            className="flex-1 rounded px-2 py-1"
            style={{ ...inputStyle, fontSize: 10 }}
          />
          <input
            type="text"
            value={renameNew}
            onChange={(e) => setRenameNew(e.target.value)}
            placeholder="Nuevo (ej: B)"
            className="flex-1 rounded px-2 py-1"
            style={{ ...inputStyle, fontSize: 10 }}
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {BLOCKS.map((block) => (
            <button
              key={block}
              onClick={() => { if (renameOld && renameNew) onRenameRow(block, renameOld, renameNew); }}
              className="px-2 py-0.5 rounded text-[10px]"
              style={btnStyle}
            >
              {getBlockLabel(block)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-2" style={{ borderTop: `1px solid var(--border-color)` }}>
        <h3 style={{ color: 'var(--text-secondary)' }} className="font-medium">Renumerar fila</h3>
        <div className="flex gap-1">
          <select
            value={renumberBlock}
            onChange={(e) => setRenumberBlock(e.target.value as SeatBlock)}
            className="rounded px-1 py-1"
            style={{ ...inputStyle, fontSize: 10 }}
          >
            {BLOCKS.map((b) => (
              <option key={b} value={b}>{getBlockLabel(b)}</option>
            ))}
          </select>
          <input
            type="text"
            value={renumberRow}
            onChange={(e) => setRenumberRowLabel(e.target.value)}
            placeholder="Fila (A)"
            className="w-16 rounded px-2 py-1"
            style={{ ...inputStyle, fontSize: 10 }}
          />
        </div>
        <div className="flex gap-1 items-center">
          <label style={{ color: 'var(--text-muted)', fontSize: 10 }}>Desde</label>
          <input
            type="number"
            value={renumberStart}
            onChange={(e) => setRenumberStart(Number(e.target.value))}
            className="w-16 rounded px-2 py-1"
            style={{ ...inputStyle, fontSize: 10 }}
          />
          <button
            onClick={() => onRenumberRow(renumberBlock, renumberRow, renumberStart)}
            className="px-2 py-0.5 rounded text-[10px]"
            style={btnStyle}
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}
