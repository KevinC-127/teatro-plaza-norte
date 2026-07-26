'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { SeatMap } from '@/components/SeatMap';
import { Toolbar } from '@/components/Toolbar';
import { Sidebar } from '@/components/Sidebar';
import { Legend } from '@/components/Legend';
import { generateSeedSeats, getRowMax, LEFT_INNER, CENTER_START, RIGHT_INNER } from '@/lib/seed-data';
import { loadSeats, saveSeats } from '@/lib/storage';
import { generateWhatsAppCopy, copyToClipboard } from '@/lib/whatsapp-copy';
import { generatePNG } from '@/lib/png-export';
import { snapX, snapY } from '@/lib/seat-layout';
import { CELL_W, CELL_H } from '@/lib/seat-layout';
import type { Seat, SeatStatus, AccessibilityType, SeatBlock } from '@/types/seat';

function getTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem('teatro-theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: 'dark' | 'light') {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem('teatro-theme', theme);
}

function genId(block: string, row: string, num: string): string {
  return `${block}-${row}-${num}`;
}

function computeCellX(block: SeatBlock, label: string, cell: number): number {
  const max = getRowMax(block, label);
  if (block === 'left') {
    return LEFT_INNER - (max - 1 - cell) * CELL_W;
  }
  if (block === 'center') {
    if (cell < max / 2) return CENTER_START + cell * CELL_W;
    return CENTER_START + (cell + 6) * CELL_W;
  }
  return RIGHT_INNER + cell * CELL_W;
}

function cellIndexOf(x: number, block: SeatBlock): number {
  if (block === 'left') return Math.round((LEFT_INNER - x) / CELL_W);
  if (block === 'right') return Math.round((x - RIGHT_INNER) / CELL_W);
  return Math.round((x - CENTER_START) / CELL_W);
}

function findBestRowForBlock(
  seats: Seat[],
  block: SeatBlock
): { rowLabel: string; y: number; seatNumber: string; x: number } | null {
  const allRows = Array.from(
    new Map(
      seats.filter((s) => s.block === block).map((s) => [s.rowLabel, s.y])
    )
  )
    .map(([label, y]) => ({ label, y }))
    .sort((a, b) => b.y - a.y);

  for (const row of allRows) {
    const maxCells = getRowMax(block, row.label);
    if (maxCells === 0) continue;

    const occupiedCells = new Set(
      seats
        .filter((s) => s.block === block && s.rowLabel === row.label)
        .map((s) => cellIndexOf(s.x, block))
    );

    for (let cell = 0; cell < maxCells; cell++) {
      if (occupiedCells.has(cell)) continue;
      const cellX = computeCellX(block, row.label, cell);

      const existing = seats.filter(
        (s) => s.block === block && s.rowLabel === row.label
      );
      const nextNum = existing.length > 0
        ? Math.max(...existing.map((s) => Number(s.seatNumber) || 0)) + 1
        : 1;

      let sid = genId(block, row.label, String(nextNum));
      let num = String(nextNum);
      let tries = 0;
      while (seats.some((s) => s.id === sid) && tries < 100) {
        tries++;
        num = String(nextNum + tries);
        sid = genId(block, row.label, num);
      }

      return { rowLabel: row.label, y: row.y, seatNumber: num, x: cellX };
    }
  }

  return null;
}

export default function Home() {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editMode, setEditMode] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [toast, setToast] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const initialized = useRef(false);

  useEffect(() => {
    setTheme(getTheme());
    const saved = loadSeats();
    if (saved && saved.length > 0) {
      setSeats(saved);
    } else {
      const seed = generateSeedSeats();
      setSeats(seed);
      saveSeats(seed);
    }
    initialized.current = true;
  }, []);

  useEffect(() => {
    if (!initialized.current) return;
    saveSeats(seats);
  }, [seats]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      return next;
    });
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  }, []);

  const updateSeats = useCallback((ids: string[], changes: Partial<Seat>) => {
    setSeats((prev) => prev.map((s) => (ids.includes(s.id) ? { ...s, ...changes } : s)));
  }, []);

  const toggleSelect = useCallback((id: string, ctrlKey: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(ctrlKey ? prev : []);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const selectedSeats = useMemo(
    () => seats.filter((s) => selectedIds.has(s.id)),
    [seats, selectedIds]
  );

  const moveSeats = useCallback((ids: string[], dx: number, dy: number) => {
    setSeats((prev) =>
      prev.map((s) => {
        if (!ids.includes(s.id)) return s;
        return { ...s, x: snapX(s.x + dx), y: snapY(s.y + dy) };
      })
    );
  }, []);

  const addSeat = useCallback(
    (block: SeatBlock) => {
      const result = findBestRowForBlock(seats, block);
      if (!result) { showToast(`No hay celdas libres en ${block}`); return; }
      const { rowLabel, y, seatNumber, x } = result;
      const sid = genId(block, rowLabel, seatNumber);

      const newSeat: Seat = {
        id: sid,
        block,
        rowId: `${block}-${rowLabel}`,
        rowLabel,
        seatNumber,
        x,
        y,
        color: '#e2e4e9',
        status: 'free',
        reservedFor: '',
        notes: '',
        accessibilityType: 'normal',
        seedX: x,
        seedY: y,
      };

      setSeats((prev) => [...prev, newSeat]);
      showToast(`Agregada: ${block} ${rowLabel}-${seatNumber}`);
    },
    [seats, showToast]
  );

  const renameRow = useCallback(
    (blockFilter: Seat['block'], oldLabel: string, newLabel: string) => {
      if (!oldLabel || !newLabel) return;
      setSeats((prev) =>
        prev.map((s) => {
          if (s.block !== blockFilter || s.rowLabel !== oldLabel) return s;
          return { ...s, rowLabel: newLabel, rowId: `${s.block}-${newLabel}`, id: `${s.block}-${newLabel}-${s.seatNumber}` };
        })
      );
      setSelectedIds(new Set());
      showToast(`Fila ${oldLabel} -> ${newLabel}`);
    },
    [showToast]
  );

  const renumberRow = useCallback(
    (blockFilter: Seat['block'], rowLabel: string, startAt: number) => {
      if (!rowLabel) return;
      setSeats((prev) => {
        const rowSeats = prev.filter((s) => s.block === blockFilter && s.rowLabel === rowLabel);
        const sortedByX = [...rowSeats].sort((a, b) => a.x - b.x);
        const numberMap = new Map<string, string>();
        sortedByX.forEach((s, i) => numberMap.set(s.id, String(startAt + i)));
        return prev.map((s) => {
          if (s.block !== blockFilter || s.rowLabel !== rowLabel) return s;
          const newNum = numberMap.get(s.id) ?? s.seatNumber;
          return { ...s, seatNumber: newNum, id: `${s.block}-${s.rowLabel}-${newNum}` };
        });
      });
      setSelectedIds(new Set());
      showToast(`Fila ${rowLabel} renumerada desde ${startAt}`);
    },
    [showToast]
  );

  const applyColorToSelected = useCallback((color: string) => {
    updateSeats(Array.from(selectedIds), { color });
  }, [selectedIds, updateSeats]);

  const applyStatusToSelected = useCallback((status: SeatStatus) => {
    const sc: Record<SeatStatus, string> = { free: '#e2e4e9', pending: '#f59e0b', reserved: '#ef4444' };
    updateSeats(Array.from(selectedIds), { status, color: sc[status] });
  }, [selectedIds, updateSeats]);

  const applyReservationToSelected = useCallback((name: string) => {
    updateSeats(Array.from(selectedIds), { reservedFor: name });
  }, [selectedIds, updateSeats]);

  const applyAccessibilityToSelected = useCallback((type: AccessibilityType) => {
    updateSeats(Array.from(selectedIds), { accessibilityType: type });
  }, [selectedIds, updateSeats]);

  const alignSelected = useCallback(() => {
    const ids = Array.from(selectedIds);
    setSeats((prev) =>
      prev.map((s) => {
        if (!ids.includes(s.id)) return s;
        return { ...s, x: snapX(s.x), y: snapY(s.y) };
      })
    );
  }, [selectedIds]);

  const resetSelectedPositions = useCallback(() => {
    const ids = Array.from(selectedIds);
    setSeats((prev) =>
      prev.map((s) => {
        if (!ids.includes(s.id) || s.seedX == null || s.seedY == null) return s;
        return { ...s, x: s.seedX, y: s.seedY };
      })
    );
  }, [selectedIds]);

  const handleWhatsAppCopy = useCallback(async () => {
    const text = generateWhatsAppCopy(selectedSeats);
    if (!text) { showToast('Selecciona al menos un asiento'); return; }
    await copyToClipboard(text);
    showToast('Copiado al portapapeles');
  }, [selectedSeats, showToast]);

  const handleGeneratePNG = useCallback(() => {
    if (selectedIds.size === 0) { showToast('Selecciona al menos un asiento'); return; }
    const mx = Math.max(...seats.map((s) => s.x), 0) + 60;
    const my = Math.max(...seats.map((s) => s.y), 0) + 40;
    const w = Math.max(mx + 40, 1600);
    const h = my + 40;
    generatePNG(seats, selectedIds, w, h, 0, showGrid, theme);
    showToast('PNG generado');
  }, [seats, selectedIds, showGrid, theme, showToast]);

  const singleSelected = selectedSeats.length === 1 ? selectedSeats[0] : null;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Toolbar
        theme={theme}
        onToggleTheme={toggleTheme}
        editMode={editMode}
        onToggleEditMode={() => setEditMode((v) => !v)}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid((v) => !v)}
        selectedCount={selectedIds.size}
        onAlignSelected={alignSelected}
        onResetPositions={resetSelectedPositions}
        onWhatsAppCopy={handleWhatsAppCopy}
        onGeneratePNG={handleGeneratePNG}
        onAddSeat={addSeat}
        accessibilityType={singleSelected?.accessibilityType ?? 'normal'}
        onAccessibilityChange={(t) => {
          if (selectedIds.size > 0) applyAccessibilityToSelected(t);
        }}
        onClearSelection={clearSelection}
      />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto relative">
          <SeatMap
            seats={seats}
            selectedIds={selectedIds}
            editMode={editMode}
            showGrid={showGrid}
            onToggleSelect={toggleSelect}
            onMoveSeats={moveSeats}
            onClearSelection={clearSelection}
          />
        </div>
        <Sidebar
          singleSeat={singleSelected}
          selectedCount={selectedIds.size}
          onUpdateSeat={(changes) => {
            if (singleSelected) updateSeats([singleSelected.id], changes);
          }}
          onUpdateSelected={(changes) => updateSeats(Array.from(selectedIds), changes)}
          onApplyStatus={applyStatusToSelected}
          onApplyColor={applyColorToSelected}
          onApplyReservation={applyReservationToSelected}
          onClearReservation={() => applyReservationToSelected('')}
          onApplyAccessibility={applyAccessibilityToSelected}
          onRenameRow={renameRow}
          onRenumberRow={renumberRow}
          onAlignSelected={alignSelected}
          onResetPositions={resetSelectedPositions}
          editMode={editMode}
          gridSize={CELL_W}
        />
      </div>
      <Legend />
      {toast && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg text-sm z-50 transition-opacity"
          style={{
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
