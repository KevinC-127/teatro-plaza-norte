import type { Seat, SeatStatus, AccessibilityType } from '@/types/seat';

export const CELL_W = 32;
export const CELL_H = 30;
const MAX_SIDE_SEATS = 8;
const CENTER_SEATS_PER_ROW = 28;
const K_L_GAP_EXTRA = 36;

export const BLOCK_X: Record<string, number> = {
  left: 44,
  center: 340,
  right: 1276,
};

const CENTER_ROWS_DEF = [
  { label: 'N', yBase: 460 },
  { label: 'M', yBase: 430 },
  { label: 'L', yBase: 400 },
  { label: 'K', yBase: 334 },
  { label: 'J', yBase: 304 },
  { label: 'I', yBase: 274 },
  { label: 'H', yBase: 244 },
  { label: 'G', yBase: 214 },
  { label: 'F', yBase: 184 },
  { label: 'E', yBase: 154 },
  { label: 'D', yBase: 124 },
  { label: 'C', yBase: 94 },
  { label: 'B', yBase: 64 },
  { label: 'A', yBase: 34 },
];

const SIDE_ROWS_DEF = [
  { label: 'L', yBase: 400 },
  { label: 'K', yBase: 334 },
  { label: 'J', yBase: 304 },
  { label: 'I', yBase: 274 },
  { label: 'H', yBase: 244 },
  { label: 'G', yBase: 214 },
  { label: 'F', yBase: 184 },
  { label: 'E', yBase: 154 },
  { label: 'D', yBase: 124 },
  { label: 'C', yBase: 94 },
  { label: 'B', yBase: 64 },
  { label: 'A', yBase: 34 },
];

const SIDE_COUNTS = [8, 8, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3];

export const DEFAULT_COLORS: Record<SeatStatus, string> = {
  free: '#e2e4e9',
  pending: '#f59e0b',
  reserved: '#ef4444',
};

const ACCESSIBLE_COLOR = '#eab308';

export const ROW_LABELS_ALL = CENTER_ROWS_DEF.map((r) => r.label).reverse();

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
  const baseX = BLOCK_X.center;
  for (const { label, yBase } of CENTER_ROWS_DEF) {
    for (let n = 1; n <= CENTER_SEATS_PER_ROW; n++) {
      const x = baseX + (n - 1) * CELL_W;
      seats.push(createSeat('center', label, n, x, yBase));
    }
  }
  return seats;
}

function generateSideSeats(side: 'left' | 'right'): Seat[] {
  const seats: Seat[] = [];
  const baseX = BLOCK_X[side];
  SIDE_ROWS_DEF.forEach(({ label, yBase }, rowIdx) => {
    const count = SIDE_COUNTS[rowIdx];
    for (let n = 1; n <= count; n++) {
      let x: number;
      if (side === 'left') {
        x = baseX + (MAX_SIDE_SEATS - count + (n - 1)) * CELL_W;
      } else {
        x = baseX + (n - 1) * CELL_W;
      }
      seats.push(createSeat(side, label, n, x, yBase));
    }
  });
  return seats;
}

function applyAccessible(seats: Seat[]): void {
  const accessibleYellow: Record<string, AccessibilityType> = {
    'center-A-13': 'wheelchair-space',
    'center-A-14': 'wheelchair-space',
    'center-A-15': 'companion-seat',
    'center-A-16': 'companion-seat',
    'center-B-13': 'accessible-seat',
    'center-B-14': 'accessible-seat',
    'center-B-15': 'accessible-seat',
    'center-B-16': 'accessible-seat',
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
    'center-F-12': { status: 'reserved', reservedFor: 'Kevin' },
    'center-F-13': { status: 'reserved', reservedFor: 'Kevin' },
    'center-F-14': { status: 'reserved', reservedFor: 'Kevin' },
    'center-G-5': { status: 'pending', reservedFor: 'María' },
    'center-G-6': { status: 'pending', reservedFor: 'María' },
    'center-G-7': { status: 'pending', reservedFor: 'María' },
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

export { CENTER_SEATS_PER_ROW, MAX_SIDE_SEATS, SIDE_COUNTS, K_L_GAP_EXTRA };
