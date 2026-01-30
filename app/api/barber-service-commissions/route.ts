import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { barberServiceCommissions, barbershops, barbers, services, users } from '@/lib/db/schema';
import { withAuth } from '@/lib/middleware';
import { eq, and } from 'drizzle-orm';

// GET /api/barber-service-commissions - Listar comissões por barbeiro/serviço
export const GET = withAuth(['manager', 'barber'])(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const barbershopId = searchParams.get('barbershopId');
    const barberId = searchParams.get('barberId');

    // Se for barbeiro buscando suas próprias comissões
    if (barberId && req.user!.userType === 'barber') {
      // Buscar o barbeiro do usuário
      const barber = await db.query.barbers.findFirst({
        where: eq(barbers.id, barberId),
      });

      if (!barber) {
        return NextResponse.json(
          { error: 'Barbeiro não encontrado' },
          { status: 404 }
        );
      }

      // Buscar serviços da barbearia do barbeiro
      const servicesList = await db
        .select()
        .from(services)
        .where(and(
          eq(services.barbershopId, barber.barbershopId),
          eq(services.isActive, true)
        ));

      // Buscar comissões do barbeiro
      const commissionsList = await db
        .select()
        .from(barberServiceCommissions)
        .where(eq(barberServiceCommissions.barberId, barberId));

      // Criar mapa de comissões
      const commissionMap: Record<string, string> = {};
      commissionsList.forEach(c => {
        commissionMap[c.serviceId] = c.commissionRate;
      });

      // Montar estrutura de comissões do barbeiro
      const barberCommissions = [{
        barberId: barber.id,
        barberName: req.user!.name || 'Barbeiro',
        services: servicesList.map(service => ({
          serviceId: service.id,
          serviceName: service.name,
          servicePrice: service.price,
          commissionRate: commissionMap[service.id] || '50.00',
        }))
      }];

      return NextResponse.json({
        commissions: barberCommissions,
      });
    }

    // Manager buscando comissões da barbearia
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

    // Verificar se o barbeiro pertence à barbearia
    const barber = await db.query.barbers.findFirst({
      where: and(
        eq(barbers.id, barberId),
        eq(barbers.barbershopId, barbershopId)
      ),
    });

    if (!barber) {
      return NextResponse.json(
        { error: 'Barbeiro não encontrado nesta barbearia' },
        { status: 400 }
      );
    }

    // Verificar se o serviço pertence à barbearia
    const service = await db.query.services.findFirst({
      where: and(
        eq(services.id, serviceId),
        eq(services.barbershopId, barbershopId)
      ),
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Serviço não encontrado nesta barbearia' },
        { status: 400 }
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

    // Buscar barbeiros e serviços válidos da barbearia
    const validBarbers = await db.query.barbers.findMany({
      where: eq(barbers.barbershopId, barbershopId),
    });
    const validServices = await db.query.services.findMany({
      where: eq(services.barbershopId, barbershopId),
    });
    
    const validBarberIds = new Set(validBarbers.map(b => b.id));
    const validServiceIds = new Set(validServices.map(s => s.id));

    // Atualizar todas as comissões
    for (const comm of commissions) {
      const { barberId, serviceId, commissionRate } = comm;
      
      // Verificar se barbeiro e serviço pertencem à barbearia
      if (!validBarberIds.has(barberId) || !validServiceIds.has(serviceId)) {
        continue; // Pular comissões inválidas
      }
      
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
