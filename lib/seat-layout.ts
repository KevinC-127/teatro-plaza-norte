import type { Seat } from '@/types/seat';

export const CELL_W = 32;
export const CELL_H = 30;

export function snapX(x: number): number { return Math.round(x / CELL_W) * CELL_W; }
export function snapY(y: number): number { return Math.round(y / CELL_H) * CELL_H; }

export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

export function isCellOccupied(x: number, y: number, seats: Seat[], excludeIds: Set<string>): boolean {
  const sx = snapX(x);
  const sy = snapY(y);
  for (const s of seats) {
    if (excludeIds.has(s.id)) continue;
    if (snapX(s.x) === sx && snapY(s.y) === sy) return true;
  }
  return false;
}

export function findNearestFreeCell(
  targetX: number,
  targetY: number,
  seats: Seat[],
  excludeIds: Set<string>
): { x: number; y: number } {
  const sx = snapX(targetX);
  const sy = snapY(targetY);

  if (!isCellOccupied(sx, sy, seats, excludeIds)) return { x: sx, y: sy };

  const maxDist = 40;
  for (let dist = 1; dist <= maxDist; dist++) {
    for (let d = -dist; d <= dist; d++) {
      const candidates = [
        { x: sx + d * CELL_W, y: sy - dist * CELL_H },
        { x: sx + d * CELL_W, y: sy + dist * CELL_H },
        { x: sx - dist * CELL_W, y: sy + d * CELL_H },
        { x: sx + dist * CELL_W, y: sy + d * CELL_H },
      ];
      for (const c of candidates) {
        if (!isCellOccupied(c.x, c.y, seats, excludeIds)) {
          return { x: c.x, y: c.y };
        }
      }
    }
  }

  return { x: sx, y: sy };
}

export function getDefaultColor(status: Seat['status']): string {
  switch (status) {
    case 'free': return '#e2e4e9';
    case 'pending': return '#f59e0b';
    case 'reserved': return '#ef4444';
  }
}

export function getAccessibilityIcon(type: Seat['accessibilityType']): string {
  switch (type) {
    case 'wheelchair-space': return 'W';
    case 'accessible-seat': return 'A';
    case 'companion-seat': return 'C';
    default: return '';
  }
}

export function getAccessibilityLabel(type: Seat['accessibilityType']): string {
  switch (type) {
    case 'wheelchair-space': return 'Silla de ruedas';
    case 'accessible-seat': return 'Accesible';
    case 'companion-seat': return 'Acompañante';
    default: return 'Normal';
  }
}

export function getStatusLabel(status: Seat['status']): string {
  switch (status) {
    case 'free': return 'Sin reservar';
    case 'pending': return 'Pendiente';
    case 'reserved': return 'Reservado';
  }
}

export function getBlockLabel(block: Seat['block']): string {
  switch (block) {
    case 'left': return 'Platea Izquierda';
    case 'center': return 'Platea Central';
    case 'right': return 'Platea Derecha';
  }
}
