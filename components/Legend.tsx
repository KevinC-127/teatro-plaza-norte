'use client';

import React from 'react';

export function Legend() {
  const items = [
    { color: '#e2e4e9', label: 'Sin reservar', border: '#c4c7cc' },
    { color: '#f59e0b', label: 'Pendiente', border: '#d97706' },
    { color: '#ef4444', label: 'Reservado', border: '#dc2626' },
    { color: '#eab308', label: 'Accesible / Silla ruedas', border: '#ca8a04' },
    { color: '#22c55e', label: 'Personalizado', border: '#16a34a' },
  ];

  const accIcons = [
    { icon: 'A', label: 'Accesible' },
    { icon: 'W', label: 'Silla de ruedas' },
    { icon: 'C', label: 'Acompañante' },
  ];

  return (
    <div className="flex items-center gap-4 px-3 py-1.5 text-[10px] border-t select-none"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
        color: 'var(--text-secondary)',
      }}
    >
      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Leyenda:</span>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1">
          <div
            className="w-3.5 h-2.5 rounded-sm border"
            style={{ backgroundColor: item.color, borderColor: item.border }}
          />
          <span>{item.label}</span>
        </div>
      ))}
      <div className="h-3 w-px mx-1" style={{ backgroundColor: 'var(--border-color)' }} />
      {accIcons.map((a) => (
        <div key={a.icon} className="flex items-center gap-1">
          <span
            className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold text-white"
            style={{ backgroundColor: '#334155' }}
          >
            {a.icon}
          </span>
          <span>{a.label}</span>
        </div>
      ))}
    </div>
  );
}
