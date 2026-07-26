'use client';

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import type { Seat, SeatBlock } from '@/types/seat';
import { snapX, snapY, findNearestFreeCell } from '@/lib/seat-layout';
import { LEFT_INNER, CENTER_START, RIGHT_INNER } from '@/lib/seed-data';
import { CELL_W, CELL_H } from '@/lib/seat-layout';
import { getRowMax } from '@/lib/seed-data';
import { SeatComponent } from './Seat';
import { GridOverlay } from './Grid';

interface SeatMapProps {
  seats: Seat[];
  selectedIds: Set<string>;
  editMode: boolean;
  showGrid: boolean;
  multiSelect: boolean;
  onToggleSelect: (id: string, ctrlKey: boolean) => void;
  onMoveSeats: (ids: string[], dx: number, dy: number) => void;
  onClearSelection: () => void;
  onAddSeat: (block: SeatBlock) => void;
}

function cellIndexOf(x: number, block: SeatBlock): number {
  if (block === 'left') return Math.round((LEFT_INNER - x) / CELL_W);
  if (block === 'right') return Math.round((x - RIGHT_INNER) / CELL_W);
  return Math.round((x - CENTER_START) / CELL_W);
}

function computeCellX(block: SeatBlock, label: string, cell: number): number {
  const max = getRowMax(block, label);
  if (block === 'left') return LEFT_INNER - (max - 1 - cell) * CELL_W;
  if (block === 'center') {
    if (cell < max / 2) return CENTER_START + cell * CELL_W;
    return CENTER_START + (cell + 6) * CELL_W;
  }
  return RIGHT_INNER + cell * CELL_W;
}

function findBestRowForBlock(seats: Seat[], block: SeatBlock): { rowLabel: string; y: number; seatNumber: string; x: number; category: string; price: number; color: string } | null {
  const allRows = Array.from(new Map(
    seats.filter(s => s.block === block).map(s => [s.rowLabel, s.y])
  )).map(([label, y]) => ({ label, y })).sort((a, b) => b.y - a.y);

  for (const row of allRows) {
    const maxCells = getRowMax(block, row.label);
    if (maxCells === 0) continue;

    const occupiedCells = new Set(
      seats.filter(s => s.block === block && s.rowLabel === row.label)
        .map(s => cellIndexOf(s.x, block))
    );

    for (let cell = 0; cell < maxCells; cell++) {
      if (occupiedCells.has(cell)) continue;
      const cellX = computeCellX(block, row.label, cell);
      const existing = seats.filter(s => s.block === block && s.rowLabel === row.label);
      const nextNum = existing.length > 0
        ? Math.max(...existing.map(s => Number(s.seatNumber) || 0)) + 1 : 1;

      const refSeat = seats.find(s => s.block === block && s.rowLabel === row.label);
      const category = refSeat?.category ?? '';
      const price = refSeat?.price ?? 0;
      const color = refSeat?.color ?? '#e2e4e9';

      let sid = `${block}-${row.label}-${nextNum}`;
      let num = String(nextNum);
      let tries = 0;
      while (seats.some(s => s.id === sid) && tries < 100) {
        tries++;
        num = String(nextNum + tries);
        sid = `${block}-${row.label}-${num}`;
      }

      return { rowLabel: row.label, y: row.y, seatNumber: num, x: cellX, category, price, color };
    }
  }
  return null;
}

export function SeatMap({
  seats, selectedIds, editMode, showGrid, multiSelect,
  onToggleSelect, onMoveSeats, onClearSelection, onAddSeat,
}: SeatMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{
    startMouseX: number; startMouseY: number;
    seatPositions: Map<string, { x: number; y: number }>; dragIds: string[];
  } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const seatsRef = useRef(seats); seatsRef.current = seats;
  const selectedRef = useRef(selectedIds); selectedRef.current = selectedIds;
  const moveRef = useRef(onMoveSeats); moveRef.current = onMoveSeats;

  const maxX = Math.max(...seats.map(s => s.x), 0) + 40;
  const maxY = Math.max(...seats.map(s => s.y), 0) + 40;
  const canvasW = Math.max(maxX + 180, 1800);
  const canvasH = maxY + 40;

  const uniqueRows = useMemo(() => {
    const seen = new Map<string, { label: string; y: number; total: number }>();
    for (const s of seats) {
      const key = `${s.rowLabel}@${s.y}`;
      if (!seen.has(key)) seen.set(key, { label: s.rowLabel, y: s.y, total: 0 });
      seen.get(key)!.total++;
    }
    return Array.from(seen.values()).sort((a, b) => a.y - b.y);
  }, [seats]);

  const totalPanelX = maxX + 100;
  const grandTotal = seats.length;

  const handleSeatClick = useCallback(
    (e: React.MouseEvent, seatId: string) => {
      const ctrl = e.ctrlKey || e.metaKey;

      if (!editMode || ctrl || multiSelect) {
        onToggleSelect(seatId, ctrl || multiSelect);
        setDragging(false);
        dragRef.current = null;
        return;
      }

      const currentlySelected = new Set(selectedRef.current);
      const alreadySelected = currentlySelected.has(seatId);

      if (!alreadySelected) {
        onToggleSelect(seatId, false);
      }

      let dragIds: string[];
      if (alreadySelected) {
        dragIds = Array.from(currentlySelected);
      } else {
        dragIds = [seatId];
      }
      if (dragIds.length === 0) return;

      const currentSeats = seatsRef.current;
      const seatPositions = new Map<string, { x: number; y: number }>();
      for (const id of dragIds) {
        const seat = currentSeats.find(s => s.id === id);
        if (seat) seatPositions.set(id, { x: seat.x, y: seat.y });
      }

      dragRef.current = {
        startMouseX: e.clientX, startMouseY: e.clientY,
        seatPositions, dragIds,
      };
      setDragging(true);
      setDragOffset({ x: 0, y: 0 });
      e.preventDefault();
      e.stopPropagation();
    },
    [editMode, onToggleSelect]
  );

  useEffect(() => {
    if (!dragging) return;
    const mm = (e: MouseEvent) => {
      const drag = dragRef.current; if (!drag) return;
      const fId = drag.dragIds[0];
      const fo = drag.seatPositions.get(fId);
      if (fo) {
        const sx = snapX(fo.x + (e.clientX - drag.startMouseX));
        const sy = snapY(fo.y + (e.clientY - drag.startMouseY));
        setDragOffset({ x: sx - fo.x, y: sy - fo.y });
      }
    };
    const mu = (e: MouseEvent) => {
      e.preventDefault();
      const drag = dragRef.current; if (!drag) { setDragging(false); return; }
      const cs = seatsRef.current; const mv = moveRef.current;
      const fId = drag.dragIds[0];
      const fo = drag.seatPositions.get(fId);
      if (!fo) { setDragging(false); dragRef.current = null; return; }
      const tx = snapX(fo.x + (e.clientX - drag.startMouseX));
      const ty = snapY(fo.y + (e.clientY - drag.startMouseY));
      const freeCell = findNearestFreeCell(tx, ty, cs, new Set(drag.dragIds));
      const dx = freeCell.x - fo.x; const dy = freeCell.y - fo.y;
      if (dx !== 0 || dy !== 0) mv([...drag.dragIds], dx, dy);
      setDragging(false); dragRef.current = null;
    };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setDragging(false); dragRef.current = null; } };
    window.addEventListener('mousemove', mm);
    window.addEventListener('mouseup', mu);
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('mousemove', mm);
      window.removeEventListener('mouseup', mu);
      window.removeEventListener('keydown', esc);
    };
  }, [dragging]);

  useEffect(() => {
    if (selectedIds.size === 0) return;
    const kd = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClearSelection(); return; }
      if (!editMode || dragging) return;
      const sIds = Array.from(selectedIds);
      const cs = seatsRef.current;
      const firstSeat = cs.find(s => s.id === sIds[0]); if (!firstSeat) return;
      const sx = e.shiftKey ? 96 : 32; const sy = e.shiftKey ? 90 : 30;
      let dx = 0, dy = 0;
      if (e.key === 'ArrowLeft') dx = -sx;
      else if (e.key === 'ArrowRight') dx = sx;
      else if (e.key === 'ArrowUp') dy = -sy;
      else if (e.key === 'ArrowDown') dy = sy;
      else return;
      e.preventDefault();
      const tx = snapX(firstSeat.x + dx); const ty = snapY(firstSeat.y + dy);
      const free = findNearestFreeCell(tx, ty, cs, new Set(sIds));
      moveRef.current(sIds, free.x - firstSeat.x, free.y - firstSeat.y);
    };
    window.addEventListener('keydown', kd);
    return () => window.removeEventListener('keydown', kd);
  }, [selectedIds, editMode, dragging, onClearSelection]);

  const getOffset = (s: Seat) => {
    if (!dragging || !dragRef.current || !dragRef.current.dragIds.includes(s.id)) return { x: 0, y: 0 };
    return dragOffset;
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-auto">
      <div className="relative" style={{ width: canvasW, height: canvasH, minWidth: '100%' }}>
        {showGrid && <GridOverlay width={canvasW} height={canvasH} />}

        <div className="absolute left-0 right-0 mx-auto text-center select-none" style={{ top: 0, maxWidth: 700 }}>
          <div className="text-xs tracking-[0.3em] uppercase font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>ESCENARIO</div>
          <div className="h-[2px] rounded mx-8" style={{ backgroundColor: 'var(--text-muted)' }} />
        </div>

        {uniqueRows.map(row => (
          <div key={`row-${row.label}-${row.y}`}
            className="absolute select-none font-bold"
            style={{ left: 0, top: row.y + 6, width: 80, textAlign: 'right', paddingRight: 8, fontSize: 11, color: 'var(--text-secondary)' }}>
            {row.label}
          </div>
        ))}

        {seats.map(seat => {
          const off = getOffset(seat);
          const isDrag = dragging && dragRef.current?.dragIds.includes(seat.id);
          return <SeatComponent key={seat.id} seat={seat} isSelected={selectedIds.has(seat.id)}
            isEditMode={editMode} isDragging={!!isDrag} offsetX={off.x} offsetY={off.y}
            onClick={e => handleSeatClick(e, seat.id)} />;
        })}

        <div className="absolute select-none" style={{
          left: totalPanelX, top: 16,
          backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)',
          borderRadius: 8, padding: '8px 12px', minWidth: 80,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, borderBottom: '1px solid var(--border-color)', paddingBottom: 4 }}>
            TOTAL
          </div>
          {uniqueRows.map(row => (
            <div key={`t-${row.label}`} className="flex justify-between" style={{ fontSize: 10, padding: '1px 0', color: 'var(--text-secondary)' }}>
              <span style={{ fontWeight: 600, marginRight: 12 }}>{row.label}</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{row.total}</span>
            </div>
          ))}
          <div className="flex justify-between" style={{
            fontSize: 10, fontWeight: 800, marginTop: 4, paddingTop: 4,
            borderTop: '1px solid var(--border-color)', color: 'var(--text-primary)',
          }}>
            <span>Total</span>
            <span>{grandTotal}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
