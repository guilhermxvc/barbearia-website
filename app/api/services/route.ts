import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { services, barbershops, insertServiceSchema } from '@/lib/db/schema';
import { withAuth } from '@/lib/middleware';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

// GET /api/services - Listar serviços de uma barbearia
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

    const servicesList = await db
      .select()
      .from(services)
      .where(
        and(
          eq(services.barbershopId, barbershopId),
          eq(services.isActive, true)
        )
      );

    return NextResponse.json({
      success: true,
      services: servicesList,
    });
  } catch (error) {
    console.error('Get services error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar serviços' },
      { status: 500 }
    );
  }
});

// POST /api/services - Criar novo serviço (apenas manager da barbearia)
export const POST = withAuth(['manager'])(async (req) => {
  try {
    const body = await req.json();
    const data = insertServiceSchema.parse(body);

    // Verificar se o usuário é o dono da barbearia
    const barbershop = await db.query.barbershops.findFirst({
      where: eq(barbershops.id, data.barbershopId),
    });

    if (!barbershop) {
      return NextResponse.json(
        { error: 'Barbearia não encontrada' },
        { status: 404 }
      );
    }

    if (barbershop.ownerId !== req.user!.id) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const [newService] = await db
      .insert(services)
      .values(data)
      .returning();

    return NextResponse.json({
      success: true,
      service: newService,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Create service error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar serviço' },
      { status: 500 }
    );
  }
});