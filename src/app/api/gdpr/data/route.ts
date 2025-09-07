import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { deleteUserData } from '@/lib/gdpr';

// Delete request schema
const DeleteRequestSchema = z.object({
  reason: z.string().min(10).max(500),
  confirmation: z.boolean().refine(val => val === true, {
    message: 'Confirmation must be true',
  }),
});

// DELETE /api/gdpr/data - Delete user data
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const deleteData = DeleteRequestSchema.parse(body);
    
    // Log deletion request for audit purposes
    console.log(`Data deletion requested by user ${userId}: ${deleteData.reason}`);
    
    await deleteUserData(userId);
    
    return NextResponse.json({
      success: true,
      message: 'User data deleted successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid deletion request', details: error.errors },
        { status: 400 }
      );
    }
    
    if (error instanceof Error && error.message.includes('active bookings')) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete user with active bookings' },
        { status: 409 }
      );
    }
    
    console.error('Error deleting data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete data' },
      { status: 500 }
    );
  }
}
