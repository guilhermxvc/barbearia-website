import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { barberRequests } from '@/lib/db/schema';
import { withAuth } from '@/lib/middleware';
import { eq, and } from 'drizzle-orm';

export const GET = withAuth(['barber'])(async (req) => {
  try {
    const pendingRequest = await db.query.barberRequests.findFirst({
      where: and(
        eq(barberRequests.userId, req.user!.id),
        eq(barberRequests.status, 'pending')
      ),
      with: {
        barbershop: true,
      },
    });

    if (!pendingRequest) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    return NextResponse.json({
      success: true,
      data: pendingRequest,
    });
  } catch (error) {
    console.error('Get pending request error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar solicitação pendente' },
      { status: 500 }
    );
  }
});
