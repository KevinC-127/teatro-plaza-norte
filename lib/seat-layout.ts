import type { Seat } from '@/types/seat';

export const CELL_W = 32;
export const CELL_H = 30;

export function snapX(x: number): number { return Math.round(x / CELL_W) * CELL_W; }
export function snapY(y: number): number { return Math.round(y / CELL_H) * CELL_H; }

export function isCellOccupied(
  cellX: number, cellY: number, seats: Seat[], excludeIds: Set<string>
): boolean {
  const sx = snapX(cellX); const sy = snapY(cellY);
  for (const s of seats) {
    if (excludeIds.has(s.id)) continue;
    if (snapX(s.x) === sx && snapY(s.y) === sy) return true;
  }
  return false;
}

export function findNearestFreeCell(
  targetX: number, targetY: number, seats: Seat[], excludeIds: Set<string>
): { x: number; y: number } {
  const sx = snapX(targetX); const sy = snapY(targetY);
  if (!isCellOccupied(sx, sy, seats, excludeIds)) return { x: sx, y: sy };
  for (let dist = 1; dist <= 40; dist++) {
    for (let d = -dist; d <= dist; d++) {
      const candidates = [
        { x: sx + d * CELL_W, y: sy - dist * CELL_H },
        { x: sx + d * CELL_W, y: sy + dist * CELL_H },
        { x: sx - dist * CELL_W, y: sy + d * CELL_H },
        { x: sx + dist * CELL_W, y: sy + d * CELL_H },
      ];
      for (const c of candidates) {
        if (!isCellOccupied(c.x, c.y, seats, excludeIds)) return c;
      }
    }
  }
  return { x: sx, y: sy };
}

export function getStatusLabel(status: Seat['status']): string {
  return status === 'free' ? 'Sin reservar' : status === 'pending' ? 'Pendiente' : 'Reservado';
}
