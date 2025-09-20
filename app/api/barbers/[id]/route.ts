import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { barbers, users } from '@/lib/db/schema';
import { withAuth } from '@/lib/middleware';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const updateBarberSchema = z.object({
  specialties: z.array(z.string()).optional(),
  commissionRate: z.string().optional(),
  isActive: z.boolean().optional(),
  isApproved: z.boolean().optional(),
});

// GET /api/barbers/[id] - Obter dados de um barbeiro específico
export const GET = withAuth()(async (req, { params }) => {
  try {
    const { id } = params;

    const barber = await db
      .select({
        id: barbers.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        specialties: barbers.specialties,
        commissionRate: barbers.commissionRate,
        isApproved: barbers.isApproved,
        isActive: barbers.isActive,
        createdAt: barbers.createdAt,
      })
      .from(barbers)
      .innerJoin(users, eq(barbers.userId, users.id))
      .where(eq(barbers.id, id))
      .limit(1);

    if (barber.length === 0) {
      return NextResponse.json(
        { error: 'Barbeiro não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      barber: barber[0],
    });
  } catch (error) {
    console.error('Get barber error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar barbeiro' },
      { status: 500 }
    );
  }
});

// PUT /api/barbers/[id] - Atualizar dados de um barbeiro
export const PUT = withAuth(['manager'])(async (req, { params }) => {
  try {
    const { id } = params;
    const body = await req.json();
    const validatedData = updateBarberSchema.parse(body);

    // Verificar se o barbeiro existe e pertence à barbearia do manager
    const existingBarber = await db.query.barbers.findFirst({
      where: eq(barbers.id, id),
      with: {
        barbershop: true,
      },
    });

    if (!existingBarber) {
      return NextResponse.json(
        { error: 'Barbeiro não encontrado' },
        { status: 404 }
      );
    }

    if (existingBarber.barbershop?.ownerId !== req.user!.id) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    // Atualizar os dados do barbeiro
    await db
      .update(barbers)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(barbers.id, id));

    return NextResponse.json({
      success: true,
      message: 'Barbeiro atualizado com sucesso',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Update barber error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar barbeiro' },
      { status: 500 }
    );
  }
});

// DELETE /api/barbers/[id] - Desativar um barbeiro (soft delete)
export const DELETE = withAuth(['manager'])(async (req, { params }) => {
  try {
    const { id } = params;

    // Verificar se o barbeiro existe e pertence à barbearia do manager
    const existingBarber = await db.query.barbers.findFirst({
      where: eq(barbers.id, id),
      with: {
        barbershop: true,
      },
    });

    if (!existingBarber) {
      return NextResponse.json(
        { error: 'Barbeiro não encontrado' },
        { status: 404 }
      );
    }

    if (existingBarber.barbershop?.ownerId !== req.user!.id) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    // Desativar o barbeiro (soft delete)
    await db
      .update(barbers)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(barbers.id, id));

    return NextResponse.json({
      success: true,
      message: 'Barbeiro desativado com sucesso',
    });
  } catch (error) {
    console.error('Delete barber error:', error);
    return NextResponse.json(
      { error: 'Erro ao desativar barbeiro' },
      { status: 500 }
    );
  }
});