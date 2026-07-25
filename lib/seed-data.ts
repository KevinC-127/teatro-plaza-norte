import type { Seat, SeatStatus, AccessibilityType } from '@/types/seat';

const CELL_W = 32;
const CELL_H = 30;
const MAX_SIDE_SEATS = 8;

const BLOCK_X: Record<string, number> = {
  left: 0,
  'center-left': 296,
  'center-right': 780,
  right: 1268,
};

const CENTER_SEATS_PER_ROW = 14;

const CENTER_ROWS = [
  { label: 'N', y: 0 },
  { label: 'M', y: 30 },
  { label: 'L', y: 60 },
  { label: 'K', y: 90 },
  { label: 'J', y: 120 },
  { label: 'I', y: 150 },
  { label: 'H', y: 180 },
  { label: 'G', y: 210 },
  { label: 'F', y: 240 },
  { label: 'E', y: 270 },
  { label: 'D', y: 300 },
  { label: 'C', y: 330 },
  { label: 'B', y: 360 },
  { label: 'A', y: 390 },
];

const SIDE_ROWS = [
  { label: 'L', y: 60 },
  { label: 'K', y: 90 },
  { label: 'J', y: 120 },
  { label: 'I', y: 150 },
  { label: 'H', y: 180 },
  { label: 'G', y: 210 },
  { label: 'F', y: 240 },
  { label: 'E', y: 270 },
  { label: 'D', y: 300 },
  { label: 'C', y: 330 },
  { label: 'B', y: 360 },
  { label: 'A', y: 390 },
];

const SIDE_COUNTS = [8, 8, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3];

const DEFAULT_COLORS: Record<SeatStatus, string> = {
  free: '#e5e7eb',
  pending: '#f59e0b',
  reserved: '#ef4444',
};

const ACCESSIBLE_COLOR = '#eab308';

function makeId(block: string, row: string, num: number): string {
  return `${block}-${row}-${num}`;
}

function createSeat(
  block: Seat['block'],
  row: string,
  num: number,
  x: number,
  y: number,
  overrides: Partial<Seat> = {}
): Seat {
  const finalId = overrides.id ?? makeId(block, row, num);
  const finalSeedX = overrides.seedX ?? x;
  const finalSeedY = overrides.seedY ?? y;
  return {
    block,
    rowId: `${block}-${row}`,
    rowLabel: row,
    seatNumber: String(num),
    x,
    y,
    color: DEFAULT_COLORS.free,
    status: 'free',
    reservedFor: '',
    notes: '',
    accessibilityType: 'normal',
    ...overrides,
    id: finalId,
    seedX: finalSeedX,
    seedY: finalSeedY,
  } satisfies Seat;
}

function generateCenterSeats(): Seat[] {
  const seats: Seat[] = [];
  for (const { label, y } of CENTER_ROWS) {
    for (let side of ['center-left', 'center-right'] as const) {
      const baseX = BLOCK_X[side];
      for (let n = 1; n <= CENTER_SEATS_PER_ROW; n++) {
        const x = baseX + (n - 1) * CELL_W;
        seats.push(createSeat(side, label, n, x, y));
      }
    }
  }
  return seats;
}

function generateSideSeats(side: 'left' | 'right'): Seat[] {
  const seats: Seat[] = [];
  const baseX = BLOCK_X[side];
  SIDE_ROWS.forEach(({ label, y }, rowIdx) => {
    const count = SIDE_COUNTS[rowIdx];
    for (let n = 1; n <= count; n++) {
      let x: number;
      if (side === 'left') {
        x = baseX + (MAX_SIDE_SEATS - count + (n - 1)) * CELL_W;
      } else {
        x = baseX + (n - 1) * CELL_W;
      }
      seats.push(createSeat(side, label, n, x, y));
    }
  });
  return seats;
}

function applyAccessible(seats: Seat[]): void {
  const accessibleYellow: Record<string, AccessibilityType> = {
    [`center-left-A-12`]: 'wheelchair-space',
    [`center-left-A-13`]: 'wheelchair-space',
    [`center-left-A-14`]: 'companion-seat',
    [`center-right-A-1`]: 'companion-seat',
    [`center-right-A-2`]: 'wheelchair-space',
    [`center-right-A-3`]: 'wheelchair-space',
    [`center-left-B-13`]: 'accessible-seat',
    [`center-left-B-14`]: 'accessible-seat',
    [`center-right-B-1`]: 'accessible-seat',
    [`center-right-B-2`]: 'accessible-seat',
  };
  for (const seat of seats) {
    if (accessibleYellow[seat.id]) {
      seat.color = ACCESSIBLE_COLOR;
      seat.accessibilityType = accessibleYellow[seat.id];
    }
  }
}

function applyDemoReservations(seats: Seat[]): void {
  const reservations: Record<string, { status: SeatStatus; reservedFor: string }> = {
    [`center-left-F-12`]: { status: 'reserved', reservedFor: 'Kevin' },
    [`center-left-F-13`]: { status: 'reserved', reservedFor: 'Kevin' },
    [`center-left-F-14`]: { status: 'reserved', reservedFor: 'Kevin' },
    [`center-right-G-5`]: { status: 'pending', reservedFor: 'María' },
    [`center-right-G-6`]: { status: 'pending', reservedFor: 'María' },
    [`center-right-G-7`]: { status: 'pending', reservedFor: 'María' },
  };
  for (const seat of seats) {
    const r = reservations[seat.id];
    if (r) {
      seat.status = r.status;
      seat.reservedFor = r.reservedFor;
      seat.color = DEFAULT_COLORS[r.status];
    }
  }
}

export function generateSeedSeats(): Seat[] {
  const seats = [
    ...generateCenterSeats(),
    ...generateSideSeats('left'),
    ...generateSideSeats('right'),
  ];
  applyAccessible(seats);
  applyDemoReservations(seats);
  return seats;
}

export { DEFAULT_COLORS, ACCESSIBLE_COLOR, CELL_W, CELL_H, CENTER_ROWS, SIDE_ROWS, SIDE_COUNTS, CENTER_SEATS_PER_ROW, MAX_SIDE_SEATS, BLOCK_X };
