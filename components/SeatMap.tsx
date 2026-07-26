'use client';

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import type { Seat, SeatBlock } from '@/types/seat';
import { snapToGrid } from '@/lib/seat-layout';
import { BLOCK_X, CENTER_SEATS_PER_ROW, MAX_SIDE_SEATS } from '@/lib/seed-data';
import { SeatComponent } from './Seat';
import { GridOverlay } from './Grid';

interface SeatMapProps {
  seats: Seat[];
  selectedIds: Set<string>;
  editMode: boolean;
  showGrid: boolean;
  gridSize: number;
  onToggleSelect: (id: string, ctrlKey: boolean) => void;
  onSetSelection: (ids: Set<string>) => void;
  onMoveSeats: (ids: string[], dx: number, dy: number) => void;
  onClearSelection: () => void;
  onAddSeat: (block: SeatBlock, rowLabel: string, x: number, y: number, seatNumber: string) => void;
}

function findNearestRow(seats: Seat[], snapY: number): { label: string; y: number } {
  const rows = new Map<string, number>();
  for (const s of seats) {
    const key = s.rowLabel;
    if (!rows.has(key)) rows.set(key, s.y);
  }
  let best = '';
  let bestDist = Infinity;
  let bestY = snapY;
  for (const [label, y] of rows) {
    const dist = Math.abs(y - snapY);
    if (dist < bestDist) { bestDist = dist; best = label; bestY = y; }
  }
  return { label: best, y: bestY };
}

function findBlockForX(x: number): SeatBlock {
  if (x < BLOCK_X.center - 30) return 'left';
  if (x < BLOCK_X.right - 30) return 'center';
  return 'right';
}

export function SeatMap({
  seats,
  selectedIds,
  editMode,
  showGrid,
  gridSize,
  onToggleSelect,
  onMoveSeats,
  onClearSelection,
  onAddSeat,
}: SeatMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [wasDrag, setWasDrag] = useState(false);
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

  const handleMouseDown = useCallback(
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
      setWasDrag(false);
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
        const snappedX = snapToGrid(firstOrig.x + rawDx, gridSize) - firstOrig.x;
        const snappedY = snapToGrid(firstOrig.y + rawDy, gridSize) - firstOrig.y;
        setDragOffset({ x: snappedX, y: snappedY });
        if (Math.abs(rawDx) > 2 || Math.abs(rawDy) > 2) setWasDrag(true);
      }
    };
    const handleMouseUp = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) { setDragging(false); return; }
      const rawDx = e.clientX - drag.startMouseX;
      const rawDy = e.clientY - drag.startMouseY;
      const sd = gridSize;
      const moves: Array<{ id: string; dx: number; dy: number }> = [];
      for (const id of drag.dragIds) {
        const orig = drag.seatPositions.get(id);
        if (!orig) continue;
        const tx = snapToGrid(orig.x + rawDx, sd);
        const ty = snapToGrid(orig.y + rawDy, sd);
        if (tx !== orig.x || ty !== orig.y) {
          moves.push({ id, dx: tx - orig.x, dy: ty - orig.y });
        }
      }
      if (moves.length > 0) {
        const ids = moves.map((m) => m.id);
        const dx = moves[0].dx;
        const dy = moves[0].dy;
        onMoveSeats(ids, dx, dy);
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
  }, [dragging, gridSize, onMoveSeats]);

  useEffect(() => {
    if (selectedIds.size === 0) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClearSelection(); return; }
      if (!editMode) return;
      const step = e.shiftKey ? gridSize * 3 : gridSize;
      let dx = 0, dy = 0;
      if (e.key === 'ArrowLeft') dx = -step;
      else if (e.key === 'ArrowRight') dx = step;
      else if (e.key === 'ArrowUp') dy = -step;
      else if (e.key === 'ArrowDown') dy = step;
      else return;
      e.preventDefault();
      onMoveSeats(Array.from(selectedIds), dx, dy);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, editMode, gridSize, onMoveSeats, onClearSelection]);

  const getSeatOffset = (seat: Seat): { x: number; y: number } => {
    if (!dragging || !dragRef.current) return { x: 0, y: 0 };
    if (!dragRef.current.dragIds.includes(seat.id)) return { x: 0, y: 0 };
    return dragOffset;
  };

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!editMode) return;
      if (wasDrag) { setWasDrag(false); return; }
      if (dragging) { setDragging(false); return; }

      const el = e.target as HTMLElement;
      if (el.closest('[data-seat]')) return;

      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const scrollLeft = container.scrollLeft;
      const scrollTop = container.scrollTop;
      const clickX = e.clientX - rect.left + scrollLeft;
      const clickY = e.clientY - rect.top + scrollTop;

      const snapX = snapToGrid(clickX - 14, gridSize);
      const snapY = snapToGrid(clickY - 12, gridSize);

      const block = findBlockForX(snapX);
      const { label: rowLabel } = findNearestRow(seats, snapY);

      const existingInRow = seats.filter(
        (s) => s.block === block && s.rowLabel === rowLabel
      );
      const nextNum = existingInRow.length > 0
        ? Math.max(...existingInRow.map((s) => Number(s.seatNumber))) + 1
        : 1;

      onAddSeat(block, rowLabel, snapX, snapY, String(nextNum));
    },
    [editMode, wasDrag, dragging, gridSize, seats, onAddSeat]
  );

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-auto">
      <div
        className="relative"
        style={{ width: canvasW, height: canvasH, minWidth: '100%' }}
        onClick={handleCanvasClick}
      >
        {showGrid && <GridOverlay gridSize={gridSize} width={canvasW} height={canvasH} />}

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
              onClick={(e) => handleMouseDown(e, seat.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
