'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { SeatMap } from '@/components/SeatMap';
import { Toolbar } from '@/components/Toolbar';
import { Sidebar } from '@/components/Sidebar';
import { generateSeedSeats } from '@/lib/seed-data';
import { loadSeats, saveSeats } from '@/lib/storage';
import { generateWhatsAppCopy, copyToClipboard } from '@/lib/whatsapp-copy';
import { generatePNG } from '@/lib/png-export';
import { snapX, snapY } from '@/lib/seat-layout';
import type { Seat, SeatStatus, SeatBlock } from '@/types/seat';

function getTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  const s = localStorage.getItem('teatro-theme');
  if (s === 'light' || s === 'dark') return s;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
function applyTheme(t: 'dark' | 'light') {
  document.documentElement.classList.toggle('dark', t === 'dark');
  localStorage.setItem('teatro-theme', t);
}

export default function Home() {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editMode, setEditMode] = useState(false);
  const [multiSelect, setMultiSelect] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [toast, setToast] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const init = useRef(false);

  useEffect(() => {
    setTheme(getTheme());
    const saved = loadSeats();
    if (saved?.length) setSeats(saved);
    else { const sd = generateSeedSeats(); setSeats(sd); saveSeats(sd); }
    init.current = true;
  }, []);

  useEffect(() => { if (init.current) saveSeats(seats); }, [seats]);

  const toggleTheme = useCallback(() => {
    setTheme(p => { const n = p === 'dark' ? 'light' : 'dark'; applyTheme(n); return n; });
  }, []);

  const toastFn = useCallback((m: string) => { setToast(m); setTimeout(() => setToast(''), 2000); }, []);

  const updateSeats = useCallback((ids: string[], ch: Partial<Seat>) => {
    setSeats(p => p.map(s => ids.includes(s.id) ? { ...s, ...ch } : s));
  }, []);

  const toggleSelect = useCallback((id: string, c: boolean) => {
    setSelectedIds(p => { const n = new Set(c ? p : []); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const sel = useMemo(() => seats.filter(s => selectedIds.has(s.id)), [seats, selectedIds]);

  const moveSeats = useCallback((ids: string[], dx: number, dy: number) => {
    setSeats(p => p.map(s => ids.includes(s.id) ? { ...s, x: snapX(s.x + dx), y: snapY(s.y + dy) } : s));
  }, []);

  const addSeat = useCallback((_block: SeatBlock) => {
    toastFn('Usa el boton de la toolbar en modo edicion');
  }, [toastFn]);

  const applyColor = useCallback((c: string) => { updateSeats(Array.from(selectedIds), { color: c }); }, [selectedIds, updateSeats]);
  const applyStatus = useCallback((st: SeatStatus) => {
    const sc: Record<SeatStatus, string> = { free: '#e2e4e9', pending: '#f59e0b', reserved: '#ef4444' };
    updateSeats(Array.from(selectedIds), { status: st, color: sc[st] });
  }, [selectedIds, updateSeats]);
  const applyRes = useCallback((n: string) => { updateSeats(Array.from(selectedIds), { reservedFor: n }); }, [selectedIds, updateSeats]);

  const alignSel = useCallback(() => {
    setSeats(p => p.map(s => selectedIds.has(s.id) ? { ...s, x: snapX(s.x), y: snapY(s.y) } : s));
  }, [selectedIds]);
  const resetSel = useCallback(() => {
    setSeats(p => p.map(s => selectedIds.has(s.id) && s.seedX != null ? { ...s, x: s.seedX, y: s.seedY! } : s));
  }, [selectedIds]);

  const whatsapp = useCallback(async () => {
    const t = generateWhatsAppCopy(sel); if (!t) { toastFn('Selecciona al menos un asiento'); return; }
    await copyToClipboard(t); toastFn('Copiado');
  }, [sel, toastFn]);

  const png = useCallback(() => {
    if (selectedIds.size === 0) { toastFn('Selecciona al menos un asiento'); return; }
    const mx = Math.max(...seats.map(s => s.x), 0) + 40;
    const my = Math.max(...seats.map(s => s.y), 0) + 40;
    generatePNG(seats, selectedIds, Math.max(mx + 180, 1800), my + 40, showGrid, theme);
    toastFn('PNG generado');
  }, [seats, selectedIds, showGrid, theme, toastFn]);

  const single = sel.length === 1 ? sel[0] : null;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Toolbar theme={theme} onToggleTheme={toggleTheme}
        editMode={editMode} onToggleEditMode={() => setEditMode(v => !v)}
        showGrid={showGrid} onToggleGrid={() => setShowGrid(v => !v)}
        selectedCount={selectedIds.size} multiSelect={multiSelect}
        onToggleMultiSelect={() => setMultiSelect(v => !v)}
        onAlignSelected={alignSel} onResetPositions={resetSel}
        onWhatsAppCopy={whatsapp} onGeneratePNG={png}
        onClearSelection={clearSelection}
      />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto relative">
          <SeatMap seats={seats} selectedIds={selectedIds}
            editMode={editMode} showGrid={showGrid} multiSelect={multiSelect}
            onToggleSelect={toggleSelect} onMoveSeats={moveSeats}
            onClearSelection={clearSelection} onAddSeat={addSeat}
          />
        </div>
        <Sidebar singleSeat={single} selectedCount={selectedIds.size}
          onUpdateSeat={ch => { if (single) updateSeats([single.id], ch); }}
          onUpdateSelected={ch => updateSeats(Array.from(selectedIds), ch)}
          onApplyStatus={applyStatus} onApplyColor={applyColor}
          onApplyReservation={applyRes} onClearReservation={() => applyRes('')}
          editMode={editMode}
        />
      </div>
      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg text-sm z-50"
          style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
