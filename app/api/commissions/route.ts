import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { commissions, barbershops, barbers, users } from '@/lib/db/schema';
import { withAuth } from '@/lib/middleware';
import { eq, and, desc, gte, lte } from 'drizzle-orm';

// GET /api/commissions - Listar comissões
export const GET = withAuth(['manager', 'barber'])(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const barbershopId = searchParams.get('barbershopId');
    const barberId = searchParams.get('barberId');
    const isPaid = searchParams.get('isPaid');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let whereConditions: any = [];

    if (barbershopId) {
      whereConditions.push(eq(commissions.barbershopId, barbershopId));
    }

    if (barberId) {
      whereConditions.push(eq(commissions.barberId, barberId));
    }

    if (isPaid !== null && isPaid !== undefined) {
      whereConditions.push(eq(commissions.isPaid, isPaid === 'true'));
    }

    if (startDate) {
      whereConditions.push(gte(commissions.createdAt, new Date(startDate)));
    }

    if (endDate) {
      whereConditions.push(lte(commissions.createdAt, new Date(endDate)));
    }

    // Se for barbeiro, só pode ver suas próprias comissões
    if (req.user!.userType === 'barber') {
      // Buscar o perfil do barbeiro
      const barberProfile = await db.query.barbers.findFirst({
        where: eq(barbers.userId, req.user!.id),
      });

      if (barberProfile) {
        whereConditions.push(eq(commissions.barberId, barberProfile.id));
      } else {
        return NextResponse.json({
          success: true,
          commissions: [],
        });
      }
    }

    const commissionsList = await db
      .select({
        id: commissions.id,
        amount: commissions.amount,
        rate: commissions.rate,
        isPaid: commissions.isPaid,
        paidAt: commissions.paidAt,
        createdAt: commissions.createdAt,
        barber: {
          id: barbers.id,
          name: users.name,
        },
        barbershop: {
          id: barbershops.id,
          name: barbershops.name,
        },
      })
      .from(commissions)
      .innerJoin(barbers, eq(commissions.barberId, barbers.id))
      .innerJoin(users, eq(barbers.userId, users.id))
      .innerJoin(barbershops, eq(commissions.barbershopId, barbershops.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(commissions.createdAt));

    return NextResponse.json({
      success: true,
      commissions: commissionsList,
    });
  } catch (error) {
    console.error('Get commissions error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar comissões' },
      { status: 500 }
    );
  }
});

