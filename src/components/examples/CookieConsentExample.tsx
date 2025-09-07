'use client';

/**
 * Usage Example for UX-Optimized Cookie Consent Component
 * Demonstrates integration with Gastvrij.eu application
 */

import { useState } from 'react';
import { UXOptimizedCookieConsent } from '../UXOptimizedCookieConsent';

interface ConsentData {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  timestamp: Date;
  version: string;
}

export function CookieConsentExample() {
  const [consentData, setConsentData] = useState<ConsentData | null>(null);
  const [showBanner, setShowBanner] = useState(true);

  const handleConsentChange = (consent: ConsentData) => {
    console.log('Consent updated:', consent);
    setConsentData(consent);
    
    // Example: Initialize analytics based on consent
    if (consent.analytics) {
      // Initialize Google Analytics, etc.
      console.log('Initializing analytics...');
    }
    
    // Example: Initialize marketing tools
    if (consent.marketing) {
      // Initialize marketing pixels, etc.
      console.log('Initializing marketing tools...');
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    console.log('Cookie banner dismissed');
  };

  const resetConsent = () => {
    localStorage.removeItem('gastvrij-consent');
    setConsentData(null);
    setShowBanner(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          UX-Optimized Cookie Consent Demo
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Consent Status</h2>
          
          {consentData ? (
            <div className="space-y-2">
              <p><strong>Necessary:</strong> {consentData.necessary ? '✅' : '❌'}</p>
              <p><strong>Analytics:</strong> {consentData.analytics ? '✅' : '❌'}</p>
              <p><strong>Marketing:</strong> {consentData.marketing ? '✅' : '❌'}</p>
              <p><strong>Preferences:</strong> {consentData.preferences ? '✅' : '❌'}</p>
              <p><strong>Version:</strong> {consentData.version}</p>
              <p><strong>Timestamp:</strong> {consentData.timestamp.toLocaleString('nl-NL')}</p>
            </div>
          ) : (
            <p className="text-gray-500">No consent data available</p>
          )}
          
          <button
            onClick={resetConsent}
            className="mt-4 px-4 py-2 bg-hospitality-600 text-white rounded-md hover:bg-hospitality-700 transition-colors"
          >
            Reset Consent (Show Banner Again)
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Integration Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">UX Best Practices</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✅ Non-intrusive bottom banner</li>
                <li>✅ Equal choice treatment</li>
                <li>✅ Progressive disclosure</li>
                <li>✅ Mobile-first responsive</li>
                <li>✅ Value-focused messaging</li>
                <li>✅ Minimal cognitive load</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Accessibility Features</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✅ WCAG 2.1 AA compliant</li>
                <li>✅ Keyboard navigation</li>
                <li>✅ Screen reader support</li>
                <li>✅ Focus management</li>
                <li>✅ ARIA labels and roles</li>
                <li>✅ High contrast support</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="font-medium text-gray-900 mb-2">Performance Features</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✅ Async loading with configurable delay</li>
              <li>✅ Minimal DOM impact</li>
              <li>✅ CSS-in-JS optimized styles</li>
              <li>✅ No layout shift when appearing</li>
              <li>✅ Smooth animations (300ms)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* The Cookie Consent Component */}
      {showBanner && (
        <UXOptimizedCookieConsent
          onConsentChange={handleConsentChange}
          onDismiss={handleDismiss}
          autoShow={true}
          showDelay={1000} // Reduced delay for demo
        />
      )}
    </div>
  );
}