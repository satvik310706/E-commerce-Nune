import type { Metadata, Viewport } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import { Suspense } from 'react';
import MobileBottomNav from '@/components/MobileBottomNav';

export const metadata: Metadata = {
  title: 'Oil & Pooja Bazaar | Nune & Pooja Bazaar - Pure Edible Oils & Pooja Items',
  description: 'Buy pure cold pressed sesame, groundnut, coconut oils and organic camphor, incense sticks online. Traditional wood-pressed oils and premium pooja items delivered across Andhra Pradesh & Telangana.',
  keywords: 'Nuvvula Nune, Sesame Oil, Groundnut Oil, Pooja items, Camphor, Agarbatti, Telugu oil seller, Hyderabad pooja items, cold pressed oil',
  authors: [{ name: 'Nune Bazaar Team' }],
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col bg-[#fdfbf7] pb-16 md:pb-0">
        <Providers>
          {children}
          <Suspense fallback={null}>
            <MobileBottomNav />
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
