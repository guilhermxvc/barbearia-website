import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { commissions, barbershops } from '@/lib/db/schema';
import { withAuth } from '@/lib/middleware';
import { eq } from 'drizzle-orm';

// PUT /api/commissions/[id]/pay - Marcar comissão como paga (apenas manager)
export const PUT = withAuth(['manager'])(async (req, context) => {
  try {
    const { params } = context;
    const { id } = params;

    const commission = await db.query.commissions.findFirst({
      where: eq(commissions.id, id),
    });

    if (!commission) {
      return NextResponse.json(
        { error: 'Comissão não encontrada' },
        { status: 404 }
      );
    }

    // Buscar a barbearia para verificar o dono
    const barbershop = await db.query.barbershops.findFirst({
      where: eq(barbershops.id, commission.barbershopId),
    });

    if (!barbershop || barbershop.ownerId !== req.user!.id) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const [updatedCommission] = await db
      .update(commissions)
      .set({
        isPaid: true,
        paidAt: new Date(),
      })
      .where(eq(commissions.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      commission: updatedCommission,
    });
  } catch (error) {
    console.error('Pay commission error:', error);
    return NextResponse.json(
      { error: 'Erro ao marcar comissão como paga' },
      { status: 500 }
    );
  }
});