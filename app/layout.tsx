import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Teatro Plaza Norte - Mapa de Butacas',
  description: 'Mapa interactivo de butacas para gestión de reservas',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('teatro-theme');if(t==='light')document.documentElement.classList.remove('dark');else if(t==='dark'||!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
