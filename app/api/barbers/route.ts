import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { barbers, users, barbershops, barberRequests } from '@/lib/db/schema';
import { withAuth } from '@/lib/middleware';
import { eq, and } from 'drizzle-orm';

// GET /api/barbers - Listar barbeiros de uma barbearia
export const GET = withAuth()(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const barbershopId = searchParams.get('barbershopId');

    if (!barbershopId) {
      return NextResponse.json(
        { error: 'ID da barbearia é obrigatório' },
        { status: 400 }
      );
    }

    const barbersList = await db
      .select({
        id: barbers.id,
        name: users.name,
        phone: users.phone,
        email: users.email,
        specialties: barbers.specialties,
        commissionRate: barbers.commissionRate,
        isApproved: barbers.isApproved,
        isActive: barbers.isActive,
      })
      .from(barbers)
      .innerJoin(users, eq(barbers.userId, users.id))
      .where(
        and(
          eq(barbers.barbershopId, barbershopId),
          eq(barbers.isActive, true)
        )
      );

    return NextResponse.json({
      success: true,
      barbers: barbersList,
    });
  } catch (error) {
    console.error('Get barbers error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar barbeiros' },
      { status: 500 }
    );
  }
});

// GET /api/barbers/requests - Listar solicitações de barbeiros (apenas manager)
export const POST = withAuth(['manager'])(async (req) => {
  try {
    const body = await req.json();
    const { barbershopId } = body;

    // Verificar se o usuário é o dono da barbearia
    const barbershop = await db.query.barbershops.findFirst({
      where: eq(barbershops.id, barbershopId),
    });

    if (!barbershop || barbershop.ownerId !== req.user!.id) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const requests = await db
      .select({
        id: barberRequests.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        status: barberRequests.status,
        message: barberRequests.message,
        createdAt: barberRequests.createdAt,
        barber: {
          specialties: barbers.specialties,
        },
      })
      .from(barberRequests)
      .innerJoin(users, eq(barberRequests.userId, users.id))
      .leftJoin(barbers, eq(barbers.userId, users.id))
      .where(eq(barberRequests.barbershopId, barbershopId));

    return NextResponse.json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error('Get barber requests error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar solicitações' },
      { status: 500 }
    );
  }
});