'use client';

import React, { useState } from 'react';
import type { Seat, SeatStatus } from '@/types/seat';
import { getStatusLabel } from '@/lib/seat-layout';

interface SidebarProps {
  singleSeat: Seat | null;
  selectedCount: number;
  onUpdateSeat: (changes: Partial<Seat>) => void;
  onUpdateSelected: (changes: Partial<Seat>) => void;
  onApplyStatus: (status: SeatStatus) => void;
  onApplyColor: (color: string) => void;
  onApplyReservation: (name: string) => void;
  onClearReservation: () => void;
  editMode: boolean;
}

const STATUS_OPTS: { value: SeatStatus; label: string; color: string }[] = [
  { value: 'free', label: 'Libre', color: '#e2e4e9' },
  { value: 'pending', label: 'Pendiente', color: '#f59e0b' },
  { value: 'reserved', label: 'Reservado', color: '#ef4444' },
];

const PRESET_COLORS = ['#e2e4e9', '#f59e0b', '#ef4444', '#eab308', '#22c55e'];

export function Sidebar({
  singleSeat, selectedCount, onUpdateSeat, onUpdateSelected,
  onApplyStatus, onApplyColor, onApplyReservation, onClearReservation,
  editMode,
}: SidebarProps) {
  const [reserveName, setReserveName] = useState('');
  const [colorInput, setColorInput] = useState('#e2e4e9');

  const surface = { backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' };
  const inp: React.CSSProperties = { backgroundColor: 'var(--bg-surface-hover)', borderColor: 'var(--border-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' };
  const btn: React.CSSProperties = { backgroundColor: 'var(--bg-surface-hover)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' };

  return (
    <div className="w-72 border-l p-3 overflow-y-auto text-xs flex flex-col gap-3" style={surface}>
      <h2 className="font-semibold text-sm border-b pb-1" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>
        {singleSeat
          ? `${singleSeat.rowLabel}-${singleSeat.seatNumber}`
          : selectedCount > 1
          ? `${selectedCount} butacas`
          : 'Sin seleccion'}
      </h2>

      {singleSeat && (
        <div className="flex flex-col gap-2">
          <h3 style={{ color: 'var(--text-secondary)' }} className="font-medium">Detalle</h3>
          <div className="grid grid-cols-2 gap-1" style={{ color: 'var(--text-primary)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Categoria:</span>
            <span className="font-semibold">{singleSeat.category || '-'}</span>
            <span style={{ color: 'var(--text-muted)' }}>Fila:</span>
            <span>{singleSeat.rowLabel}</span>
            <span style={{ color: 'var(--text-muted)' }}>Asiento:</span>
            <span>{singleSeat.seatNumber}</span>
            <span style={{ color: 'var(--text-muted)' }}>Estado:</span>
            <span>{getStatusLabel(singleSeat.status)}</span>
            <span style={{ color: 'var(--text-muted)' }}>Precio:</span>
            <span className="font-semibold">S/ {singleSeat.price.toFixed(2)}</span>
            <span style={{ color: 'var(--text-muted)' }}>Reservado:</span>
            <span>{singleSeat.reservedFor || '-'}</span>
            {singleSeat.accessibilityType === 'wheelchair-space' && (
              <>
                <span style={{ color: 'var(--text-muted)' }}>Accesibilidad:</span>
                <span style={{ color: '#eab308' }}>Silla de ruedas</span>
              </>
            )}
          </div>

          {editMode && (
            <>
              <label style={{ color: 'var(--text-muted)', fontSize: 10 }}>Precio</label>
              <input type="number" value={singleSeat.price}
                onChange={e => onUpdateSeat({ price: Number(e.target.value) })}
                className="rounded px-2 py-1" style={{ ...inp, fontSize: 10 }} />
              <label style={{ color: 'var(--text-muted)', fontSize: 10 }}>Notas</label>
              <textarea value={singleSeat.notes}
                onChange={e => onUpdateSeat({ notes: e.target.value })}
                className="rounded px-2 py-1 resize-none h-12" style={{ ...inp, fontSize: 10 }} />
              <div className="flex gap-2 items-center">
                <label style={{ color: 'var(--text-muted)', fontSize: 10 }}>X</label>
                <input type="number" value={singleSeat.x}
                  onChange={e => onUpdateSeat({ x: Number(e.target.value) })}
                  className="rounded px-1 py-0.5 w-16" style={{ ...inp, fontSize: 10 }} />
                <label style={{ color: 'var(--text-muted)', fontSize: 10 }}>Y</label>
                <input type="number" value={singleSeat.y}
                  onChange={e => onUpdateSeat({ y: Number(e.target.value) })}
                  className="rounded px-1 py-0.5 w-16" style={{ ...inp, fontSize: 10 }} />
              </div>
            </>
          )}
        </div>
      )}

      {selectedCount > 0 && (
        <div className="flex flex-col gap-2 pt-2" style={{ borderTop: `1px solid var(--border-color)` }}>
          <h3 style={{ color: 'var(--text-secondary)' }} className="font-medium">Edicion masiva ({selectedCount})</h3>

          <label style={{ color: 'var(--text-muted)', fontSize: 10 }}>Estado</label>
          <div className="flex gap-1">
            {STATUS_OPTS.map(opt => (
              <button key={opt.value} onClick={() => onApplyStatus(opt.value)}
                className="flex-1 px-1 py-1 rounded text-[10px] font-medium hover:opacity-85"
                style={{ backgroundColor: opt.color, color: opt.value === 'free' ? '#374151' : '#fff', border: '1px solid rgba(0,0,0,0.15)' }}>
                {opt.label}
              </button>
            ))}
          </div>

          <label style={{ color: 'var(--text-muted)', fontSize: 10 }}>Color</label>
          <div className="flex gap-1 flex-wrap">
            {PRESET_COLORS.map(c => (
              <button key={c} onClick={() => onApplyColor(c)} className="w-5 h-5 rounded border hover:scale-110"
                style={{ backgroundColor: c, borderColor: 'rgba(0,0,0,0.2)' }} />
            ))}
          </div>
          <div className="flex gap-1">
            <input type="color" value={colorInput} onChange={e => setColorInput(e.target.value)}
              className="w-7 h-5 rounded border cursor-pointer" style={{ borderColor: 'var(--border-color)' }} />
            <button onClick={() => onApplyColor(colorInput)} className="px-2 py-0.5 rounded text-[10px]" style={btn}>Aplicar</button>
          </div>

          <label style={{ color: 'var(--text-muted)', fontSize: 10 }}>Reservado para</label>
          <div className="flex gap-1">
            <input type="text" value={reserveName} onChange={e => setReserveName(e.target.value)}
              placeholder="Nombre..." className="flex-1 rounded px-2 py-1" style={{ ...inp, fontSize: 10 }} />
            <button onClick={() => { onApplyReservation(reserveName); setReserveName(''); }}
              className="px-2 py-1 rounded text-[10px]" style={btn}>Asignar</button>
          </div>
          <button onClick={onClearReservation} className="px-2 py-1 rounded text-[10px]" style={btn}>
            Limpiar reservacion
          </button>
        </div>
      )}
    </div>
  );
}
