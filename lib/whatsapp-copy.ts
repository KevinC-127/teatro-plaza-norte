import type { Seat } from '@/types/seat';

const BLOCK_LABELS: Record<string, string> = {
  left: 'Platea Izquierda',
  'center-left': 'Platea Central (izq)',
  'center-right': 'Platea Central (der)',
  right: 'Platea Derecha',
};

interface GroupedSeats {
  reservedFor: string;
  block: string;
  rowLabel: string;
  numbers: string[];
}

export function generateWhatsAppCopy(seats: Seat[]): string {
  if (seats.length === 0) return '';

  const sorted = [...seats].sort((a, b) => {
    if (a.block !== b.block) return a.block.localeCompare(b.block);
    if (a.rowLabel !== b.rowLabel) return a.rowLabel.localeCompare(b.rowLabel);
    return Number(a.seatNumber) - Number(b.seatNumber);
  });

  const groups: GroupedSeats[] = [];
  for (const seat of sorted) {
    const key = `${seat.reservedFor || '__sin__'}|${seat.block}|${seat.rowLabel}`;
    const existing = groups.find(
      (g) => `${g.reservedFor}|${g.block}|${g.rowLabel}` === key
    );
    if (existing) {
      existing.numbers.push(seat.seatNumber);
    } else {
      groups.push({
        reservedFor: seat.reservedFor || '',
        block: seat.block,
        rowLabel: seat.rowLabel,
        numbers: [seat.seatNumber],
      });
    }
  }

  const lines: string[] = [];
  for (const g of groups) {
    const name = g.reservedFor || 'Sin asignar';
    const blockLabel = BLOCK_LABELS[g.block] ?? g.block;
    const nums = g.numbers.join(', ');
    lines.push(`${name}: ${blockLabel} fila ${g.rowLabel} asientos ${nums}`);
  }

  return lines.join('\n');
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  }
}
