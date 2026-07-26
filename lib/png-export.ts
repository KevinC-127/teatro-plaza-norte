import type { Seat } from '@/types/seat';
import { getStatusLabel } from '@/lib/seat-layout';

const SEAT_W = 28;
const SEAT_H = 24;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - 2);
  ctx.quadraticCurveTo(x + w, y + h, x + w - 2, y + h);
  ctx.lineTo(x + 2, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - 2);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function generatePNG(
  seats: Seat[],
  selectedIds: Set<string>,
  width: number,
  height: number,
  gridSize: number,
  showGrid: boolean,
  theme: 'dark' | 'light'
): void {
  const selected = seats.filter((s) => selectedIds.has(s.id));
  const sortedSelected = [...selected].sort((a, b) => {
    if (a.block !== b.block) return a.block.localeCompare(b.block);
    if (a.rowLabel !== b.rowLabel) return a.rowLabel.localeCompare(b.rowLabel);
    return Number(a.seatNumber) - Number(b.seatNumber);
  });

  const lineHeight = 14;
  const infoPadding = 16;
  const infoHeaderH = 20;
  const infoLines = sortedSelected.length;
  const infoHeight = infoLines > 0 ? infoHeaderH + infoLines * lineHeight + infoPadding * 2 : 0;

  const canvasW = width;
  const canvasH = height + 20 + infoHeight + 20;

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(2, 2);
  const w = canvasW / 2;
  const h = canvasH / 2;

  const bgColor = theme === 'dark' ? '#0c0c0e' : '#f0f1f4';
  const textColor = theme === 'dark' ? '#e4e4e7' : '#18181b';
  const mutedColor = theme === 'dark' ? '#a1a1aa' : '#71717a';
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.06)';

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, w, h);

  if (showGrid) {
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;
    for (let x = gridSize; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height / 2 + 30);
      ctx.stroke();
    }
    for (let y = gridSize; y < height / 2 + 30; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  const uniqueRows = new Map<string, { label: string; y: number }>();
  for (const s of seats) {
    const key = `${s.rowLabel}@${s.y}`;
    if (!uniqueRows.has(key)) uniqueRows.set(key, { label: s.rowLabel, y: s.y });
  }
  const rows = Array.from(uniqueRows.values()).sort((a, b) => a.y - b.y);

  ctx.font = 'bold 8px Inter, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (const row of rows) {
    ctx.fillStyle = mutedColor;
    ctx.fillText(row.label, 36, row.y / 2 + SEAT_H / 4);
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const seat of seats) {
    const sx = seat.x / 2;
    const sy = seat.y / 2;
    const isSel = selectedIds.has(seat.id);

    ctx.fillStyle = seat.color;
    roundRect(ctx, sx, sy, SEAT_W / 2, SEAT_H / 2, 3);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(sx + 1, sy, SEAT_W / 2 - 2, 1);

    if (isSel) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.fillStyle = '#1a1a1a';
    ctx.font = '600 6px Inter, sans-serif';
    ctx.fillText(seat.seatNumber, sx + SEAT_W / 4, sy + SEAT_H / 4);
  }

  ctx.fillStyle = mutedColor;
  ctx.font = '600 7px Inter, sans-serif';
  ctx.textAlign = 'center';
  const stageY = 4;
  ctx.fillText('ESCENARIO', w / 2, stageY);
  ctx.fillStyle = theme === 'dark' ? '#71717a' : '#a1a1aa';
  ctx.fillRect(w / 2 - 150, stageY + 8, 300, 1);

  if (infoLines > 0 && infoHeight > 0) {
    const infoY = height / 2 + 30;

    ctx.fillStyle = theme === 'dark' ? '#161618' : '#ffffff';
    ctx.fillRect(10, infoY, w - 20, infoHeight / 2 - 10);

    ctx.strokeStyle = theme === 'dark' ? '#27272c' : '#e2e4e9';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(10, infoY, w - 20, infoHeight / 2 - 10);

    ctx.fillStyle = textColor;
    ctx.font = 'bold 8px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Seleccion (${infoLines} asientos):`, 20, infoY + infoPadding + 5);

    ctx.font = '7px Inter, sans-serif';
    for (let i = 0; i < sortedSelected.length; i++) {
      const s = sortedSelected[i];
      const line = `${s.category || s.block} ${s.rowLabel}-${s.seatNumber}${s.reservedFor ? ' | R: ' + s.reservedFor : ''} | ${getStatusLabel(s.status)} | S/ ${s.price.toFixed(2)}`;
      ctx.fillStyle = textColor;
      ctx.fillText(line, 20, infoY + infoPadding + infoHeaderH + i * lineHeight + 2);
    }
  }

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plaza-norte-seleccion.png';
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}
