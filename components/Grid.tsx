'use client';

import React from 'react';
import { CELL_W, CELL_H } from '@/lib/seat-layout';

interface GridOverlayProps {
  width: number;
  height: number;
}

export function GridOverlay({ width, height }: GridOverlayProps) {
  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          width,
          height,
          backgroundImage: `linear-gradient(to right, var(--grid-line) 1px, transparent 1px)`,
          backgroundSize: `${CELL_W}px 1px`,
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          width,
          height,
          backgroundImage: `linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)`,
          backgroundSize: `1px ${CELL_H}px`,
        }}
      />
    </>
  );
}
