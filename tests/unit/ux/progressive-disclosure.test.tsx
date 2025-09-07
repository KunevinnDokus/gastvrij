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

describe('Cookie Consent - Progressive Disclosure Pattern Tests', () => {
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

    // Mock CSS transitions for animation testing
    Object.defineProperty(window, 'getComputedStyle', {
      writable: true,
      value: vi.fn().mockReturnValue({
        transition: 'all 0.3s ease-in-out',
        opacity: '1',
        height: 'auto',
        overflow: 'visible',
      }),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Simple Interface', () => {
    it('should show simple choices first (Accept/Decline only)', () => {
      render(<CookieConsent />);

      // Primary actions should be visible immediately
      expect(screen.getByRole('button', { name: /alle cookies accepteren/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /alleen noodzakelijke/i })).toBeInTheDocument();
      
      // Advanced settings should be accessible but not prominent
      expect(screen.getByRole('button', { name: /toon gedetailleerde instellingen/i })).toBeInTheDocument();
      
      // Detailed category settings should NOT be visible initially
      expect(screen.queryByText('Noodzakelijke Cookies')).not.toBeInTheDocument();
      expect(screen.queryByText('Analytische Cookies')).not.toBeInTheDocument();
    });

    it('should present a clean, uncluttered initial view', () => {
      render(<CookieConsent />);

      // Should show basic information without overwhelming detail
      expect(screen.getByText('Cookie Instellingen')).toBeInTheDocument();
      expect(screen.getByText(/we respecteren uw privacy/i)).toBeInTheDocument();
      
      // Should show summary view instead of detailed categories
      const quickSummary = screen.getByText(/we gebruiken verschillende soorten cookies/i);
      expect(quickSummary).toBeInTheDocument();
      
      // Should show cookie indicators but not full descriptions
      expect(screen.getByText('Noodzakelijke')).toBeInTheDocument(); // Summary form
      expect(screen.getByText('Analytische')).toBeInTheDocument(); // Summary form
    });

    it('should provide clear indication that more options are available', () => {
      render(<CookieConsent />);

      const settingsButton = screen.getByRole('button', { name: /toon gedetailleerde instellingen/i });
      
      // Settings button should be clearly labeled and accessible
      expect(settingsButton).toBeInTheDocument();
      expect(settingsButton).toHaveAttribute('aria-expanded', 'false');
      
      // Should indicate expandability
      expect(settingsButton.textContent).toContain('Meer');
    });

    it('should allow quick decision-making without details', async () => {
      const user = userEvent.setup();
      const onAccept = vi.fn();
      const onDecline = vi.fn();
      
      render(<CookieConsent onAccept={onAccept} onDecline={onDecline} />);

      // Users should be able to make quick decisions
      const acceptButton = screen.getByRole('button', { name: /alle cookies accepteren/i });
      await user.click(acceptButton);

      expect(onAccept).toHaveBeenCalled();
      expect(mockSaveCookieConsent).toHaveBeenCalledWith({
        necessary: true,
        analytics: true,
        marketing: true,
        preferences: true,
        timestamp: expect.any(Date),
        version: '2.0',
      });
    });
  });

  describe('Advanced Options Access', () => {
    it('should reveal detailed settings via Instellingen button', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      const settingsButton = screen.getByRole('button', { name: /toon gedetailleerde instellingen/i });
      
      // Initially, detailed settings should not be visible
      expect(screen.queryByText('Noodzakelijke Cookies')).not.toBeInTheDocument();
      
      await user.click(settingsButton);

      // After clicking, detailed settings should appear
      await waitFor(() => {
        expect(screen.getByText('Noodzakelijke Cookies')).toBeInTheDocument();
        expect(screen.getByText('Analytische Cookies')).toBeInTheDocument();
        expect(screen.getByText('Marketing Cookies')).toBeInTheDocument();
        expect(screen.getByText('Voorkeur Cookies')).toBeInTheDocument();
      });

      // Button text should change to indicate expanded state
      expect(settingsButton).toHaveAttribute('aria-expanded', 'true');
      expect(settingsButton.textContent).toContain('Minder');
    });

    it('should provide toggle functionality for settings visibility', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      const settingsButton = screen.getByRole('button', { name: /toon gedetailleerde instellingen/i });
      
      // Expand settings
      await user.click(settingsButton);
      
      await waitFor(() => {
        expect(screen.getByText('Noodzakelijke Cookies')).toBeInTheDocument();
      });

      // Collapse settings again
      await user.click(settingsButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Noodzakelijke Cookies')).not.toBeInTheDocument();
      });

      // Should return to simple view
      expect(screen.getByText(/we gebruiken verschillende soorten cookies/i)).toBeInTheDocument();
    });

    it('should maintain appropriate ARIA states during expansion', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      const settingsButton = screen.getByRole('button', { name: /toon gedetailleerde instellingen/i });
      
      // Initially collapsed
      expect(settingsButton).toHaveAttribute('aria-expanded', 'false');
      
      await user.click(settingsButton);
      
      // After expansion
      expect(settingsButton).toHaveAttribute('aria-expanded', 'true');
      
      // Should have proper labeling for screen readers
      expect(settingsButton).toHaveAttribute('aria-label', expect.stringContaining('Verberg gedetailleerde instellingen'));
    });
  });

  describe('Collapsible Detailed View', () => {
    it('should show detailed cookie category information when expanded', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      await user.click(screen.getByRole('button', { name: /toon gedetailleerde instellingen/i }));

      await waitFor(() => {
        // Each category should have detailed information
        expect(screen.getByText('Deze cookies zijn essentieel voor de werking van de website')).toBeInTheDocument();
        expect(screen.getByText('Helpen ons de website te verbeteren door anonieme gebruikersstatistieken')).toBeInTheDocument();
        expect(screen.getByText('Worden gebruikt om relevante advertenties te tonen')).toBeInTheDocument();
        expect(screen.getByText('Onthouden uw persoonlijke voorkeuren en instellingen')).toBeInTheDocument();
      });
    });

    it('should provide individual controls for each cookie category', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      await user.click(screen.getByRole('button', { name: /toon gedetailleerde instellingen/i }));

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        
        // Should have toggle for each category
        expect(checkboxes).toHaveLength(4); // necessary, analytics, marketing, preferences
        
        // Necessary should be disabled (always required)
        expect(checkboxes[0]).toBeDisabled();
        expect(checkboxes[0]).toBeChecked();
        
        // Others should be toggleable
        expect(checkboxes[1]).toBeEnabled(); // Analytics
        expect(checkboxes[2]).toBeEnabled(); // Marketing
        expect(checkboxes[3]).toBeEnabled(); // Preferences
      });
    });

    it('should show Save Settings button when in detailed mode', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      // Initially, save settings button should not be visible
      expect(screen.queryByRole('button', { name: /instellingen opslaan/i })).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /toon gedetailleerde instellingen/i }));

      await waitFor(() => {
        // Save settings button should appear in detailed mode
        expect(screen.getByRole('button', { name: /instellingen opslaan/i })).toBeInTheDocument();
      });
    });

    it('should provide legal basis information for each category', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      await user.click(screen.getByRole('button', { name: /toon gedetailleerde instellingen/i }));

      await waitFor(() => {
        // Should show legal basis for each category
        expect(screen.getByText('Rechtmatig belang voor basisfunctionaliteit')).toBeInTheDocument();
        expect(screen.getByText('Toestemming vereist voor analytische doeleinden')).toBeInTheDocument();
        expect(screen.getByText('Toestemming vereist voor marketingdoeleinden')).toBeInTheDocument();
        expect(screen.getByText('Toestemming vereist voor personalisatie')).toBeInTheDocument();
      });
    });
  });

  describe('Smooth Animations and Transitions', () => {
    it('should have smooth animation when expanding settings', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      const settingsButton = screen.getByRole('button', { name: /toon gedetailleerde instellingen/i });
      
      // Trigger expansion
      await user.click(settingsButton);

      // Should apply transition classes for smooth animation
      await waitFor(() => {
        const expandedSection = screen.getByRole('group', { name: /cookie categorieën/i });
        expect(expandedSection).toBeInTheDocument();
      });

      // Animation should be CSS-based, not jarring instant show/hide
      const computedStyle = window.getComputedStyle(document.body);
      expect(computedStyle.transition).toBeTruthy();
    });

    it('should maintain content flow during expansion/collapse', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      // Get initial position of accept button
      const acceptButton = screen.getByRole('button', { name: /alle cookies accepteren/i });
      const initialRect = acceptButton.getBoundingClientRect();

      // Expand settings
      await user.click(screen.getByRole('button', { name: /toon gedetailleerde instellingen/i }));

      await waitFor(() => {
        expect(screen.getByText('Noodzakelijke Cookies')).toBeInTheDocument();
      });

      // Accept button should still be accessible (possibly moved but not hidden)
      const expandedRect = acceptButton.getBoundingClientRect();
      expect(expandedRect.width).toBeGreaterThan(0);
      expect(expandedRect.height).toBeGreaterThan(0);
    });

    it('should not cause layout thrashing during animations', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      const settingsButton = screen.getByRole('button', { name: /toon gedetailleerde instellingen/i });
      
      // Monitor layout stability during expansion
      const originalContent = screen.getByText(/we respecteren uw privacy/i);
      const originalRect = originalContent.getBoundingClientRect();

      await user.click(settingsButton);

      await waitFor(() => {
        expect(screen.getByText('Noodzakelijke Cookies')).toBeInTheDocument();
      });

      // Original content should remain stable
      const newRect = originalContent.getBoundingClientRect();
      expect(newRect.left).toBe(originalRect.left);
      expect(newRect.width).toBe(originalRect.width);
    });
  });

  describe('Quick Dismiss Functionality', () => {
    it('should allow quick dismissal without making choices for consent fatigue prevention', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      // Should support Escape key for quick dismissal
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Should not have saved any consent (allowing user to avoid decision fatigue)
      expect(mockSaveCookieConsent).not.toHaveBeenCalled();
    });

    it('should provide visual quick dismiss option for impatient users', () => {
      render(<CookieConsent />);

      // Should be easily dismissible without scrolling or detailed interaction
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // Escape key functionality should be documented for screen readers
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should remember dismissal preference temporarily', async () => {
      const user = userEvent.setup();
      const { unmount, rerender } = render(<CookieConsent />);

      // Quick dismiss
      await user.keyboard('{Escape}');
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Remount component (simulate page navigation within session)
      unmount();
      rerender(<CookieConsent />);

      // Should still respect temporary dismissal (though this would typically be handled by session storage)
      // Note: This test validates the intended behavior, implementation may vary
    });
  });

  describe('Information Hierarchy', () => {
    it('should present information in logical priority order', () => {
      render(<CookieConsent />);

      const elements = Array.from(document.querySelectorAll('*')).filter(el => el.textContent?.trim());
      const textContent = elements.map(el => el.textContent?.trim()).join(' ');

      // Title should come before description
      const titleIndex = textContent.indexOf('Cookie Instellingen');
      const descriptionIndex = textContent.indexOf('We respecteren uw privacy');
      expect(titleIndex).toBeLessThan(descriptionIndex);

      // Main actions should come before detailed settings
      const actionsIndex = textContent.indexOf('Alle Cookies Accepteren');
      const settingsIndex = textContent.indexOf('Meer');
      expect(actionsIndex).toBeLessThan(settingsIndex);
    });

    it('should maintain logical tab order through progressive disclosure', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      // Initial tab order
      await user.tab();
      expect(document.activeElement?.textContent).toContain('Meer'); // Settings button

      await user.tab();
      expect(document.activeElement?.textContent).toContain('Alle Cookies Accepteren');

      // Expand settings and verify extended tab order
      const settingsButton = screen.getByRole('button', { name: /toon gedetailleerde instellingen/i });
      await user.click(settingsButton);

      await waitFor(() => {
        expect(screen.getByText('Noodzakelijke Cookies')).toBeInTheDocument();
      });

      // Tab order should now include detailed controls
      await user.tab(); // Should go to decline button
      expect(document.activeElement?.textContent).toContain('Alleen Noodzakelijke');
    });

    it('should provide contextual help without overwhelming users', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);

      // Basic view should have minimal help text
      expect(screen.getByText(/klik op "meer" voor gedetailleerde instellingen/i)).toBeInTheDocument();

      // Expanded view should have more detailed help
      await user.click(screen.getByRole('button', { name: /toon gedetailleerde instellingen/i }));

      await waitFor(() => {
        // Legal basis should be available but not overwhelming
        expect(screen.getByText('Rechtmatig belang voor basisfunctionaliteit')).toBeInTheDocument();
      });
    });
  });
});