import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { barberRequests, barbers, barbershops } from '@/lib/db/schema';
import { withAuth } from '@/lib/middleware';
import { eq, and } from 'drizzle-orm';

export const POST = withAuth(['barber'])(async (req) => {
  try {
    const body = await req.json();
    const { barbershopCode, message } = body;

    if (!barbershopCode || typeof barbershopCode !== 'string') {
      return NextResponse.json(
        { error: 'Código da barbearia é obrigatório' },
        { status: 400 }
      );
    }

    const normalizedCode = barbershopCode.trim().toUpperCase();

    const barbershop = await db.query.barbershops.findFirst({
      where: eq(barbershops.code, normalizedCode),
    });

    if (!barbershop) {
      return NextResponse.json(
        { error: 'Código de barbearia inválido' },
        { status: 404 }
      );
    }

    const existingBarber = await db.query.barbers.findFirst({
      where: eq(barbers.userId, req.user!.id),
    });

    if (existingBarber?.isApproved && existingBarber?.barbershopId) {
      return NextResponse.json(
        { error: 'Você já está vinculado a uma barbearia. Aguarde o dono desvincular você para tentar outra barbearia.' },
        { status: 400 }
      );
    }

    const pendingRequest = await db.query.barberRequests.findFirst({
      where: and(
        eq(barberRequests.userId, req.user!.id),
        eq(barberRequests.status, 'pending')
      ),
    });

    if (pendingRequest) {
      return NextResponse.json(
        { error: 'Você já tem uma solicitação pendente. Aguarde a resposta do dono ou cancele a solicitação atual.' },
        { status: 400 }
      );
    }

    await db.insert(barberRequests).values({
      userId: req.user!.id,
      barbershopId: barbershop.id,
      message: message || null,
      status: 'pending',
    });

    return NextResponse.json({
      success: true,
      message: 'Solicitação enviada com sucesso! Aguarde a aprovação do dono da barbearia.',
      barbershopName: barbershop.name,
    });
  } catch (error) {
    console.error('Link barber error:', error);
    return NextResponse.json(
      { error: 'Erro ao enviar solicitação' },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(['barber'])(async (req) => {
  try {
    const pendingRequest = await db.query.barberRequests.findFirst({
      where: and(
        eq(barberRequests.userId, req.user!.id),
        eq(barberRequests.status, 'pending')
      ),
    });

    if (!pendingRequest) {
      return NextResponse.json(
        { error: 'Nenhuma solicitação pendente encontrada' },
        { status: 404 }
      );
    }

    await db
      .update(barberRequests)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(eq(barberRequests.id, pendingRequest.id));

    return NextResponse.json({
      success: true,
      message: 'Solicitação cancelada com sucesso',
    });
  } catch (error) {
    console.error('Cancel barber request error:', error);
    return NextResponse.json(
      { error: 'Erro ao cancelar solicitação' },
      { status: 500 }
    );
  }
});
