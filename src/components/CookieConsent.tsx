'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCookieConsent, saveCookieConsent } from '@/lib/gdpr';

interface CookieConsentProps {
  onAccept?: (consent: any) => void;
  onDecline?: () => void;
}

export function CookieConsent({ onAccept, onDecline }: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [consent, setConsent] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false,
  });

  useEffect(() => {
    const existingConsent = getCookieConsent();
    if (!existingConsent.necessary) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    const newConsent = {
      ...consent,
      timestamp: new Date(),
    };
    
    saveCookieConsent(newConsent);
    setIsVisible(false);
    onAccept?.(newConsent);
  };

  const handleDecline = () => {
    const minimalConsent = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
      timestamp: new Date(),
    };
    
    saveCookieConsent(minimalConsent);
    setIsVisible(false);
    onDecline?.();
  };

  const handleToggle = (type: keyof typeof consent) => {
    if (type === 'necessary') return; // Always required
    
    setConsent(prev => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t shadow-lg">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cookie Instellingen</CardTitle>
            <CardDescription>
              We gebruiken cookies om uw ervaring te verbeteren en onze diensten te optimaliseren. 
              U kunt uw voorkeuren hieronder aanpassen.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Necessary Cookies */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium">Noodzakelijke Cookies</h4>
                <p className="text-sm text-gray-600">
                  Deze cookies zijn essentieel voor de werking van de website.
                </p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={consent.necessary}
                  disabled
                  className="w-4 h-4 text-hospitality-600 bg-gray-100 border-gray-300 rounded focus:ring-hospitality-500"
                />
                <span className="ml-2 text-sm text-gray-500">Altijd actief</span>
              </div>
            </div>

            {/* Analytics Cookies */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium">Analytische Cookies</h4>
                <p className="text-sm text-gray-600">
                  Deze cookies helpen ons de website te verbeteren door anonieme gebruikersstatistieken te verzamelen.
                </p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={consent.analytics}
                  onChange={() => handleToggle('analytics')}
                  className="w-4 h-4 text-hospitality-600 bg-gray-100 border-gray-300 rounded focus:ring-hospitality-500"
                />
                <span className="ml-2 text-sm text-gray-600">Optioneel</span>
              </div>
            </div>

            {/* Marketing Cookies */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium">Marketing Cookies</h4>
                <p className="text-sm text-gray-600">
                  Deze cookies worden gebruikt om relevante advertenties te tonen.
                </p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={consent.marketing}
                  onChange={() => handleToggle('marketing')}
                  className="w-4 h-4 text-hospitality-600 bg-gray-100 border-gray-300 rounded focus:ring-hospitality-500"
                />
                <span className="ml-2 text-sm text-gray-600">Optioneel</span>
              </div>
            </div>

            {/* Preference Cookies */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium">Voorkeur Cookies</h4>
                <p className="text-sm text-gray-600">
                  Deze cookies onthouden uw voorkeuren en instellingen.
                </p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={consent.preferences}
                  onChange={() => handleToggle('preferences')}
                  className="w-4 h-4 text-hospitality-600 bg-gray-100 border-gray-300 rounded focus:ring-hospitality-500"
                />
                <span className="ml-2 text-sm text-gray-600">Optioneel</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={handleAccept}
                className="flex-1 bg-hospitality-600 hover:bg-hospitality-700"
              >
                Alle Cookies Accepteren
              </Button>
              <Button
                onClick={handleDecline}
                variant="outline"
                className="flex-1"
              >
                Alleen Noodzakelijke
              </Button>
            </div>

            {/* Privacy Policy Link */}
            <div className="text-center pt-2">
              <p className="text-sm text-gray-600">
                Lees meer over ons{' '}
                <a href="/privacy" className="text-hospitality-600 hover:underline">
                  privacybeleid
                </a>{' '}
                en{' '}
                <a href="/cookies" className="text-hospitality-600 hover:underline">
                  cookiebeleid
                </a>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
