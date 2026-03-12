import type { Metadata } from 'next';
import { Inter, Source_Serif_4 } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
});

const sourceSerif4 = Source_Serif_4({
  variable: '--font-serif',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Department of Physics & Engineering Physics',
    template: '%s | Physics — OAU',
  },
  description:
    'Department of Physics and Engineering Physics, Obafemi Awolowo University, Ile-Ife, Nigeria.',
  icons: {
    icon: [
      { url: '/assets/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/assets/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/assets/favicon.ico',
    apple: '/assets/apple-touch-icon.png',
  },
  manifest: '/assets/site.webmanifest',
  metadataBase: new URL('https://physics.oauife.edu.ng'),
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    siteName: 'OAU Physics',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${sourceSerif4.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
