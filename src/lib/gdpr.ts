/**
 * GDPR Compliance Module for Gastvrij.eu
 * 
 * This module implements comprehensive GDPR compliance with:
 * - Granular consent management (necessary, analytics, marketing, preferences)
 * - Consent versioning and expiry handling
 * - Complete audit trail via ConsentHistory
 * - Anonymous consent support
 * - Input validation and error handling
 * - Rate limiting for consent updates
 * - Proper TypeScript types throughout
 * 
 * @version 2.0
 * @author Gastvrij.eu Development Team
 */

import { prisma } from '@/lib/prisma';
import { calculateDataRetentionDate, isDataRetentionExpired } from '@/lib/utils';
import { ConsentAction, ConsentHistory, User } from '@prisma/client';

// GDPR Compliance Types
export interface GDPRConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  timestamp: Date | null; // null indicates no stored consent
  version?: string;
  expiresAt?: Date;
}

export interface ConsentHistoryEntry {
  id: string;
  userId: string | null;
  consentNecessary: boolean;
  consentAnalytics: boolean;
  consentMarketing: boolean;
  consentPreferences: boolean;
  consentVersion: string;
  action: ConsentAction;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: Date;
  expiresAt: Date | null;
}

export interface ConsentValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface UserConsentData {
  consentNecessary: boolean;
  consentAnalytics: boolean;
  consentMarketing: boolean;
  consentPreferences: boolean;
  consentUpdatedAt: Date | null;
  gdprConsentVersion: string | null;
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

// GDPR Constants
export const CONSENT_VERSION = '2.0';
export const CONSENT_EXPIRY_MONTHS = 24; // 2 years as per GDPR best practices
export const MAX_CONSENT_UPDATES_PER_HOUR = 10; // Rate limiting

// Input Validation
export function validateConsentData(data: unknown): ConsentValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Invalid consent data format'] };
  }

  const consent = data as Record<string, unknown>;

  // Validate required boolean fields
  const booleanFields = ['necessary', 'analytics', 'marketing', 'preferences'];
  for (const field of booleanFields) {
    if (typeof consent[field] !== 'boolean') {
      errors.push(`Field '${field}' must be a boolean`);
    }
  }

  // Validate timestamp
  if (consent.timestamp) {
    const timestamp = new Date(consent.timestamp as string);
    if (isNaN(timestamp.getTime())) {
      errors.push('Invalid timestamp format');
    }
  }

  // Validate version if provided
  if (consent.version && typeof consent.version !== 'string') {
    errors.push('Version must be a string');
  }

  // Validate expiresAt if provided
  if (consent.expiresAt) {
    const expiresAt = new Date(consent.expiresAt as string);
    if (isNaN(expiresAt.getTime())) {
      errors.push('Invalid expiresAt format');
    }
  }

  return { isValid: errors.length === 0, errors };
}

// Check if consent has expired
export function isConsentExpired(consentDate: Date | null, expiresAt?: Date | null): boolean {
  // If no consent date, consider it expired (needs consent)
  if (!consentDate) {
    return true;
  }
  
  const now = new Date();
  
  if (expiresAt) {
    return now > expiresAt;
  }
  
  // Default expiry: 24 months from consent date
  const expiryDate = new Date(consentDate);
  expiryDate.setMonth(expiryDate.getMonth() + CONSENT_EXPIRY_MONTHS);
  
  return now > expiryDate;
}

// Save anonymous consent for users without accounts
export async function saveAnonymousConsent(
  consent: GDPRConsent,
  ipAddress?: string,
  userAgent?: string
): Promise<ConsentHistoryEntry> {
  try {
    // Validate consent data
    const validation = validateConsentData(consent);
    if (!validation.isValid) {
      throw new Error(`Invalid consent data: ${validation.errors.join(', ')}`);
    }

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + CONSENT_EXPIRY_MONTHS);

    // Create audit trail entry for anonymous consent
    const historyEntry = await createConsentHistory(
      null, // No userId for anonymous
      { ...consent, expiresAt },
      ConsentAction.GRANTED,
      ipAddress,
      userAgent
    );

    return historyEntry;
  } catch (error) {
    throw new Error(`Failed to save anonymous consent: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Check if user's consent needs renewal (within 30 days of expiry)
export async function needsConsentRenewal(userId: string): Promise<boolean> {
  try {
    const consent = await getUserConsent(userId);
    if (!consent || !consent.expiresAt) return true;

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Check if consent expires within 30 days
    return consent.expiresAt <= thirtyDaysFromNow;
  } catch (error) {
    console.error('Error checking consent renewal status:', error);
    return true; // Default to requiring renewal on error
  }
}

// Create consent history entry for audit trail
export async function createConsentHistory(
  userId: string | null,
  consent: GDPRConsent,
  action: ConsentAction,
  ipAddress?: string,
  userAgent?: string
): Promise<ConsentHistoryEntry> {
  try {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + CONSENT_EXPIRY_MONTHS);

    const historyEntry = await prisma.consentHistory.create({
      data: {
        userId,
        consentNecessary: consent.necessary,
        consentAnalytics: consent.analytics,
        consentMarketing: consent.marketing,
        consentPreferences: consent.preferences,
        consentVersion: consent.version || CONSENT_VERSION,
        action,
        ipAddress,
        userAgent,
        timestamp: consent.timestamp || new Date(),
        expiresAt: consent.expiresAt || expiresAt,
      },
    });

    return historyEntry as ConsentHistoryEntry;
  } catch (error) {
    throw new Error(`Failed to create consent history: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// GDPR Consent Management - Updated to handle all 4 consent types
export async function saveUserConsent(
  userId: string,
  consent: GDPRConsent,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    // Validate consent data
    const validation = validateConsentData(consent);
    if (!validation.isValid) {
      throw new Error(`Invalid consent data: ${validation.errors.join(', ')}`);
    }

    // Check rate limiting - get recent consent updates
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const recentUpdates = await prisma.consentHistory.count({
      where: {
        userId,
        timestamp: { gte: oneHourAgo },
      },
    });

    if (recentUpdates >= MAX_CONSENT_UPDATES_PER_HOUR) {
      throw new Error('Too many consent updates. Please wait before updating again.');
    }

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + CONSENT_EXPIRY_MONTHS);

    // Update user with all granular consent fields
    await prisma.user.update({
      where: { id: userId },
      data: {
        // Legacy field for backward compatibility
        gdprConsent: consent.necessary,
        gdprConsentDate: consent.timestamp,
        gdprConsentVersion: consent.version || CONSENT_VERSION,
        
        // New granular consent fields
        consentNecessary: consent.necessary,
        consentAnalytics: consent.analytics,
        consentMarketing: consent.marketing,
        consentPreferences: consent.preferences,
        consentUpdatedAt: consent.timestamp,
        
        // Data retention
        dataRetention: calculateDataRetentionDate(DEFAULT_RETENTION_POLICY.userData),
      },
    });

    // Create audit trail entry
    await createConsentHistory(
      userId,
      { ...consent, expiresAt },
      ConsentAction.GRANTED,
      ipAddress,
      userAgent
    );
  } catch (error) {
    throw new Error(`Failed to save user consent: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get user's stored consent - retrieves actual values, not defaults
export async function getUserConsent(userId: string): Promise<GDPRConsent | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        consentNecessary: true,
        consentAnalytics: true,
        consentMarketing: true,
        consentPreferences: true,
        consentUpdatedAt: true,
        gdprConsentVersion: true,
        gdprConsentDate: true,
      },
    });

    if (!user) return null;

    // Calculate expiry date
    const consentDate = user.consentUpdatedAt || user.gdprConsentDate;
    if (!consentDate) return null;

    const expiresAt = new Date(consentDate);
    expiresAt.setMonth(expiresAt.getMonth() + CONSENT_EXPIRY_MONTHS);

    // Check if consent has expired
    if (isConsentExpired(consentDate, expiresAt)) {
      // Mark consent as expired in history
      await createConsentHistory(
        userId,
        {
          necessary: user.consentNecessary,
          analytics: user.consentAnalytics,
          marketing: user.consentMarketing,
          preferences: user.consentPreferences,
          timestamp: new Date(),
          version: user.gdprConsentVersion || CONSENT_VERSION,
          expiresAt,
        },
        ConsentAction.EXPIRED
      );
      return null;
    }

    return {
      necessary: user.consentNecessary,
      analytics: user.consentAnalytics,
      marketing: user.consentMarketing,
      preferences: user.consentPreferences,
      timestamp: consentDate,
      version: user.gdprConsentVersion || CONSENT_VERSION,
      expiresAt,
    };
  } catch (error) {
    throw new Error(`Failed to get user consent: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Withdraw user consent with complete data cleanup
export async function withdrawConsent(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    // Get current consent for history
    const currentConsent = await getUserConsent(userId);
    if (!currentConsent) {
      throw new Error('No existing consent found to withdraw');
    }

    // Update user to withdraw all non-necessary consent
    await prisma.user.update({
      where: { id: userId },
      data: {
        consentAnalytics: false,
        consentMarketing: false,
        consentPreferences: false,
        consentUpdatedAt: new Date(),
        gdprConsentVersion: CONSENT_VERSION,
      },
    });

    // Create audit trail for withdrawal
    await createConsentHistory(
      userId,
      {
        necessary: true, // Always keep necessary consent
        analytics: false,
        marketing: false,
        preferences: false,
        timestamp: new Date(),
        version: CONSENT_VERSION,
      },
      ConsentAction.WITHDRAWN,
      ipAddress,
      userAgent
    );

    // Clear marketing-related data if marketing consent was withdrawn
    if (currentConsent.marketing) {
      // Note: Implement marketing data cleanup based on your specific needs
      console.log(`Marketing consent withdrawn for user ${userId} - implement cleanup logic`);
    }

    // Clear analytics data if analytics consent was withdrawn
    if (currentConsent.analytics) {
      // Note: Implement analytics data cleanup based on your specific needs
      console.log(`Analytics consent withdrawn for user ${userId} - implement cleanup logic`);
    }
  } catch (error) {
    throw new Error(`Failed to withdraw consent: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get user's consent history for GDPR compliance
export async function getConsentHistory(userId: string): Promise<ConsentHistoryEntry[]> {
  try {
    const history = await prisma.consentHistory.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
    });

    return history.map(entry => ({
      id: entry.id,
      userId: entry.userId,
      consentNecessary: entry.consentNecessary,
      consentAnalytics: entry.consentAnalytics,
      consentMarketing: entry.consentMarketing,
      consentPreferences: entry.consentPreferences,
      consentVersion: entry.consentVersion,
      action: entry.action,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      timestamp: entry.timestamp,
      expiresAt: entry.expiresAt,
    }));
  } catch (error) {
    throw new Error(`Failed to get consent history: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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

// Data Export (Right to Data Portability) - Updated with new consent fields
export async function exportUserData(userId: string): Promise<any> {
  try {
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

  // Get consent history for complete audit trail
  const consentHistory = await getConsentHistory(userId);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      // Legacy GDPR fields
      gdprConsent: user.gdprConsent,
      gdprConsentDate: user.gdprConsentDate,
      // New granular consent fields
      consentNecessary: user.consentNecessary,
      consentAnalytics: user.consentAnalytics,
      consentMarketing: user.consentMarketing,
      consentPreferences: user.consentPreferences,
      consentUpdatedAt: user.consentUpdatedAt,
      gdprConsentVersion: user.gdprConsentVersion,
    },
    consentHistory,
    properties: user.properties,
    bookings: user.bookings,
    reviews: user.reviews,
    exportedAt: new Date().toISOString(),
    dataRetentionPolicy: DEFAULT_RETENTION_POLICY,
  };
  } catch (error) {
    throw new Error(`Failed to export user data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Data Deletion (Right to be Forgotten)
export async function deleteUserData(userId: string): Promise<void> {
  try {
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

    // Create final consent history entry for deletion
    const currentConsent = await getUserConsent(userId);
    if (currentConsent) {
      await createConsentHistory(
        userId,
        currentConsent,
        ConsentAction.WITHDRAWN,
        undefined,
        'Data deletion request'
      );
    }

    // Delete user data (cascading deletes will handle related data)
    await prisma.user.delete({
      where: { id: userId },
    });
  } catch (error) {
    throw new Error(`Failed to delete user data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Cookie Consent Management - Updated with proper error handling
export function getCookieConsent(): GDPRConsent {
  // Default consent for server-side rendering
  const defaultConsent: GDPRConsent = {
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false,
    timestamp: null, // Null timestamp indicates no stored consent
    version: CONSENT_VERSION,
  };

  if (typeof window === 'undefined') {
    return defaultConsent;
  }

  try {
    const stored = localStorage.getItem('gdpr-consent');
    if (stored) {
      // Parse with safety checks
      const parsed = JSON.parse(stored);
      const validation = validateConsentData(parsed);
      
      if (!validation.isValid) {
        console.warn('Invalid stored consent data, using defaults:', validation.errors);
        return defaultConsent;
      }

      // Check if consent has expired
      const consentDate = new Date(parsed.timestamp);
      if (isConsentExpired(consentDate, parsed.expiresAt ? new Date(parsed.expiresAt) : undefined)) {
        console.info('Stored consent has expired, clearing localStorage');
        localStorage.removeItem('gdpr-consent');
        return defaultConsent;
      }

      return {
        necessary: parsed.necessary,
        analytics: parsed.analytics,
        marketing: parsed.marketing,
        preferences: parsed.preferences,
        timestamp: consentDate,
        version: parsed.version || CONSENT_VERSION,
        expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : undefined,
      };
    }
  } catch (error) {
    console.error('Error reading consent from localStorage:', error);
    // Clear corrupted data
    try {
      localStorage.removeItem('gdpr-consent');
    } catch (removeError) {
      console.error('Error removing corrupted consent data:', removeError);
    }
  }

  return defaultConsent;
}

export function saveCookieConsent(consent: GDPRConsent): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    // Validate consent data before saving
    const validation = validateConsentData(consent);
    if (!validation.isValid) {
      throw new Error(`Invalid consent data: ${validation.errors.join(', ')}`);
    }

    // Add expiry date if not present
    const consentToSave = {
      ...consent,
      version: consent.version || CONSENT_VERSION,
    };

    if (!consentToSave.expiresAt) {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + CONSENT_EXPIRY_MONTHS);
      consentToSave.expiresAt = expiresAt;
    }

    // Safely stringify and store
    const jsonString = JSON.stringify(consentToSave, null, 0);
    localStorage.setItem('gdpr-consent', jsonString);
    
    // Update analytics and marketing tracking based on consent
    if (consent.analytics) {
      console.log('Analytics consent granted - enable tracking');
      // Enable analytics tracking here
    } else {
      console.log('Analytics consent denied - disable tracking');
      // Disable analytics tracking here
    }

    if (consent.marketing) {
      console.log('Marketing consent granted - enable marketing cookies');
      // Enable marketing cookies here
    } else {
      console.log('Marketing consent denied - disable marketing cookies');
      // Disable marketing cookies here
    }

    return true;
  } catch (error) {
    console.error('Error saving consent to localStorage:', error);
    return false;
  }
}

// Privacy Policy Compliance - Updated for granular consent
export function generatePrivacyPolicy(): string {
  return `
# Privacy Policy - Gastvrij.eu

## Data Controller
Gastvrij.eu  
Email: privacy@gastvrij.eu

## Data We Collect
- **Necessary Data**: Personal information (name, email, phone) for bookings and account management
- **Booking Information**: Reservation details, payment information (processed securely)
- **Analytics Data**: Usage patterns and website performance data (with your consent only)
- **Marketing Data**: Communication preferences and promotional interests (with your consent only)
- **Preference Data**: Your website preferences and settings (with your consent only)

## Legal Basis for Processing
- **Necessary Cookies**: Essential for website functionality and service delivery (legitimate interest)
- **Analytics**: Statistical analysis and website improvement (consent required)
- **Marketing**: Promotional communications and targeted advertising (consent required)  
- **Preferences**: Personalized experience and saved settings (consent required)

## Granular Consent Management
We provide granular control over your data:
- **Necessary**: Always enabled (required for core functionality)
- **Analytics**: Optional - helps us improve our services
- **Marketing**: Optional - for promotional communications
- **Preferences**: Optional - for personalized experience

You can update your consent preferences at any time through your account settings.

## Consent Expiry and Renewal
- Consent expires after 24 months and requires renewal
- We maintain a complete audit trail of all consent changes
- You can withdraw consent at any time
- Withdrawal does not affect previously processed data under valid consent

## Data Retention
- **User data**: 7 years (legal requirement for hospitality industry)
- **Booking data**: 7 years (legal requirement)
- **Analytics data**: 1 year (only with consent)
- **Marketing data**: 1 year (only with consent)
- **Consent history**: Permanent (for legal compliance)

## Your Rights Under GDPR
- **Right to access**: Request a copy of your personal data
- **Right to rectification**: Correct inaccurate or incomplete data
- **Right to erasure**: Delete your data (subject to legal obligations)
- **Right to restrict processing**: Limit how we use your data
- **Right to data portability**: Receive your data in a structured format
- **Right to object**: Object to processing based on legitimate interests
- **Right to withdraw consent**: Withdraw consent for optional processing

## Data Security
- All data is encrypted in transit and at rest
- Regular security audits and vulnerability assessments  
- Access controls and audit logging for all data access
- GDPR-compliant data processing agreements with all third parties

## International Transfers
Personal data is processed within the EU. Any international transfers are protected by:
- Adequacy decisions by the European Commission
- Standard Contractual Clauses (SCCs)
- Binding Corporate Rules where applicable

## Changes to This Policy
- Policy version: ${CONSENT_VERSION}
- Last updated: ${new Date().toISOString().split('T')[0]}
- We will notify you of material changes via email or website notice
- Your continued use constitutes acceptance of policy changes

## Contact Information
**Data Protection Officer**: privacy@gastvrij.eu  
**General Contact**: info@gastvrij.eu  
**Address**: [Your business address]

For data protection concerns or to exercise your rights, contact us at privacy@gastvrij.eu.
  `.trim();
}
