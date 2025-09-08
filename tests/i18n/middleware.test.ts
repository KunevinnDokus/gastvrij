import { describe, it, expect, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Mock next-intl middleware
vi.mock('next-intl/middleware', () => ({
  default: vi.fn((config) => {
    return (request: NextRequest) => {
      const url = request.nextUrl.clone();
      const pathname = url.pathname;
      
      // Simulate next-intl middleware behavior
      if (pathname === '/') {
        url.pathname = '/nl';
        return NextResponse.redirect(url);
      }
      
      return NextResponse.next();
    };
  })
}));

import { middleware } from '@/middleware';

describe('i18n Middleware', () => {
  it('should redirect root to default locale (Dutch)', () => {
    const request = new NextRequest('https://gastvrij.eu/');
    const response = middleware(request);
    
    expect(response?.status).toBe(307); // Next.js redirect status
    expect(response?.headers.get('location')).toBe('https://gastvrij.eu/nl');
  });

  it('should handle direct locale paths correctly', () => {
    const request = new NextRequest('https://gastvrij.eu/fr/properties');
    const response = middleware(request);
    
    // Should not redirect, just continue
    expect(response?.status).not.toBe(307);
  });

  it('should detect browser locale and redirect accordingly', () => {
    const request = new NextRequest('https://gastvrij.eu/', {
      headers: {
        'accept-language': 'fr-FR,fr;q=0.9,en;q=0.8'
      }
    });
    
    const response = middleware(request);
    
    // Should redirect to French version
    expect(response?.headers.get('location')).toBe('https://gastvrij.eu/fr');
  });

  it('should handle unsupported locales gracefully', () => {
    const request = new NextRequest('https://gastvrij.eu/es'); // Spanish not supported
    const response = middleware(request);
    
    // Should redirect to default locale
    expect(response?.headers.get('location')).toBe('https://gastvrij.eu/nl');
  });

  it('should preserve query parameters during locale redirect', () => {
    const request = new NextRequest('https://gastvrij.eu/?search=hotels&location=brussels');
    const response = middleware(request);
    
    expect(response?.headers.get('location')).toBe(
      'https://gastvrij.eu/nl?search=hotels&location=brussels'
    );
  });
});