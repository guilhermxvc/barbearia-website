import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { 
  sales, 
  commissions, 
  barbers, 
  barbershops,
  appointments
} from '@/lib/db/schema';
import { withAuth } from '@/lib/middleware';
import { eq, and, gte, lte, sum, count } from 'drizzle-orm';

// GET /api/reports/financial - Relatório financeiro detalhado
export const GET = withAuth(['manager', 'barber'])(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const barbershopId = searchParams.get('barbershopId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

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

    // Definir período padrão se não informado
    const defaultStartDate = new Date();
    defaultStartDate.setMonth(defaultStartDate.getMonth() - 1);
    
    const defaultEndDate = new Date();

    const periodStart = startDate ? new Date(startDate) : defaultStartDate;
    const periodEnd = endDate ? new Date(endDate) : defaultEndDate;

    // Faturamento total no período
    const totalRevenue = await db
      .select({ total: sum(sales.totalAmount) })
      .from(sales)
      .where(
        and(
          eq(sales.barbershopId, barbershopId),
          gte(sales.createdAt, periodStart),
          lte(sales.createdAt, periodEnd)
        )
      );

    // Total de vendas no período
    const totalSales = await db
      .select({ total: count() })
      .from(sales)
      .where(
        and(
          eq(sales.barbershopId, barbershopId),
          gte(sales.createdAt, periodStart),
          lte(sales.createdAt, periodEnd)
        )
      );

    // Comissões pagas no período
    const paidCommissions = await db
      .select({ total: sum(commissions.amount) })
      .from(commissions)
      .where(
        and(
          eq(commissions.barbershopId, barbershopId),
          eq(commissions.isPaid, true),
          gte(commissions.createdAt, periodStart),
          lte(commissions.createdAt, periodEnd)
        )
      );

    // Comissões pendentes no período
    const pendingCommissions = await db
      .select({ total: sum(commissions.amount) })
      .from(commissions)
      .where(
        and(
          eq(commissions.barbershopId, barbershopId),
          eq(commissions.isPaid, false),
          gte(commissions.createdAt, periodStart),
          lte(commissions.createdAt, periodEnd)
        )
      );

    // Agendamentos concluídos no período
    const completedAppointments = await db
      .select({ total: count() })
      .from(appointments)
      .where(
        and(
          eq(appointments.barbershopId, barbershopId),
          eq(appointments.status, 'completed'),
          gte(appointments.scheduledAt, periodStart),
          lte(appointments.scheduledAt, periodEnd)
        )
      );

    // Barbeiros ativos
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

    const financialSummary = {
      totalRevenue: parseFloat(totalRevenue[0]?.total || '0'),
      totalSales: totalSales[0]?.total || 0,
      paidCommissions: parseFloat(paidCommissions[0]?.total || '0'),
      pendingCommissions: parseFloat(pendingCommissions[0]?.total || '0'),
      completedAppointments: completedAppointments[0]?.total || 0,
      activeBarbers: activeBarbers[0]?.total || 0,
      period: {
        startDate: periodStart.toISOString(),
        endDate: periodEnd.toISOString(),
      },
      // Métricas calculadas
      averageTicket: totalSales[0]?.total ? 
        parseFloat(totalRevenue[0]?.total || '0') / totalSales[0].total : 0,
      commissionRate: parseFloat(totalRevenue[0]?.total || '0') > 0 ? 
        (parseFloat(paidCommissions[0]?.total || '0') / parseFloat(totalRevenue[0]?.total || '0')) * 100 : 0,
    };

    return NextResponse.json({
      success: true,
      data: financialSummary,
    });
  } catch (error) {
    console.error('Financial report error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar relatório financeiro' },
      { status: 500 }
    );
  }
});