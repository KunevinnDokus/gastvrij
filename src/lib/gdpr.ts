import { prisma } from '@/lib/prisma';
import { calculateDataRetentionDate, isDataRetentionExpired } from '@/lib/utils';

// GDPR Compliance Types
export interface GDPRConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  timestamp: Date;
}

export interface DataRetentionPolicy {
  userData: number; // days
  bookingData: number; // days
  analyticsData: number; // days
  marketingData: number; // days
}

// Default retention policy (7 years for hospitality records)
export const DEFAULT_RETENTION_POLICY: DataRetentionPolicy = {
  userData: 2555, // 7 years
  bookingData: 2555, // 7 years
  analyticsData: 365, // 1 year
  marketingData: 365, // 1 year
};

// GDPR Consent Management
export async function saveUserConsent(
  userId: string,
  consent: GDPRConsent
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      gdprConsent: consent.necessary,
      gdprConsentDate: consent.timestamp,
      dataRetention: calculateDataRetentionDate(DEFAULT_RETENTION_POLICY.userData),
    },
  });
}

export async function getUserConsent(userId: string): Promise<GDPRConsent | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      gdprConsent: true,
      gdprConsentDate: true,
    },
  });

  if (!user) return null;

  return {
    necessary: user.gdprConsent,
    analytics: false, // Default to false for privacy
    marketing: false, // Default to false for privacy
    preferences: false, // Default to false for privacy
    timestamp: user.gdprConsentDate || new Date(),
  };
}

// Data Retention Management
export async function checkDataRetention(): Promise<void> {
  const expiredUsers = await prisma.user.findMany({
    where: {
      dataRetention: {
        lt: new Date(),
      },
      isActive: true,
    },
  });

  for (const user of expiredUsers) {
    await anonymizeUserData(user.id);
  }
}

export async function anonymizeUserData(userId: string): Promise<void> {
  // Anonymize user data instead of deleting (for legal compliance)
  await prisma.user.update({
    where: { id: userId },
    data: {
      email: `anonymized-${userId}@deleted.local`,
      name: 'Anonymized User',
      image: null,
      isActive: false,
    },
  });

  // Anonymize related data
  await prisma.booking.updateMany({
    where: { userId },
    data: {
      guestName: 'Anonymized Guest',
      guestEmail: `anonymized-${userId}@deleted.local`,
      guestPhone: null,
    },
  });

  await prisma.review.updateMany({
    where: { userId },
    data: {
      comment: 'Review anonymized',
    },
  });
}

// Data Export (Right to Data Portability)
export async function exportUserData(userId: string): Promise<any> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      properties: {
        include: {
          images: true,
          bookings: true,
          reviews: true,
        },
      },
      bookings: {
        include: {
          property: {
            select: {
              name: true,
              address: true,
            },
          },
          payments: true,
        },
      },
      reviews: {
        include: {
          property: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      gdprConsent: user.gdprConsent,
      gdprConsentDate: user.gdprConsentDate,
    },
    properties: user.properties,
    bookings: user.bookings,
    reviews: user.reviews,
    exportedAt: new Date().toISOString(),
  };
}

// Data Deletion (Right to be Forgotten)
export async function deleteUserData(userId: string): Promise<void> {
  // Check if user has active bookings
  const activeBookings = await prisma.booking.findFirst({
    where: {
      userId,
      status: {
        in: ['PENDING', 'CONFIRMED'],
      },
    },
  });

  if (activeBookings) {
    throw new Error('Cannot delete user with active bookings');
  }

  // Delete user data
  await prisma.user.delete({
    where: { id: userId },
  });
}

// Cookie Consent Management
export function getCookieConsent(): GDPRConsent {
  if (typeof window === 'undefined') {
    return {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
      timestamp: new Date(),
    };
  }

  const stored = localStorage.getItem('gdpr-consent');
  if (stored) {
    return JSON.parse(stored);
  }

  return {
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false,
    timestamp: new Date(),
  };
}

export function saveCookieConsent(consent: GDPRConsent): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('gdpr-consent', JSON.stringify(consent));
  
  // Update analytics based on consent
  if (consent.analytics) {
    // Enable analytics
    console.log('Analytics enabled');
  } else {
    // Disable analytics
    console.log('Analytics disabled');
  }
}

// Privacy Policy Compliance
export function generatePrivacyPolicy(): string {
  return `
# Privacy Policy - Gastvrij.eu

## Data Controller
Gastvrij.eu
Email: privacy@gastvrij.eu

## Data We Collect
- Personal information (name, email, phone)
- Booking information
- Payment information (processed securely)
- Usage analytics (with consent)

## How We Use Your Data
- To provide hospitality services
- To process bookings and payments
- To communicate with you
- To improve our services (with consent)

## Data Retention
- User data: 7 years (legal requirement)
- Booking data: 7 years (legal requirement)
- Analytics data: 1 year (with consent)

## Your Rights
- Right to access your data
- Right to correct your data
- Right to delete your data
- Right to data portability
- Right to object to processing

## Contact
For privacy concerns: privacy@gastvrij.eu
  `.trim();
}
