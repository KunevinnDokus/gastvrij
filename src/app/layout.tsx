import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { CookieConsent } from '@/components/CookieConsent';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Gastvrij.eu - Belgian Hospitality Platform',
  description: 'Premium hospitality management platform for Belgian properties with GDPR compliance',
  keywords: ['hospitality', 'Belgium', 'accommodation', 'booking', 'GDPR'],
  authors: [{ name: 'Gastvrij.eu' }],
  creator: 'Gastvrij.eu',
  publisher: 'Gastvrij.eu',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://gastvrij.eu'),
  alternates: {
    canonical: '/',
    languages: {
      'nl-BE': '/nl',
      'fr-BE': '/fr',
      'en-US': '/en',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'nl_BE',
    url: 'https://gastvrij.eu',
    title: 'Gastvrij.eu - Belgian Hospitality Platform',
    description: 'Premium hospitality management platform for Belgian properties',
    siteName: 'Gastvrij.eu',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gastvrij.eu - Belgian Hospitality Platform',
    description: 'Premium hospitality management platform for Belgian properties',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <head>
        {/* GDPR Compliance - Cookie Consent */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // GDPR Cookie Consent Script
              window.gdprConsent = {
                necessary: true,
                analytics: false,
                marketing: false,
                preferences: false
              };
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <div id="root">
          {children}
        </div>
        {/* GDPR Cookie Consent */}
        <CookieConsent />
      </body>
    </html>
  );
}
