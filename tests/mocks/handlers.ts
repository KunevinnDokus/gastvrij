import { http, HttpResponse } from 'msw';

export const handlers = [
  // Properties API
  http.get('/api/properties', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: '1',
          name: 'Cozy Apartment in Brussels',
          description: 'Beautiful apartment in the heart of Brussels',
          address: 'Rue de la Paix 123',
          city: 'Brussels',
          postalCode: '1000',
          country: 'Belgium',
          propertyType: 'APARTMENT',
          maxGuests: 4,
          bedrooms: 2,
          bathrooms: 1,
          basePrice: 120,
          currency: 'EUR',
          isActive: true,
          isVerified: true,
        },
      ],
    });
  }),

  // Bookings API
  http.post('/api/bookings', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      data: {
        id: 'booking-123',
        ...body,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        createdAt: new Date().toISOString(),
      },
    });
  }),

  // Auth API
  http.post('/api/auth/signin', () => {
    return HttpResponse.json({
      success: true,
      data: {
        user: {
          id: 'user-123',
          email: 'test@gastvrij.eu',
          name: 'Test User',
        },
        token: 'mock-jwt-token',
      },
    });
  }),

  // GDPR Compliance API
  http.get('/api/gdpr/consent', ({ request }) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    // Return different consent states based on test scenarios
    if (userId === 'user-no-consent') {
      return HttpResponse.json({
        success: true,
        data: {
          necessary: false,
          analytics: false,
          marketing: false,
          preferences: false,
          timestamp: null,
        },
      });
    }
    
    if (userId === 'user-full-consent') {
      return HttpResponse.json({
        success: true,
        data: {
          necessary: true,
          analytics: true,
          marketing: true,
          preferences: true,
          timestamp: new Date().toISOString(),
          version: '1.0',
        },
      });
    }
    
    // Default minimal consent
    return HttpResponse.json({
      success: true,
      data: {
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    });
  }),

  http.post('/api/gdpr/consent', async ({ request }) => {
    const body = await request.json() as any;
    
    // Validate consent structure
    if (!body || typeof body.necessary !== 'boolean') {
      return HttpResponse.json(
        {
          success: false,
          error: 'Invalid consent data: necessary field is required and must be boolean',
          code: 'INVALID_CONSENT_DATA',
        },
        { status: 400 }
      );
    }
    
    // Simulate validation of consent fields
    const requiredFields = ['necessary', 'analytics', 'marketing', 'preferences'];
    const missingFields = requiredFields.filter(field => typeof body[field] !== 'boolean');
    
    if (missingFields.length > 0) {
      return HttpResponse.json(
        {
          success: false,
          error: `Missing or invalid consent fields: ${missingFields.join(', ')}`,
          code: 'MISSING_CONSENT_FIELDS',
        },
        { status: 400 }
      );
    }
    
    // Add server-side timestamp if not provided
    const consentWithTimestamp = {
      ...body,
      timestamp: body.timestamp || new Date().toISOString(),
      version: '1.0',
      savedAt: new Date().toISOString(),
    };
    
    return HttpResponse.json({
      success: true,
      data: consentWithTimestamp,
      message: 'Consent saved successfully',
    });
  }),

  http.put('/api/gdpr/consent', async ({ request }) => {
    const body = await request.json() as any;
    
    // Handle consent updates (same validation as POST)
    const requiredFields = ['necessary', 'analytics', 'marketing', 'preferences'];
    const missingFields = requiredFields.filter(field => typeof body[field] !== 'boolean');
    
    if (missingFields.length > 0) {
      return HttpResponse.json(
        {
          success: false,
          error: `Missing or invalid consent fields: ${missingFields.join(', ')}`,
          code: 'MISSING_CONSENT_FIELDS',
        },
        { status: 400 }
      );
    }
    
    const updatedConsent = {
      ...body,
      timestamp: new Date().toISOString(),
      version: '1.0',
      updatedAt: new Date().toISOString(),
    };
    
    return HttpResponse.json({
      success: true,
      data: updatedConsent,
      message: 'Consent updated successfully',
    });
  }),

  http.delete('/api/gdpr/consent', ({ request }) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return HttpResponse.json(
        {
          success: false,
          error: 'User ID is required for consent withdrawal',
          code: 'MISSING_USER_ID',
        },
        { status: 400 }
      );
    }
    
    // Return minimal consent after withdrawal
    return HttpResponse.json({
      success: true,
      data: {
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: new Date().toISOString(),
        version: '1.0',
        withdrawnAt: new Date().toISOString(),
      },
      message: 'Consent withdrawn successfully. Only necessary cookies remain active.',
    });
  }),

  // GDPR Data Export API
  http.get('/api/gdpr/export', ({ request }) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return HttpResponse.json(
        {
          success: false,
          error: 'User ID is required for data export',
          code: 'MISSING_USER_ID',
        },
        { status: 400 }
      );
    }
    
    return HttpResponse.json({
      success: true,
      data: {
        user: {
          id: userId,
          email: 'test@gastvrij.eu',
          name: 'Test User',
          createdAt: '2024-01-01T00:00:00.000Z',
          gdprConsent: true,
          gdprConsentDate: new Date().toISOString(),
        },
        consent: {
          necessary: true,
          analytics: false,
          marketing: false,
          preferences: false,
          timestamp: new Date().toISOString(),
          version: '1.0',
        },
        exportedAt: new Date().toISOString(),
        format: 'JSON',
      },
      message: 'Data export completed successfully',
    });
  }),

  // GDPR Data Deletion API
  http.delete('/api/gdpr/delete-account', ({ request }) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return HttpResponse.json(
        {
          success: false,
          error: 'User ID is required for account deletion',
          code: 'MISSING_USER_ID',
        },
        { status: 400 }
      );
    }
    
    // Simulate checking for active bookings
    if (userId === 'user-with-active-bookings') {
      return HttpResponse.json(
        {
          success: false,
          error: 'Cannot delete account with active bookings',
          code: 'ACTIVE_BOOKINGS_EXIST',
        },
        { status: 409 }
      );
    }
    
    return HttpResponse.json({
      success: true,
      data: {
        deletedUserId: userId,
        deletedAt: new Date().toISOString(),
        anonymized: true,
      },
      message: 'Account deleted and data anonymized successfully',
    });
  }),

  // Consent History API
  http.get('/api/gdpr/consent/history', ({ request }) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return HttpResponse.json(
        {
          success: false,
          error: 'User ID is required for consent history',
          code: 'MISSING_USER_ID',
        },
        { status: 400 }
      );
    }
    
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 'consent-1',
          userId,
          necessary: true,
          analytics: false,
          marketing: false,
          preferences: false,
          timestamp: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          version: '1.0',
          action: 'declined',
        },
        {
          id: 'consent-2',
          userId,
          necessary: true,
          analytics: true,
          marketing: false,
          preferences: true,
          timestamp: new Date().toISOString(),
          version: '1.0',
          action: 'partial_accept',
        },
      ],
    });
  }),

  // API Error Simulation Endpoints (for testing error handling)
  http.post('/api/gdpr/consent/error/500', () => {
    return HttpResponse.json(
      {
        success: false,
        error: 'Internal server error during consent save',
        code: 'INTERNAL_SERVER_ERROR',
      },
      { status: 500 }
    );
  }),

  http.post('/api/gdpr/consent/error/timeout', () => {
    // Simulate timeout by delaying response
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(
          HttpResponse.json(
            {
              success: false,
              error: 'Request timeout',
              code: 'REQUEST_TIMEOUT',
            },
            { status: 408 }
          )
        );
      }, 5000); // 5 second delay
    });
  }),

  http.post('/api/gdpr/consent/error/rate-limit', () => {
    return HttpResponse.json(
      {
        success: false,
        error: 'Too many consent updates. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: 300, // 5 minutes
      },
      { 
        status: 429,
        headers: {
          'Retry-After': '300'
        }
      }
    );
  }),
];
