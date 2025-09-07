/**
 * Tests for CookieConsent component
 * Validates fixes for identified issues
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CookieConsent } from '@/components/CookieConsent'

describe('CookieConsent', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    // Mock crypto.randomUUID
    Object.defineProperty(global, 'crypto', {
      value: {
        randomUUID: vi.fn(() => 'test-uuid-123')
      },
      writable: true
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('ARIA Compliance', () => {
    it('should have proper aria-modal boolean value when collapsed', () => {
      render(<CookieConsent />)
      
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'false')
    })

    it('should have proper aria-modal boolean value when expanded', async () => {
      render(<CookieConsent />)
      
      const expandButton = screen.getByLabelText(/instellingen tonen/i)
      fireEvent.click(expandButton)
      
      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(dialog).toHaveAttribute('aria-modal', 'true')
      })
    })

    it('should have proper aria-labelledby and aria-describedby attributes', () => {
      render(<CookieConsent />)
      
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-labelledby', 'cookie-consent-title')
      expect(dialog).toHaveAttribute('aria-describedby', 'cookie-consent-description')
    })
  })

  describe('Touch Event Handling', () => {
    it('should handle touch events safely with proper null checks', () => {
      render(<CookieConsent />)
      
      const banner = screen.getByRole('dialog')
      
      // Test touchStart with valid touch
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 } as Touch]
      })
      
      expect(() => {
        fireEvent(banner, touchStartEvent)
      }).not.toThrow()
    })

    it('should handle touchEnd with missing touchStart safely', () => {
      render(<CookieConsent />)
      
      const banner = screen.getByRole('dialog')
      
      // Test touchEnd without touchStart
      const touchEndEvent = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 100, clientY: 150 } as Touch]
      })
      
      expect(() => {
        fireEvent(banner, touchEndEvent)
      }).not.toThrow()
    })

    it('should handle swipe down gesture for dismissal', () => {
      const onDismiss = vi.fn()
      render(<CookieConsent onDismiss={onDismiss} />)
      
      const banner = screen.getByRole('dialog')
      
      // Simulate swipe down gesture
      fireEvent.touchStart(banner, {
        touches: [{ clientX: 100, clientY: 100 }]
      })
      
      fireEvent.touchEnd(banner, {
        changedTouches: [{ clientX: 100, clientY: 160 }] // 60px down
      })
      
      expect(onDismiss).toHaveBeenCalled()
    })
  })

  describe('Component Rendering', () => {
    it('should render without errors when all imports are properly used', () => {
      expect(() => {
        render(<CookieConsent />)
      }).not.toThrow()
    })

    it('should not render when consent already exists and is valid', () => {
      // Mock existing valid consent
      const validConsent = {
        consent: { necessary: true, analytics: false, marketing: false, preferences: false },
        timestamp: new Date(),
        version: '1.0.0',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days future
      }
      
      localStorage.setItem('gastvrij-consent', JSON.stringify(validConsent))
      
      render(<CookieConsent />)
      
      // Should not show the banner
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw error
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('localStorage error')
      })
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      expect(() => {
        render(<CookieConsent />)
      }).not.toThrow()
      
      expect(consoleSpy).toHaveBeenCalledWith('Error reading consent:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should handle escape key properly in expanded state', async () => {
      render(<CookieConsent />)
      
      const expandButton = screen.getByLabelText(/instellingen tonen/i)
      fireEvent.click(expandButton)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/instellingen verbergen/i)).toBeInTheDocument()
      })
      
      // Press escape - should collapse first
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
      
      await waitFor(() => {
        expect(screen.getByLabelText(/instellingen tonen/i)).toBeInTheDocument()
      })
    })

    it('should handle arrow key navigation in expanded view', async () => {
      render(<CookieConsent />)
      
      const expandButton = screen.getByLabelText(/instellingen tonen/i)
      fireEvent.click(expandButton)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/instellingen verbergen/i)).toBeInTheDocument()
      })
      
      // Test arrow key navigation
      expect(() => {
        fireEvent.keyDown(screen.getByRole('dialog'), { key: 'ArrowRight' })
        fireEvent.keyDown(screen.getByRole('dialog'), { key: 'ArrowLeft' })
      }).not.toThrow()
    })
  })

  describe('Performance Monitoring', () => {
    it('should not throw when performance.memory is not available', () => {
      // Mock performance without memory
      const originalPerformance = global.performance
      global.performance = { ...originalPerformance } as any
      delete (global.performance as any).memory
      
      expect(() => {
        render(<CookieConsent />)
      }).not.toThrow()
      
      global.performance = originalPerformance
    })

    it('should log warning when memory usage is high', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      // Mock high memory usage
      global.performance = {
        ...global.performance,
        memory: {
          usedJSHeapSize: 5 * 1024 * 1024 * 1024 // 5MB (above 2MB target)
        }
      } as any
      
      render(<CookieConsent />)
      
      // Should log warning about high memory usage
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cookie consent memory usage above target'),
        expect.stringContaining('MB')
      )
      
      consoleSpy.mockRestore()
    })
  })
})