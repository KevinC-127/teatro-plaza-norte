'use client';

import React from 'react';
import type { Seat } from '@/types/seat';
import { getAccessibilityIcon, getAccessibilityLabel, getStatusLabel, getBlockLabel } from '@/lib/seat-layout';

interface SeatComponentProps {
  seat: Seat;
  isSelected: boolean;
  isEditMode: boolean;
  isDragging: boolean;
  offsetX: number;
  offsetY: number;
  onClick: (e: React.MouseEvent) => void;
}

export function SeatComponent({
  seat,
  isSelected,
  isEditMode,
  isDragging,
  offsetX,
  offsetY,
  onClick,
}: SeatComponentProps) {
  const accessIcon = getAccessibilityIcon(seat.accessibilityType);
  const accessLabel = getAccessibilityLabel(seat.accessibilityType);

  const tooltip = [
    getBlockLabel(seat.block),
    `Fila ${seat.rowLabel}`,
    `Asiento ${seat.seatNumber}`,
    getStatusLabel(seat.status),
    seat.reservedFor ? `Reservado: ${seat.reservedFor}` : '',
    `Accesibilidad: ${accessLabel}`,
    seat.notes ? `Notas: ${seat.notes}` : '',
  ]
    .filter(Boolean)
    .join(' | ');

  const cursor = isEditMode ? (isDragging ? 'grabbing' : 'grab') : 'pointer';

  const seatWidth = 28;
  const seatHeight = 24;

  return (
    <div
      title={tooltip}
      onClick={onClick}
      className="absolute flex items-center justify-center select-none"
      style={{
        left: seat.x + offsetX,
        top: seat.y + offsetY,
        width: seatWidth,
        height: seatHeight,
        cursor,
        borderRadius: '4px 4px 2px 2px',
        backgroundColor: seat.color,
        color: '#1a1a1a',
        fontSize: 9,
        fontWeight: 700,
        lineHeight: 1,
        border: '1px solid rgba(0,0,0,0.2)',
        boxShadow: isSelected
          ? '0 0 0 2px #3b82f6, inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.12)'
          : 'inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.12)',
        zIndex: isDragging ? 30 : isSelected ? 20 : 10,
        transition: isDragging ? 'none' : 'box-shadow 0.12s',
        opacity: isDragging ? 0.85 : 1,
      }}
    >
      {accessIcon && (
        <span
          className="absolute flex items-center justify-center font-bold text-white rounded-full"
          style={{
            top: -4,
            right: -4,
            width: 12,
            height: 12,
            fontSize: 7,
            lineHeight: 1,
            backgroundColor: '#1e293b',
          }}
          title={accessLabel}
        >
          {accessIcon}
        </span>
      )}
      <span>{seat.seatNumber}</span>
    </div>
  );
}
