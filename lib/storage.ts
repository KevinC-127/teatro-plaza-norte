import type { Seat } from '@/types/seat';

const STORAGE_KEY = 'teatro-plaza-norte-seats';

export function loadSeats(): Seat[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Seat[];
  } catch {
    return null;
  }
}

export function saveSeats(seats: Seat[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seats));
}

export function exportJSON(seats: Seat[], venueName: string, stageLabel: string): string {
  return JSON.stringify({ venueName, stageLabel, seats }, null, 2);
}

export function importJSON(json: string): Seat[] {
  const data = JSON.parse(json);
  if (!Array.isArray(data.seats)) throw new Error('Formato inválido: falta array "seats"');
  return data.seats as Seat[];
}
