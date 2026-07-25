import type { Seat } from '@/types/seat';
import { CELL_W, CELL_H } from './seed-data';

export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

export function getDefaultColor(status: Seat['status']): string {
  switch (status) {
    case 'free': return '#e5e7eb';
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
    case 'center-left': return 'Platea Central (izq)';
    case 'center-right': return 'Platea Central (der)';
    case 'right': return 'Platea Derecha';
  }
}

export const GRID_SIZES = [4, 8, 12, 16, 20, 24, 32];

export { CELL_W, CELL_H };
