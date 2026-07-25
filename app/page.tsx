'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { SeatMap } from '@/components/SeatMap';
import { Toolbar } from '@/components/Toolbar';
import { Sidebar } from '@/components/Sidebar';
import { Legend } from '@/components/Legend';
import { generateSeedSeats } from '@/lib/seed-data';
import { loadSeats, saveSeats, exportJSON, importJSON } from '@/lib/storage';
import { generateWhatsAppCopy, copyToClipboard } from '@/lib/whatsapp-copy';
import { GRID_SIZES } from '@/lib/seat-layout';
import type { Seat, SeatStatus, AccessibilityType } from '@/types/seat';

export default function Home() {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editMode, setEditMode] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize, setGridSize] = useState(16);
  const [toast, setToast] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = loadSeats();
    if (saved) {
      setSeats(saved);
    } else {
      const seed = generateSeedSeats();
      setSeats(seed);
      saveSeats(seed);
    }
  }, []);

  useEffect(() => {
    if (seats.length > 0) saveSeats(seats);
  }, [seats]);

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

  const selectedSeats = seats.filter((s) => selectedIds.has(s.id));

  const moveSeats = useCallback((ids: string[], dx: number, dy: number) => {
    setSeats((prev) =>
      prev.map((s) =>
        ids.includes(s.id) ? { ...s, x: s.x + dx, y: s.y + dy } : s
      )
    );
  }, []);

  const renameRow = useCallback(
    (blockFilter: Seat['block'], oldLabel: string, newLabel: string) => {
      setSeats((prev) =>
        prev.map((s) => {
          if (s.block !== blockFilter || s.rowLabel !== oldLabel) return s;
          return { ...s, rowLabel: newLabel, rowId: `${s.block}-${newLabel}`, id: `${s.block}-${newLabel}-${s.seatNumber}` };
        })
      );
      setSelectedIds(new Set());
      showToast(`Fila ${oldLabel} renombrada a ${newLabel}`);
    },
    [showToast]
  );

  const renumberRow = useCallback(
    (blockFilter: Seat['block'], rowLabel: string, startAt: number) => {
      setSeats((prev) => {
        const rowSeats = prev.filter((s) => s.block === blockFilter && s.rowLabel === rowLabel);
        const sortedByX = [...rowSeats].sort((a, b) => a.x - b.x);
        const numberMap = new Map<string, string>();
        sortedByX.forEach((s, i) => numberMap.set(s.id, String(startAt + i)));

        return prev.map((s) => {
          if (s.block !== blockFilter || s.rowLabel !== rowLabel) return s;
          const newNum = numberMap.get(s.id) ?? s.seatNumber;
          return {
            ...s,
            seatNumber: newNum,
            id: `${s.block}-${s.rowLabel}-${newNum}`,
          };
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
        free: '#e5e7eb',
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
        const nx = Math.round(s.x / gridSize) * gridSize;
        const ny = Math.round(s.y / gridSize) * gridSize;
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

  const handleExport = useCallback(() => {
    const json = exportJSON(seats, 'Teatro Plaza Norte', 'ESCENARIO');
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'teatro-plaza-norte-seats.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('JSON exportado');
  }, [seats, showToast]);

  const handleImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const imported = importJSON(reader.result as string);
          setSeats(imported);
          setSelectedIds(new Set());
          saveSeats(imported);
          showToast(`Importados ${imported.length} asientos`);
        } catch (err) {
          showToast('Error al importar JSON');
        }
      };
      reader.readAsText(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [showToast]
  );

  const handleWhatsAppCopy = useCallback(async () => {
    const text = generateWhatsAppCopy(selectedSeats);
    if (!text) {
      showToast('Selecciona al menos un asiento');
      return;
    }
    await copyToClipboard(text);
    showToast('Copiado al portapapeles');
  }, [selectedSeats, showToast]);

  const singleSelected = selectedSeats.length === 1 ? selectedSeats[0] : null;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Toolbar
        editMode={editMode}
        onToggleEditMode={() => setEditMode((v) => !v)}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid((v) => !v)}
        gridSize={gridSize}
        onGridSizeChange={setGridSize}
        selectedCount={selectedIds.size}
        onAlignSelected={alignSelected}
        onResetPositions={resetSelectedPositions}
        onExport={handleExport}
        onImport={() => fileInputRef.current?.click()}
        onWhatsAppCopy={handleWhatsAppCopy}
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
            gridSize={gridSize}
            onToggleSelect={toggleSelect}
            onSetSelection={setSelection}
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
          onRenameRow={(block, oldLabel, newLabel) => renameRow(block, oldLabel, newLabel)}
          onRenumberRow={(block, rowLabel, startAt) => renumberRow(block, rowLabel, startAt)}
          onAlignSelected={alignSelected}
          onResetPositions={resetSelectedPositions}
          editMode={editMode}
          gridSize={gridSize}
        />
      </div>
      <Legend />
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImport}
      />
      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50 transition-opacity">
          {toast}
        </div>
      )}
    </div>
  );
}
