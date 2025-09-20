import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { barbershops, insertBarbershopSchema } from '@/lib/db/schema';
import { withAuth } from '@/lib/middleware';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateBarbershopSchema = insertBarbershopSchema.partial().omit({
  id: true,
  ownerId: true,
  createdAt: true,
});

// GET /api/barbershops/[id] - Obter detalhes de uma barbearia
export const GET = withAuth()(async (req, { params }) => {
  try {
    const { id } = params;

    const barbershop = await db.query.barbershops.findFirst({
      where: eq(barbershops.id, id),
      with: {
        services: {
          where: (services, { eq }) => eq(services.isActive, true),
        },
        barbers: {
          with: {
            user: {
              columns: {
                name: true,
                phone: true,
              },
            },
          },
          where: (barbers, { eq, and }) =>
            and(eq(barbers.isApproved, true), eq(barbers.isActive, true)),
        },
      },
    });

    if (!barbershop) {
      return NextResponse.json(
        { error: 'Barbearia não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      barbershop,
    });
  } catch (error) {
    console.error('Get barbershop error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar barbearia' },
      { status: 500 }
    );
  }
});

// PUT /api/barbershops/[id] - Atualizar barbearia (apenas owner)
export const PUT = withAuth(['manager'])(async (req, { params }) => {
  try {
    const { id } = params;
    const body = await req.json();
    const data = updateBarbershopSchema.parse(body);

    // Verificar se o usuário é o dono da barbearia
    const barbershop = await db.query.barbershops.findFirst({
      where: eq(barbershops.id, id),
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

    const [updatedBarbershop] = await db
      .update(barbershops)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(barbershops.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      barbershop: updatedBarbershop,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Update barbershop error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar barbearia' },
      { status: 500 }
    );
  }
});