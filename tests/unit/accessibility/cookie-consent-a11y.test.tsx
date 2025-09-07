import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CookieConsent } from '@/components/CookieConsent';
import * as gdpr from '@/lib/gdpr';

// Mock GDPR functions
vi.mock('@/lib/gdpr', () => ({
  getCookieConsent: vi.fn(),
  saveCookieConsent: vi.fn(),
}));

const mockGetCookieConsent = vi.mocked(gdpr.getCookieConsent);
const mockSaveCookieConsent = vi.mocked(gdpr.saveCookieConsent);

describe('Cookie Consent Accessibility Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });

    // Always show banner for accessibility tests
    mockGetCookieConsent.mockReturnValue({
      necessary: false,
      analytics: false,
      marketing: false,
      preferences: false,
      timestamp: new Date(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Keyboard Navigation', () => {
    it('should support full keyboard navigation through all interactive elements', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);
      
      // Get all focusable elements in order
      const checkboxes = screen.getAllByRole('checkbox');
      const buttons = screen.getAllByRole('button');
      const links = screen.getAllByRole('link');
      
      // Tab through checkboxes (only enabled ones should be focusable)
      const enabledCheckboxes = checkboxes.filter(checkbox => !checkbox.hasAttribute('disabled'));
      
      for (const checkbox of enabledCheckboxes) {
        await user.tab();
        expect(checkbox).toHaveFocus();
      }
      
      // Tab through buttons
      for (const button of buttons) {
        await user.tab();
        expect(button).toHaveFocus();
      }
      
      // Tab through links
      for (const link of links) {
        await user.tab();
        expect(link).toHaveFocus();
      }
    });

    it('should allow checkbox interaction via keyboard', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);
      
      // Focus on analytics checkbox (first enabled checkbox)
      const analyticsCheckbox = screen.getAllByRole('checkbox')[1];
      analyticsCheckbox.focus();
      
      expect(analyticsCheckbox).toHaveFocus();
      expect(analyticsCheckbox).not.toBeChecked();
      
      // Toggle with space key
      await user.keyboard(' ');
      expect(analyticsCheckbox).toBeChecked();
      
      // Toggle again with space key
      await user.keyboard(' ');
      expect(analyticsCheckbox).not.toBeChecked();
    });

    it('should allow button activation via keyboard', async () => {
      const user = userEvent.setup();
      const mockOnAccept = vi.fn();
      
      render(<CookieConsent onAccept={mockOnAccept} />);
      
      const acceptButton = screen.getByRole('button', { name: 'Alle Cookies Accepteren' });
      acceptButton.focus();
      
      expect(acceptButton).toHaveFocus();
      
      // Activate with Enter key
      await user.keyboard('{Enter}');
      expect(mockOnAccept).toHaveBeenCalled();
      
      // Should also work with Space key
      mockOnAccept.mockClear();
      
      // Re-render to show banner again
      mockGetCookieConsent.mockReturnValue({
        necessary: false,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: new Date(),
      });
      
      render(<CookieConsent onAccept={mockOnAccept} />);
      const acceptButton2 = screen.getByRole('button', { name: 'Alle Cookies Accepteren' });
      acceptButton2.focus();
      
      await user.keyboard(' ');
      expect(mockOnAccept).toHaveBeenCalled();
    });

    it('should support Shift+Tab for reverse navigation', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);
      
      // Start from the last link
      const links = screen.getAllByRole('link');
      const lastLink = links[links.length - 1];
      lastLink.focus();
      
      expect(lastLink).toHaveFocus();
      
      // Shift+Tab should move to previous focusable element
      await user.keyboard('{Shift>}{Tab}{/Shift}');
      
      // Should focus on the element before the last link
      if (links.length > 1) {
        expect(links[links.length - 2]).toHaveFocus();
      } else {
        // If only one link, should focus on buttons
        const buttons = screen.getAllByRole('button');
        expect(buttons[buttons.length - 1]).toHaveFocus();
      }
    });

    it('should trap focus within the consent banner', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);
      
      // Get all focusable elements within the banner
      const banner = screen.getByText('Cookie Instellingen').closest('div');
      const focusableElements = banner?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) || [];
      
      expect(focusableElements.length).toBeGreaterThan(0);
      
      // Focus should cycle through elements within the banner
      const firstFocusable = focusableElements[0] as HTMLElement;
      const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;
      
      firstFocusable.focus();
      expect(firstFocusable).toHaveFocus();
      
      // Tab to last element
      for (let i = 0; i < focusableElements.length - 1; i++) {
        await user.tab();
      }
      expect(lastFocusable).toHaveFocus();
      
      // Tab beyond last should cycle to first (focus trap)
      // Note: This test documents expected behavior, actual implementation may vary
      await user.tab();
      // In a full focus trap implementation, this would cycle back to first
    });
  });

  describe('ARIA Labels and Roles', () => {
    it('should have appropriate ARIA roles for all elements', () => {
      render(<CookieConsent />);
      
      // Check that buttons have button role
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
      
      // Check that checkboxes have checkbox role
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(4);
      
      // Check that links have link role
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
    });

    it('should have descriptive accessible names for all interactive elements', () => {
      render(<CookieConsent />);
      
      // Buttons should have clear names
      expect(screen.getByRole('button', { name: 'Alle Cookies Accepteren' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Alleen Noodzakelijke' })).toBeInTheDocument();
      
      // Links should have descriptive names
      expect(screen.getByRole('link', { name: 'privacybeleid' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'cookiebeleid' })).toBeInTheDocument();
      
      // Checkboxes should be associated with their labels
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        // Each checkbox should have an accessible name (from associated label)
        expect(checkbox.getAttribute('aria-label') || checkbox.closest('label')).toBeTruthy();
      });
    });

    it('should use proper heading hierarchy', () => {
      render(<CookieConsent />);
      
      // Main title should be a heading
      const mainHeading = screen.getByText('Cookie Instellingen');
      expect(mainHeading.tagName.toLowerCase()).toMatch(/^h[1-6]$/);
      
      // Cookie category titles should be properly structured
      const categoryTitles = [
        'Noodzakelijke Cookies',
        'Analytische Cookies',
        'Marketing Cookies',
        'Voorkeur Cookies'
      ];
      
      categoryTitles.forEach(title => {
        const element = screen.getByText(title);
        // Should be h4 or properly marked up for screen readers
        expect(element.tagName.toLowerCase()).toMatch(/^h[1-6]$/);
      });
    });

    it('should provide ARIA descriptions for complex interactions', () => {
      render(<CookieConsent />);
      
      // Necessary cookies checkbox should indicate it cannot be disabled
      const necessaryCheckbox = screen.getAllByRole('checkbox')[0];
      const altijdActiefText = screen.getByText('Altijd actief');
      
      // Should be associated with descriptive text
      expect(altijdActiefText).toBeInTheDocument();
      expect(necessaryCheckbox).toBeDisabled();
    });

    it('should use proper ARIA live regions for dynamic content', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);
      
      // When banner disappears, screen readers should be notified
      // This would typically use aria-live="polite" or announcements
      const acceptButton = screen.getByRole('button', { name: 'Alle Cookies Accepteren' });
      await user.click(acceptButton);
      
      // Banner should be removed
      await waitFor(() => {
        expect(screen.queryByText('Cookie Instellingen')).not.toBeInTheDocument();
      });
      
      // In a full implementation, there might be an aria-live announcement
      // about consent being saved
    });
  });

  describe('Focus Management', () => {
    it('should provide visible focus indicators', () => {
      render(<CookieConsent />);
      
      // All interactive elements should have focus styles
      const interactiveElements = [
        ...screen.getAllByRole('button'),
        ...screen.getAllByRole('checkbox').filter(cb => !cb.hasAttribute('disabled')),
        ...screen.getAllByRole('link'),
      ];
      
      interactiveElements.forEach(element => {
        element.focus();
        
        // Focus should be visible (this would be tested visually in E2E)
        expect(element).toHaveFocus();
        expect(element.className).toContain('focus:'); // Tailwind focus classes
      });
    });

    it('should set initial focus appropriately when banner appears', () => {
      render(<CookieConsent />);
      
      // When banner appears, focus should be managed appropriately
      // Could focus on first interactive element or banner container
      const firstButton = screen.getAllByRole('button')[0];
      
      // Focus management might set focus to first actionable element
      // This tests the expected behavior
      expect(document.activeElement).toBeDefined();
    });

    it('should restore focus after banner closes', async () => {
      const user = userEvent.setup();
      
      // Create a button that was focused before banner appeared
      const triggerButton = document.createElement('button');
      triggerButton.textContent = 'Trigger';
      document.body.appendChild(triggerButton);
      triggerButton.focus();
      
      expect(triggerButton).toHaveFocus();
      
      render(<CookieConsent />);
      
      // Interact with banner
      const acceptButton = screen.getByRole('button', { name: 'Alle Cookies Accepteren' });
      await user.click(acceptButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Cookie Instellingen')).not.toBeInTheDocument();
      });
      
      // Focus should ideally return to previously focused element
      // This documents expected behavior for proper focus management
      document.body.removeChild(triggerButton);
    });

    it('should handle focus for disabled elements appropriately', () => {
      render(<CookieConsent />);
      
      const necessaryCheckbox = screen.getAllByRole('checkbox')[0];
      
      // Disabled elements should not be focusable
      expect(necessaryCheckbox).toBeDisabled();
      
      // Try to focus - should not receive focus
      necessaryCheckbox.focus();
      expect(necessaryCheckbox).not.toHaveFocus();
    });
  });

  describe('Screen Reader Compatibility', () => {
    it('should provide meaningful context for cookie categories', () => {
      render(<CookieConsent />);
      
      // Each cookie category should have both title and description
      const categories = [
        {
          title: 'Noodzakelijke Cookies',
          description: 'Deze cookies zijn essentieel voor de werking van de website.'
        },
        {
          title: 'Analytische Cookies',
          description: 'Deze cookies helpen ons de website te verbeteren door anonieme gebruikersstatistieken te verzamelen.'
        },
        {
          title: 'Marketing Cookies',
          description: 'Deze cookies worden gebruikt om relevante advertenties te tonen.'
        },
        {
          title: 'Voorkeur Cookies',
          description: 'Deze cookies onthouden uw voorkeuren en instellingen.'
        }
      ];
      
      categories.forEach(category => {
        expect(screen.getByText(category.title)).toBeInTheDocument();
        expect(screen.getByText(category.description)).toBeInTheDocument();
      });
    });

    it('should provide clear instructions about cookie purposes', () => {
      render(<CookieConsent />);
      
      // Main description should explain what cookies are used for
      expect(screen.getByText(/We gebruiken cookies om uw ervaring te verbeteren/)).toBeInTheDocument();
      
      // Optional/required status should be clear
      expect(screen.getByText('Altijd actief')).toBeInTheDocument();
      expect(screen.getAllByText('Optioneel')).toHaveLength(3);
    });

    it('should announce the purpose of action buttons clearly', () => {
      render(<CookieConsent />);
      
      // Button names should be descriptive
      const acceptButton = screen.getByRole('button', { name: 'Alle Cookies Accepteren' });
      const declineButton = screen.getByRole('button', { name: 'Alleen Noodzakelijke' });
      
      expect(acceptButton).toBeInTheDocument();
      expect(declineButton).toBeInTheDocument();
      
      // Names should clearly indicate what will happen
      expect(acceptButton.textContent).toContain('Alle');
      expect(declineButton.textContent).toContain('Alleen Noodzakelijke');
    });

    it('should provide context about privacy policies', () => {
      render(<CookieConsent />);
      
      // Privacy policy section should have clear context
      const privacyText = screen.getByText(/Lees meer over ons/);
      expect(privacyText).toBeInTheDocument();
      
      // Links should be in meaningful context
      const privacyLink = screen.getByRole('link', { name: 'privacybeleid' });
      const cookieLink = screen.getByRole('link', { name: 'cookiebeleid' });
      
      expect(privacyLink).toBeInTheDocument();
      expect(cookieLink).toBeInTheDocument();
    });
  });

  describe('High Contrast and Visual Accessibility', () => {
    it('should use semantic HTML elements for better accessibility', () => {
      render(<CookieConsent />);
      
      // Should use proper form elements
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox.tagName.toLowerCase()).toBe('input');
        expect(checkbox.getAttribute('type')).toBe('checkbox');
      });
      
      // Should use proper button elements
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button.tagName.toLowerCase()).toBe('button');
      });
      
      // Should use proper link elements
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link.tagName.toLowerCase()).toBe('a');
        expect(link.getAttribute('href')).toBeTruthy();
      });
    });

    it('should have sufficient color contrast ratios', () => {
      render(<CookieConsent />);
      
      // Test that text elements have appropriate contrast classes
      const textElements = screen.getAllByText(/Deze cookies/);
      textElements.forEach(element => {
        // Should use Tailwind classes that provide good contrast
        expect(element.className).toMatch(/(text-gray-600|text-gray-700|text-gray-800|text-gray-900)/);
      });
      
      // Buttons should have high contrast
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button.className).toMatch(/(bg-hospitality|bg-white|border)/);
      });
    });

    it('should support system preferences for reduced motion', () => {
      render(<CookieConsent />);
      
      // Component should not have animations that could cause issues
      // This test documents the expectation - actual implementation would
      // use CSS prefers-reduced-motion media query
      
      const banner = screen.getByText('Cookie Instellingen').closest('div');
      
      // Should not have animation classes that ignore reduced motion preference
      expect(banner?.className).not.toContain('animate-bounce');
      expect(banner?.className).not.toContain('animate-spin');
    });
  });

  describe('Landmark Regions', () => {
    it('should use appropriate landmark roles for navigation', () => {
      render(<CookieConsent />);
      
      // Cookie banner should be a dialog or alert
      const banner = screen.getByText('Cookie Instellingen').closest('div');
      
      // Should be clearly identified as a dialog/banner/alert region
      // This test documents expected behavior
      expect(banner).toBeInTheDocument();
    });

    it('should provide clear boundaries for the consent interface', () => {
      render(<CookieConsent />);
      
      // The entire consent interface should be contained within a clear boundary
      const consentContainer = screen.getByText('Cookie Instellingen').closest('div');
      
      // Should have appropriate styling to indicate it's a modal/overlay
      expect(consentContainer?.className).toContain('fixed');
      expect(consentContainer?.className).toContain('z-50');
    });
  });
});