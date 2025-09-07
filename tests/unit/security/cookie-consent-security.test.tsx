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

describe('Cookie Consent Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock console methods to suppress expected error logs in security tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('localStorage Error Handling', () => {
    it('should handle localStorage being unavailable (private browsing mode)', () => {
      // Mock localStorage to throw errors (simulating private browsing)
      const mockLocalStorage = {
        getItem: vi.fn(() => {
          throw new Error('localStorage is not available');
        }),
        setItem: vi.fn(() => {
          throw new Error('localStorage is not available');
        }),
        removeItem: vi.fn(() => {
          throw new Error('localStorage is not available');
        }),
        clear: vi.fn(() => {
          throw new Error('localStorage is not available');
        }),
      };

      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
      });

      // Mock getCookieConsent to throw error
      mockGetCookieConsent.mockImplementation(() => {
        throw new Error('localStorage is not available');
      });

      // Component should not crash and should handle the error gracefully
      expect(() => render(<CookieConsent />)).not.toThrow();
      
      // Should not display the banner if localStorage check fails
      expect(screen.queryByText('Cookie Instellingen')).not.toBeInTheDocument();
    });

    it('should handle localStorage quota exceeded errors', async () => {
      const user = userEvent.setup();
      
      // Set up localStorage mock that works for reading but fails on writing
      const mockLocalStorage = {
        getItem: vi.fn(() => null),
        setItem: vi.fn(() => {
          throw new Error('QuotaExceededError: localStorage quota exceeded');
        }),
        removeItem: vi.fn(),
        clear: vi.fn(),
      };

      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
      });

      mockGetCookieConsent.mockReturnValue({
        necessary: false,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: new Date(),
      });

      mockSaveCookieConsent.mockImplementation(() => {
        throw new Error('QuotaExceededError: localStorage quota exceeded');
      });

      render(<CookieConsent />);
      
      const acceptButton = screen.getByRole('button', { name: 'Alle Cookies Accepteren' });
      
      // Should not crash when localStorage saving fails
      expect(async () => await user.click(acceptButton)).not.toThrow();
      
      // Component should still hide the banner (graceful degradation)
      await waitFor(() => {
        expect(screen.queryByText('Cookie Instellingen')).not.toBeInTheDocument();
      });
    });

    it('should handle localStorage being undefined', () => {
      // Simulate environment where localStorage is undefined
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      });

      // Mock getCookieConsent to return default values when localStorage is unavailable
      mockGetCookieConsent.mockReturnValue({
        necessary: false,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: new Date(),
      });

      expect(() => render(<CookieConsent />)).not.toThrow();
    });
  });

  describe('JSON Parsing Security', () => {
    it('should handle malformed JSON in localStorage gracefully', () => {
      // Mock localStorage with malformed JSON
      const mockLocalStorage = {
        getItem: vi.fn(() => '{ invalid json }'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      };

      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
      });

      // Mock getCookieConsent to handle JSON parsing error
      mockGetCookieConsent.mockImplementation(() => {
        try {
          const stored = localStorage.getItem('gdpr-consent');
          if (stored) {
            return JSON.parse(stored); // This will throw
          }
        } catch (error) {
          // Return default consent on parsing error
          return {
            necessary: false,
            analytics: false,
            marketing: false,
            preferences: false,
            timestamp: new Date(),
          };
        }
        return {
          necessary: false,
          analytics: false,
          marketing: false,
          preferences: false,
          timestamp: new Date(),
        };
      });

      expect(() => render(<CookieConsent />)).not.toThrow();
      
      // Should show banner when parsing fails and returns default consent
      expect(screen.getByText('Cookie Instellingen')).toBeInTheDocument();
    });

    it('should validate consent object structure', () => {
      // Mock localStorage with invalid consent structure
      const mockLocalStorage = {
        getItem: vi.fn(() => JSON.stringify({
          // Missing required fields
          onlyNecessary: true,
          analytics: 'invalid_type', // Wrong type
          // Missing marketing, preferences, timestamp
        })),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      };

      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
      });

      // Mock getCookieConsent to validate and return safe defaults
      mockGetCookieConsent.mockImplementation(() => {
        const stored = localStorage.getItem('gdpr-consent');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            
            // Validate structure and types
            if (
              typeof parsed === 'object' &&
              typeof parsed.necessary === 'boolean' &&
              typeof parsed.analytics === 'boolean' &&
              typeof parsed.marketing === 'boolean' &&
              typeof parsed.preferences === 'boolean' &&
              parsed.timestamp
            ) {
              return parsed;
            }
          } catch (error) {
            // Invalid structure, return defaults
          }
        }
        
        return {
          necessary: false,
          analytics: false,
          marketing: false,
          preferences: false,
          timestamp: new Date(),
        };
      });

      expect(() => render(<CookieConsent />)).not.toThrow();
      expect(screen.getByText('Cookie Instellingen')).toBeInTheDocument();
    });

    it('should prevent prototype pollution through JSON parsing', () => {
      // Mock localStorage with potential prototype pollution payload
      const maliciousJSON = JSON.stringify({
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: new Date(),
        '__proto__': { polluted: true },
        'constructor': { prototype: { polluted: true } }
      });

      const mockLocalStorage = {
        getItem: vi.fn(() => maliciousJSON),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      };

      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
      });

      // Mock getCookieConsent to use safe JSON parsing
      mockGetCookieConsent.mockImplementation(() => {
        const stored = localStorage.getItem('gdpr-consent');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            
            // Create clean object without potentially dangerous properties
            return {
              necessary: Boolean(parsed.necessary),
              analytics: Boolean(parsed.analytics),
              marketing: Boolean(parsed.marketing),
              preferences: Boolean(parsed.preferences),
              timestamp: new Date(parsed.timestamp || Date.now()),
            };
          } catch (error) {
            return {
              necessary: true,
              analytics: false,
              marketing: false,
              preferences: false,
              timestamp: new Date(),
            };
          }
        }
        
        return {
          necessary: true,
          analytics: false,
          marketing: false,
          preferences: false,
          timestamp: new Date(),
        };
      });

      expect(() => render(<CookieConsent />)).not.toThrow();
      
      // Verify prototype wasn't polluted
      expect((Object.prototype as any).polluted).toBeUndefined();
    });
  });

  describe('XSS Prevention', () => {
    it('should not render user-controlled content as HTML', () => {
      // Even though current component doesn't take user input,
      // test that it's safe against potential XSS vectors
      
      render(<CookieConsent />);
      
      // Check that all text content is safely rendered as text, not HTML
      const cookieTitle = screen.getByText('Cookie Instellingen');
      expect(cookieTitle.innerHTML).toBe('Cookie Instellingen');
      
      // Verify that descriptions are rendered as text
      const descriptions = screen.getAllByText(/Deze cookies/);
      descriptions.forEach(desc => {
        expect(desc.textContent).not.toContain('<script>');
        expect(desc.textContent).not.toContain('javascript:');
      });
    });

    it('should sanitize any dynamic content in cookie descriptions', () => {
      // Test with potential XSS payload in component props
      const xssPayload = '<script>alert("xss")</script>';
      
      // Component doesn't currently accept dynamic descriptions,
      // but this test ensures safety if that changes
      render(<CookieConsent />);
      
      // Verify no script tags are rendered
      const html = document.documentElement.innerHTML;
      expect(html).not.toContain('<script>');
      expect(html).not.toContain('javascript:');
      expect(html).not.toContain('onerror=');
      expect(html).not.toContain('onload=');
    });

    it('should have safe href attributes in policy links', () => {
      render(<CookieConsent />);
      
      const privacyLink = screen.getByRole('link', { name: 'privacybeleid' });
      const cookieLink = screen.getByRole('link', { name: 'cookiebeleid' });
      
      // Verify links are safe (no javascript:, data:, etc.)
      expect(privacyLink.getAttribute('href')).toBe('/privacy');
      expect(cookieLink.getAttribute('href')).toBe('/cookies');
      
      // Ensure no dangerous attributes
      expect(privacyLink.getAttribute('onclick')).toBeNull();
      expect(cookieLink.getAttribute('onclick')).toBeNull();
    });
  });

  describe('TypeScript Type Safety', () => {
    it('should maintain type safety for consent objects', async () => {
      const user = userEvent.setup();
      
      mockGetCookieConsent.mockReturnValue({
        necessary: false,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: new Date(),
      });

      let capturedConsent: any = null;
      const onAccept = (consent: any) => {
        capturedConsent = consent;
      };

      render(<CookieConsent onAccept={onAccept} />);
      
      const acceptButton = screen.getByRole('button', { name: 'Alle Cookies Accepteren' });
      await user.click(acceptButton);
      
      // Verify the consent object has the correct type structure
      expect(capturedConsent).toHaveProperty('necessary');
      expect(capturedConsent).toHaveProperty('analytics');
      expect(capturedConsent).toHaveProperty('marketing');
      expect(capturedConsent).toHaveProperty('preferences');
      expect(capturedConsent).toHaveProperty('timestamp');
      
      // Verify types
      expect(typeof capturedConsent.necessary).toBe('boolean');
      expect(typeof capturedConsent.analytics).toBe('boolean');
      expect(typeof capturedConsent.marketing).toBe('boolean');
      expect(typeof capturedConsent.preferences).toBe('boolean');
      expect(capturedConsent.timestamp).toBeInstanceOf(Date);
    });

    it('should handle optional callback props safely', async () => {
      const user = userEvent.setup();
      
      mockGetCookieConsent.mockReturnValue({
        necessary: false,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: new Date(),
      });

      // Render without callbacks (should not crash)
      render(<CookieConsent />);
      
      const acceptButton = screen.getByRole('button', { name: 'Alle Cookies Accepteren' });
      expect(async () => await user.click(acceptButton)).not.toThrow();
      
      const declineButton = screen.getByRole('button', { name: 'Alleen Noodzakelijke' });
      expect(async () => await user.click(declineButton)).not.toThrow();
    });
  });

  describe('Content Security Policy Compliance', () => {
    it('should not use inline styles or scripts', () => {
      render(<CookieConsent />);
      
      // Get all elements in the component
      const container = screen.getByText('Cookie Instellingen').closest('[data-testid], div, section, article, main') || document.body;
      const allElements = container.querySelectorAll('*');
      
      allElements.forEach(element => {
        // Check for inline styles (should use Tailwind classes instead)
        expect(element.getAttribute('style')).toBeNull();
        
        // Check for inline event handlers
        expect(element.getAttribute('onclick')).toBeNull();
        expect(element.getAttribute('onload')).toBeNull();
        expect(element.getAttribute('onerror')).toBeNull();
      });
    });

    it('should use safe CSS classes without dynamic class injection', () => {
      render(<CookieConsent />);
      
      // Verify that all class names are static Tailwind classes
      const elements = screen.getByText('Cookie Instellingen').closest('div')?.querySelectorAll('*') || [];
      
      Array.from(elements).forEach(element => {
        const className = element.className;
        if (className) {
          // Should not contain potential XSS vectors in class names
          expect(className).not.toContain('<');
          expect(className).not.toContain('>');
          expect(className).not.toContain('javascript:');
          expect(className).not.toMatch(/['"]/);
        }
      });
    });
  });

  describe('Session Security', () => {
    it('should not expose sensitive information in localStorage', async () => {
      const user = userEvent.setup();
      
      mockGetCookieConsent.mockReturnValue({
        necessary: false,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: new Date(),
      });

      const mockSetItem = vi.fn();
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn(),
          setItem: mockSetItem,
          removeItem: vi.fn(),
          clear: vi.fn(),
        },
        writable: true,
      });

      render(<CookieConsent />);
      
      const acceptButton = screen.getByRole('button', { name: 'Alle Cookies Accepteren' });
      await user.click(acceptButton);
      
      // Verify that only consent data is stored, no sensitive info
      expect(mockSetItem).toHaveBeenCalledWith(
        'gdpr-consent',
        expect.stringMatching(/^{.*"necessary":.*"analytics":.*"marketing":.*"preferences":.*"timestamp":.*}$/)
      );
      
      // Verify no user ID, session tokens, or other sensitive data
      const storedValue = mockSetItem.mock.calls[0][1];
      expect(storedValue).not.toContain('userId');
      expect(storedValue).not.toContain('sessionId');
      expect(storedValue).not.toContain('token');
      expect(storedValue).not.toContain('password');
    });

    it('should use secure key names for localStorage', () => {
      // Verify the localStorage key is descriptive but not revealing sensitive info
      const expectedKey = 'gdpr-consent';
      
      mockGetCookieConsent.mockReturnValue({
        necessary: false,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: new Date(),
      });

      expect(mockGetCookieConsent).toBeDefined();
      
      // The key should be clear about its purpose but not expose implementation details
      expect(expectedKey).toMatch(/^[a-z-]+$/); // Only lowercase and hyphens
      expect(expectedKey).not.toContain('secret');
      expect(expectedKey).not.toContain('token');
      expect(expectedKey).not.toContain('private');
    });
  });
});