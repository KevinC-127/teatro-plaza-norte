export type SeatStatus = 'free' | 'pending' | 'reserved';

export type AccessibilityType =
  | 'normal'
  | 'accessible-seat'
  | 'wheelchair-space'
  | 'companion-seat';

export type SeatBlock = 'left' | 'center' | 'right';

export interface Seat {
  id: string;
  block: SeatBlock;
  rowId: string;
  rowLabel: string;
  seatNumber: string;
  x: number;
  y: number;
  color: string;
  status: SeatStatus;
  reservedFor: string;
  notes: string;
  accessibilityType: AccessibilityType;
  locked?: boolean;
  seedX?: number;
  seedY?: number;
}

export interface Row {
  id: string;
  label: string;
  blockGroup: string;
}

export interface LayoutData {
  venueName: string;
  stageLabel: string;
  seats: Seat[];
}
