export type SeatStatus = 'free' | 'pending' | 'reserved';

export type AccessibilityType = 'normal' | 'wheelchair-space';

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
  category: string;
  price: number;
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
