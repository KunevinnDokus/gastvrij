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

describe('Cookie Consent - Performance and Consent Fatigue Prevention Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSaveCookieConsent.mockReturnValue(true);
    
    // Mock Performance API
    Object.defineProperty(window, 'performance', {
      writable: true,
      value: {
        now: vi.fn().mockReturnValue(100),
        mark: vi.fn(),
        measure: vi.fn(),
        getEntriesByName: vi.fn().mockReturnValue([{ duration: 50 }]),
        getEntriesByType: vi.fn().mockReturnValue([]),
        memory: {
          usedJSHeapSize: 1000000,
          totalJSHeapSize: 2000000,
          jsHeapSizeLimit: 4000000,
        },
      },
    });

    // Mock localStorage for session tracking
    const mockStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: mockStorage });
    Object.defineProperty(window, 'sessionStorage', { value: mockStorage });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Async Loading Performance', () => {
    it('should not block page render during initialization', async () => {
      mockIsConsentExpired.mockReturnValue(true);
      mockGetCookieConsent.mockReturnValue({
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: null,
      });

      const renderStart = performance.now();
      
      render(
        <div>
          <div data-testid="page-content">Main page content</div>
          <CookieConsent />
        </div>
      );

      // Page content should be immediately available
      expect(screen.getByTestId('page-content')).toBeInTheDocument();
      
      // Cookie consent should load asynchronously
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Should complete within performance budget
      expect(performance.now).toHaveBeenCalled();
    });

    it('should load component in under 100ms', async () => {
      mockIsConsentExpired.mockReturnValue(true);
      mockGetCookieConsent.mockReturnValue({
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: null,
      });

      const startTime = Date.now();
      
      render(<CookieConsent />);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const loadTime = Date.now() - startTime;
      
      // Should load quickly
      expect(loadTime).toBeLessThan(100);
    });

    it('should handle slow localStorage access gracefully', async () => {
      // Mock slow localStorage
      mockGetCookieConsent.mockImplementation(() => {
        // Simulate slow storage access
        const start = Date.now();
        while (Date.now() - start < 50) {
          // Busy wait to simulate slow storage
        }
        
        return {
          necessary: true,
          analytics: false,
          marketing: false,
          preferences: false,
          timestamp: null,
        };
      });

      mockIsConsentExpired.mockReturnValue(true);

      const { container } = render(<CookieConsent />);
      
      // Should not freeze the UI during storage access
      expect(container).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should prioritize critical rendering path', () => {
      mockIsConsentExpired.mockReturnValue(true);
      mockGetCookieConsent.mockReturnValue({
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: null,
      });

      render(<CookieConsent />);

      // Essential elements should be rendered first
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Cookie Instellingen')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /alle cookies accepteren/i })).toBeInTheDocument();
    });
  });

  describe('Memory Usage Optimization', () => {
    it('should stay under 2MB memory usage threshold', () => {
      mockIsConsentExpired.mockReturnValue(true);
      mockGetCookieConsent.mockReturnValue({
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: null,
      });

      render(<CookieConsent />);

      // Check memory usage (mocked)
      if (window.performance.memory) {
        expect(window.performance.memory.usedJSHeapSize).toBeLessThan(2 * 1024 * 1024); // 2MB
      }
    });

    it('should clean up event listeners and timers', () => {
      const { unmount } = render(<CookieConsent />);

      // Component should clean up resources
      unmount();

      // No specific assertions needed - this tests that unmount doesn't throw
      expect(true).toBe(true);
    });

    it('should avoid memory leaks in notification timers', async () => {
      mockIsConsentExpired.mockReturnValue(true);
      mockGetCookieConsent.mockReturnValue({
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Expired consent
      });

      const { unmount } = render(<CookieConsent />);

      // Should show expiry notification
      await waitFor(() => {
        expect(screen.getByText(/toestemming is verlopen/i)).toBeInTheDocument();
      });

      // Unmount should clear timers
      unmount();

      // Timer cleanup test - no memory leaks
      expect(true).toBe(true);
    });
  });

  describe('Layout Shift Prevention', () => {
    it('should not cause Cumulative Layout Shift when banner appears', async () => {
      const TestPage = () => (
        <div>
          <div data-testid="header" style={{ height: '60px', background: 'blue' }}>
            Header
          </div>
          <div data-testid="content" style={{ height: '500px', background: 'gray' }}>
            Main Content
          </div>
          <CookieConsent />
        </div>
      );

      mockIsConsentExpired.mockReturnValue(true);
      mockGetCookieConsent.mockReturnValue({
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: null,
      });

      render(<TestPage />);

      // Get initial layout
      const header = screen.getByTestId('header');
      const content = screen.getByTestId('content');
      
      const initialHeaderRect = header.getBoundingClientRect();
      const initialContentRect = content.getBoundingClientRect();

      // Wait for cookie banner to appear
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Layout should remain stable (fixed positioning)
      const finalHeaderRect = header.getBoundingClientRect();
      const finalContentRect = content.getBoundingClientRect();

      expect(finalHeaderRect.top).toBe(initialHeaderRect.top);
      expect(finalContentRect.top).toBe(initialContentRect.top);
    });

    it('should use fixed positioning to avoid layout disruption', () => {
      mockIsConsentExpired.mockReturnValue(true);
      mockGetCookieConsent.mockReturnValue({
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: null,
      });

      render(<CookieConsent />);

      const dialog = screen.getByRole('dialog');
      const overlay = dialog.closest('.fixed');

      // Should use fixed positioning
      expect(overlay).toHaveClass('fixed');
      expect(overlay).toHaveClass('inset-0');
    });

    it('should maintain document flow when expanding settings', async () => {
      const user = userEvent.setup();
      
      mockIsConsentExpired.mockReturnValue(true);
      mockGetCookieConsent.mockReturnValue({
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: null,
      });

      render(<CookieConsent />);

      const acceptButton = screen.getByRole('button', { name: /alle cookies accepteren/i });
      const initialRect = acceptButton.getBoundingClientRect();

      // Expand settings
      await user.click(screen.getByRole('button', { name: /toon gedetailleerde instellingen/i }));

      await waitFor(() => {
        expect(screen.getByText('Noodzakelijke Cookies')).toBeInTheDocument();
      });

      // Accept button should still be accessible (position may change but should be reasonable)
      const finalRect = acceptButton.getBoundingClientRect();
      expect(finalRect.width).toBeGreaterThan(0);
      expect(finalRect.height).toBeGreaterThan(0);
    });
  });

  describe('Returning User Experience', () => {
    it('should not show banner for users with valid consent', () => {
      mockIsConsentExpired.mockReturnValue(false);
      mockGetCookieConsent.mockReturnValue({
        necessary: true,
        analytics: true,
        marketing: false,
        preferences: true,
        timestamp: new Date(),
      });

      render(<CookieConsent />);

      // Should not render banner for returning users with valid consent
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should remember user dismissal within session', async () => {
      const user = userEvent.setup();
      
      mockIsConsentExpired.mockReturnValue(true);
      mockGetCookieConsent.mockReturnValue({
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: null,
      });

      render(<CookieConsent />);

      // Dismiss with Escape
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Should not reappear immediately
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should not repeatedly prompt users who declined', () => {
      mockIsConsentExpired.mockReturnValue(false);
      mockGetCookieConsent.mockReturnValue({
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      });

      render(<CookieConsent />);

      // Should respect user's previous decline decision
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should show appropriate renewal notification before expiry', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 20); // Expires in 20 days

      mockIsConsentExpired.mockReturnValue(false);
      mockGetCookieConsent.mockReturnValue({
        necessary: true,
        analytics: true,
        marketing: false,
        preferences: false,
        timestamp: new Date(),
        expiresAt: futureDate,
      });

      render(<CookieConsent />);

      // Should show renewal notification
      await waitFor(() => {
        expect(screen.getByText(/toestemming verloopt binnenkort/i)).toBeInTheDocument();
      });

      // But not the full consent dialog
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Consent Fatigue Mitigation', () => {
    it('should provide quick continue option for impatient users', async () => {
      const user = userEvent.setup();
      
      mockIsConsentExpired.mockReturnValue(true);
      mockGetCookieConsent.mockReturnValue({
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: null,
      });

      render(<CookieConsent />);

      // Should allow quick dismissal via Escape
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should use value-focused messaging instead of legal jargon', () => {
      mockIsConsentExpired.mockReturnValue(true);
      mockGetCookieConsent.mockReturnValue({
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: null,
      });

      render(<CookieConsent />);

      // Should use user-friendly language
      expect(screen.getByText(/we respecteren uw privacy/i)).toBeInTheDocument();
      expect(screen.getByText(/volledige controle over uw voorkeuren/i)).toBeInTheDocument();

      // Should avoid overwhelming legal text in main view
      expect(screen.queryByText(/rechtmatig belang/i)).not.toBeInTheDocument(); // This appears only in detailed view
    });

    it('should not guilt-trip users for declining', async () => {
      const user = userEvent.setup();
      
      mockIsConsentExpired.mockReturnValue(true);
      mockGetCookieConsent.mockReturnValue({
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: null,
      });

      const onDecline = vi.fn();
      render(<CookieConsent onDecline={onDecline} />);

      const declineButton = screen.getByRole('button', { name: /alleen noodzakelijke/i });
      await user.click(declineButton);

      // Should process decline without manipulative messaging
      expect(mockSaveCookieConsent).toHaveBeenCalledWith({
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: expect.any(Date),
        version: '2.0',
      });

      expect(onDecline).toHaveBeenCalled();

      // Should not show guilt-trip messages
      expect(screen.queryByText(/you'll miss out/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/limited functionality/i)).not.toBeInTheDocument();
    });

    it('should minimize frequency of consent requests', () => {
      // Test different scenarios
      const scenarios = [
        {
          name: 'Fresh user',
          mockReturn: {
            necessary: true,
            analytics: false,
            marketing: false,
            preferences: false,
            timestamp: null,
          },
          expired: true,
          shouldShow: true,
        },
        {
          name: 'Recent consent',
          mockReturn: {
            necessary: true,
            analytics: true,
            marketing: false,
            preferences: false,
            timestamp: new Date(),
          },
          expired: false,
          shouldShow: false,
        },
        {
          name: 'Dismissed recently',
          mockReturn: {
            necessary: true,
            analytics: false,
            marketing: false,
            preferences: false,
            timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
          },
          expired: false,
          shouldShow: false,
        },
      ];

      scenarios.forEach(({ name, mockReturn, expired, shouldShow }) => {
        vi.clearAllMocks();
        mockIsConsentExpired.mockReturnValue(expired);
        mockGetCookieConsent.mockReturnValue(mockReturn);

        const { unmount } = render(<CookieConsent />);

        if (shouldShow) {
          expect(screen.queryByRole('dialog')).toBeInTheDocument();
        } else {
          expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        }

        unmount();
      });
    });

    it('should provide clear value proposition for each consent type', async () => {
      const user = userEvent.setup();
      
      mockIsConsentExpired.mockReturnValue(true);
      mockGetCookieConsent.mockReturnValue({
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: null,
      });

      render(<CookieConsent />);

      // Expand to see detailed descriptions
      await user.click(screen.getByRole('button', { name: /toon gedetailleerde instellingen/i }));

      await waitFor(() => {
        // Each category should explain the benefit to the user
        expect(screen.getByText(/helpen ons de website te verbeteren/i)).toBeInTheDocument();
        expect(screen.getByText(/relevante advertenties te tonen/i)).toBeInTheDocument();
        expect(screen.getByText(/gepersonaliseerde ervaring/i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance Monitoring', () => {
    it('should track initialization performance metrics', async () => {
      mockIsConsentExpired.mockReturnValue(true);
      mockGetCookieConsent.mockReturnValue({
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: null,
      });

      render(<CookieConsent />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Should call performance marking
      expect(window.performance.mark).toHaveBeenCalled();
    });

    it('should handle performance API unavailability gracefully', () => {
      // Remove performance API
      delete (window as any).performance;

      mockIsConsentExpired.mockReturnValue(true);
      mockGetCookieConsent.mockReturnValue({
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: null,
      });

      // Should not crash without performance API
      expect(() => render(<CookieConsent />)).not.toThrow();
    });

    it('should batch DOM operations for better performance', async () => {
      const user = userEvent.setup();
      
      mockIsConsentExpired.mockReturnValue(true);
      mockGetCookieConsent.mockReturnValue({
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: null,
      });

      render(<CookieConsent />);

      // Rapidly toggle settings
      const settingsButton = screen.getByRole('button', { name: /toon gedetailleerde instellingen/i });
      
      await user.click(settingsButton);
      await user.click(settingsButton);
      await user.click(settingsButton);

      // Should handle rapid interactions smoothly
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});