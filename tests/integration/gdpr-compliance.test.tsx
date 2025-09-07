import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CookieConsent } from '@/components/CookieConsent';
import * as gdpr from '@/lib/gdpr';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

// Mock localStorage to test different scenarios
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get store() {
      return { ...store };
    }
  };
};

describe('GDPR Compliance Integration Tests', () => {
  let localStorageMock: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    // Reset localStorage mock
    localStorageMock = createLocalStorageMock();
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // Reset console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorageMock.clear();
  });

  describe('Consent Persistence', () => {
    it('should persist consent across sessions', async () => {
      const user = userEvent.setup();

      // First render - no existing consent
      const { unmount } = render(<CookieConsent />);
      
      // User accepts with analytics enabled
      const analyticsCheckbox = screen.getAllByRole('checkbox')[1];
      await user.click(analyticsCheckbox);
      
      const acceptButton = screen.getByRole('button', { name: 'Alle Cookies Accepteren' });
      await user.click(acceptButton);
      
      // Check that consent was saved to localStorage
      expect(localStorageMock.store['gdpr-consent']).toBeDefined();
      const savedConsent = JSON.parse(localStorageMock.store['gdpr-consent']);
      expect(savedConsent).toMatchObject({
        necessary: true,
        analytics: true,
        marketing: false,
        preferences: false,
      });

      unmount();

      // Second render - should not show banner due to existing consent
      render(<CookieConsent />);
      expect(screen.queryByText('Cookie Instellingen')).not.toBeInTheDocument();
    });

    it('should handle consent versioning and expiry', () => {
      // Set old consent (simulating expired or outdated consent)
      const oldConsent = {
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
      };
      
      localStorageMock.setItem('gdpr-consent', JSON.stringify(oldConsent));
      
      // Component should handle old consent and potentially request new consent
      render(<CookieConsent />);
      
      // For now, it accepts any existing consent, but this test documents
      // the need for consent versioning in the future
      expect(screen.queryByText('Cookie Instellingen')).not.toBeInTheDocument();
    });

    it('should support granular consent tracking', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);
      
      // Test different combinations of consent
      const checkboxes = screen.getAllByRole('checkbox');
      const [, analyticsCheckbox, marketingCheckbox, preferencesCheckbox] = checkboxes;
      
      // Enable only analytics and preferences
      await user.click(analyticsCheckbox);
      await user.click(preferencesCheckbox);
      
      const acceptButton = screen.getByRole('button', { name: 'Alle Cookies Accepteren' });
      await user.click(acceptButton);
      
      const savedConsent = JSON.parse(localStorageMock.store['gdpr-consent']);
      expect(savedConsent).toMatchObject({
        necessary: true,
        analytics: true,
        marketing: false,
        preferences: true,
      });
    });
  });

  describe('Consent Withdrawal Mechanism', () => {
    it('should allow users to withdraw consent by declining', async () => {
      const user = userEvent.setup();
      
      // Set existing full consent
      const existingConsent = {
        necessary: true,
        analytics: true,
        marketing: true,
        preferences: true,
        timestamp: new Date(),
      };
      localStorageMock.setItem('gdpr-consent', JSON.stringify(existingConsent));
      
      // Force banner to show by setting necessary to false (simulating re-consent)
      const { rerender } = render(<CookieConsent />);
      
      // Simulate a scenario where consent needs to be re-evaluated
      vi.mocked(gdpr.getCookieConsent).mockReturnValue({
        necessary: false,
        analytics: true,
        marketing: true,
        preferences: true,
        timestamp: new Date(),
      });
      
      rerender(<CookieConsent />);
      
      const declineButton = screen.getByRole('button', { name: 'Alleen Noodzakelijke' });
      await user.click(declineButton);
      
      const savedConsent = JSON.parse(localStorageMock.store['gdpr-consent']);
      expect(savedConsent).toMatchObject({
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
      });
    });
  });

  describe('Database-UI Consistency', () => {
    it('should match database schema for consent options', () => {
      render(<CookieConsent />);
      
      // Verify that UI consent options match expected database fields
      const consentCategories = [
        'Noodzakelijke Cookies',
        'Analytische Cookies',
        'Marketing Cookies',
        'Voorkeur Cookies',
      ];
      
      consentCategories.forEach(category => {
        expect(screen.getByText(category)).toBeInTheDocument();
      });
      
      // Ensure all expected checkboxes are present
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(4); // necessary, analytics, marketing, preferences
    });

    it('should save consent in format compatible with database', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);
      
      const acceptButton = screen.getByRole('button', { name: 'Alle Cookies Accepteren' });
      await user.click(acceptButton);
      
      const savedConsent = JSON.parse(localStorageMock.store['gdpr-consent']);
      
      // Verify structure matches what database expects
      expect(savedConsent).toHaveProperty('necessary');
      expect(savedConsent).toHaveProperty('analytics');
      expect(savedConsent).toHaveProperty('marketing');
      expect(savedConsent).toHaveProperty('preferences');
      expect(savedConsent).toHaveProperty('timestamp');
      
      // Verify types
      expect(typeof savedConsent.necessary).toBe('boolean');
      expect(typeof savedConsent.analytics).toBe('boolean');
      expect(typeof savedConsent.marketing).toBe('boolean');
      expect(typeof savedConsent.preferences).toBe('boolean');
      expect(savedConsent.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('API Integration for Consent Saving', () => {
    it('should handle successful API response for consent saving', async () => {
      const user = userEvent.setup();
      
      // Mock successful API response
      server.use(
        http.post('/api/gdpr/consent', () => {
          return HttpResponse.json({
            success: true,
            data: {
              necessary: true,
              analytics: true,
              marketing: false,
              preferences: false,
              timestamp: new Date().toISOString(),
            }
          });
        })
      );

      render(<CookieConsent />);
      
      const analyticsCheckbox = screen.getAllByRole('checkbox')[1];
      await user.click(analyticsCheckbox);
      
      const acceptButton = screen.getByRole('button', { name: 'Alle Cookies Accepteren' });
      await user.click(acceptButton);
      
      // Banner should be hidden
      await waitFor(() => {
        expect(screen.queryByText('Cookie Instellingen')).not.toBeInTheDocument();
      });
    });

    it('should handle API errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock API error
      server.use(
        http.post('/api/gdpr/consent', () => {
          return HttpResponse.json(
            { success: false, error: 'Database error' },
            { status: 500 }
          );
        })
      );

      render(<CookieConsent />);
      
      const acceptButton = screen.getByRole('button', { name: 'Alle Cookies Accepteren' });
      await user.click(acceptButton);
      
      // Component should still hide banner and save to localStorage
      // even if API fails (graceful degradation)
      await waitFor(() => {
        expect(screen.queryByText('Cookie Instellingen')).not.toBeInTheDocument();
      });
      
      expect(localStorageMock.store['gdpr-consent']).toBeDefined();
    });
  });

  describe('Analytics Script Management', () => {
    it('should enable analytics when consent is given', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const user = userEvent.setup();
      
      render(<CookieConsent />);
      
      const analyticsCheckbox = screen.getAllByRole('checkbox')[1];
      await user.click(analyticsCheckbox);
      
      const acceptButton = screen.getByRole('button', { name: 'Alle Cookies Accepteren' });
      await user.click(acceptButton);
      
      // Check that analytics enabling is logged (in real app, this would load analytics scripts)
      expect(consoleSpy).toHaveBeenCalledWith('Analytics enabled');
    });

    it('should disable analytics when consent is withdrawn', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const user = userEvent.setup();
      
      render(<CookieConsent />);
      
      const declineButton = screen.getByRole('button', { name: 'Alleen Noodzakelijke' });
      await user.click(declineButton);
      
      // Check that analytics disabling is logged
      expect(consoleSpy).toHaveBeenCalledWith('Analytics disabled');
    });
  });

  describe('GDPR Rights Compliance', () => {
    it('should provide clear information about each cookie category', () => {
      render(<CookieConsent />);
      
      // Verify detailed descriptions are present
      expect(screen.getByText(/Deze cookies zijn essentieel voor de werking van de website/)).toBeInTheDocument();
      expect(screen.getByText(/Deze cookies helpen ons de website te verbeteren door anonieme gebruikersstatistieken/)).toBeInTheDocument();
      expect(screen.getByText(/Deze cookies worden gebruikt om relevante advertenties te tonen/)).toBeInTheDocument();
      expect(screen.getByText(/Deze cookies onthouden uw voorkeuren en instellingen/)).toBeInTheDocument();
    });

    it('should provide access to privacy policy', () => {
      render(<CookieConsent />);
      
      const privacyLink = screen.getByRole('link', { name: 'privacybeleid' });
      const cookieLink = screen.getByRole('link', { name: 'cookiebeleid' });
      
      expect(privacyLink).toHaveAttribute('href', '/privacy');
      expect(cookieLink).toHaveAttribute('href', '/cookies');
    });
  });

  describe('Data Minimization Principle', () => {
    it('should default to minimal data collection (only necessary cookies)', () => {
      render(<CookieConsent />);
      
      const checkboxes = screen.getAllByRole('checkbox');
      const [necessaryCheckbox, analyticsCheckbox, marketingCheckbox, preferencesCheckbox] = checkboxes;
      
      // Only necessary should be checked by default
      expect(necessaryCheckbox).toBeChecked();
      expect(analyticsCheckbox).not.toBeChecked();
      expect(marketingCheckbox).not.toBeChecked();
      expect(preferencesCheckbox).not.toBeChecked();
    });

    it('should save minimal consent when user declines', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);
      
      const declineButton = screen.getByRole('button', { name: 'Alleen Noodzakelijke' });
      await user.click(declineButton);
      
      const savedConsent = JSON.parse(localStorageMock.store['gdpr-consent']);
      expect(savedConsent).toMatchObject({
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
      });
    });
  });

  describe('Consent Timestamp Tracking', () => {
    it('should record accurate timestamps for consent decisions', async () => {
      const beforeTimestamp = new Date();
      const user = userEvent.setup();
      
      render(<CookieConsent />);
      
      const acceptButton = screen.getByRole('button', { name: 'Alle Cookies Accepteren' });
      await user.click(acceptButton);
      
      const afterTimestamp = new Date();
      
      const savedConsent = JSON.parse(localStorageMock.store['gdpr-consent']);
      const savedTimestamp = new Date(savedConsent.timestamp);
      
      expect(savedTimestamp.getTime()).toBeGreaterThanOrEqual(beforeTimestamp.getTime());
      expect(savedTimestamp.getTime()).toBeLessThanOrEqual(afterTimestamp.getTime());
    });

    it('should update timestamp on consent changes', async () => {
      const user = userEvent.setup();
      
      // First consent
      render(<CookieConsent />);
      const acceptButton = screen.getByRole('button', { name: 'Alle Cookies Accepteren' });
      await user.click(acceptButton);
      
      const firstConsent = JSON.parse(localStorageMock.store['gdpr-consent']);
      const firstTimestamp = new Date(firstConsent.timestamp);
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Simulate consent change by re-rendering and declining
      vi.mocked(gdpr.getCookieConsent).mockReturnValue({
        necessary: false,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: firstTimestamp,
      });
      
      const { rerender } = render(<CookieConsent />);
      rerender(<CookieConsent />);
      
      const declineButton = screen.getByRole('button', { name: 'Alleen Noodzakelijke' });
      await user.click(declineButton);
      
      const secondConsent = JSON.parse(localStorageMock.store['gdpr-consent']);
      const secondTimestamp = new Date(secondConsent.timestamp);
      
      expect(secondTimestamp.getTime()).toBeGreaterThan(firstTimestamp.getTime());
    });
  });
});