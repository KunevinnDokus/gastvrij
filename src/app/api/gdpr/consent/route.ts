import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { saveUserConsent, getUserConsent, exportUserData, deleteUserData } from '@/lib/gdpr';

// Consent schema
const ConsentSchema = z.object({
  necessary: z.boolean(),
  analytics: z.boolean(),
  marketing: z.boolean(),
  preferences: z.boolean(),
});

// GET /api/gdpr/consent - Get user consent status
export async function GET(request: NextRequest) {
  try {
    // In a real app, you'd get the user from the session
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const consent = await getUserConsent(userId);
    
    return NextResponse.json({
      success: true,
      data: consent,
    });
  } catch (error) {
    console.error('Error getting consent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get consent' },
      { status: 500 }
    );
  }
}

// POST /api/gdpr/consent - Update user consent
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const consentData = ConsentSchema.parse(body);
    
    const consent = {
      ...consentData,
      timestamp: new Date(),
    };

    await saveUserConsent(userId, consent);
    
    return NextResponse.json({
      success: true,
      data: consent,
      message: 'Consent updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid consent data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating consent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update consent' },
      { status: 500 }
    );
  }
}
