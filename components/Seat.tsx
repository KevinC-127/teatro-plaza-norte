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

  return (
    <div
      title={tooltip}
      onClick={onClick}
      className={[
        'absolute flex items-center justify-center rounded text-[9px] font-bold select-none transition-shadow',
        'w-[28px] h-[24px] border',
        isSelected
          ? 'ring-2 ring-blue-400 border-blue-400 z-20 shadow-lg'
          : 'border-gray-600 z-10',
        isDragging ? 'opacity-80 shadow-xl z-30' : '',
        isEditMode && !isDragging ? 'hover:ring-1 hover:ring-blue-300' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        left: seat.x + offsetX + 2,
        top: seat.y + offsetY + 2,
        backgroundColor: seat.color,
        cursor,
        transition: isDragging ? 'none' : 'box-shadow 0.1s',
      }}
    >
      {accessIcon && (
        <span
          className="absolute -top-1 -right-1 text-[7px] leading-none bg-gray-800 text-white rounded-full w-3 h-3 flex items-center justify-center font-bold"
          title={`${accessLabel}`}
        >
          {accessIcon}
        </span>
      )}
      <span className="leading-none">{seat.seatNumber}</span>
    </div>
  );
}
