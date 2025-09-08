import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../globals.css';
import { CookieConsent } from '@/components/CookieConsent';
import { Suspense } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { locales } from '@/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const inter = Inter({ subsets: ['latin'] });

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'homepage' });
  
  return {
    title: `${t('hero.title')} - Belgian Hospitality Platform`,
    description: t('hero.subtitle'),
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
      canonical: `/${locale}`,
      languages: {
        'nl': '/nl',
        'fr': '/fr', 
        'de': '/de',
        'en': '/en',
      },
    },
    openGraph: {
      type: 'website',
      locale: locale,
      url: `https://gastvrij.eu/${locale}`,
      title: t('hero.title'),
      description: t('hero.subtitle'),
      siteName: 'Gastvrij.eu',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('hero.title'),
      description: t('hero.subtitle'),
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
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  const messages = await getMessages();
  const t = await getTranslations('nav');

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.gdprConsent = {
                necessary: true,
                analytics: false,
                marketing: false,
                preferences: false,
                version: '3.0',
                loadTime: 0
              };
              
              window.cookieConsentPerf = {
                startTime: 0,
                memoryBaseline: 0
              };
              
              if (typeof performance !== 'undefined') {
                window.gdprConsent.loadTime = performance.now();
                window.cookieConsentPerf.startTime = performance.now();
                window.cookieConsentPerf.memoryBaseline = performance.memory ? performance.memory.usedJSHeapSize : 0;
              }
              
              if ('serviceWorker' in navigator && 'caches' in window) {
                const criticalResources = ['/privacy', '/cookies'];
                caches.open('gdpr-v3').then(cache => {
                  cache.addAll(criticalResources).catch(() => {});
                });
              }
            `,
          }}
        />
        
        <link rel="preload" href="/privacy" as="document" />
        <link rel="preload" href="/cookies" as="document" />
        
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        
        <meta name="theme-color" content="#059669" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <a 
            href="#main-content" 
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-hospitality-600 text-white px-4 py-2 rounded-md z-50 transition-all"
          >
            {t('skipToMain')}
          </a>
          
          <header className="bg-white shadow-sm border-b">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
              <div className="text-2xl font-bold text-hospitality-600">
                Gastvrij.eu
              </div>
              <LanguageSwitcher currentLocale={locale} />
            </div>
          </header>
          
          <div id="root">
            <main id="main-content">
              {children}
            </main>
          </div>
          
          <CookieConsentLoader />
          
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.addEventListener('load', function() {
                  if (window.cookieConsentPerf) {
                    const loadTime = performance.now() - window.cookieConsentPerf.startTime;
                    console.log('🚀 Cookie consent system load time:', loadTime.toFixed(2), 'ms');
                    
                    if (window.gdprConsent && window.gdprConsent.analytics && typeof gtag !== 'undefined') {
                      gtag('event', 'page_load_timing', {
                        event_category: 'Performance',
                        event_label: 'cookie_consent_system',
                        value: Math.round(loadTime)
                      });
                    }
                  }
                });
                
                window.addEventListener('cookieConsentChange', function(event) {
                  const consent = event.detail.consent;
                  console.log('🍪 Consent changed, initializing services...', consent);
                  
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
                  
                  if (consent.marketing && !window.fbq) {
                    console.log('🎯 Marketing tools would be initialized');
                  }
                  
                  if (consent.preferences) {
                    console.log('🎨 User preferences applied');
                  }
                });
                
                window.addEventListener('cookieConsentWithdrawn', function(event) {
                  console.log('🧹 Cleaning up non-essential services...', event.detail);
                  
                  const analyticsCookies = ['_ga', '_gid', '_gat', '_fbp', '_fbc'];
                  analyticsCookies.forEach(function(cookie) {
                    document.cookie = cookie + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=' + window.location.hostname;
                  });
                  
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
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

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