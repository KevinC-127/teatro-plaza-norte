'use client';

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import type { Seat } from '@/types/seat';
import { snapX, snapY, findNearestFreeCell } from '@/lib/seat-layout';
import { SeatComponent } from './Seat';
import { GridOverlay } from './Grid';

interface SeatMapProps {
  seats: Seat[];
  selectedIds: Set<string>;
  editMode: boolean;
  showGrid: boolean;
  onToggleSelect: (id: string, ctrlKey: boolean) => void;
  onMoveSeats: (ids: string[], dx: number, dy: number) => void;
  onClearSelection: () => void;
}

export function SeatMap({
  seats,
  selectedIds,
  editMode,
  showGrid,
  onToggleSelect,
  onMoveSeats,
  onClearSelection,
}: SeatMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{
    startMouseX: number;
    startMouseY: number;
    seatPositions: Map<string, { x: number; y: number }>;
    dragIds: string[];
  } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const maxX = Math.max(...seats.map((s) => s.x), 0) + 60;
  const maxY = Math.max(...seats.map((s) => s.y), 0) + 40;
  const canvasW = Math.max(maxX + 40, 1600);
  const canvasH = maxY + 40;

  const uniqueRows = useMemo(() => {
    const seen = new Map<string, { label: string; y: number }>();
    for (const s of seats) {
      const key = `${s.rowLabel}@${s.y}`;
      if (!seen.has(key)) seen.set(key, { label: s.rowLabel, y: s.y });
    }
    return Array.from(seen.values()).sort((a, b) => a.y - b.y);
  }, [seats]);

  const handleSeatClick = useCallback(
    (e: React.MouseEvent, seatId: string) => {
      if (!editMode) {
        onToggleSelect(seatId, e.ctrlKey || e.metaKey);
        return;
      }

      const ctrl = e.ctrlKey || e.metaKey;
      onToggleSelect(seatId, ctrl);

      const newSelected = new Set(ctrl ? selectedIds : []);
      if (newSelected.has(seatId)) newSelected.delete(seatId);
      else newSelected.add(seatId);

      const dragIds = Array.from(newSelected.size > 0 ? newSelected : []);
      if (dragIds.length === 0) return;
      if (!newSelected.has(seatId)) dragIds.push(seatId);

      const seatPositions = new Map<string, { x: number; y: number }>();
      for (const id of dragIds) {
        const seat = seats.find((s) => s.id === id);
        if (seat) seatPositions.set(id, { x: seat.x, y: seat.y });
      }

      dragRef.current = { startMouseX: e.clientX, startMouseY: e.clientY, seatPositions, dragIds };
      setDragging(true);
      setDragOffset({ x: 0, y: 0 });
      e.preventDefault();
    },
    [editMode, selectedIds, seats, onToggleSelect]
  );

  useEffect(() => {
    if (!dragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const rawDx = e.clientX - drag.startMouseX;
      const rawDy = e.clientY - drag.startMouseY;
      const firstId = drag.dragIds[0];
      const firstOrig = drag.seatPositions.get(firstId);
      if (firstOrig) {
        const sx = snapX(firstOrig.x + rawDx);
        const sy = snapY(firstOrig.y + rawDy);
        setDragOffset({ x: sx - firstOrig.x, y: sy - firstOrig.y });
      }
    };
    const handleMouseUp = (_e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) { setDragging(false); return; }

      const firstId = drag.dragIds[0];
      const firstOrig = drag.seatPositions.get(firstId);
      if (!firstOrig) { setDragging(false); return; }

      const rawDx = _e.clientX - drag.startMouseX;
      const rawDy = _e.clientY - drag.startMouseY;
      const targetX = snapX(firstOrig.x + rawDx);
      const targetY = snapY(firstOrig.y + rawDy);

      const excludeIds = new Set(drag.dragIds);
      const freeCell = findNearestFreeCell(targetX, targetY, seats, excludeIds);

      const dx = freeCell.x - firstOrig.x;
      const dy = freeCell.y - firstOrig.y;

      if (dx !== 0 || dy !== 0) {
        onMoveSeats([...drag.dragIds], dx, dy);
      }

      setDragging(false);
      dragRef.current = null;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, seats, onMoveSeats]);

  useEffect(() => {
    if (selectedIds.size === 0) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClearSelection(); return; }
      if (!editMode) return;
      const sIds = Array.from(selectedIds);
      const firstSeat = seats.find((s) => s.id === sIds[0]);
      if (!firstSeat) return;
      const stepX = e.shiftKey ? 32 * 3 : 32;
      const stepY = e.shiftKey ? 30 * 3 : 30;
      let dx = 0, dy = 0;
      if (e.key === 'ArrowLeft') dx = -stepX;
      else if (e.key === 'ArrowRight') dx = stepX;
      else if (e.key === 'ArrowUp') dy = -stepY;
      else if (e.key === 'ArrowDown') dy = stepY;
      else return;
      e.preventDefault();
      const targetX = snapX(firstSeat.x + dx);
      const targetY = snapY(firstSeat.y + dy);
      const excludeIds = new Set(sIds);
      const free = findNearestFreeCell(targetX, targetY, seats, excludeIds);
      onMoveSeats(sIds, free.x - firstSeat.x, free.y - firstSeat.y);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, editMode, seats, onMoveSeats, onClearSelection]);

  const getSeatOffset = (seat: Seat): { x: number; y: number } => {
    if (!dragging || !dragRef.current) return { x: 0, y: 0 };
    if (!dragRef.current.dragIds.includes(seat.id)) return { x: 0, y: 0 };
    return dragOffset;
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-auto">
      <div
        className="relative"
        style={{ width: canvasW, height: canvasH, minWidth: '100%' }}
      >
        {showGrid && <GridOverlay width={canvasW} height={canvasH} />}

        <div
          className="absolute left-0 right-0 mx-auto text-center select-none"
          style={{ top: 0, maxWidth: 700 }}
        >
          <div className="text-xs tracking-[0.3em] uppercase font-medium mb-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            ESCENARIO
          </div>
          <div className="h-[2px] rounded mx-8" style={{ backgroundColor: 'var(--text-muted)' }} />
        </div>

        {uniqueRows.map((row) => (
          <div
            key={`row-${row.label}-${row.y}`}
            className="absolute select-none font-bold"
            style={{
              left: 0,
              top: row.y + 6,
              width: 40,
              textAlign: 'right',
              paddingRight: 8,
              fontSize: 11,
              color: 'var(--text-secondary)',
            }}
          >
            {row.label}
          </div>
        ))}

        {seats.map((seat) => {
          const offset = getSeatOffset(seat);
          const isDragging = dragging && dragRef.current?.dragIds.includes(seat.id);
          return (
            <SeatComponent
              key={seat.id}
              seat={seat}
              isSelected={selectedIds.has(seat.id)}
              isEditMode={editMode}
              isDragging={!!isDragging}
              offsetX={offset.x}
              offsetY={offset.y}
              onClick={(e) => handleSeatClick(e, seat.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
