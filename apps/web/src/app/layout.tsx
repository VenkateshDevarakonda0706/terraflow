import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Terraflow - Cinematic 3D Memory Mapping Platform',
  description: 'Share your photos, videos, and time capsules directly onto a beautiful 3D interactive Earth. Navigate memories geographically and chronologically.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
