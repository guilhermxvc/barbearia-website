import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { barberRequests } from '@/lib/db/schema';
import { withAuth } from '@/lib/middleware';
import { eq, and, or, desc } from 'drizzle-orm';

export const GET = withAuth(['barber'])(async (req) => {
  try {
    // Buscar a solicitação mais recente (pendente ou rejeitada recentemente)
    const latestRequest = await db.query.barberRequests.findFirst({
      where: and(
        eq(barberRequests.userId, req.user!.id),
        or(
          eq(barberRequests.status, 'pending'),
          eq(barberRequests.status, 'rejected')
        )
      ),
      with: {
        barbershop: true,
      },
      orderBy: [desc(barberRequests.createdAt)],
    });

    if (!latestRequest) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    return NextResponse.json({
      success: true,
      data: latestRequest,
    });
  } catch (error) {
    console.error('Get pending request error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar solicitação' },
      { status: 500 }
    );
  }
});
