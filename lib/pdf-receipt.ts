import type { Seat } from '@/types/seat';

const SCALE = 2;

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

export function generatePDFReceipt(
  allSeats: Seat[],
  customerName: string,
  purchaseNumber: number,
): void {
  const customerSeats = allSeats
    .filter(s => s.reservedFor === customerName)
    .sort((a, b) => {
      if (a.rowLabel !== b.rowLabel) return a.rowLabel.localeCompare(b.rowLabel);
      if (a.block !== b.block) return a.block.localeCompare(b.block);
      return Number(a.seatNumber) - Number(b.seatNumber);
    });

  if (customerSeats.length === 0) return;

  const totalPrice = customerSeats.reduce((sum, s) => sum + s.price, 0);
  const today = new Date().toLocaleDateString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });

  const mx = Math.max(...allSeats.map(s => s.x), 0) + 40;
  const my = Math.max(...allSeats.map(s => s.y), 0) + 40;
  const mapW = Math.max(mx, 800);
  const mapH = my + 20;

  const canvas = document.createElement('canvas');
  canvas.width = mapW * SCALE;
  canvas.height = mapH * SCALE;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(SCALE, SCALE);

  ctx.fillStyle = '#f8f9fb';
  ctx.fillRect(0, 0, mapW, mapH);

  const rowMap = new Map<string, { label: string; y: number }>();
  for (const s of allSeats) {
    if (!rowMap.has(s.rowLabel)) rowMap.set(s.rowLabel, { label: s.rowLabel, y: s.y });
  }
  const sortedRows = Array.from(rowMap.values()).sort((a, b) => a.y - b.y);

  ctx.font = '700 12px Inter, system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (const row of sortedRows) {
    ctx.fillStyle = '#71717a';
    ctx.fillText(row.label, 68, row.y + 12);
  }

  ctx.fillStyle = '#71717a';
  ctx.font = '600 9px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ESCENARIO', mapW / 2, 10);

  const SW = 28, SH = 24;
  for (const seat of allSeats) {
    const sx = seat.x;
    const sy = seat.y;
    const isCustomerSeat = customerSeats.some(cs => cs.id === seat.id);

    ctx.fillStyle = isCustomerSeat ? '#3b82f6' : seat.color;
    roundRect(ctx, sx, sy, SW, SH, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    if (seat.accessibilityType === 'wheelchair-space') {
      drawWheelchair(ctx, sx + SW - 5, sy + SH - 5, 6);
    }

    ctx.fillStyle = '#1a1a1a';
    ctx.font = '700 9px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(seat.seatNumber, sx + SW / 2, sy + SH / 2);
  }

  const dataUrl = canvas.toDataURL('image/png');

  const pinfo = customerSeats.map(s => `
    <tr>
      <td>${s.rowLabel}-${s.seatNumber}</td>
      <td>${s.category || '-'}</td>
      <td class="price">S/ ${s.price.toFixed(2)}</td>
    </tr>
  `).join('');

  const padNum = String(purchaseNumber).padStart(4, '0');
  const plural = customerSeats.length !== 1 ? 's' : '';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Boleta #${padNum} - ${customerName}</title>
<style>
  @page { margin: 12mm; size: A4 portrait; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    background: #f5f5f5;
    display: flex;
    justify-content: center;
    padding: 20px;
  }
  .receipt {
    max-width: 210mm;
    width: 100%;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.1);
    padding: 28px 32px;
    page-break-after: avoid;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
    padding-bottom: 14px;
    border-bottom: 2px solid #eab308;
  }
  .header .title {
    font-size: 20px;
    font-weight: 800;
    color: #1a1a2e;
    letter-spacing: -0.3px;
  }
  .header .title small {
    display: block;
    font-size: 11px;
    font-weight: 400;
    color: #71717a;
    margin-top: 2px;
  }
  .header .purchase-num {
    text-align: right;
    font-size: 14px;
    font-weight: 700;
    color: #18181b;
  }
  .header .purchase-num small {
    display: block;
    font-size: 10px;
    font-weight: 400;
    color: #71717a;
  }
  .map-container {
    text-align: center;
    margin: 16px 0;
    border: 1px solid #e4e4e7;
    border-radius: 6px;
    padding: 8px;
    background: #fafafa;
  }
  .map-container img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 0 auto;
  }
  .customer-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 16px 0;
    padding: 10px 14px;
    background: #f4f4f5;
    border-radius: 6px;
    font-size: 13px;
    color: #18181b;
  }
  .customer-info strong { font-weight: 700; }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    margin-top: 12px;
  }
  thead th {
    background: #f4f4f5;
    padding: 8px 10px;
    text-align: left;
    font-weight: 700;
    color: #27272a;
    border-bottom: 2px solid #d4d4d8;
  }
  thead th:last-child { text-align: right; }
  tbody td {
    padding: 7px 10px;
    border-bottom: 1px solid #e4e4e7;
    color: #18181b;
  }
  tbody td:last-child { text-align: right; }
  tfoot td {
    padding: 10px 10px 6px;
    font-weight: 700;
    color: #18181b;
    border-top: 2px solid #d4d4d8;
  }
  tfoot td:last-child {
    text-align: right;
    font-size: 15px;
    color: #059669;
  }
  .price { font-variant-numeric: tabular-nums; }
  .footer {
    margin-top: 24px;
    text-align: center;
    color: #a1a1aa;
    font-size: 11px;
    border-top: 1px solid #e4e4e7;
    padding-top: 14px;
  }
  @media print {
    body { background: #fff; padding: 0; }
    .receipt { box-shadow: none; border-radius: 0; padding: 20px 32px; }
  }
</style>
</head>
<body>
<div class="receipt">
  <div class="header">
    <div class="title">
      Teatro Plaza Norte
      <small>Mapa de butacas</small>
    </div>
    <div class="purchase-num">
      Nro de Compra: #${padNum}
      <small>Boleta de reserva</small>
    </div>
  </div>

  <div class="map-container">
    <img src="${dataUrl}" alt="Mapa de butacas" />
  </div>

  <div class="customer-info">
    <span><strong>Cliente:</strong> ${customerName}</span>
    <span><strong>Fecha:</strong> ${today}</span>
  </div>

  <table>
    <thead>
      <tr>
        <th>Asiento</th>
        <th>Categoria</th>
        <th style="text-align:right">Precio</th>
      </tr>
    </thead>
    <tbody>
      ${pinfo}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="2">Total: ${customerSeats.length} asiento${plural}</td>
        <td class="price">S/ ${totalPrice.toFixed(2)}</td>
      </tr>
    </tfoot>
  </table>

  <div class="footer">
    Teatro Plaza Norte &bull; Gracias por su preferencia
  </div>
</div>
<script>
window.onload = function () {
  setTimeout(function () { window.print(); }, 500);
};
</script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

export function getPurchaseCounter(): number {
  if (typeof window === 'undefined') return 1;
  const val = localStorage.getItem('teatro-purchase-counter');
  return val ? parseInt(val, 10) : 1;
}

export function incrementPurchaseCounter(): number {
  const next = getPurchaseCounter() + 1;
  localStorage.setItem('teatro-purchase-counter', String(next));
  return next;
}
