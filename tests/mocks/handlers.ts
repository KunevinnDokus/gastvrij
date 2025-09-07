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
  http.get('/api/gdpr/consent', () => {
    return HttpResponse.json({
      success: true,
      data: {
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: new Date().toISOString(),
      },
    });
  }),

  http.post('/api/gdpr/consent', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      data: body,
    });
  }),
];
