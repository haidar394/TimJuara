import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TimJuara - Kelola Tim Lomba & Kerja Kelompok Jadi Mudah',
  description: 'Aplikasi pengelola tim lomba dan kerja kelompok berbahasa Indonesia: pantau tugas, deadline, leaderboard kontribusi, dan materi riset Google Drive.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body suppressHydrationWarning>
        <main suppressHydrationWarning>{children}</main>
      </body>
    </html>
  );
}
