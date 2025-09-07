import { NextRequest, NextResponse } from 'next/server';
import { exportUserData, deleteUserData } from '@/lib/gdpr';

// GET /api/gdpr/export - Export user data
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const userData = await exportUserData(userId);
    
    return NextResponse.json({
      success: true,
      data: userData,
      message: 'User data exported successfully',
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
