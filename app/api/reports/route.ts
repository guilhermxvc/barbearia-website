import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { 
  appointments, 
  sales, 
  commissions, 
  barbers, 
  barbershops, 
  clients, 
  services, 
  users 
} from '@/lib/db/schema';
import { withAuth } from '@/lib/middleware';
import { eq, and, gte, lte, count, sum, sql, desc } from 'drizzle-orm';

// GET /api/reports - Relatórios consolidados
export const GET = withAuth(['manager', 'barber'])(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const barbershopId = searchParams.get('barbershopId');
    const period = searchParams.get('period') || '6'; // meses

    if (!barbershopId) {
      return NextResponse.json(
        { error: 'ID da barbearia é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar autorização
    const userRole = req.user!.userType;
    
    if (userRole === 'manager') {
      const barbershop = await db.query.barbershops.findFirst({
        where: eq(barbershops.id, barbershopId),
      });

      if (!barbershop || barbershop.ownerId !== req.user!.id) {
        return NextResponse.json(
          { error: 'Acesso negado' },
          { status: 403 }
        );
      }
    } else if (userRole === 'barber') {
      const barber = await db.query.barbers.findFirst({
        where: and(
          eq(barbers.userId, req.user!.id),
          eq(barbers.barbershopId, barbershopId)
        ),
      });

      if (!barber) {
        return NextResponse.json(
          { error: 'Acesso negado' },
          { status: 403 }
        );
      }
    }

    const periodMonths = parseInt(period);
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - periodMonths);

    // 1. Dados mensais
    const monthlyData = [];
    for (let i = periodMonths - 1; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);
      monthEnd.setHours(23, 59, 59, 999);

      // Faturamento do mês
      const monthRevenue = await db
        .select({ total: sum(sales.totalAmount) })
        .from(sales)
        .where(
          and(
            eq(sales.barbershopId, barbershopId),
            gte(sales.createdAt, monthStart),
            lte(sales.createdAt, monthEnd)
          )
        );

      // Agendamentos do mês
      const monthAppointments = await db
        .select({ total: count() })
        .from(appointments)
        .where(
          and(
            eq(appointments.barbershopId, barbershopId),
            gte(appointments.scheduledAt, monthStart),
            lte(appointments.scheduledAt, monthEnd)
          )
        );

      // Novos clientes do mês (distinct count para evitar duplicatas)
      const monthNewClients = await db
        .select({ total: sql<number>`COUNT(DISTINCT ${clients.id})` })
        .from(clients)
        .innerJoin(appointments, eq(clients.id, appointments.clientId))
        .where(
          and(
            eq(appointments.barbershopId, barbershopId),
            gte(clients.createdAt, monthStart),
            lte(clients.createdAt, monthEnd)
          )
        );

      monthlyData.push({
        month: monthStart.toLocaleDateString('pt-BR', { month: 'short' }),
        revenue: parseFloat(monthRevenue[0]?.total || '0'),
        appointments: monthAppointments[0]?.total || 0,
        newClients: monthNewClients[0]?.total || 0,
      });
    }

    // 2. Top serviços
    const topServices = await db
      .select({
        name: services.name,
        count: count(),
        revenue: sum(sales.totalAmount),
      })
      .from(appointments)
      .innerJoin(services, eq(appointments.serviceId, services.id))
      .leftJoin(sales, eq(sales.appointmentId, appointments.id))
      .where(
        and(
          eq(appointments.barbershopId, barbershopId),
          gte(appointments.scheduledAt, startDate)
        )
      )
      .groupBy(services.id, services.name)
      .orderBy(desc(count()))
      .limit(5);

    // 3. Top barbeiros
    const topBarbers = await db
      .select({
        name: users.name,
        appointments: count(appointments.id),
        revenue: sum(sales.totalAmount),
        rating: sql<number>`AVG(CASE WHEN ${appointments.status} = 'completed' THEN 5.0 ELSE NULL END)`,
      })
      .from(barbers)
      .innerJoin(users, eq(barbers.userId, users.id))
      .leftJoin(appointments, eq(appointments.barberId, barbers.id))
      .leftJoin(sales, eq(sales.appointmentId, appointments.id))
      .where(
        and(
          eq(barbers.barbershopId, barbershopId),
          eq(barbers.isActive, true),
          gte(appointments.scheduledAt, startDate)
        )
      )
      .groupBy(barbers.id, users.name)
      .orderBy(desc(count(appointments.id)))
      .limit(5);

    // 4. Resumo financeiro
    const totalRevenue = await db
      .select({ total: sum(sales.totalAmount) })
      .from(sales)
      .where(
        and(
          eq(sales.barbershopId, barbershopId),
          gte(sales.createdAt, startDate)
        )
      );

    const totalCommissions = await db
      .select({ total: sum(commissions.amount) })
      .from(commissions)
      .where(
        and(
          eq(commissions.barbershopId, barbershopId),
          eq(commissions.isPaid, true),
          gte(commissions.createdAt, startDate)
        )
      );

    const pendingCommissions = await db
      .select({ total: sum(commissions.amount) })
      .from(commissions)
      .where(
        and(
          eq(commissions.barbershopId, barbershopId),
          eq(commissions.isPaid, false),
          gte(commissions.createdAt, startDate)
        )
      );

    const activeBarbers = await db
      .select({ total: count() })
      .from(barbers)
      .where(
        and(
          eq(barbers.barbershopId, barbershopId),
          eq(barbers.isActive, true),
          eq(barbers.isApproved, true)
        )
      );

    const reportsData = {
      monthlyData,
      topServices: topServices.map(service => ({
        name: service.name,
        count: service.count,
        revenue: parseFloat(service.revenue || '0'),
      })),
      topBarbers: topBarbers.map(barber => ({
        name: barber.name,
        appointments: barber.appointments,
        revenue: parseFloat(barber.revenue || '0'),
        rating: parseFloat(barber.rating?.toString() || '4.5'),
      })),
      financialSummary: {
        totalRevenue: parseFloat(totalRevenue[0]?.total || '0'),
        totalCommissions: parseFloat(totalCommissions[0]?.total || '0'),
        pendingCommissions: parseFloat(pendingCommissions[0]?.total || '0'),
        activeBarbers: activeBarbers[0]?.total || 0,
      },
    };

    return NextResponse.json({
      success: true,
      data: reportsData,
    });
  } catch (error) {
    console.error('Get reports error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar relatórios' },
      { status: 500 }
    );
  }
});