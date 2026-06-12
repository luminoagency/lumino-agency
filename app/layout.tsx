import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lumino Agency',
  description: 'AI-built professional websites for Italian restaurants.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
