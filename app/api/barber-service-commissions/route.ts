import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { barberServiceCommissions, barbershops, barbers, services, users } from '@/lib/db/schema';
import { withAuth } from '@/lib/middleware';
import { eq, and } from 'drizzle-orm';

// GET /api/barber-service-commissions - Listar comissões por barbeiro/serviço
export const GET = withAuth(['manager'])(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const barbershopId = searchParams.get('barbershopId');

    if (!barbershopId) {
      return NextResponse.json(
        { error: 'ID da barbearia é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se é o dono da barbearia
    const barbershop = await db.query.barbershops.findFirst({
      where: eq(barbershops.id, barbershopId),
    });

    if (!barbershop || barbershop.ownerId !== req.user!.id) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    // Buscar todos os barbeiros da barbearia
    const barbersList = await db
      .select({
        id: barbers.id,
        name: users.name,
      })
      .from(barbers)
      .leftJoin(users, eq(barbers.userId, users.id))
      .where(and(
        eq(barbers.barbershopId, barbershopId),
        eq(barbers.isActive, true)
      ));

    // Buscar todos os serviços da barbearia
    const servicesList = await db
      .select()
      .from(services)
      .where(and(
        eq(services.barbershopId, barbershopId),
        eq(services.isActive, true)
      ));

    // Buscar todas as comissões configuradas
    const commissionsList = await db
      .select()
      .from(barberServiceCommissions)
      .where(eq(barberServiceCommissions.barbershopId, barbershopId));

    // Criar mapa de comissões existentes
    const commissionMap: Record<string, string> = {};
    commissionsList.forEach(c => {
      commissionMap[`${c.barberId}-${c.serviceId}`] = c.commissionRate;
    });

    // Montar estrutura completa de comissões (barbeiro x serviço)
    const fullCommissions = barbersList.map(barber => ({
      barberId: barber.id,
      barberName: barber.name || 'Barbeiro',
      services: servicesList.map(service => ({
        serviceId: service.id,
        serviceName: service.name,
        servicePrice: service.price,
        commissionRate: commissionMap[`${barber.id}-${service.id}`] || '50.00',
      }))
    }));

    return NextResponse.json({
      success: true,
      commissions: fullCommissions,
      barbers: barbersList,
      services: servicesList,
    });
  } catch (error) {
    console.error('Get barber service commissions error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar comissões' },
      { status: 500 }
    );
  }
});

// POST /api/barber-service-commissions - Criar ou atualizar comissão
export const POST = withAuth(['manager'])(async (req) => {
  try {
    const body = await req.json();
    const { barbershopId, barberId, serviceId, commissionRate } = body;

    if (!barbershopId || !barberId || !serviceId || commissionRate === undefined) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    // Verificar se é o dono da barbearia
    const barbershop = await db.query.barbershops.findFirst({
      where: eq(barbershops.id, barbershopId),
    });

    if (!barbershop || barbershop.ownerId !== req.user!.id) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    // Verificar se já existe uma comissão para este barbeiro/serviço
    const existing = await db.query.barberServiceCommissions.findFirst({
      where: and(
        eq(barberServiceCommissions.barberId, barberId),
        eq(barberServiceCommissions.serviceId, serviceId)
      ),
    });

    if (existing) {
      // Atualizar
      await db
        .update(barberServiceCommissions)
        .set({ 
          commissionRate: commissionRate.toString(),
          updatedAt: new Date()
        })
        .where(eq(barberServiceCommissions.id, existing.id));
    } else {
      // Criar nova
      await db.insert(barberServiceCommissions).values({
        barbershopId,
        barberId,
        serviceId,
        commissionRate: commissionRate.toString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Comissão atualizada com sucesso',
    });
  } catch (error) {
    console.error('Create/update barber service commission error:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar comissão' },
      { status: 500 }
    );
  }
});

// PUT /api/barber-service-commissions - Atualizar múltiplas comissões de uma vez
export const PUT = withAuth(['manager'])(async (req) => {
  try {
    const body = await req.json();
    const { barbershopId, commissions } = body;

    if (!barbershopId || !commissions || !Array.isArray(commissions)) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    // Verificar se é o dono da barbearia
    const barbershop = await db.query.barbershops.findFirst({
      where: eq(barbershops.id, barbershopId),
    });

    if (!barbershop || barbershop.ownerId !== req.user!.id) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    // Atualizar todas as comissões
    for (const comm of commissions) {
      const { barberId, serviceId, commissionRate } = comm;
      
      const existing = await db.query.barberServiceCommissions.findFirst({
        where: and(
          eq(barberServiceCommissions.barberId, barberId),
          eq(barberServiceCommissions.serviceId, serviceId)
        ),
      });

      if (existing) {
        await db
          .update(barberServiceCommissions)
          .set({ 
            commissionRate: commissionRate.toString(),
            updatedAt: new Date()
          })
          .where(eq(barberServiceCommissions.id, existing.id));
      } else {
        await db.insert(barberServiceCommissions).values({
          barbershopId,
          barberId,
          serviceId,
          commissionRate: commissionRate.toString(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Comissões atualizadas com sucesso',
    });
  } catch (error) {
    console.error('Bulk update barber service commissions error:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar comissões' },
      { status: 500 }
    );
  }
});
