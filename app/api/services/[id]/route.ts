import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { services, barbershops, barbers, insertServiceSchema } from '@/lib/db/schema';
import { withAuth } from '@/lib/middleware';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const updateServiceSchema = insertServiceSchema.partial().omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// GET /api/services/[id] - Obter serviço específico
export const GET = withAuth()(async (req, context) => {
  try {
    const { params } = context;
    const { id } = params;

    const service = await db.query.services.findFirst({
      where: eq(services.id, id),
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Serviço não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o usuário tem acesso ao serviço (deve ser da mesma barbearia)
    if (req.user!.userType === 'manager') {
      const barbershop = await db.query.barbershops.findFirst({
        where: eq(barbershops.id, service.barbershopId),
      });

      if (!barbershop || barbershop.ownerId !== req.user!.id) {
        return NextResponse.json(
          { error: 'Acesso negado' },
          { status: 403 }
        );
      }
    } else if (req.user!.userType === 'barber') {
      // Barbeiro só pode ver serviços da sua barbearia
      const barber = await db.query.barbers.findFirst({
        where: eq(barbers.userId, req.user!.id),
      });

      if (!barber || barber.barbershopId !== service.barbershopId) {
        return NextResponse.json(
          { error: 'Acesso negado' },
          { status: 403 }
        );
      }
    } else if (req.user!.userType === 'client') {
      // Cliente só pode ver serviços ativos (públicos)
      if (!service.isActive) {
        return NextResponse.json(
          { error: 'Serviço não encontrado' },
          { status: 404 }
        );
      }
    }


    return NextResponse.json({
      success: true,
      service,
    });
  } catch (error) {
    console.error('Get service error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar serviço' },
      { status: 500 }
    );
  }
});

// PUT /api/services/[id] - Atualizar serviço
export const PUT = withAuth(['manager'])(async (req, context) => {
  try {
    const { params } = context;
    const { id } = params;
    const body = await req.json();
    const data = updateServiceSchema.parse(body);

    // Verificar se o serviço existe e se o usuário é o dono da barbearia
    const service = await db.query.services.findFirst({
      where: eq(services.id, id),
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Serviço não encontrado' },
        { status: 404 }
      );
    }

    const barbershop = await db.query.barbershops.findFirst({
      where: eq(barbershops.id, service.barbershopId),
    });

    if (!barbershop || barbershop.ownerId !== req.user!.id) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const [updatedService] = await db
      .update(services)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(services.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      service: updatedService,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Update service error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar serviço' },
      { status: 500 }
    );
  }
});

// DELETE /api/services/[id] - Excluir serviço
export const DELETE = withAuth(['manager'])(async (req, context) => {
  try {
    const { params } = context;
    const { id } = params;

    // Verificar se o serviço existe e se o usuário é o dono da barbearia
    const service = await db.query.services.findFirst({
      where: eq(services.id, id),
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Serviço não encontrado' },
        { status: 404 }
      );
    }

    const barbershop = await db.query.barbershops.findFirst({
      where: eq(barbershops.id, service.barbershopId),
    });

    if (!barbershop || barbershop.ownerId !== req.user!.id) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    // Soft delete - marcar como inativo
    const [deletedService] = await db
      .update(services)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(services.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      service: deletedService,
    });
  } catch (error) {
    console.error('Delete service error:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir serviço' },
      { status: 500 }
    );
  }
});