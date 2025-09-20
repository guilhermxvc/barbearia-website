import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { barberRequests, barbers, barbershops } from '@/lib/db/schema';
import { withAuth } from '@/lib/middleware';
import { eq } from 'drizzle-orm';

// PUT /api/barbers/requests/[id] - Aprovar ou rejeitar solicitação de barbeiro
export const PUT = withAuth(['manager'])(async (req, { params }) => {
  try {
    const { id } = params;
    const body = await req.json();
    const { action } = body; // 'approve' ou 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Ação inválida' },
        { status: 400 }
      );
    }

    // Buscar a solicitação
    const request = await db.query.barberRequests.findFirst({
      where: eq(barberRequests.id, id),
      with: {
        barbershop: true,
      },
    });

    if (!request) {
      return NextResponse.json(
        { error: 'Solicitação não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se o usuário é o dono da barbearia
    if (request.barbershop?.ownerId !== req.user!.id) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    if (action === 'approve') {
      // Aprovar: criar entrada na tabela barbers
      await db.insert(barbers).values({
        userId: request.userId,
        barbershopId: request.barbershopId,
        specialties: [],
        commissionRate: '40.00',
        isApproved: true,
        isActive: true,
      });
    }

    // Atualizar status da solicitação
    await db
      .update(barberRequests)
      .set({
        status: action === 'approve' ? 'approved' : 'rejected',
        updatedAt: new Date(),
      })
      .where(eq(barberRequests.id, id));

    return NextResponse.json({
      success: true,
      message: `Solicitação ${action === 'approve' ? 'aprovada' : 'rejeitada'} com sucesso`,
    });
  } catch (error) {
    console.error('Update barber request error:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
});