import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, barbershops, barbers, insertProductSchema } from '@/lib/db/schema';
import { withAuth } from '@/lib/middleware';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

// GET /api/products - Listar produtos de uma barbearia
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

    // Verificar se o usuário tem acesso à barbearia
    const userRole = req.user!.userType;
    
    if (userRole === 'manager') {
      // Manager deve ser o dono da barbearia
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
      // Barbeiro deve pertencer à barbearia
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
    } else {
      // Clientes não têm acesso aos produtos
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const productsList = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.barbershopId, barbershopId),
          eq(products.isActive, true)
        )
      );

    return NextResponse.json({
      success: true,
      products: productsList,
    });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produtos' },
      { status: 500 }
    );
  }
});

// POST /api/products - Criar novo produto (apenas manager da barbearia)
export const POST = withAuth(['manager'])(async (req) => {
  try {
    const body = await req.json();
    const data = insertProductSchema.parse(body);

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

    const [newProduct] = await db
      .insert(products)
      .values(data)
      .returning();

    return NextResponse.json({
      success: true,
      product: newProduct,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Create product error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar produto' },
      { status: 500 }
    );
  }
});