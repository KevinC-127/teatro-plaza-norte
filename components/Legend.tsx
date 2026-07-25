'use client';

import React from 'react';

export function Legend() {
  const items = [
    { color: '#e5e7eb', label: 'Sin reservar', border: '#9ca3af' },
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
    <div className="flex items-center gap-4 px-3 py-1.5 bg-gray-900 border-t border-gray-700 text-[10px] text-gray-400">
      <span className="font-semibold text-gray-300">Leyenda:</span>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1">
          <div
            className="w-3.5 h-3 rounded border"
            style={{ backgroundColor: item.color, borderColor: item.border }}
          />
          <span>{item.label}</span>
        </div>
      ))}
      <div className="h-3 w-px bg-gray-600 mx-1" />
      {accIcons.map((a) => (
        <div key={a.icon} className="flex items-center gap-1">
          <span className="w-3.5 h-3.5 rounded-full bg-gray-700 text-white flex items-center justify-center text-[7px] font-bold">
            {a.icon}
          </span>
          <span>{a.label}</span>
        </div>
      ))}
    </div>
  );
}
