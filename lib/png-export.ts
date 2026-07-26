import type { Seat } from '@/types/seat';
import { getStatusLabel } from '@/lib/seat-layout';

const SCALE = 4;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function generatePNG(
  seats: Seat[], selectedIds: Set<string>,
  width: number, height: number,
  _gridSize: number, showGrid: boolean, theme: 'dark' | 'light'
): void {
  const selected = seats.filter(s => selectedIds.has(s.id))
    .sort((a, b) => {
      if (a.rowLabel !== b.rowLabel) return a.rowLabel.localeCompare(b.rowLabel);
      if (a.block !== b.block) return a.block.localeCompare(b.block);
      return Number(a.seatNumber) - Number(b.seatNumber);
    });

  const infoLines = selected.length;
  const lineH = 18;
  const infPad = 20;
  const infHead = 24;
  const infoH = infoLines > 0 ? infHead + infoLines * lineH + infPad * 2 : 0;

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

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, mapW, totalH);

  if (showGrid) {
    ctx.strokeStyle = theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 0.5;
    for (let x = 32; x < mapW; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, mapH + 20); ctx.stroke(); }
    for (let y = 30; y < mapH; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(mapW, y); ctx.stroke(); }
  }

  const rows = new Map<string, { label: string; y: number; total: number }>();
  for (const s of seats) {
    const key = s.rowLabel;
    if (!rows.has(key)) rows.set(key, { label: s.rowLabel, y: s.y, total: 0 });
    rows.get(key)!.total++;
  }
  const sortedRows = Array.from(rows.values()).sort((a, b) => a.y - b.y);

  ctx.font = '700 12px Inter, system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (const row of sortedRows) {
    ctx.fillStyle = mc;
    ctx.fillText(row.label, 68, row.y + 12);
  }

  const totalPanelX = mapW - 140;
  ctx.fillStyle = theme === 'dark' ? '#161618' : '#ffffff';
  roundRect(ctx, totalPanelX, 20, 120, 14 + sortedRows.length * 16 + 8, 6);
  ctx.fill();
  ctx.strokeStyle = theme === 'dark' ? '#27272c' : '#d4d4d8';
  ctx.lineWidth = 0.5;
  ctx.stroke();
  ctx.font = '700 11px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = tc;
  ctx.fillText('TOTAL', totalPanelX + 60, 34);
  ctx.font = '600 10px Inter, system-ui, sans-serif';
  ctx.textAlign = 'right';
  let grand = 0;
  sortedRows.forEach((row, i) => {
    ctx.fillStyle = mc;
    ctx.fillText(row.label, totalPanelX + 35, 48 + i * 14);
    ctx.textAlign = 'right';
    ctx.fillStyle = tc;
    ctx.fillText(String(row.total), totalPanelX + 105, 48 + i * 14);
    grand += row.total;
  });
  ctx.strokeStyle = theme === 'dark' ? '#3f3f46' : '#d4d4d8';
  ctx.beginPath();
  ctx.moveTo(totalPanelX + 8, 44 + sortedRows.length * 14);
  ctx.lineTo(totalPanelX + 112, 44 + sortedRows.length * 14);
  ctx.stroke();
  ctx.font = '700 10px Inter, system-ui, sans-serif';
  ctx.fillStyle = tc;
  ctx.fillText(String(grand), totalPanelX + 105, 52 + sortedRows.length * 14);
  ctx.textAlign = 'left';

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const SW = 28, SH = 24;

  for (const seat of seats) {
    const sx = seat.x;
    const sy = seat.y;
    const isSel = selectedIds.has(seat.id);

    ctx.fillStyle = seat.color;
    roundRect(ctx, sx, sy, SW, SH, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(sx + 2, sy, SW - 4, 2);

    if (isSel) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (seat.accessibilityType === 'wheelchair-space') {
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(sx + SW - 4, sy + SH - 4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '600 6px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('W', sx + SW - 4, sy + SH - 4);
    }

    ctx.fillStyle = '#1a1a1a';
    ctx.font = '700 9px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(seat.seatNumber, sx + SW / 2, sy + SH / 2);
  }

  ctx.fillStyle = mc;
  ctx.font = '600 9px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ESCENARIO', mapW / 2, 10);

  if (infoLines > 0 && infoH > 0) {
    const iy = mapH + 20;
    ctx.fillStyle = theme === 'dark' ? '#161618' : '#ffffff';
    roundRect(ctx, 16, iy, mapW - 32, infoH - 10, 8);
    ctx.fill();
    ctx.strokeStyle = theme === 'dark' ? '#27272c' : '#d4d4d8';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.fillStyle = tc;
    ctx.font = '700 12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Butacas seleccionadas (${infoLines}):`, 36, iy + infPad + 8);

    ctx.font = '600 10px Inter, system-ui, sans-serif';

    const colX = [36, 210, 310, 480, 520];
    const headers = ['Categoria', 'Asiento', 'Estado', 'Reservado', 'Precio'];
    ctx.fillStyle = mc;
    ctx.font = '700 9px Inter, system-ui, sans-serif';
    for (let ci = 0; ci < headers.length; ci++) {
      ctx.fillText(headers[ci], colX[ci], iy + infPad + infHead - 6);
    }
    ctx.strokeStyle = theme === 'dark' ? '#3f3f46' : '#d4d4d8';
    ctx.beginPath();
    ctx.moveTo(36, iy + infPad + infHead - 2);
    ctx.lineTo(mapW - 36, iy + infPad + infHead - 2);
    ctx.stroke();

    ctx.font = '600 10px Inter, system-ui, sans-serif';
    for (let i = 0; i < selected.length; i++) {
      const s = selected[i];
      const ly = iy + infPad + infHead + i * lineH + 4;
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

  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plaza-norte-seleccion.png';
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}
