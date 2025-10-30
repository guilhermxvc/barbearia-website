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
      // Aprovar: atualizar ou criar entrada na tabela barbers
      const existingBarber = await db.query.barbers.findFirst({
        where: eq(barbers.userId, request.userId),
      });

      if (existingBarber) {
        await db
          .update(barbers)
          .set({
            barbershopId: request.barbershopId,
            isApproved: true,
            isActive: true,
            updatedAt: new Date(),
          })
          .where(eq(barbers.userId, request.userId));
      } else {
        await db.insert(barbers).values({
          userId: request.userId,
          barbershopId: request.barbershopId,
          specialties: [],
          commissionRate: '40.00',
          isApproved: true,
          isActive: true,
        });
      }
    } else {
      // Rejeitar: resetar barbershopId e isApproved para permitir novo vínculo
      const existingBarber = await db.query.barbers.findFirst({
        where: eq(barbers.userId, request.userId),
      });

      if (existingBarber) {
        await db
          .update(barbers)
          .set({
            barbershopId: null,
            isApproved: false,
            updatedAt: new Date(),
          })
          .where(eq(barbers.userId, request.userId));
      }
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