import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { barbershops, appointments, sales, barbers, clients } from '@/lib/db/schema';
import { withAuth } from '@/lib/middleware';
import { eq, and, gte, lte, count, sum, sql } from 'drizzle-orm';

// GET /api/barbershops/[id]/stats - Estatísticas da barbearia
export const GET = withAuth(['manager', 'barber'])(async (req, { params }) => {
  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30'; // dias

    // Verificar permissões
    const barbershop = await db.query.barbershops.findFirst({
      where: eq(barbershops.id, id),
    });

    if (!barbershop) {
      return NextResponse.json(
        { error: 'Barbearia não encontrada' },
        { status: 404 }
      );
    }

    const isOwner = barbershop.ownerId === req.user!.id;
    const isBarber = req.user!.userType === 'barber';

    if (!isOwner && !isBarber) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Estatísticas de agendamentos
    const appointmentStats = await db
      .select({
        total: count(),
        completed: sum(
          sql<number>`CASE WHEN ${appointments.status} = 'completed' THEN 1 ELSE 0 END`
        ),
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.barbershopId, id),
          gte(appointments.scheduledAt, startDate)
        )
      );

    // Faturamento
    const revenueStats = await db
      .select({
        totalRevenue: sum(sales.totalAmount),
        totalSales: count(),
      })
      .from(sales)
      .where(
        and(
          eq(sales.barbershopId, id),
          gte(sales.createdAt, startDate)
        )
      );

    // Número de barbeiros ativos
    const activeBarbers = await db
      .select({ count: count() })
      .from(barbers)
      .where(
        and(
          eq(barbers.barbershopId, id),
          eq(barbers.isActive, true),
          eq(barbers.isApproved, true)
        )
      );

    // Novos clientes no período
    const newClients = await db
      .select({ count: count() })
      .from(clients)
      .innerJoin(appointments, eq(clients.id, appointments.clientId))
      .where(
        and(
          eq(appointments.barbershopId, id),
          gte(appointments.createdAt, startDate)
        )
      );

    return NextResponse.json({
      success: true,
      stats: {
        appointments: {
          total: appointmentStats[0]?.total || 0,
          completed: appointmentStats[0]?.completed || 0,
        },
        revenue: {
          total: revenueStats[0]?.totalRevenue || '0',
          sales: revenueStats[0]?.totalSales || 0,
        },
        barbers: {
          active: activeBarbers[0]?.count || 0,
        },
        clients: {
          new: newClients[0]?.count || 0,
        },
        period: parseInt(period),
      },
    });
  } catch (error) {
    console.error('Get barbershop stats error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    );
  }
});