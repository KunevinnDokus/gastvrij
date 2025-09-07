import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CookieConsent } from '@/components/CookieConsent';
import * as gdpr from '@/lib/gdpr';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

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

// UX Metrics Interface
interface UXMetrics {
  timeToFirstInteraction: number;
  timeToDecision: number;
  bannerViewDuration: number;
  settingsEngagementRate: number;
  conversionRate: number;
  abandonmentRate: number;
  mobileUsabilityScore: number;
  accessibilityScore: number;
}

// Mock UX tracking service
const mockUXTracker = {
  startSession: vi.fn(),
  trackInteraction: vi.fn(),
  trackDecision: vi.fn(),
  trackAbandonment: vi.fn(),
  calculateMetrics: vi.fn(),
  reportMetrics: vi.fn(),
};

describe('Cookie Consent - Integration UX Metrics Tracking', () => {
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

    // Mock performance and timing APIs
    Object.defineProperty(window, 'performance', {
      writable: true,
      value: {
        now: vi.fn().mockReturnValue(Date.now()),
        mark: vi.fn(),
        measure: vi.fn(),
        getEntriesByName: vi.fn().mockReturnValue([]),
        getEntriesByType: vi.fn().mockReturnValue([]),
        timing: {
          navigationStart: Date.now() - 1000,
          loadEventEnd: Date.now() - 500,
        },
      },
    });

    // Mock intersection observer for visibility tracking
    global.IntersectionObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));

    // Mock mutation observer for DOM changes
    global.MutationObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
    }));

    // Setup UX tracking service
    Object.defineProperty(window, 'uxTracker', {
      value: mockUXTracker,
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    server.resetHandlers();
  });

  describe('Time-to-First-Interaction Tracking', () => {
    it('should measure time from banner display to first user interaction', async () => {
      const user = userEvent.setup();
      const startTime = performance.now();
      
      render(<CookieConsent />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Wait briefly to simulate user consideration
      await act(() => new Promise(resolve => setTimeout(resolve, 100)));

      // First interaction - clicking settings
      await user.click(screen.getByRole('button', { name: /toon gedetailleerde instellingen/i }));

      const interactionTime = performance.now() - startTime;
      
      expect(mockUXTracker.trackInteraction).toHaveBeenCalledWith('settings_expand', {
        timeFromDisplay: expect.any(Number),
        interactionType: 'click',
        elementType: 'button',
      });

      expect(interactionTime).toBeGreaterThan(50); // Should have some measurable time
    });

    it('should differentiate between interaction types', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Test keyboard interaction
      await user.keyboard('{Tab}');
      
      expect(mockUXTracker.trackInteraction).toHaveBeenCalledWith('focus_change', {
        timeFromDisplay: expect.any(Number),
        interactionType: 'keyboard',
        elementType: 'button',
      });

      // Test mouse interaction
      await user.click(screen.getByRole('button', { name: /alle cookies accepteren/i }));

      expect(mockUXTracker.trackInteraction).toHaveBeenCalledWith('accept_decision', {
        timeFromDisplay: expect.any(Number),
        interactionType: 'click',
        elementType: 'button',
      });
    });

    it('should track interaction delays for different user segments', async () => {
      const user = userEvent.setup();

      // Mock mobile user
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true,
      });

      render(<CookieConsent />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /alle cookies accepteren/i }));

      expect(mockUXTracker.trackInteraction).toHaveBeenCalledWith('accept_decision', {
        timeFromDisplay: expect.any(Number),
        interactionType: 'click',
        elementType: 'button',
        userSegment: 'mobile',
      });
    });
  });

  describe('Decision-Making Time Analysis', () => {
    it('should measure complete decision-making funnel timing', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      // Start timing
      const displayTime = performance.now();

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // User explores settings
      const settingsExpandTime = performance.now();
      await user.click(screen.getByRole('button', { name: /toon gedetailleerde instellingen/i }));

      await waitFor(() => {
        expect(screen.getByText('Noodzakelijke Cookies')).toBeInTheDocument();
      });

      // User makes custom selection
      const selectionTime = performance.now();
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]); // Analytics

      // User saves decision
      const decisionTime = performance.now();
      await user.click(screen.getByRole('button', { name: /instellingen opslaan/i }));

      expect(mockUXTracker.trackDecision).toHaveBeenCalledWith('custom_consent', {
        totalDecisionTime: decisionTime - displayTime,
        explorationTime: selectionTime - settingsExpandTime,
        selectionTime: decisionTime - selectionTime,
        decisionType: 'custom',
        categoriesSelected: ['necessary', 'analytics'],
      });
    });

    it('should compare decision times across consent types', async () => {
      const testScenarios = [
        {
          name: 'Quick Accept',
          action: async (user: ReturnType<typeof userEvent.setup>) => {
            await user.click(screen.getByRole('button', { name: /alle cookies accepteren/i }));
          },
          expectedType: 'accept_all',
        },
        {
          name: 'Quick Decline',
          action: async (user: ReturnType<typeof userEvent.setup>) => {
            await user.click(screen.getByRole('button', { name: /alleen noodzakelijke/i }));
          },
          expectedType: 'decline_all',
        },
        {
          name: 'Custom Selection',
          action: async (user: ReturnType<typeof userEvent.setup>) => {
            await user.click(screen.getByRole('button', { name: /toon gedetailleerde instellingen/i }));
            await waitFor(() => {
              const checkboxes = screen.getAllByRole('checkbox');
              user.click(checkboxes[2]); // Marketing
            });
            await waitFor(() => {
              user.click(screen.getByRole('button', { name: /instellingen opslaan/i }));
            });
          },
          expectedType: 'custom',
        },
      ];

      for (const scenario of testScenarios) {
        const user = userEvent.setup();
        const { unmount } = render(<CookieConsent />);

        const startTime = performance.now();

        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        await scenario.action(user);

        expect(mockUXTracker.trackDecision).toHaveBeenCalledWith(
          expect.stringContaining(scenario.expectedType),
          expect.objectContaining({
            totalDecisionTime: expect.any(Number),
            decisionType: expect.any(String),
          })
        );

        unmount();
        vi.clearAllMocks();
      }
    });

    it('should track decision abandonment patterns', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // User starts exploring but then abandons
      await user.click(screen.getByRole('button', { name: /toon gedetailleerde instellingen/i }));

      await waitFor(() => {
        expect(screen.getByText('Noodzakelijke Cookies')).toBeInTheDocument();
      });

      // Simulate abandonment via escape
      await user.keyboard('{Escape}');

      expect(mockUXTracker.trackAbandonment).toHaveBeenCalledWith('settings_escape', {
        abandonmentPoint: 'settings_expanded',
        timeSpentBeforeAbandon: expect.any(Number),
        interactionsBeforeAbandon: expect.any(Number),
      });
    });
  });

  describe('Banner Engagement Metrics', () => {
    it('should track banner view duration and visibility', async () => {
      const mockIntersectionObserver = vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      }));
      global.IntersectionObserver = mockIntersectionObserver;

      render(<CookieConsent />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Simulate visibility tracking
      expect(mockIntersectionObserver).toHaveBeenCalled();
    });

    it('should measure scroll behavior during banner display', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <div style={{ height: '1000px' }}>Long content</div>
          <CookieConsent />
        </div>
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Simulate scrolling
      window.dispatchEvent(new Event('scroll'));

      expect(mockUXTracker.trackInteraction).toHaveBeenCalledWith('page_scroll', {
        timeFromDisplay: expect.any(Number),
        interactionType: 'scroll',
        elementType: 'page',
      });
    });

    it('should track clicks outside banner area', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <button data-testid="outside-button">Outside Button</button>
          <CookieConsent />
        </div>
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click outside the banner
      await user.click(screen.getByTestId('outside-button'));

      expect(mockUXTracker.trackInteraction).toHaveBeenCalledWith('click_outside', {
        timeFromDisplay: expect.any(Number),
        interactionType: 'click',
        elementType: 'external',
      });
    });

    it('should measure reading behavior and dwell time', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Simulate user reading by expanding settings and dwelling
      await user.click(screen.getByRole('button', { name: /toon gedetailleerde instellingen/i }));

      await waitFor(() => {
        expect(screen.getByText('Noodzakelijke Cookies')).toBeInTheDocument();
      });

      // Wait to simulate reading time
      await act(() => new Promise(resolve => setTimeout(resolve, 200)));

      expect(mockUXTracker.trackInteraction).toHaveBeenCalledWith('settings_expand', {
        timeFromDisplay: expect.any(Number),
        interactionType: 'click',
        elementType: 'button',
      });
    });
  });

  describe('Usability Score Calculation', () => {
    it('should calculate mobile usability metrics', async () => {
      // Mock mobile environment
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      Object.defineProperty(window, 'innerHeight', { value: 667 });
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      });

      const user = userEvent.setup();
      render(<CookieConsent />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Test touch interaction
      const acceptButton = screen.getByRole('button', { name: /alle cookies accepteren/i });
      await user.click(acceptButton);

      expect(mockUXTracker.calculateMetrics).toHaveBeenCalledWith('mobile_usability', {
        touchTargetSize: expect.any(Number),
        buttonSpacing: expect.any(Number),
        textReadability: expect.any(Number),
        interactionSuccess: true,
      });
    });

    it('should evaluate accessibility compliance scores', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Test keyboard navigation
      await user.tab();
      await user.keyboard('{Enter}');

      expect(mockUXTracker.calculateMetrics).toHaveBeenCalledWith('accessibility_score', {
        keyboardNavigation: true,
        ariaLabeling: true,
        focusManagement: true,
        screenReaderSupport: true,
      });
    });

    it('should measure cognitive load indicators', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Multiple interactions indicating confusion
      await user.click(screen.getByRole('button', { name: /toon gedetailleerde instellingen/i }));
      await user.click(screen.getByRole('button', { name: /verberg gedetailleerde instellingen/i }));
      await user.click(screen.getByRole('button', { name: /toon gedetailleerde instellingen/i }));

      expect(mockUXTracker.calculateMetrics).toHaveBeenCalledWith('cognitive_load', {
        backAndForthInteractions: expect.any(Number),
        hesitationTime: expect.any(Number),
        explorationDepth: expect.any(Number),
      });
    });

    it('should generate overall UX health score', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Complete user journey
      await user.click(screen.getByRole('button', { name: /alle cookies accepteren/i }));

      expect(mockUXTracker.calculateMetrics).toHaveBeenCalledWith('overall_ux_score', {
        conversionRate: expect.any(Number),
        timeToDecision: expect.any(Number),
        userSatisfaction: expect.any(Number),
        accessibility: expect.any(Number),
        mobileUsability: expect.any(Number),
      });
    });
  });

  describe('Cross-Browser Compatibility Metrics', () => {
    it('should track browser-specific performance metrics', async () => {
      const browsers = [
        { name: 'Chrome', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
        { name: 'Firefox', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0' },
        { name: 'Safari', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15' },
      ];

      for (const browser of browsers) {
        Object.defineProperty(navigator, 'userAgent', {
          value: browser.userAgent,
          writable: true,
        });

        const { unmount } = render(<CookieConsent />);

        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        expect(mockUXTracker.trackInteraction).toHaveBeenCalledWith('banner_display', {
          timeFromDisplay: expect.any(Number),
          browserName: browser.name,
          renderPerformance: expect.any(Object),
        });

        unmount();
        vi.clearAllMocks();
      }
    });

    it('should measure feature support and fallbacks', () => {
      // Test with limited feature support
      delete window.IntersectionObserver;

      render(<CookieConsent />);

      expect(mockUXTracker.trackInteraction).toHaveBeenCalledWith('feature_support', {
        intersectionObserver: false,
        localStorage: true,
        flexbox: true, // Assumed supported
        cssGrid: true, // Assumed supported
      });
    });
  });

  describe('Real-User Monitoring Integration', () => {
    it('should integrate with RUM services for continuous monitoring', async () => {
      // Mock RUM service
      const mockRUM = {
        addMetric: vi.fn(),
        startTransaction: vi.fn(),
        endTransaction: vi.fn(),
      };

      Object.defineProperty(window, 'rumService', {
        value: mockRUM,
        writable: true,
      });

      const user = userEvent.setup();
      render(<CookieConsent />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /alle cookies accepteren/i }));

      expect(mockRUM.addMetric).toHaveBeenCalledWith('cookie_consent_completion', {
        duration: expect.any(Number),
        success: true,
        consentType: 'accept_all',
      });
    });

    it('should send metrics to backend analytics service', async () => {
      // Mock analytics endpoint
      server.use(
        http.post('/api/analytics/ux-metrics', () => {
          return HttpResponse.json({ success: true });
        })
      );

      const user = userEvent.setup();
      render(<CookieConsent />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /alle cookies accepteren/i }));

      expect(mockUXTracker.reportMetrics).toHaveBeenCalledWith('/api/analytics/ux-metrics', {
        sessionId: expect.any(String),
        timestamp: expect.any(Number),
        metrics: expect.any(Object),
      });
    });

    it('should batch metrics for efficient reporting', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Multiple interactions
      await user.click(screen.getByRole('button', { name: /toon gedetailleerde instellingen/i }));
      await user.click(screen.getByRole('button', { name: /verberg gedetailleerde instellingen/i }));
      await user.click(screen.getByRole('button', { name: /alle cookies accepteren/i }));

      // Should batch metrics rather than sending individually
      expect(mockUXTracker.reportMetrics).toHaveBeenCalledWith(expect.any(String), {
        sessionId: expect.any(String),
        timestamp: expect.any(Number),
        metrics: expect.objectContaining({
          interactions: expect.arrayContaining([
            expect.objectContaining({ type: 'settings_expand' }),
            expect.objectContaining({ type: 'settings_collapse' }),
            expect.objectContaining({ type: 'accept_decision' }),
          ]),
        }),
      });
    });
  });

  describe('Privacy-Compliant Metrics Collection', () => {
    it('should anonymize user data in metrics collection', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /alle cookies accepteren/i }));

      expect(mockUXTracker.trackDecision).toHaveBeenCalledWith('accept_all', {
        totalDecisionTime: expect.any(Number),
        decisionType: 'accept_all',
        // Should not contain PII
        sessionId: expect.any(String), // Anonymized session ID
        browserFingerprint: expect.not.stringMatching(/personal|email|name/i),
      });
    });

    it('should respect user consent for analytics tracking', async () => {
      // User declines analytics
      const user = userEvent.setup();
      render(<CookieConsent />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /alleen noodzakelijke/i }));

      // Should limit metrics collection to essential only
      expect(mockUXTracker.trackDecision).toHaveBeenCalledWith('decline_all', {
        decisionType: 'decline_all',
        essential: true, // Only essential metrics
        // No detailed behavioral analytics
      });
    });

    it('should provide metrics opt-out capability', () => {
      // Mock user with metrics opt-out preference
      Object.defineProperty(window, 'uxOptOut', {
        value: true,
        writable: true,
      });

      render(<CookieConsent />);

      // Should not initialize tracking
      expect(mockUXTracker.startSession).not.toHaveBeenCalled();
    });
  });
});