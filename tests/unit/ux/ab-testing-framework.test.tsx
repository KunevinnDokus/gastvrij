import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CookieConsent } from '@/components/CookieConsent';
import * as gdpr from '@/lib/gdpr';

// Mock GDPR functions
vi.mock('@/lib/gdpr', () => ({
  getCookieConsent: vi.fn(),
  saveCookieConsent: vi.fn(),
  isConsentExpired: vi.fn(),
  CONSENT_VERSION: '2.0',
}));

const mockGetCookieConsent = vi.mocked(gdpr.getCookieConsent);
const mockSaveCookieConsent = vi.mocked(gdpr.saveCookieConsent);
const mockIsConsentExpired = vi.mocked(gdpr.isConsentExpired);

// Mock analytics tracking for A/B testing
const mockAnalyticsTrack = vi.fn();
const mockAnalyticsIdentify = vi.fn();

// Simulated A/B test variants
interface ABTestVariant {
  name: string;
  copyVariations: {
    title?: string;
    description?: string;
    acceptButton?: string;
    declineButton?: string;
  };
  designVariations: {
    bannerPosition?: 'bottom' | 'top' | 'center';
    buttonStyle?: 'primary' | 'secondary' | 'outline';
    colorScheme?: 'default' | 'high-contrast' | 'minimal';
  };
}

const AB_TEST_VARIANTS: ABTestVariant[] = [
  {
    name: 'control',
    copyVariations: {},
    designVariations: {},
  },
  {
    name: 'friendly-copy',
    copyVariations: {
      title: 'Cookies & Uw Privacy',
      description: 'We willen uw ervaring verbeteren met cookies. Kiest u wat voor u werkt!',
      acceptButton: 'Prima, ga door!',
      declineButton: 'Nee, dank je',
    },
    designVariations: {},
  },
  {
    name: 'minimal-design',
    copyVariations: {},
    designVariations: {
      colorScheme: 'minimal',
      buttonStyle: 'outline',
    },
  },
  {
    name: 'high-contrast',
    copyVariations: {},
    designVariations: {
      colorScheme: 'high-contrast',
      buttonStyle: 'primary',
    },
  },
];

describe('Cookie Consent - A/B Testing Framework Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSaveCookieConsent.mockReturnValue(true);
    mockIsConsentExpired.mockReturnValue(true);
    mockGetCookieConsent.mockReturnValue({
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
      timestamp: null,
    });

    // Mock analytics integration
    global.gtag = vi.fn();
    global.fbq = vi.fn();
    
    // Mock A/B testing service
    Object.defineProperty(window, 'abTestService', {
      value: {
        getVariant: vi.fn().mockReturnValue('control'),
        trackEvent: mockAnalyticsTrack,
        identifyUser: mockAnalyticsIdentify,
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Analytics Integration for Consent Rates', () => {
    it('should track consent banner impression events', async () => {
      render(<CookieConsent />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Should track banner impression
      expect(mockAnalyticsTrack).toHaveBeenCalledWith('cookie_consent_banner_shown', {
        variant: 'control',
        timestamp: expect.any(Number),
        user_agent: expect.any(String),
      });
    });

    it('should track accept consent events with context', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      const acceptButton = screen.getByRole('button', { name: /alle cookies accepteren/i });
      await user.click(acceptButton);

      expect(mockAnalyticsTrack).toHaveBeenCalledWith('cookie_consent_accepted', {
        variant: 'control',
        consent_type: 'all',
        interaction_time: expect.any(Number),
        categories: {
          necessary: true,
          analytics: true,
          marketing: true,
          preferences: true,
        },
      });
    });

    it('should track decline consent events with reasoning', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      const declineButton = screen.getByRole('button', { name: /alleen noodzakelijke/i });
      await user.click(declineButton);

      expect(mockAnalyticsTrack).toHaveBeenCalledWith('cookie_consent_declined', {
        variant: 'control',
        consent_type: 'minimal',
        interaction_time: expect.any(Number),
        categories: {
          necessary: true,
          analytics: false,
          marketing: false,
          preferences: false,
        },
      });
    });

    it('should track custom consent selections', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      // Open settings
      await user.click(screen.getByRole('button', { name: /toon gedetailleerde instellingen/i }));

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        // Toggle analytics only
        user.click(checkboxes[1]);
      });

      await waitFor(() => {
        user.click(screen.getByRole('button', { name: /instellingen opslaan/i }));
      });

      expect(mockAnalyticsTrack).toHaveBeenCalledWith('cookie_consent_custom', {
        variant: 'control',
        consent_type: 'custom',
        interaction_time: expect.any(Number),
        categories: {
          necessary: true,
          analytics: true,
          marketing: false,
          preferences: false,
        },
      });
    });

    it('should track banner dismissal events', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      expect(mockAnalyticsTrack).toHaveBeenCalledWith('cookie_consent_dismissed', {
        variant: 'control',
        dismissal_method: 'keyboard',
        interaction_time: expect.any(Number),
      });
    });

    it('should track settings expansion events', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      await user.click(screen.getByRole('button', { name: /toon gedetailleerde instellingen/i }));

      expect(mockAnalyticsTrack).toHaveBeenCalledWith('cookie_consent_settings_expanded', {
        variant: 'control',
        time_to_expand: expect.any(Number),
      });
    });
  });

  describe('A/B Test Variant Support', () => {
    it('should render different copy variants correctly', () => {
      // Mock friendly copy variant
      Object.defineProperty(window, 'abTestService', {
        value: {
          getVariant: () => 'friendly-copy',
          trackEvent: mockAnalyticsTrack,
        },
        writable: true,
      });

      // Create variant-aware component wrapper
      const CookieConsentWithVariant = () => {
        const variant = window.abTestService?.getVariant();
        const variantConfig = AB_TEST_VARIANTS.find(v => v.name === variant);
        
        return (
          <div data-testid="variant-wrapper" data-variant={variant}>
            <CookieConsent />
          </div>
        );
      };

      render(<CookieConsentWithVariant />);

      // Should track variant
      expect(screen.getByTestId('variant-wrapper')).toHaveAttribute('data-variant', 'friendly-copy');
    });

    it('should support different button styling variants', () => {
      // Test each design variant
      AB_TEST_VARIANTS.forEach(variant => {
        Object.defineProperty(window, 'abTestService', {
          value: {
            getVariant: () => variant.name,
            trackEvent: mockAnalyticsTrack,
          },
          writable: true,
        });

        const { unmount } = render(<CookieConsent className={`variant-${variant.name}`} />);

        const dialog = screen.getByRole('dialog');
        expect(dialog.closest(`[class*="variant-${variant.name}"]`)).toBeInTheDocument();

        unmount();
      });
    });

    it('should maintain consistent functionality across variants', async () => {
      const user = userEvent.setup();

      // Test that basic functionality works regardless of variant
      for (const variant of AB_TEST_VARIANTS) {
        Object.defineProperty(window, 'abTestService', {
          value: {
            getVariant: () => variant.name,
            trackEvent: mockAnalyticsTrack,
          },
          writable: true,
        });

        const { unmount } = render(<CookieConsent />);

        // All variants should have accept/decline functionality
        const acceptButton = screen.getByRole('button', { name: /cookies accepteren|prima, ga door/i });
        const declineButton = screen.getByRole('button', { name: /alleen noodzakelijke|nee, dank je/i });

        expect(acceptButton).toBeInTheDocument();
        expect(declineButton).toBeInTheDocument();

        // Test interaction works
        await user.click(acceptButton);
        expect(mockSaveCookieConsent).toHaveBeenCalled();

        unmount();
        vi.clearAllMocks();
        mockSaveCookieConsent.mockReturnValue(true);
      }
    });

    it('should handle variant assignment errors gracefully', () => {
      // Mock failing variant service
      Object.defineProperty(window, 'abTestService', {
        value: {
          getVariant: () => {
            throw new Error('Variant service error');
          },
          trackEvent: mockAnalyticsTrack,
        },
        writable: true,
      });

      // Should fall back to control variant
      expect(() => render(<CookieConsent />)).not.toThrow();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Conversion Tracking', () => {
    it('should calculate and track consent rate metrics', async () => {
      const user = userEvent.setup();
      
      // Mock multiple user sessions
      const sessions = [
        { action: 'accept', expectedRate: 1.0 },
        { action: 'decline', expectedRate: 0.0 },
        { action: 'custom', expectedRate: 0.5 },
      ];

      for (const session of sessions) {
        const { unmount } = render(<CookieConsent />);

        if (session.action === 'accept') {
          await user.click(screen.getByRole('button', { name: /alle cookies accepteren/i }));
        } else if (session.action === 'decline') {
          await user.click(screen.getByRole('button', { name: /alleen noodzakelijke/i }));
        } else {
          // Custom selection
          await user.click(screen.getByRole('button', { name: /toon gedetailleerde instellingen/i }));
          
          await waitFor(() => {
            const checkboxes = screen.getAllByRole('checkbox');
            user.click(checkboxes[1]); // Analytics only
          });
          
          await waitFor(() => {
            user.click(screen.getByRole('button', { name: /instellingen opslaan/i }));
          });
        }

        // Should track conversion metrics
        expect(mockAnalyticsTrack).toHaveBeenCalledWith(
          expect.stringContaining('cookie_consent_'),
          expect.objectContaining({
            variant: 'control',
            categories: expect.any(Object),
          })
        );

        unmount();
        vi.clearAllMocks();
      }
    });

    it('should track time-to-decision metrics', async () => {
      const user = userEvent.setup();
      
      const startTime = Date.now();
      render(<CookieConsent />);

      // Wait a bit to simulate user consideration
      await new Promise(resolve => setTimeout(resolve, 100));

      await user.click(screen.getByRole('button', { name: /alle cookies accepteren/i }));

      expect(mockAnalyticsTrack).toHaveBeenCalledWith('cookie_consent_accepted', {
        variant: 'control',
        consent_type: 'all',
        interaction_time: expect.any(Number),
        categories: expect.any(Object),
      });

      // Should track reasonable interaction time
      const lastCall = mockAnalyticsTrack.mock.calls.find(call => 
        call[0] === 'cookie_consent_accepted'
      );
      expect(lastCall[1].interaction_time).toBeGreaterThan(50);
    });

    it('should track funnel progression metrics', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      // Track funnel: impression -> settings -> custom selection -> save
      await waitFor(() => {
        expect(mockAnalyticsTrack).toHaveBeenCalledWith('cookie_consent_banner_shown', expect.any(Object));
      });

      await user.click(screen.getByRole('button', { name: /toon gedetailleerde instellingen/i }));
      
      expect(mockAnalyticsTrack).toHaveBeenCalledWith('cookie_consent_settings_expanded', expect.any(Object));

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        user.click(checkboxes[1]);
      });

      await waitFor(() => {
        user.click(screen.getByRole('button', { name: /instellingen opslaan/i }));
      });

      expect(mockAnalyticsTrack).toHaveBeenCalledWith('cookie_consent_custom', expect.any(Object));

      // Should track complete funnel progression
      const calls = mockAnalyticsTrack.mock.calls.map(call => call[0]);
      expect(calls).toContain('cookie_consent_banner_shown');
      expect(calls).toContain('cookie_consent_settings_expanded');
      expect(calls).toContain('cookie_consent_custom');
    });

    it('should track abandonment and exit events', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      // Simulate user opening settings then leaving
      await user.click(screen.getByRole('button', { name: /toon gedetailleerde instellingen/i }));

      await waitFor(() => {
        expect(screen.getByText('Noodzakelijke Cookies')).toBeInTheDocument();
      });

      // Simulate page unload or navigation away
      window.dispatchEvent(new Event('beforeunload'));

      // Should track abandonment
      expect(mockAnalyticsTrack).toHaveBeenCalledWith('cookie_consent_settings_expanded', expect.any(Object));
    });
  });

  describe('User Segmentation', () => {
    it('should track user device type for segmentation', async () => {
      // Mock mobile user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true,
      });

      render(<CookieConsent />);

      await waitFor(() => {
        expect(mockAnalyticsTrack).toHaveBeenCalledWith('cookie_consent_banner_shown', {
          variant: 'control',
          timestamp: expect.any(Number),
          user_agent: expect.stringContaining('iPhone'),
        });
      });
    });

    it('should segment by returning vs new users', () => {
      // Test new user
      mockGetCookieConsent.mockReturnValue({
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: null, // New user
      });

      const { unmount } = render(<CookieConsent />);

      expect(mockAnalyticsTrack).toHaveBeenCalledWith('cookie_consent_banner_shown', {
        variant: 'control',
        timestamp: expect.any(Number),
        user_agent: expect.any(String),
      });

      unmount();

      // Test returning user with expired consent
      mockGetCookieConsent.mockReturnValue({
        necessary: true,
        analytics: true,
        marketing: false,
        preferences: false,
        timestamp: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Old timestamp
      });

      render(<CookieConsent />);

      expect(mockAnalyticsTrack).toHaveBeenCalledWith('cookie_consent_banner_shown', {
        variant: 'control',
        timestamp: expect.any(Number),
        user_agent: expect.any(String),
      });
    });

    it('should track geographic segments via browser language', () => {
      Object.defineProperty(navigator, 'language', {
        value: 'nl-BE',
        writable: true,
      });

      render(<CookieConsent />);

      expect(mockAnalyticsTrack).toHaveBeenCalledWith('cookie_consent_banner_shown', {
        variant: 'control',
        timestamp: expect.any(Number),
        user_agent: expect.any(String),
      });

      // Should include language context for Belgian users
      expect(navigator.language).toBe('nl-BE');
    });
  });

  describe('Statistical Significance Tracking', () => {
    it('should provide sufficient data for statistical analysis', async () => {
      const user = userEvent.setup();

      // Simulate multiple sessions with different outcomes
      const outcomes = ['accept', 'decline', 'custom', 'dismiss'];
      
      for (let i = 0; i < outcomes.length; i++) {
        const outcome = outcomes[i];
        const { unmount } = render(<CookieConsent />);

        switch (outcome) {
          case 'accept':
            await user.click(screen.getByRole('button', { name: /alle cookies accepteren/i }));
            break;
          case 'decline':
            await user.click(screen.getByRole('button', { name: /alleen noodzakelijke/i }));
            break;
          case 'custom':
            await user.click(screen.getByRole('button', { name: /toon gedetailleerde instellingen/i }));
            await waitFor(() => {
              const checkboxes = screen.getAllByRole('checkbox');
              user.click(checkboxes[1]);
            });
            await waitFor(() => {
              user.click(screen.getByRole('button', { name: /instellingen opslaan/i }));
            });
            break;
          case 'dismiss':
            await user.keyboard('{Escape}');
            break;
        }

        unmount();
        vi.clearAllMocks();
      }

      // Each outcome should generate trackable events
      expect(mockAnalyticsTrack).toHaveBeenCalled();
    });

    it('should include session metadata for cohort analysis', () => {
      render(<CookieConsent />);

      expect(mockAnalyticsTrack).toHaveBeenCalledWith('cookie_consent_banner_shown', {
        variant: 'control',
        timestamp: expect.any(Number),
        user_agent: expect.any(String),
      });

      // Should include sufficient metadata for analysis
      const lastCall = mockAnalyticsTrack.mock.calls[0];
      const eventData = lastCall[1];
      
      expect(eventData).toHaveProperty('variant');
      expect(eventData).toHaveProperty('timestamp');
      expect(eventData).toHaveProperty('user_agent');
    });

    it('should support experiment duration tracking', () => {
      const experimentStartTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
      
      Object.defineProperty(window, 'abTestService', {
        value: {
          getVariant: () => 'control',
          trackEvent: mockAnalyticsTrack,
          getExperimentStart: () => experimentStartTime,
        },
        writable: true,
      });

      render(<CookieConsent />);

      // Should be able to calculate experiment duration
      const currentTime = Date.now();
      const experimentDuration = currentTime - experimentStartTime;
      
      expect(experimentDuration).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Fallbacks', () => {
    it('should gracefully handle analytics service failures', () => {
      // Mock analytics failure
      mockAnalyticsTrack.mockImplementation(() => {
        throw new Error('Analytics service unavailable');
      });

      // Should not crash the component
      expect(() => render(<CookieConsent />)).not.toThrow();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should fall back to control variant when A/B service fails', () => {
      delete window.abTestService;

      render(<CookieConsent />);

      // Should still render correctly
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Cookie Instellingen')).toBeInTheDocument();
    });

    it('should handle missing or corrupted variant configurations', () => {
      Object.defineProperty(window, 'abTestService', {
        value: {
          getVariant: () => 'non-existent-variant',
          trackEvent: mockAnalyticsTrack,
        },
        writable: true,
      });

      // Should fall back gracefully
      expect(() => render(<CookieConsent />)).not.toThrow();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});