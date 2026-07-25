import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Teatro Plaza Norte - Gestión de Butacas',
  description: 'Mapa interactivo de butacas para gestión de reservas',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-gray-950 text-gray-100 min-h-screen">{children}</body>
    </html>
  );
}
