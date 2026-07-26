'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { SeatMap } from '@/components/SeatMap';
import { Toolbar } from '@/components/Toolbar';
import { Sidebar } from '@/components/Sidebar';
import { Legend } from '@/components/Legend';
import { generateSeedSeats } from '@/lib/seed-data';
import { loadSeats, saveSeats } from '@/lib/storage';
import { generateWhatsAppCopy, copyToClipboard } from '@/lib/whatsapp-copy';
import { generatePNG } from '@/lib/png-export';
import { snapToGrid } from '@/lib/seat-layout';
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

export default function Home() {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editMode, setEditMode] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize, setGridSize] = useState(16);
  const [toast, setToast] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const initialized = useRef(false);
  const seatMapRef = useRef<HTMLDivElement>(null);

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

  const setSelection = useCallback((ids: Set<string>) => setSelectedIds(ids), []);
  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const selectedSeats = useMemo(
    () => seats.filter((s) => selectedIds.has(s.id)),
    [seats, selectedIds]
  );

  const moveSeats = useCallback((ids: string[], dx: number, dy: number) => {
    setSeats((prev) =>
      prev.map((s) => {
        if (!ids.includes(s.id)) return s;
        return {
          ...s,
          x: snapToGrid(s.x + dx, gridSize),
          y: snapToGrid(s.y + dy, gridSize),
        };
      })
    );
  }, [gridSize]);

  const addSeat = useCallback(
    (block: SeatBlock, rowLabel: string, x: number, y: number, seatNumber: string) => {
      const id = genId(block, rowLabel, seatNumber);
      const exists = seats.find((s) => s.id === id);
      const finalNum = exists
        ? String(
            Math.max(...seats.filter((s) => s.block === block && s.rowLabel === rowLabel).map((s) => Number(s.seatNumber) || 0)) + 1
          )
        : seatNumber;
      const finalId = genId(block, rowLabel, finalNum);

      const newSeat: Seat = {
        id: finalId,
        block,
        rowId: `${block}-${rowLabel}`,
        rowLabel,
        seatNumber: finalNum,
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
      showToast(`Butaca agreg: ${block} ${rowLabel}-${finalNum}`);
    },
    [seats, showToast]
  );

  const renameRow = useCallback(
    (blockFilter: Seat['block'], oldLabel: string, newLabel: string) => {
      if (!oldLabel || !newLabel) return;
      setSeats((prev) =>
        prev.map((s) => {
          if (s.block !== blockFilter || s.rowLabel !== oldLabel) return s;
          return {
            ...s,
            rowLabel: newLabel,
            rowId: `${s.block}-${newLabel}`,
            id: `${s.block}-${newLabel}-${s.seatNumber}`,
          };
        })
      );
      setSelectedIds(new Set());
      showToast(`Fila ${oldLabel} renombrada a ${newLabel}`);
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

  const applyColorToSelected = useCallback(
    (color: string) => {
      updateSeats(Array.from(selectedIds), { color });
      showToast('Color aplicado');
    },
    [selectedIds, updateSeats, showToast]
  );

  const applyStatusToSelected = useCallback(
    (status: SeatStatus) => {
      const statusColors: Record<SeatStatus, string> = {
        free: '#e2e4e9',
        pending: '#f59e0b',
        reserved: '#ef4444',
      };
      updateSeats(Array.from(selectedIds), { status, color: statusColors[status] });
      showToast(`Estado cambiado a: ${status}`);
    },
    [selectedIds, updateSeats, showToast]
  );

  const applyReservationToSelected = useCallback(
    (name: string) => {
      updateSeats(Array.from(selectedIds), { reservedFor: name });
      showToast(`Reservado para: ${name || '(limpiado)'}`);
    },
    [selectedIds, updateSeats, showToast]
  );

  const applyAccessibilityToSelected = useCallback(
    (type: AccessibilityType) => {
      updateSeats(Array.from(selectedIds), { accessibilityType: type });
      showToast(`Accesibilidad: ${type}`);
    },
    [selectedIds, updateSeats, showToast]
  );

  const alignSelected = useCallback(() => {
    const ids = Array.from(selectedIds);
    setSeats((prev) =>
      prev.map((s) => {
        if (!ids.includes(s.id)) return s;
        const nx = snapToGrid(s.x, gridSize);
        const ny = snapToGrid(s.y, gridSize);
        return { ...s, x: nx, y: ny };
      })
    );
    showToast('Selección alineada a la malla');
  }, [selectedIds, gridSize, showToast]);

  const resetSelectedPositions = useCallback(() => {
    const ids = Array.from(selectedIds);
    setSeats((prev) =>
      prev.map((s) => {
        if (!ids.includes(s.id) || s.seedX == null || s.seedY == null) return s;
        return { ...s, x: s.seedX, y: s.seedY };
      })
    );
    showToast('Posiciones reseteadas');
  }, [selectedIds, showToast]);

  const handleWhatsAppCopy = useCallback(async () => {
    const text = generateWhatsAppCopy(selectedSeats);
    if (!text) { showToast('Selecciona al menos un asiento'); return; }
    await copyToClipboard(text);
    showToast('Copiado al portapapeles');
  }, [selectedSeats, showToast]);

  const handleGeneratePNG = useCallback(() => {
    if (selectedIds.size === 0) { showToast('Selecciona al menos un asiento'); return; }
    const maxX = Math.max(...seats.map((s) => s.x), 0) + 60;
    const maxY = Math.max(...seats.map((s) => s.y), 0) + 40;
    const w = Math.max(maxX + 40, 1600);
    const h = maxY + 40;
    generatePNG(seats, selectedIds, w, h, gridSize, showGrid, theme);
    showToast('PNG generado');
  }, [seats, selectedIds, gridSize, showGrid, theme, showToast]);

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
        gridSize={gridSize}
        onGridSizeChange={setGridSize}
        selectedCount={selectedIds.size}
        onAlignSelected={alignSelected}
        onResetPositions={resetSelectedPositions}
        onWhatsAppCopy={handleWhatsAppCopy}
        onGeneratePNG={handleGeneratePNG}
        accessibilityType={singleSelected?.accessibilityType ?? 'normal'}
        onAccessibilityChange={(t) => {
          if (selectedIds.size > 0) applyAccessibilityToSelected(t);
        }}
        onClearSelection={clearSelection}
      />
      <div className="flex flex-1 overflow-hidden" ref={seatMapRef}>
        <div className="flex-1 overflow-auto relative">
          <SeatMap
            seats={seats}
            selectedIds={selectedIds}
            editMode={editMode}
            showGrid={showGrid}
            gridSize={gridSize}
            onToggleSelect={toggleSelect}
            onSetSelection={setSelection}
            onMoveSeats={moveSeats}
            onClearSelection={clearSelection}
            onAddSeat={addSeat}
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
          gridSize={gridSize}
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
