import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CookieConsent } from '@/components/CookieConsent';
import * as gdpr from '@/lib/gdpr';

// Mock GDPR functions
vi.mock('@/lib/gdpr', () => ({
  getCookieConsent: vi.fn(),
  saveCookieConsent: vi.fn(),
  validateConsentData: vi.fn(),
  isConsentExpired: vi.fn(),
  saveUserConsent: vi.fn(),
  withdrawConsent: vi.fn(),
  needsConsentRenewal: vi.fn(),
  CONSENT_VERSION: '2.0',
  CONSENT_EXPIRY_MONTHS: 24,
  DEFAULT_RETENTION_POLICY: {
    userData: 2555,
    bookingData: 2555,
    analyticsData: 365,
    marketingData: 365,
  },
}));

const mockGetCookieConsent = vi.mocked(gdpr.getCookieConsent);
const mockSaveCookieConsent = vi.mocked(gdpr.saveCookieConsent);
const mockValidateConsentData = vi.mocked(gdpr.validateConsentData);
const mockIsConsentExpired = vi.mocked(gdpr.isConsentExpired);
const mockSaveUserConsent = vi.mocked(gdpr.saveUserConsent);
const mockWithdrawConsent = vi.mocked(gdpr.withdrawConsent);
const mockNeedsConsentRenewal = vi.mocked(gdpr.needsConsentRenewal);

describe('CookieConsent Component', () => {
  const mockOnAccept = vi.fn();
  const mockOnDecline = vi.fn();

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
    
    // Setup default mock implementations
    mockValidateConsentData.mockReturnValue({ isValid: true, errors: [] });
    mockIsConsentExpired.mockReturnValue(false);
    mockSaveCookieConsent.mockReturnValue(true);
    mockSaveUserConsent.mockResolvedValue(undefined);
    mockWithdrawConsent.mockResolvedValue(undefined);
    mockNeedsConsentRenewal.mockResolvedValue(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should not render when existing consent is found', () => {
      mockGetCookieConsent.mockReturnValue({
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: new Date(),
      });

      render(<CookieConsent />);
      
      expect(screen.queryByText('Cookie Instellingen')).not.toBeInTheDocument();
    });

    it('should render when no existing consent is found', async () => {
      mockGetCookieConsent.mockReturnValue({
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: null, // No timestamp means no consent yet
      });

      render(<CookieConsent />);
      
      await waitFor(() => {
        expect(screen.getByText('Cookie Instellingen')).toBeInTheDocument();
      });
      expect(screen.getByText(/We respecteren uw privacy/)).toBeInTheDocument();
    });

    it('should render with correct structure and elements', () => {
      mockGetCookieConsent.mockReturnValue({
        necessary: false,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: new Date(),
      });

      render(<CookieConsent />);
      
      // Check for cookie categories
      expect(screen.getByText('Noodzakelijke Cookies')).toBeInTheDocument();
      expect(screen.getByText('Analytische Cookies')).toBeInTheDocument();
      expect(screen.getByText('Marketing Cookies')).toBeInTheDocument();
      expect(screen.getByText('Voorkeur Cookies')).toBeInTheDocument();
      
      // Check for action buttons
      expect(screen.getByRole('button', { name: 'Alle Cookies Accepteren' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Alleen Noodzakelijke' })).toBeInTheDocument();
      
      // Check for policy links
      expect(screen.getByRole('link', { name: 'privacybeleid' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'cookiebeleid' })).toBeInTheDocument();
    });
  });

  describe('Checkbox Interactions', () => {
    beforeEach(() => {
      mockGetCookieConsent.mockReturnValue({
        necessary: false,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: new Date(),
      });
    });

    it('should have necessary cookies checkbox disabled and checked', () => {
      render(<CookieConsent />);
      
      const necessaryCheckbox = screen.getAllByRole('checkbox')[0];
      expect(necessaryCheckbox).toBeChecked();
      expect(necessaryCheckbox).toBeDisabled();
    });

    it('should allow toggling analytics cookies', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);
      
      const analyticsCheckbox = screen.getAllByRole('checkbox')[1];
      expect(analyticsCheckbox).not.toBeChecked();
      expect(analyticsCheckbox).toBeEnabled();
      
      await user.click(analyticsCheckbox);
      expect(analyticsCheckbox).toBeChecked();
      
      await user.click(analyticsCheckbox);
      expect(analyticsCheckbox).not.toBeChecked();
    });

    it('should allow toggling marketing cookies', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);
      
      const marketingCheckbox = screen.getAllByRole('checkbox')[2];
      expect(marketingCheckbox).not.toBeChecked();
      expect(marketingCheckbox).toBeEnabled();
      
      await user.click(marketingCheckbox);
      expect(marketingCheckbox).toBeChecked();
    });

    it('should allow toggling preferences cookies', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);
      
      const preferencesCheckbox = screen.getAllByRole('checkbox')[3];
      expect(preferencesCheckbox).not.toBeChecked();
      expect(preferencesCheckbox).toBeEnabled();
      
      await user.click(preferencesCheckbox);
      expect(preferencesCheckbox).toBeChecked();
    });
  });

  describe('Accept Functionality', () => {
    beforeEach(() => {
      mockGetCookieConsent.mockReturnValue({
        necessary: false,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: new Date(),
      });
    });

    it('should save consent with current selections when accept is clicked', async () => {
      const user = userEvent.setup();
      render(<CookieConsent onAccept={mockOnAccept} />);
      
      // Toggle some options
      const analyticsCheckbox = screen.getAllByRole('checkbox')[1];
      await user.click(analyticsCheckbox);
      
      const acceptButton = screen.getByRole('button', { name: 'Alle Cookies Accepteren' });
      await user.click(acceptButton);
      
      expect(mockSaveCookieConsent).toHaveBeenCalledWith({
        necessary: true,
        analytics: true,
        marketing: false,
        preferences: false,
        timestamp: expect.any(Date),
      });
    });

    it('should hide banner and call onAccept callback', async () => {
      const user = userEvent.setup();
      render(<CookieConsent onAccept={mockOnAccept} />);
      
      const acceptButton = screen.getByRole('button', { name: 'Alle Cookies Accepteren' });
      await user.click(acceptButton);
      
      // Banner should be hidden
      expect(screen.queryByText('Cookie Instellingen')).not.toBeInTheDocument();
      
      // Callback should be called
      expect(mockOnAccept).toHaveBeenCalledWith({
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: expect.any(Date),
      });
    });

    it('should work without onAccept callback', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);
      
      const acceptButton = screen.getByRole('button', { name: 'Alle Cookies Accepteren' });
      
      // Should not throw error
      expect(async () => await user.click(acceptButton)).not.toThrow();
      expect(mockSaveCookieConsent).toHaveBeenCalled();
    });
  });

  describe('Decline Functionality', () => {
    beforeEach(() => {
      mockGetCookieConsent.mockReturnValue({
        necessary: false,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: new Date(),
      });
    });

    it('should save minimal consent when decline is clicked', async () => {
      const user = userEvent.setup();
      render(<CookieConsent onDecline={mockOnDecline} />);
      
      // Toggle some options first
      const analyticsCheckbox = screen.getAllByRole('checkbox')[1];
      await user.click(analyticsCheckbox);
      
      const declineButton = screen.getByRole('button', { name: 'Alleen Noodzakelijke' });
      await user.click(declineButton);
      
      expect(mockSaveCookieConsent).toHaveBeenCalledWith({
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: expect.any(Date),
      });
    });

    it('should hide banner and call onDecline callback', async () => {
      const user = userEvent.setup();
      render(<CookieConsent onDecline={mockOnDecline} />);
      
      const declineButton = screen.getByRole('button', { name: 'Alleen Noodzakelijke' });
      await user.click(declineButton);
      
      // Banner should be hidden
      expect(screen.queryByText('Cookie Instellingen')).not.toBeInTheDocument();
      
      // Callback should be called
      expect(mockOnDecline).toHaveBeenCalled();
    });

    it('should work without onDecline callback', async () => {
      const user = userEvent.setup();
      render(<CookieConsent />);
      
      const declineButton = screen.getByRole('button', { name: 'Alleen Noodzakelijke' });
      
      // Should not throw error
      expect(async () => await user.click(declineButton)).not.toThrow();
      expect(mockSaveCookieConsent).toHaveBeenCalled();
    });
  });

  describe('Privacy Policy Links', () => {
    beforeEach(() => {
      mockGetCookieConsent.mockReturnValue({
        necessary: false,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: new Date(),
      });
    });

    it('should have correct privacy policy link', () => {
      render(<CookieConsent />);
      
      const privacyLink = screen.getByRole('link', { name: 'privacybeleid' });
      expect(privacyLink).toHaveAttribute('href', '/privacy');
    });

    it('should have correct cookie policy link', () => {
      render(<CookieConsent />);
      
      const cookieLink = screen.getByRole('link', { name: 'cookiebeleid' });
      expect(cookieLink).toHaveAttribute('href', '/cookies');
    });
  });

  describe('Component State Management', () => {
    it('should maintain checkbox state during interactions', async () => {
      mockGetCookieConsent.mockReturnValue({
        necessary: false,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: new Date(),
      });

      const user = userEvent.setup();
      render(<CookieConsent />);
      
      const checkboxes = screen.getAllByRole('checkbox');
      const [, analyticsCheckbox, marketingCheckbox, preferencesCheckbox] = checkboxes;
      
      // Toggle multiple checkboxes
      await user.click(analyticsCheckbox);
      await user.click(marketingCheckbox);
      
      expect(analyticsCheckbox).toBeChecked();
      expect(marketingCheckbox).toBeChecked();
      expect(preferencesCheckbox).not.toBeChecked();
    });

    it('should not allow toggling necessary cookies', async () => {
      mockGetCookieConsent.mockReturnValue({
        necessary: false,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: new Date(),
      });

      const user = userEvent.setup();
      render(<CookieConsent />);
      
      const necessaryCheckbox = screen.getAllByRole('checkbox')[0];
      
      // Try to click necessary checkbox (should be disabled)
      await user.click(necessaryCheckbox);
      
      // Should remain checked and disabled
      expect(necessaryCheckbox).toBeChecked();
      expect(necessaryCheckbox).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should handle getCookieConsent errors gracefully', () => {
      mockGetCookieConsent.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      // Should not crash
      expect(() => render(<CookieConsent />)).not.toThrow();
    });

    it('should handle saveCookieConsent errors gracefully', async () => {
      mockGetCookieConsent.mockReturnValue({
        necessary: false,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: new Date(),
      });
      
      mockSaveCookieConsent.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const user = userEvent.setup();
      render(<CookieConsent />);
      
      const acceptButton = screen.getByRole('button', { name: 'Alle Cookies Accepteren' });
      
      // Should not crash
      expect(async () => await user.click(acceptButton)).not.toThrow();
    });
  });

  describe('Hospitality Brand Integration', () => {
    it('should use hospitality-focused messaging', async () => {
      render(<CookieConsent autoShow={true} showDelay={100} variant="hospitality" />);
      
      await waitFor(() => {
        expect(screen.getByText('We maken uw ervaring beter')).toBeInTheDocument();
        expect(screen.getByText(/functies ingeschakeld voor uw gemak/)).toBeInTheDocument();
      });
    });

    it('should show value-focused benefits in expanded view', async () => {
      const user = userEvent.setup();
      render(<CookieConsent autoShow={true} showDelay={100} variant="hospitality" />);
      
      await waitFor(() => {
        expect(screen.getByText('We maken uw ervaring beter')).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('button', { name: /aanpassen/i }));
      
      await waitFor(() => {
        // Check for hospitality-specific benefits
        expect(screen.getByText('Veilige reserveringen en account toegang')).toBeInTheDocument();
        expect(screen.getByText('Betere aanbevelingen voor uw volgende verblijf')).toBeInTheDocument();
        expect(screen.getByText('Gepersonaliseerde deals voor uw droombestemming')).toBeInTheDocument();
        expect(screen.getByText('Uw favorieten en instellingen altijd bij de hand')).toBeInTheDocument();
      });
    });

    it('should display Gastvrij.eu branding appropriately', async () => {
      const user = userEvent.setup();
      render(<CookieConsent autoShow={true} showDelay={100} />);
      
      await waitFor(() => {
        expect(screen.getByText('We maken uw ervaring beter')).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('button', { name: /aanpassen/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/Gastvrij\.eu/)).toBeInTheDocument();
        expect(screen.getByText(/Uw privacy, onze prioriteit/)).toBeInTheDocument();
        expect(screen.getByText(/GDPR-compatibel/)).toBeInTheDocument();
      });
    });
  });

  describe('Performance and UX Metrics', () => {
    it('should track UX metrics for optimization', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      render(<CookieConsent autoShow={true} showDelay={100} />);
      
      await waitFor(() => {
        expect(screen.getByText('We maken uw ervaring beter')).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('button', { name: /accepteren/i }));
      
      // Should log UX feedback
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('cookies geaccepteerd'));
      
      consoleSpy.mockRestore();
    });

    it('should handle different A/B test variants', async () => {
      render(<CookieConsent autoShow={true} showDelay={100} variant="minimal" />);
      
      await waitFor(() => {
        // Should render regardless of variant
        expect(screen.getByText('We maken uw ervaring beter')).toBeInTheDocument();
      });
    });

    it('should support custom show delays for UX optimization', async () => {
      const startTime = Date.now();
      
      render(<CookieConsent autoShow={true} showDelay={500} />);
      
      // Should not be visible immediately
      expect(screen.queryByText('We maken uw ervaring beter')).not.toBeInTheDocument();
      
      // Should be visible after delay
      await waitFor(() => {
        expect(screen.getByText('We maken uw ervaring beter')).toBeInTheDocument();
      }, { timeout: 1000 });
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(400); // Allow some variance
    });
  });
});