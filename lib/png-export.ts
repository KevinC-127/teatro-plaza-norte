import type { Seat } from '@/types/seat';
import { getStatusLabel } from '@/lib/seat-layout';

const SCALE = 4;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

function drawWheelchair(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.fillStyle = '#334155';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${r * 1.4}px Inter, system-ui, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('\u267F', cx, cy + 0.5);
}

export function generateFilename(selected: Seat[]): string {
  const cats = [...new Set(selected.map(s => s.category).filter(Boolean))];
  const names = [...new Set(selected.map(s => s.reservedFor).filter(Boolean))];
  const count = selected.length;
  const catStr = cats.length > 0 ? cats.join(' - ') : 'Sin categoria';
  const nameStr = names.length > 0 ? names.join(' & ') : 'sin-reservar';
  return `${catStr} - ${nameStr} x${count}.png`
    .replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_.]/g, '');
}

export function generatePNG(
  seats: Seat[], selectedIds: Set<string>,
  width: number, height: number,
  showGrid: boolean, theme: 'dark' | 'light'
): void {
  const selected = seats.filter(s => selectedIds.has(s.id))
    .sort((a, b) => {
      if (a.rowLabel !== b.rowLabel) return a.rowLabel.localeCompare(b.rowLabel);
      if (a.block !== b.block) return a.block.localeCompare(b.block);
      return Number(a.seatNumber) - Number(b.seatNumber);
    });

  const lineH = 26; const infPad = 24; const infHead = 32;
  const infoH = selected.length > 0 ? infHead + selected.length * lineH + infPad * 2 : 0;

  const mapW = width;
  const mapH = height;
  const totalH = mapH + 30 + infoH + 20;

  const canvas = document.createElement('canvas');
  canvas.width = mapW * SCALE;
  canvas.height = totalH * SCALE;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(SCALE, SCALE);

  const bg = theme === 'dark' ? '#0c0c0e' : '#f8f9fb';
  const tc = theme === 'dark' ? '#e4e4e7' : '#18181b';
  const mc = theme === 'dark' ? '#a1a1aa' : '#71717a';

  ctx.fillStyle = bg; ctx.fillRect(0, 0, mapW, totalH);

  if (showGrid) {
    ctx.strokeStyle = theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 0.5;
    for (let x = 32; x < mapW; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, mapH + 20); ctx.stroke(); }
    for (let y = 30; y < mapH; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(mapW, y); ctx.stroke(); }
  }

  const rowMap = new Map<string, { label: string; y: number }>();
  for (const s of seats) {
    if (!rowMap.has(s.rowLabel)) rowMap.set(s.rowLabel, { label: s.rowLabel, y: s.y });
  }
  const sortedRows = Array.from(rowMap.values()).sort((a, b) => a.y - b.y);

  ctx.font = '700 12px Inter, system-ui, sans-serif';
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const row of sortedRows) {
    ctx.fillStyle = mc; ctx.fillText(row.label, 68, row.y + 12);
  }

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const SW = 28, SH = 24;

  for (const seat of seats) {
    const sx = seat.x; const sy = seat.y;
    const isSel = selectedIds.has(seat.id);
    ctx.fillStyle = seat.color;
    roundRect(ctx, sx, sy, SW, SH, 4); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 0.5; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(sx + 2, sy, SW - 4, 2);
    if (isSel) { ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2; ctx.stroke(); }
    if (seat.accessibilityType === 'wheelchair-space') {
      drawWheelchair(ctx, sx + SW - 5, sy + SH - 5, 6);
    }
    ctx.fillStyle = '#1a1a1a';
    ctx.font = '700 9px Inter, system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(seat.seatNumber, sx + SW / 2, sy + SH / 2);
  }

  ctx.fillStyle = mc; ctx.font = '600 9px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center'; ctx.fillText('ESCENARIO', mapW / 2, 10);

  if (selected.length > 0 && infoH > 0) {
    const iy = mapH + 20;
    ctx.fillStyle = theme === 'dark' ? '#161618' : '#ffffff';
    roundRect(ctx, 16, iy, mapW - 32, infoH - 10, 8); ctx.fill();
    ctx.strokeStyle = theme === 'dark' ? '#27272c' : '#d4d4d8';
    ctx.lineWidth = 0.5; ctx.stroke();

    ctx.fillStyle = tc;
    ctx.font = '700 14px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Butacas seleccionadas (${selected.length}):`, 36, iy + infPad + 10);

    const colX = [36, 240, 360, 540, 720];
    const headers = ['Categoria', 'Asiento', 'Estado', 'Reservado', 'Precio'];
    ctx.fillStyle = mc;
    ctx.font = '700 11px Inter, system-ui, sans-serif';
    for (let ci = 0; ci < headers.length; ci++) {
      ctx.fillText(headers[ci], colX[ci], iy + infPad + infHead - 4);
    }
    ctx.strokeStyle = theme === 'dark' ? '#3f3f46' : '#d4d4d8';
    ctx.beginPath();
    ctx.moveTo(36, iy + infPad + infHead); ctx.lineTo(mapW - 36, iy + infPad + infHead);
    ctx.stroke();

    ctx.font = '600 12px Inter, system-ui, sans-serif';
    for (let i = 0; i < selected.length; i++) {
      const s = selected[i];
      const ly = iy + infPad + infHead + i * lineH + 8;
      ctx.fillStyle = tc;
      ctx.fillText(s.category || s.block, colX[0], ly);
      ctx.fillText(`${s.rowLabel}-${s.seatNumber}`, colX[1], ly);
      ctx.fillStyle = s.status === 'reserved' ? '#ef4444' : s.status === 'pending' ? '#f59e0b' : tc;
      ctx.fillText(getStatusLabel(s.status), colX[2], ly);
      ctx.fillStyle = tc;
      ctx.fillText(s.reservedFor || '-', colX[3], ly);
      ctx.fillText(`S/ ${s.price.toFixed(2)}`, colX[4], ly);
    }
  }

  const filename = generateFilename(selected);

  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    a.click(); URL.revokeObjectURL(url);
  }, 'image/png');
}

const LEGEND_ITEMS = [
  { label: 'VIP Platinum', color: '#fef3c7', price: 'S/ 60', rows: 'C-D-E' },
  { label: 'Platea Baja', color: '#f3e8ff', price: 'S/ 50', rows: 'F-G-H-I-J-K' },
  { label: 'Galeria', color: '#dcfce7', price: 'S/ 45', rows: 'L-V (centro)' },
  { label: 'Palco', color: '#e0f2fe', price: 'S/ 40', rows: 'L-S (costados)' },
  { label: 'Platea Alta', color: '#fee2e2', price: 'S/ 30', rows: 'T-X (costados)' },
  { label: 'Silla ruedas', color: '#eab308', price: '', rows: 'Fila B (5-8, 15-18)' },
];

export function generateFullMapPNG(
  seats: Seat[], width: number, height: number, theme: 'dark' | 'light'
): void {
  const lgH = 180;
  const mapW = width;
  const mapH = height;
  const totalH = mapH + 40 + lgH;

  const canvas = document.createElement('canvas');
  canvas.width = mapW * SCALE; canvas.height = totalH * SCALE;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(SCALE, SCALE);

  const bg = theme === 'dark' ? '#0c0c0e' : '#f8f9fb';
  const tc = theme === 'dark' ? '#e4e4e7' : '#18181b';
  const mc = theme === 'dark' ? '#a1a1aa' : '#71717a';

  ctx.fillStyle = bg; ctx.fillRect(0, 0, mapW, totalH);

  const rowMap = new Map<string, { label: string; y: number }>();
  for (const s of seats) {
    if (!rowMap.has(s.rowLabel)) rowMap.set(s.rowLabel, { label: s.rowLabel, y: s.y });
  }
  const sortedRows = Array.from(rowMap.values()).sort((a, b) => a.y - b.y);

  ctx.font = '700 12px Inter, system-ui, sans-serif';
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (const row of sortedRows) {
    ctx.fillStyle = mc; ctx.fillText(row.label, 68, row.y + 12);
  }

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const SW = 28, SH = 24;

  for (const seat of seats) {
    const sx = seat.x; const sy = seat.y;
    ctx.fillStyle = seat.color;
    roundRect(ctx, sx, sy, SW, SH, 4); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 0.5; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(sx + 2, sy, SW - 4, 2);
    if (seat.accessibilityType === 'wheelchair-space') {
      drawWheelchair(ctx, sx + SW - 5, sy + SH - 5, 6);
    }
    ctx.fillStyle = '#1a1a1a';
    ctx.font = '700 9px Inter, system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(seat.seatNumber, sx + SW / 2, sy + SH / 2);
  }

  ctx.fillStyle = mc; ctx.font = '600 9px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center'; ctx.fillText('ESCENARIO', mapW / 2, 10);

  const ly = mapH + 30;
  ctx.fillStyle = theme === 'dark' ? '#161618' : '#ffffff';
  roundRect(ctx, 16, ly, mapW - 32, lgH - 20, 8); ctx.fill();
  ctx.strokeStyle = theme === 'dark' ? '#27272c' : '#d4d4d8';
  ctx.lineWidth = 0.5; ctx.stroke();

  ctx.fillStyle = tc;
  ctx.font = '700 14px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Leyenda', 40, ly + 20);

  const colsPerRow = 3;
  const itemW = (mapW - 80) / colsPerRow;

  ctx.font = '600 12px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < LEGEND_ITEMS.length; i++) {
    const item = LEGEND_ITEMS[i];
    const col = i % colsPerRow;
    const row = Math.floor(i / colsPerRow);
    const ix = 40 + col * itemW;
    const iy = ly + 46 + row * 34;

    ctx.fillStyle = item.color;
    roundRect(ctx, ix, iy - 8, 24, 20, 3); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 0.5; ctx.stroke();

    ctx.fillStyle = tc;
    ctx.textAlign = 'left';
    ctx.fillText(item.label, ix + 34, iy + 2);
    ctx.fillStyle = mc;
    ctx.font = '600 10px Inter, system-ui, sans-serif';
    ctx.fillText(`${item.price}${item.rows ? '  |  ' + item.rows : ''}`, ix + 34, iy + 2 + 16);
    ctx.font = '600 12px Inter, system-ui, sans-serif';
  }

  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'Teatro-Plaza-Norte-Mapa.png';
    a.click(); URL.revokeObjectURL(url);
  }, 'image/png');
}
