import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { CookieConsent } from '@/components/CookieConsent';
import { Suspense } from 'react';

const inter = Inter({ subsets: ['latin'] });

// Performance-optimized cookie consent loader
function CookieConsentLoader() {
  return (
    <Suspense fallback={null}>
      <CookieConsent 
        autoShow={true}
        showDelay={2000}
        performanceMode={process.env.NODE_ENV === 'production'}
        variant="hospitality"
      />
    </Suspense>
  );
}

export const metadata: Metadata = {
  title: 'Gastvrij.eu - Belgian Hospitality Platform',
  description: 'Premium hospitality management platform for Belgian properties with UX-optimized GDPR compliance and cookie consent management',
  keywords: ['hospitality', 'Belgium', 'accommodation', 'booking', 'GDPR', 'UX-optimized', 'cookie consent', 'privacy'],
  authors: [{ name: 'Gastvrij.eu Development Team' }],
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
    description: 'Premium hospitality management platform with UX-optimized privacy controls',
    siteName: 'Gastvrij.eu',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gastvrij.eu - Belgian Hospitality Platform',
    description: 'Premium hospitality management platform with UX-optimized privacy controls',
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
        {/* UX-Optimized GDPR Compliance - Performance Optimized */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // UX-Optimized GDPR Cookie Consent - Initial State
              window.gdprConsent = {
                necessary: true,
                analytics: false,
                marketing: false,
                preferences: false,
                version: '3.0',
                loadTime: 0
              };
              
              // Performance monitoring - initialize with safe values for hydration
              window.cookieConsentPerf = {
                startTime: 0,
                memoryBaseline: 0
              };
              
              // Set actual performance values after hydration
              if (typeof performance !== 'undefined') {
                window.gdprConsent.loadTime = performance.now();
                window.cookieConsentPerf.startTime = performance.now();
                window.cookieConsentPerf.memoryBaseline = performance.memory ? performance.memory.usedJSHeapSize : 0;
              }
              
              // Preload critical resources for better UX
              if ('serviceWorker' in navigator && 'caches' in window) {
                // Cache cookie policy resources
                const criticalResources = ['/privacy', '/cookies'];
                caches.open('gdpr-v3').then(cache => {
                  cache.addAll(criticalResources).catch(() => {});
                });
              }
            `,
          }}
        />
        
        {/* Preload critical GDPR resources */}
        <link rel="preload" href="/privacy" as="document" />
        <link rel="preload" href="/cookies" as="document" />
        
        {/* DNS prefetch for analytics (conditional) */}
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        
        {/* Hospitality brand optimization */}
        <meta name="theme-color" content="#059669" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        {/* Skip link for accessibility */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-hospitality-600 text-white px-4 py-2 rounded-md z-50 transition-all"
        >
          Ga naar hoofdinhoud
        </a>
        
        <div id="root">
          <main id="main-content">
            {children}
          </main>
        </div>
        
        {/* UX-Optimized Cookie Consent - Async loaded for performance */}
        <CookieConsentLoader />
        
        {/* Performance monitoring script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Monitor cookie consent performance
              window.addEventListener('load', function() {
                if (window.cookieConsentPerf) {
                  const loadTime = performance.now() - window.cookieConsentPerf.startTime;
                  console.log('🚀 Cookie consent system load time:', loadTime.toFixed(2), 'ms');
                  
                  // Track performance metrics (only if analytics consent given)
                  if (window.gdprConsent && window.gdprConsent.analytics && typeof gtag !== 'undefined') {
                    gtag('event', 'page_load_timing', {
                      event_category: 'Performance',
                      event_label: 'cookie_consent_system',
                      value: Math.round(loadTime)
                    });
                  }
                }
              });
              
              // Listen for consent changes and initialize services
              window.addEventListener('cookieConsentChange', function(event) {
                const consent = event.detail.consent;
                console.log('🍪 Consent changed, initializing services...', consent);
                
                // Initialize Google Analytics if consent given
                if (consent.analytics && !window.gtag) {
                  const script = document.createElement('script');
                  script.async = true;
                  script.src = 'https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID';
                  document.head.appendChild(script);
                  
                  window.dataLayer = window.dataLayer || [];
                  window.gtag = function() { dataLayer.push(arguments); };
                  gtag('js', new Date());
                  gtag('config', 'GA_MEASUREMENT_ID', {
                    anonymize_ip: true,
                    allow_google_signals: false,
                    send_page_view: true
                  });
                  
                  console.log('📊 Google Analytics initialized');
                }
                
                // Initialize marketing tools if consent given
                if (consent.marketing && !window.fbq) {
                  // Facebook Pixel initialization would go here
                  console.log('🎯 Marketing tools would be initialized');
                }
                
                // Apply preferences
                if (consent.preferences) {
                  // Apply user preferences like theme, language, etc.
                  console.log('🎨 User preferences applied');
                }
              });
              
              // Clean up on consent withdrawal
              window.addEventListener('cookieConsentWithdrawn', function(event) {
                console.log('🧹 Cleaning up non-essential services...', event.detail);
                
                // Clear analytics cookies
                const analyticsCookies = ['_ga', '_gid', '_gat', '_fbp', '_fbc'];
                analyticsCookies.forEach(function(cookie) {
                  document.cookie = cookie + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=' + window.location.hostname;
                });
                
                // Disable tracking
                if (window.gtag) {
                  gtag('config', 'GA_MEASUREMENT_ID', {
                    send_page_view: false
                  });
                }
                
                console.log('✅ Non-essential services cleaned up');
              });
            `,
          }}
        />
      </body>
    </html>
  );
}

// Global type declarations for better TypeScript support
declare global {
  interface Window {
    gdprConsent?: {
      necessary: boolean;
      analytics: boolean;
      marketing: boolean;
      preferences: boolean;
      version: string;
      loadTime: number;
    };
    cookieConsentPerf?: {
      startTime: number;
      memoryBaseline: number;
    };
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
  }
}