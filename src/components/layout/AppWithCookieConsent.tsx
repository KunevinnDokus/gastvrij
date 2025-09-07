'use client';

/**
 * Application Layout with UX-Optimized Cookie Consent Integration
 * Shows complete implementation example for Gastvrij.eu
 */

import { useEffect } from 'react';
import { UXOptimizedCookieConsent } from '../UXOptimizedCookieConsent';
import { useCookieConsent } from '../../hooks/useCookieConsent';

interface AppWithCookieConsentProps {
  children: React.ReactNode;
}

export function AppWithCookieConsent({ children }: AppWithCookieConsentProps) {
  const { consent, hasConsent, getConsentStatus } = useCookieConsent();

  // Initialize services based on consent
  useEffect(() => {
    if (!hasConsent || !consent) return;

    // Analytics initialization
    if (getConsentStatus('analytics')) {
      initializeAnalytics();
    }

    // Marketing tools initialization
    if (getConsentStatus('marketing')) {
      initializeMarketingTools();
    }

    // User preferences initialization
    if (getConsentStatus('preferences')) {
      initializePersonalization();
    }

  }, [consent, hasConsent, getConsentStatus]);

  // Listen for consent changes
  useEffect(() => {
    const handleConsentChange = (event: CustomEvent) => {
      const { consent: newConsent } = event.detail;
      console.log('Consent updated:', newConsent);
      
      // Reinitialize services based on new consent
      handleServicesBasedOnConsent(newConsent);
    };

    const handleConsentWithdrawn = (event: CustomEvent) => {
      console.log('Consent withdrawn:', event.detail.timestamp);
      
      // Clean up marketing and analytics
      cleanupNonEssentialServices();
    };

    window.addEventListener('cookieConsentChange', handleConsentChange as EventListener);
    window.addEventListener('cookieConsentWithdrawn', handleConsentWithdrawn as EventListener);

    return () => {
      window.removeEventListener('cookieConsentChange', handleConsentChange as EventListener);
      window.removeEventListener('cookieConsentWithdrawn', handleConsentWithdrawn as EventListener);
    };
  }, []);

  return (
    <>
      {/* Main Application */}
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-hospitality-600">
                  Gastvrij.eu
                </h1>
                <span className="text-sm text-gray-500">
                  Hospitality SaaS Platform
                </span>
              </div>
              
              {/* Consent Status Indicator */}
              {hasConsent && consent && (
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-gray-500">Cookies:</span>
                  <div className="flex space-x-1">
                    <span className={`px-2 py-1 rounded ${consent.analytics ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      Analytics
                    </span>
                    <span className={`px-2 py-1 rounded ${consent.marketing ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      Marketing
                    </span>
                    <span className={`px-2 py-1 rounded ${consent.preferences ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      Personalisatie
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Footer with Privacy Links */}
        <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-6 mb-4 md:mb-0">
                <a 
                  href="/privacy" 
                  className="text-sm text-gray-600 hover:text-hospitality-600 transition-colors"
                >
                  Privacybeleid
                </a>
                <a 
                  href="/cookies" 
                  className="text-sm text-gray-600 hover:text-hospitality-600 transition-colors"
                >
                  Cookiebeleid
                </a>
                <a 
                  href="/gdpr" 
                  className="text-sm text-gray-600 hover:text-hospitality-600 transition-colors"
                >
                  AVG-rechten
                </a>
              </div>
              
              <div className="text-sm text-gray-500">
                © 2024 Gastvrij.eu - GDPR Compatibel
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* UX-Optimized Cookie Consent Banner */}
      <UXOptimizedCookieConsent
        onConsentChange={handleConsentUpdate}
        autoShow={!hasConsent}
        showDelay={2000}
      />
    </>
  );
}

// Helper Functions

function handleConsentUpdate(consentData: any) {
  console.log('Consent updated in app:', consentData);
  
  // Track consent event (only if analytics consent given)
  if (consentData.analytics) {
    trackEvent('cookie_consent_updated', {
      analytics: consentData.analytics,
      marketing: consentData.marketing,
      preferences: consentData.preferences,
      timestamp: consentData.timestamp,
    });
  }
}

function initializeAnalytics() {
  console.log('Initializing analytics services...');
  
  // Google Analytics 4
  if (typeof gtag !== 'undefined') {
    gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '', {
      anonymize_ip: true,
      allow_google_signals: false,
    });
  }
  
  // Adobe Analytics or other providers
  // analytics.init();
}

function initializeMarketingTools() {
  console.log('Initializing marketing tools...');
  
  // Facebook Pixel
  if (typeof fbq !== 'undefined') {
    fbq('init', process.env.NEXT_PUBLIC_FB_PIXEL_ID || '');
  }
  
  // Google Ads
  if (typeof gtag !== 'undefined') {
    gtag('config', process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || '');
  }
  
  // Other marketing tools
  // hubspot.init();
  // intercom.init();
}

function initializePersonalization() {
  console.log('Initializing personalization features...');
  
  // User preference systems
  // personalizer.init();
  
  // A/B testing frameworks
  // optimizely.init();
  
  // Recommendation engines
  // recommendations.init();
}

function handleServicesBasedOnConsent(consent: any) {
  // Reinitialize or cleanup services based on new consent
  if (consent.analytics) {
    initializeAnalytics();
  } else {
    cleanupAnalytics();
  }
  
  if (consent.marketing) {
    initializeMarketingTools();
  } else {
    cleanupMarketingTools();
  }
  
  if (consent.preferences) {
    initializePersonalization();
  } else {
    cleanupPersonalization();
  }
}

function cleanupNonEssentialServices() {
  cleanupAnalytics();
  cleanupMarketingTools();
  cleanupPersonalization();
}

function cleanupAnalytics() {
  console.log('Cleaning up analytics services...');
  // Clear analytics cookies and stop tracking
  if (typeof gtag !== 'undefined') {
    gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '', {
      send_page_view: false,
    });
  }
}

function cleanupMarketingTools() {
  console.log('Cleaning up marketing tools...');
  // Clear marketing cookies and stop tracking
  document.cookie.split(';').forEach(cookie => {
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    if (name.startsWith('_fb') || name.startsWith('_ga') || name.startsWith('gads')) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }
  });
}

function cleanupPersonalization() {
  console.log('Cleaning up personalization services...');
  // Clear personalization data
  localStorage.removeItem('user-preferences');
  sessionStorage.removeItem('personalization-data');
}

function trackEvent(eventName: string, parameters?: any) {
  if (typeof gtag !== 'undefined') {
    gtag('event', eventName, parameters);
  }
}

// Global type declarations for external libraries
declare global {
  function gtag(...args: any[]): void;
  function fbq(...args: any[]): void;
}