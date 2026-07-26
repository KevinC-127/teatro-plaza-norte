'use client';

import React from 'react';

interface GridOverlayProps {
  gridSize: number;
  width: number;
  height: number;
}

export function GridOverlay({ gridSize, width, height }: GridOverlayProps) {
  return (
    <div
      className="absolute inset-0 pointer-events-none z-0"
      style={{
        width,
        height,
        backgroundImage: `
          linear-gradient(to right, var(--grid-line) 1px, transparent 1px),
          linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)
        `,
        backgroundSize: `${gridSize}px ${gridSize}px`,
      }}
    />
  );
}
