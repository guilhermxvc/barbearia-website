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

// GET /api/reports/export - Exportar relatórios
export const GET = withAuth(['manager', 'barber'])(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const barbershopId = searchParams.get('barbershopId');
    const type = searchParams.get('type') as 'monthly' | 'services' | 'barbers' | 'financial';
    const format = searchParams.get('format') || 'csv';

    if (!barbershopId || !type) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: barbershopId, type' },
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

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);

    let csvContent = '';
    let filename = '';

    switch (type) {
      case 'monthly':
        // Relatório mensal
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
          const monthStart = new Date();
          monthStart.setMonth(monthStart.getMonth() - i);
          monthStart.setDate(1);
          monthStart.setHours(0, 0, 0, 0);

          const monthEnd = new Date(monthStart);
          monthEnd.setMonth(monthEnd.getMonth() + 1);
          monthEnd.setDate(0);
          monthEnd.setHours(23, 59, 59, 999);

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
            month: monthStart.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
            revenue: parseFloat(monthRevenue[0]?.total || '0'),
            appointments: monthAppointments[0]?.total || 0,
            newClients: monthNewClients[0]?.total || 0,
          });
        }

        csvContent = 'Mês,Faturamento,Agendamentos,Novos Clientes\n';
        monthlyData.forEach(data => {
          csvContent += `${data.month},${data.revenue.toFixed(2)},${data.appointments},${data.newClients}\n`;
        });
        filename = 'relatorio_mensal';
        break;

      case 'services':
        // Relatório de serviços
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
          .orderBy(desc(count()));

        csvContent = 'Serviço,Agendamentos,Faturamento\n';
        topServices.forEach(service => {
          csvContent += `${service.name},${service.count},${parseFloat(service.revenue || '0').toFixed(2)}\n`;
        });
        filename = 'relatorio_servicos';
        break;

      case 'barbers':
        // Relatório de barbeiros
        const topBarbers = await db
          .select({
            name: users.name,
            appointments: count(appointments.id),
            revenue: sum(sales.totalAmount),
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
          .orderBy(desc(count(appointments.id)));

        csvContent = 'Barbeiro,Agendamentos,Faturamento\n';
        topBarbers.forEach(barber => {
          csvContent += `${barber.name},${barber.appointments},${parseFloat(barber.revenue || '0').toFixed(2)}\n`;
        });
        filename = 'relatorio_barbeiros';
        break;

      case 'financial':
        // Relatório financeiro
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

        csvContent = 'Métrica,Valor\n';
        csvContent += `Faturamento Total,${parseFloat(totalRevenue[0]?.total || '0').toFixed(2)}\n`;
        csvContent += `Comissões Pagas,${parseFloat(totalCommissions[0]?.total || '0').toFixed(2)}\n`;
        csvContent += `Comissões Pendentes,${parseFloat(pendingCommissions[0]?.total || '0').toFixed(2)}\n`;
        filename = 'relatorio_financeiro';
        break;

      default:
        return NextResponse.json(
          { error: 'Tipo de relatório inválido' },
          { status: 400 }
        );
    }

    // Retornar como CSV
    const today = new Date().toISOString().split('T')[0];
    const fullFilename = `${filename}_${today}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fullFilename}"`,
      },
    });
  } catch (error) {
    console.error('Export reports error:', error);
    return NextResponse.json(
      { error: 'Erro ao exportar relatório' },
      { status: 500 }
    );
  }
});