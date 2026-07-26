import type { Seat, SeatStatus, AccessibilityType, SeatBlock } from '@/types/seat';

export const CELL_W = 32;
export const CELL_H = 30;

const LEFT_INNER = 320;
const CENTER_START = 352;
const RIGHT_INNER = 832;

export const BLOCK_X: Record<string, number> = {
  left: 64,
  center: CENTER_START,
  right: RIGHT_INNER,
};

interface RowSpec {
  label: string;
  y: number;
  left?: { start: number; count: number };
  center?: { start: number; count: number; split?: boolean };
  right?: { start: number; count: number };
  accessible?: { center: number[] };
}

const ROW_SPECS: RowSpec[] = [
  { label: 'X', y: 750, left: { start: 1, count: 11 }, right: { start: 12, count: 10 } },
  { label: 'W', y: 720, left: { start: 1, count: 8 }, right: { start: 9, count: 8 } },
  { label: 'V', y: 690, left: { start: 1, count: 9 }, center: { start: 10, count: 14 }, right: { start: 24, count: 9 } },
  { label: 'U', y: 660, left: { start: 1, count: 9 }, center: { start: 10, count: 14 }, right: { start: 24, count: 9 } },
  { label: 'T', y: 630, left: { start: 1, count: 9 }, center: { start: 10, count: 14 }, right: { start: 24, count: 9 } },
  { label: 'S', y: 600, left: { start: 1, count: 8 }, center: { start: 9, count: 14 }, right: { start: 23, count: 8 } },
  { label: 'R', y: 570, left: { start: 1, count: 8 }, center: { start: 9, count: 14 }, right: { start: 23, count: 8 } },
  { label: 'Q', y: 540, left: { start: 1, count: 8 }, center: { start: 9, count: 14 }, right: { start: 23, count: 8 } },
  { label: 'P', y: 510, left: { start: 1, count: 7 }, center: { start: 8, count: 14 }, right: { start: 22, count: 7 } },
  { label: 'O', y: 480, left: { start: 1, count: 7 }, center: { start: 8, count: 14 }, right: { start: 22, count: 7 } },
  { label: 'N', y: 450, left: { start: 1, count: 7 }, center: { start: 8, count: 8, split: true }, right: { start: 16, count: 7 } },
  { label: 'M', y: 420, left: { start: 1, count: 6 }, center: { start: 7, count: 8, split: true }, right: { start: 15, count: 6 } },
  { label: 'L', y: 390, left: { start: 1, count: 6 }, center: { start: 7, count: 8, split: true }, right: { start: 15, count: 6 } },
  { label: 'K', y: 330, left: { start: 1, count: 6 }, center: { start: 7, count: 14 }, right: { start: 21, count: 6 } },
  { label: 'J', y: 300, left: { start: 1, count: 6 }, center: { start: 7, count: 14 }, right: { start: 21, count: 6 } },
  { label: 'I', y: 270, left: { start: 1, count: 6 }, center: { start: 7, count: 14 }, right: { start: 21, count: 6 } },
  { label: 'H', y: 240, left: { start: 1, count: 5 }, center: { start: 6, count: 14 }, right: { start: 20, count: 5 } },
  { label: 'G', y: 210, left: { start: 1, count: 5 }, center: { start: 6, count: 14 }, right: { start: 20, count: 5 } },
  { label: 'F', y: 180, left: { start: 1, count: 5 }, center: { start: 6, count: 14 }, right: { start: 20, count: 5 } },
  { label: 'E', y: 150, left: { start: 1, count: 4 }, center: { start: 5, count: 14 }, right: { start: 19, count: 4 } },
  { label: 'D', y: 120, left: { start: 1, count: 4 }, center: { start: 5, count: 14 }, right: { start: 19, count: 4 } },
  { label: 'C', y: 90, left: { start: 1, count: 4 }, center: { start: 5, count: 14 }, right: { start: 19, count: 4 } },
  { label: 'B', y: 60, center: { start: 5, count: 14 }, accessible: { center: [5, 6, 7, 8, 15, 16, 17, 18] } },
];

export const ROW_LABELS_ALL = ROW_SPECS.map((r) => r.label).reverse();

const ACCESSIBLE_COLOR = '#eab308';

export const DEFAULT_COLORS: Record<SeatStatus, string> = {
  free: '#e2e4e9',
  pending: '#f59e0b',
  reserved: '#ef4444',
};

function makeId(block: string, row: string, num: number): string {
  return `${block}-${row}-${num}`;
}

function createSeat(
  block: SeatBlock,
  row: string,
  num: number,
  x: number,
  y: number,
  overrides: Partial<Seat> = {}
): Seat {
  const finalId = overrides.id ?? makeId(block, row, num);
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
    seedX: x,
    seedY: y,
  } satisfies Seat;
}

function generateSeats(): Seat[] {
  const seats: Seat[] = [];

  for (const spec of ROW_SPECS) {
    const { label, y, left, center, right, accessible } = spec;

    if (left) {
      for (let i = 0; i < left.count; i++) {
        const num = left.start + i;
        const cx = LEFT_INNER - (left.count - 1 - i) * CELL_W;
        seats.push(createSeat('left', label, num, cx, y));
      }
    }

    if (center) {
      if (center.split) {
        const half = center.count / 2;
        for (let i = 0; i < half; i++) {
          const num = center.start + i;
          const cx = CENTER_START + i * CELL_W;
          seats.push(createSeat('center', label, num, cx, y));
        }
        for (let i = 0; i < half; i++) {
          const num = center.start + half + i;
          const cx = CENTER_START + (half + 6) * CELL_W + i * CELL_W;
          seats.push(createSeat('center', label, num, cx, y));
        }
      } else {
        for (let i = 0; i < center.count; i++) {
          const num = center.start + i;
          const cx = CENTER_START + i * CELL_W;
          seats.push(createSeat('center', label, num, cx, y));
        }
      }
    }

    if (right) {
      for (let i = 0; i < right.count; i++) {
        const num = right.start + i;
        const cx = RIGHT_INNER + i * CELL_W;
        seats.push(createSeat('right', label, num, cx, y));
      }
    }

    if (accessible) {
      for (const sn of accessible.center ?? []) {
        const seat = seats.find(
          (s) => s.block === 'center' && s.rowLabel === label && s.seatNumber === String(sn)
        );
        if (seat) {
          seat.color = ACCESSIBLE_COLOR;
          seat.accessibilityType = 'wheelchair-space';
        }
      }
    }
  }

  return seats;
}

function applyDemoReservations(seats: Seat[]): void {
  const reservations: Record<string, { status: SeatStatus; reservedFor: string }> = {
    'center-F-12': { status: 'reserved', reservedFor: 'Kevin' },
    'center-F-13': { status: 'reserved', reservedFor: 'Kevin' },
    'center-F-14': { status: 'reserved', reservedFor: 'Kevin' },
    'center-G-6': { status: 'pending', reservedFor: 'Maria' },
    'center-G-7': { status: 'pending', reservedFor: 'Maria' },
    'center-G-8': { status: 'pending', reservedFor: 'Maria' },
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
  const seats = generateSeats();
  applyDemoReservations(seats);
  return seats;
}

export function getRowSpec(label: string): RowSpec | undefined {
  return ROW_SPECS.find((r) => r.label === label);
}

export function getRowMax(block: SeatBlock, label: string): number {
  const spec = getRowSpec(label);
  if (!spec) return 0;
  if (block === 'center') return spec.center?.count ?? 0;
  if (block === 'left') return spec.left?.count ?? 0;
  return spec.right?.count ?? 0;
}

export { ROW_SPECS, LEFT_INNER, CENTER_START, RIGHT_INNER };
