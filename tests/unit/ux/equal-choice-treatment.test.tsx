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

describe('Cookie Consent - Equal Choice Treatment Tests (Kunevinn Principles)', () => {
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

    // Mock viewport dimensions for touch target testing
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 });
    Object.defineProperty(window, 'innerHeight', { writable: true, value: 667 });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Button Visual Weight Equality', () => {
    it('should have Accept and Decline buttons with equal visual weight', () => {
      render(<CookieConsent />);

      const acceptButton = screen.getByRole('button', { name: /alle cookies accepteren/i });
      const declineButton = screen.getByRole('button', { name: /alleen noodzakelijke/i });

      // Both should be visible and present
      expect(acceptButton).toBeInTheDocument();
      expect(declineButton).toBeInTheDocument();

      // Accept button should not have more prominent styling than decline
      expect(acceptButton).toHaveClass('flex-1'); // Equal width
      expect(declineButton).toHaveClass('flex-1'); // Equal width
      
      // Decline should not be styled as secondary/less important
      expect(declineButton).toHaveAttribute('type', 'button');
      expect(acceptButton).toHaveAttribute('type', 'button');
    });

    it('should position Accept and Decline buttons with equal prominence', () => {
      render(<CookieConsent />);

      const acceptButton = screen.getByRole('button', { name: /alle cookies accepteren/i });
      const declineButton = screen.getByRole('button', { name: /alleen noodzakelijke/i });

      // Buttons should be in same container with equal treatment
      const buttonContainer = acceptButton.closest('.flex');
      expect(buttonContainer).toContain(declineButton);
      
      // Should use flex layout with equal space
      expect(buttonContainer).toHaveClass('flex');
      expect(buttonContainer?.querySelector('.gap-3')).toBeTruthy();
    });

    it('should not pre-emphasize Accept button over Decline', () => {
      render(<CookieConsent />);

      const acceptButton = screen.getByRole('button', { name: /alle cookies accepteren/i });
      const declineButton = screen.getByRole('button', { name: /alleen noodzakelijke/i });

      // Accept should not have "primary" emphasis if decline is "secondary"
      const acceptClasses = acceptButton.className;
      const declineClasses = declineButton.className;

      // Both should be styled appropriately without dark patterns
      expect(acceptClasses).toContain('bg-hospitality-600');
      expect(declineClasses).toContain('border-gray-300');
      
      // Decline should not be visually de-emphasized (like very small text or hidden)
      const acceptStyles = window.getComputedStyle(acceptButton);
      const declineStyles = window.getComputedStyle(declineButton);
      
      // Both should have reasonable font sizes and visibility
      expect(declineStyles.visibility).not.toBe('hidden');
      expect(declineStyles.opacity).not.toBe('0');
    });
  });

  describe('Dark Patterns Prevention', () => {
    it('should not have any pre-selected optional options', async () => {
      render(<CookieConsent />);

      // Click settings to reveal checkboxes
      const settingsButton = screen.getByRole('button', { name: /toon gedetailleerde instellingen/i });
      await userEvent.click(settingsButton);

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        
        // Only necessary should be checked (index 0)
        expect(checkboxes[0]).toBeChecked(); // Necessary - always required
        expect(checkboxes[1]).not.toBeChecked(); // Analytics - should be unchecked
        expect(checkboxes[2]).not.toBeChecked(); // Marketing - should be unchecked  
        expect(checkboxes[3]).not.toBeChecked(); // Preferences - should be unchecked
      });
    });

    it('should not trick users with confusing button labels', () => {
      render(<CookieConsent />);

      const acceptButton = screen.getByRole('button', { name: /alle cookies accepteren/i });
      const declineButton = screen.getByRole('button', { name: /alleen noodzakelijke/i });

      // Labels should be clear and honest
      expect(acceptButton.textContent).toBe('Alle Cookies Accepteren');
      expect(declineButton.textContent).toBe('Alleen Noodzakelijke');
      
      // Should not use misleading language like "Accept" for decline button
      expect(declineButton.textContent).not.toMatch(/accept/i);
      expect(acceptButton.textContent).not.toMatch(/decline|reject/i);
    });

    it('should not use visual tricks to promote Accept over Decline', () => {
      render(<CookieConsent />);

      const acceptButton = screen.getByRole('button', { name: /alle cookies accepteren/i });
      const declineButton = screen.getByRole('button', { name: /alleen noodzakelijke/i });

      // Decline button should not be significantly smaller
      const acceptRect = acceptButton.getBoundingClientRect();
      const declineRect = declineButton.getBoundingClientRect();
      
      // Heights should be similar (allowing for minor styling differences)
      expect(Math.abs(acceptRect.height - declineRect.height)).toBeLessThan(10);
      
      // Both should be reasonably sized for interaction
      expect(declineRect.height).toBeGreaterThan(30);
      expect(declineRect.width).toBeGreaterThan(100);
    });

    it('should not hide or obscure the Decline option', () => {
      render(<CookieConsent />);

      const declineButton = screen.getByRole('button', { name: /alleen noodzakelijke/i });
      
      // Should be visible and accessible
      expect(declineButton).toBeVisible();
      
      const styles = window.getComputedStyle(declineButton);
      expect(styles.display).not.toBe('none');
      expect(styles.visibility).toBe('visible');
      expect(parseFloat(styles.opacity)).toBeGreaterThan(0.7);
    });
  });

  describe('Button Size Equality', () => {
    it('should have identical button dimensions', () => {
      render(<CookieConsent />);

      const acceptButton = screen.getByRole('button', { name: /alle cookies accepteren/i });
      const declineButton = screen.getByRole('button', { name: /alleen noodzakelijke/i });

      const acceptRect = acceptButton.getBoundingClientRect();
      const declineRect = declineButton.getBoundingClientRect();

      // Both buttons should have the same height
      expect(acceptRect.height).toBe(declineRect.height);
      
      // Both should use flex-1 for equal width distribution
      expect(acceptButton).toHaveClass('flex-1');
      expect(declineButton).toHaveClass('flex-1');
    });

    it('should maintain size equality across different viewport sizes', () => {
      const testViewports = [
        { width: 320, height: 568 }, // iPhone 5
        { width: 375, height: 667 }, // iPhone 8
        { width: 768, height: 1024 }, // iPad
        { width: 1920, height: 1080 }, // Desktop
      ];

      testViewports.forEach(({ width, height }) => {
        Object.defineProperty(window, 'innerWidth', { writable: true, value: width });
        Object.defineProperty(window, 'innerHeight', { writable: true, value: height });

        const { unmount } = render(<CookieConsent />);

        const acceptButton = screen.getByRole('button', { name: /alle cookies accepteren/i });
        const declineButton = screen.getByRole('button', { name: /alleen noodzakelijke/i });

        const acceptRect = acceptButton.getBoundingClientRect();
        const declineRect = declineButton.getBoundingClientRect();

        // Buttons should maintain equal proportions
        expect(acceptRect.height).toBe(declineRect.height);
        
        unmount();
      });
    });
  });

  describe('Touch Target Requirements', () => {
    it('should meet minimum 44px touch target size on mobile', () => {
      // Set mobile viewport
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 });
      
      render(<CookieConsent />);

      const acceptButton = screen.getByRole('button', { name: /alle cookies accepteren/i });
      const declineButton = screen.getByRole('button', { name: /alleen noodzakelijke/i });

      const acceptRect = acceptButton.getBoundingClientRect();
      const declineRect = declineButton.getBoundingClientRect();

      // Both buttons should meet minimum touch target requirements
      expect(acceptRect.height).toBeGreaterThanOrEqual(44);
      expect(declineRect.height).toBeGreaterThanOrEqual(44);
      expect(acceptRect.width).toBeGreaterThanOrEqual(44);
      expect(declineRect.width).toBeGreaterThanOrEqual(44);
    });

    it('should maintain adequate spacing between touch targets', () => {
      render(<CookieConsent />);

      const buttons = screen.getAllByRole('button');
      
      // Find Accept and Decline buttons
      const acceptButton = buttons.find(btn => btn.textContent?.includes('Alle Cookies'));
      const declineButton = buttons.find(btn => btn.textContent?.includes('Alleen Noodzakelijke'));

      if (acceptButton && declineButton) {
        const acceptRect = acceptButton.getBoundingClientRect();
        const declineRect = declineButton.getBoundingClientRect();

        // Calculate horizontal spacing between buttons
        const spacing = Math.abs(acceptRect.right - declineRect.left);
        
        // Should have adequate spacing (gap-3 = 12px minimum)
        expect(spacing).toBeGreaterThan(8);
      }
    });

    it('should provide adequate padding around touch areas', () => {
      render(<CookieConsent />);

      const acceptButton = screen.getByRole('button', { name: /alle cookies accepteren/i });
      const declineButton = screen.getByRole('button', { name: /alleen noodzakelijke/i });

      // Check computed styles for padding
      const acceptStyles = window.getComputedStyle(acceptButton);
      const declineStyles = window.getComputedStyle(declineButton);

      // Both should have reasonable padding for touch interaction
      expect(acceptStyles.padding).toBeTruthy();
      expect(declineStyles.padding).toBeTruthy();
    });
  });

  describe('Language and Copy Clarity', () => {
    it('should use clear, jargon-free Dutch language', () => {
      render(<CookieConsent />);

      // Check main heading
      expect(screen.getByText('Cookie Instellingen')).toBeInTheDocument();
      
      // Check description uses plain language
      const description = screen.getByText(/we respecteren uw privacy/i);
      expect(description).toBeInTheDocument();
      
      // Button text should be clear and understandable
      expect(screen.getByRole('button', { name: /alle cookies accepteren/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /alleen noodzakelijke/i })).toBeInTheDocument();
    });

    it('should avoid technical jargon in user-facing text', () => {
      render(<CookieConsent />);

      // Check that common Dutch terms are used instead of English technical terms
      const text = document.body.textContent;
      
      // Should use Dutch terms
      expect(text).toContain('Cookie');
      expect(text).toContain('privacy');
      expect(text).toContain('voorkeuren');
      
      // Should avoid overly technical terms in main interface
      expect(screen.queryByText(/GDPR/i)).not.toBeInTheDocument(); // Technical term should not be prominent
      expect(screen.queryByText(/localStorage/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/JSON/i)).not.toBeInTheDocument();
    });

    it('should provide clear explanations for each cookie category', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      // Open detailed settings
      const settingsButton = screen.getByRole('button', { name: /toon gedetailleerde instellingen/i });
      await user.click(settingsButton);

      await waitFor(() => {
        // Each category should have clear, understandable descriptions
        expect(screen.getByText(/deze cookies zijn essentieel/i)).toBeInTheDocument();
        expect(screen.getByText(/helpen ons de website te verbeteren/i)).toBeInTheDocument();
        expect(screen.getByText(/worden gebruikt om relevante advertenties/i)).toBeInTheDocument();
        expect(screen.getByText(/onthouden uw persoonlijke voorkeuren/i)).toBeInTheDocument();
      });
    });
  });

  describe('User Choice Respect', () => {
    it('should respect user decline choice without pressure', async () => {
      const user = userEvent.setup();
      const onDecline = vi.fn();
      
      render(<CookieConsent onDecline={onDecline} />);

      const declineButton = screen.getByRole('button', { name: /alleen noodzakelijke/i });
      await user.click(declineButton);

      // Should process decline immediately without additional prompts
      expect(mockSaveCookieConsent).toHaveBeenCalledWith({
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: expect.any(Date),
        version: '2.0',
      });
      
      expect(onDecline).toHaveBeenCalled();
      
      // Banner should be hidden
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should not show guilt-trip messages after decline', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      const declineButton = screen.getByRole('button', { name: /alleen noodzakelijke/i });
      await user.click(declineButton);

      // Should not show manipulative messages
      await waitFor(() => {
        expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/this will limit/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/you'll miss out/i)).not.toBeInTheDocument();
      });
    });

    it('should allow easy modification of choices', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      // Open settings
      const settingsButton = screen.getByRole('button', { name: /toon gedetailleerde instellingen/i });
      await user.click(settingsButton);

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        
        // Toggle analytics
        user.click(checkboxes[1]);
        
        // Should have save button available
        expect(screen.getByRole('button', { name: /instellingen opslaan/i })).toBeInTheDocument();
      });
    });

    it('should not repeatedly prompt after legitimate decline', async () => {
      // Simulate user has declined before
      mockGetCookieConsent.mockReturnValue({
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: new Date(),
      });
      
      mockIsConsentExpired.mockReturnValue(false);

      render(<CookieConsent />);

      // Should not show banner if user has valid consent
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});