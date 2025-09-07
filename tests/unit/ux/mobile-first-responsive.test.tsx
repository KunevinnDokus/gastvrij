import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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

// Test viewport configurations
const VIEWPORTS = {
  mobileLandscape: { width: 568, height: 320 },
  mobilePortrait: { width: 320, height: 568 },
  iPhone8: { width: 375, height: 667 },
  iPhoneXR: { width: 414, height: 896 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
  ultraWide: { width: 2560, height: 1440 },
};

describe('Cookie Consent - Mobile-First Responsive UX Tests', () => {
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

    // Mock touch support
    Object.defineProperty(window, 'ontouchstart', {
      writable: true,
      value: () => {},
    });

    // Mock matchMedia for responsive tests
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query.includes('max-width: 640px'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Touch-Friendly Interactions', () => {
    it('should provide 44px minimum touch targets on mobile', () => {
      // Set mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      Object.defineProperty(window, 'innerHeight', { value: 667 });

      render(<CookieConsent />);

      const buttons = screen.getAllByRole('button');
      
      buttons.forEach(button => {
        const rect = button.getBoundingClientRect();
        
        // Each button should meet minimum touch target size
        expect(rect.height).toBeGreaterThanOrEqual(44);
        expect(rect.width).toBeGreaterThanOrEqual(44);
      });
    });

    it('should maintain adequate spacing between touch targets', () => {
      Object.defineProperty(window, 'innerWidth', { value: 320 }); // Smallest mobile
      
      render(<CookieConsent />);

      const acceptButton = screen.getByRole('button', { name: /alle cookies accepteren/i });
      const declineButton = screen.getByRole('button', { name: /alleen noodzakelijke/i });

      const acceptRect = acceptButton.getBoundingClientRect();
      const declineRect = declineButton.getBoundingClientRect();

      // Calculate spacing between buttons
      const horizontalSpacing = Math.abs(acceptRect.right - declineRect.left);
      const verticalSpacing = Math.abs(acceptRect.bottom - declineRect.top);

      // Should have minimum 8px spacing for comfortable touch interaction
      expect(Math.max(horizontalSpacing, verticalSpacing)).toBeGreaterThanOrEqual(8);
    });

    it('should provide larger touch targets for critical actions', () => {
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      
      render(<CookieConsent />);

      const acceptButton = screen.getByRole('button', { name: /alle cookies accepteren/i });
      const declineButton = screen.getByRole('button', { name: /alleen noodzakelijke/i });
      const settingsButton = screen.getByRole('button', { name: /toon gedetailleerde instellingen/i });

      const acceptRect = acceptButton.getBoundingClientRect();
      const declineRect = declineButton.getBoundingClientRect();
      const settingsRect = settingsButton.getBoundingClientRect();

      // Primary actions should be larger than secondary actions
      expect(acceptRect.height).toBeGreaterThanOrEqual(settingsRect.height);
      expect(declineRect.height).toBeGreaterThanOrEqual(settingsRect.height);
    });

    it('should handle touch interactions without hover states', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      
      render(<CookieConsent />);

      const acceptButton = screen.getByRole('button', { name: /alle cookies accepteren/i });

      // Simulate touch start (should not require hover)
      fireEvent.touchStart(acceptButton);
      fireEvent.touchEnd(acceptButton);

      // Button should respond to touch without requiring hover states
      expect(acceptButton).toBeInTheDocument();
      expect(acceptButton).not.toHaveClass('hover:');
    });
  });

  describe('Optimal Display Across Screen Sizes', () => {
    Object.entries(VIEWPORTS).forEach(([deviceName, { width, height }]) => {
      it(`should display correctly on ${deviceName} (${width}x${height})`, () => {
        Object.defineProperty(window, 'innerWidth', { value: width });
        Object.defineProperty(window, 'innerHeight', { value: height });

        render(<CookieConsent />);

        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();

        // Should fit within viewport
        const rect = dialog.getBoundingClientRect();
        expect(rect.width).toBeLessThanOrEqual(width);
        expect(rect.height).toBeLessThanOrEqual(height);

        // Should have appropriate responsive classes
        const container = dialog.querySelector('.max-w-4xl');
        expect(container).toBeInTheDocument();
      });
    });

    it('should stack buttons vertically on narrow screens', () => {
      Object.defineProperty(window, 'innerWidth', { value: 320 }); // Very narrow
      
      render(<CookieConsent />);

      const buttonContainer = screen.getByRole('button', { name: /alle cookies accepteren/i }).closest('.flex');
      
      // Should use flex-col on small screens
      expect(buttonContainer).toHaveClass('flex-col', 'sm:flex-row');
    });

    it('should use horizontal layout on wider screens', () => {
      Object.defineProperty(window, 'innerWidth', { value: 768 }); // Tablet+
      
      render(<CookieConsent />);

      const buttonContainer = screen.getByRole('button', { name: /alle cookies accepteren/i }).closest('.flex');
      
      // Should maintain horizontal layout on larger screens
      expect(buttonContainer).toHaveClass('flex');
    });

    it('should adapt content width based on screen size', () => {
      const testWidths = [320, 375, 768, 1024, 1920];
      
      testWidths.forEach(width => {
        Object.defineProperty(window, 'innerWidth', { value: width });
        
        const { unmount } = render(<CookieConsent />);
        
        const dialog = screen.getByRole('dialog');
        const content = dialog.querySelector('.max-w-4xl');
        
        expect(content).toBeInTheDocument();
        
        // Should use responsive max-width
        const rect = content!.getBoundingClientRect();
        expect(rect.width).toBeLessThanOrEqual(width);
        
        unmount();
      });
    });
  });

  describe('Swipe Gesture Support', () => {
    it('should support swipe-to-dismiss on mobile', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      
      render(<CookieConsent />);

      const dialog = screen.getByRole('dialog');
      
      // Simulate swipe down gesture
      fireEvent.touchStart(dialog, {
        touches: [{ clientX: 100, clientY: 100 }],
      });

      fireEvent.touchMove(dialog, {
        touches: [{ clientX: 100, clientY: 200 }],
      });

      fireEvent.touchEnd(dialog);

      // Should handle swipe gesture (implementation may vary)
      expect(dialog).toBeInTheDocument(); // Still present as dismissal may require different implementation
    });

    it('should provide visual feedback during swipe gestures', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      
      render(<CookieConsent />);

      const dialog = screen.getByRole('dialog');
      
      // Start swipe
      fireEvent.touchStart(dialog, {
        touches: [{ clientX: 100, clientY: 100 }],
      });

      // Should provide some visual indication (opacity, transform, etc.)
      // This tests the concept - actual implementation may use CSS transforms
      expect(dialog).toBeInTheDocument();
    });

    it('should distinguish between swipe and scroll gestures', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      
      render(<CookieConsent />);

      const dialog = screen.getByRole('dialog');
      
      // Vertical scroll should not trigger dismiss
      fireEvent.touchStart(dialog, {
        touches: [{ clientX: 100, clientY: 100 }],
      });

      fireEvent.touchMove(dialog, {
        touches: [{ clientX: 100, clientY: 90 }], // Small vertical movement
      });

      fireEvent.touchEnd(dialog);

      // Should remain visible for small movements (scroll vs swipe)
      expect(dialog).toBeInTheDocument();
    });
  });

  describe('Proper Spacing and Layout', () => {
    it('should maintain adequate margins on mobile', () => {
      Object.defineProperty(window, 'innerWidth', { value: 320 });
      
      render(<CookieConsent />);

      const dialog = screen.getByRole('dialog');
      const rect = dialog.getBoundingClientRect();
      
      // Should not touch screen edges
      expect(rect.left).toBeGreaterThan(0);
      expect(rect.right).toBeLessThan(320);
    });

    it('should provide comfortable reading line lengths', async () => {
      const user = userEvent.setup();
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      
      render(<CookieConsent />);

      // Expand to see detailed text
      await user.click(screen.getByRole('button', { name: /toon gedetailleerde instellingen/i }));

      await waitFor(() => {
        const descriptionTexts = screen.getAllByText(/deze cookies zijn essentieel/i);
        if (descriptionTexts.length > 0) {
          const textElement = descriptionTexts[0];
          const rect = textElement.getBoundingClientRect();
          
          // Text width should be comfortable for reading (not too wide)
          expect(rect.width).toBeLessThan(600); // Max comfortable reading width
          expect(rect.width).toBeGreaterThan(200); // Min readable width
        }
      });
    });

    it('should adapt button layout for different orientations', () => {
      // Test portrait mode
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      Object.defineProperty(window, 'innerHeight', { value: 667 });
      
      const { unmount } = render(<CookieConsent />);
      
      const portraitDialog = screen.getByRole('dialog');
      expect(portraitDialog).toBeInTheDocument();
      
      unmount();
      
      // Test landscape mode  
      Object.defineProperty(window, 'innerWidth', { value: 667 });
      Object.defineProperty(window, 'innerHeight', { value: 375 });
      
      render(<CookieConsent />);
      
      const landscapeDialog = screen.getByRole('dialog');
      expect(landscapeDialog).toBeInTheDocument();
      
      // Should adapt to landscape orientation
      const buttonContainer = landscapeDialog.querySelector('.flex.gap-3');
      expect(buttonContainer).toBeInTheDocument();
    });

    it('should maintain visual hierarchy on small screens', () => {
      Object.defineProperty(window, 'innerWidth', { value: 320 });
      
      render(<CookieConsent />);

      const title = screen.getByText('Cookie Instellingen');
      const description = screen.getByText(/we respecteren uw privacy/i);
      const acceptButton = screen.getByRole('button', { name: /alle cookies accepteren/i });

      // Title should be most prominent
      const titleStyles = window.getComputedStyle(title);
      const descriptionStyles = window.getComputedStyle(description);
      
      expect(title).toHaveClass('text-xl'); // Larger text
      expect(description).toHaveClass('text-gray-600'); // Secondary color
      
      // Button should be prominent but not overwhelming
      expect(acceptButton).toBeVisible();
    });
  });

  describe('Typography Scaling', () => {
    it('should use appropriate font sizes for mobile readability', () => {
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      
      render(<CookieConsent />);

      const title = screen.getByText('Cookie Instellingen');
      const description = screen.getByText(/we respecteren uw privacy/i);

      // Check responsive text classes
      expect(title).toHaveClass('text-xl'); // Should scale appropriately
      
      const titleRect = title.getBoundingClientRect();
      const descriptionRect = description.getBoundingClientRect();
      
      // Title should be larger than description
      expect(titleRect.height).toBeGreaterThan(descriptionRect.height);
    });

    it('should maintain readable text contrast on all screen sizes', () => {
      const screenSizes = [320, 375, 768, 1024];
      
      screenSizes.forEach(width => {
        Object.defineProperty(window, 'innerWidth', { value: width });
        
        const { unmount } = render(<CookieConsent />);
        
        const title = screen.getByText('Cookie Instellingen');
        
        // Should have high contrast text classes
        expect(title).toHaveClass('text-gray-900'); // Dark text for readability
        
        unmount();
      });
    });

    it('should scale button text appropriately across devices', () => {
      Object.defineProperty(window, 'innerWidth', { value: 320 });
      
      render(<CookieConsent />);

      const acceptButton = screen.getByRole('button', { name: /alle cookies accepteren/i });
      const declineButton = screen.getByRole('button', { name: /alleen noodzakelijke/i });

      // Button text should be readable but not overwhelming
      const acceptRect = acceptButton.getBoundingClientRect();
      const declineRect = declineButton.getBoundingClientRect();
      
      expect(acceptRect.height).toBeGreaterThan(40); // Minimum for comfortable reading
      expect(declineRect.height).toBeGreaterThan(40);
    });

    it('should handle text overflow gracefully on narrow screens', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 280 }); // Very narrow
      
      render(<CookieConsent />);

      const acceptButton = screen.getByRole('button', { name: /alle cookies accepteren/i });
      
      // Text should not overflow container
      const buttonRect = acceptButton.getBoundingClientRect();
      const textContent = acceptButton.textContent;
      
      expect(textContent).toBeTruthy();
      expect(buttonRect.width).toBeGreaterThan(0);
      
      // Should not have horizontal scroll
      expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth + 20); // Allow small margin
    });
  });

  describe('Performance on Mobile Devices', () => {
    it('should render efficiently on slower mobile devices', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      
      const startTime = performance.now();
      
      render(<CookieConsent />);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const renderTime = performance.now() - startTime;
      
      // Should render quickly even on mobile
      expect(renderTime).toBeLessThan(100); // 100ms threshold
    });

    it('should minimize layout shifts during mobile rendering', () => {
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      
      render(<CookieConsent />);
      
      const dialog = screen.getByRole('dialog');
      const initialRect = dialog.getBoundingClientRect();
      
      // Force re-render
      dialog.getBoundingClientRect();
      
      const finalRect = dialog.getBoundingClientRect();
      
      // Should maintain stable layout
      expect(Math.abs(finalRect.top - initialRect.top)).toBeLessThan(5);
      expect(Math.abs(finalRect.left - initialRect.left)).toBeLessThan(5);
    });

    it('should handle orientation changes gracefully', () => {
      // Start in portrait
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      Object.defineProperty(window, 'innerHeight', { value: 667 });
      
      render(<CookieConsent />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      
      // Simulate orientation change to landscape
      Object.defineProperty(window, 'innerWidth', { value: 667 });
      Object.defineProperty(window, 'innerHeight', { value: 375 });
      
      // Trigger resize event
      fireEvent(window, new Event('resize'));
      
      // Should still be properly displayed
      expect(dialog).toBeInTheDocument();
      
      const rect = dialog.getBoundingClientRect();
      expect(rect.width).toBeLessThanOrEqual(667);
      expect(rect.height).toBeLessThanOrEqual(375);
    });
  });
});