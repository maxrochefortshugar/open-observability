import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'open-observability | Analytics Dashboard',
  description: 'Open-source web application metrics collection and visualization',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--color-background)] font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
