import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, barbers } from '@/lib/db/schema';
import { withAuth } from '@/lib/middleware';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const stockUpdateSchema = z.object({
  quantity: z.number().positive('Quantidade deve ser positiva'),
  operation: z.enum(['add', 'subtract'], {
    errorMap: () => ({ message: 'Operação deve ser "add" ou "subtract"' }),
  }),
});

// PUT /api/products/[id]/stock - Atualizar estoque do produto
export const PUT = withAuth(['manager', 'barber'])(async (req, { params }) => {
  try {
    const productId = params?.id as string;
    const body = await req.json();
    const { quantity, operation } = stockUpdateSchema.parse(body);

    // Buscar produto existente
    const existingProduct = await db.query.products.findFirst({
      where: eq(products.id, productId),
      with: {
        barbershop: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o usuário tem acesso à barbearia
    const userRole = req.user!.role;
    if (userRole === 'manager') {
      // Manager deve ser o dono da barbearia
      if (existingProduct.barbershop?.ownerId !== req.user!.id) {
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
          eq(barbers.barbershopId, existingProduct.barbershopId)
        ),
      });

      if (!barber) {
        return NextResponse.json(
          { error: 'Acesso negado' },
          { status: 403 }
        );
      }
    }

    // Calcular novo estoque
    const currentStock = existingProduct.stockQuantity || 0;
    let newStock: number;

    if (operation === 'add') {
      newStock = currentStock + quantity;
    } else {
      newStock = currentStock - quantity;
      
      // Verificar se o estoque não ficará negativo
      if (newStock < 0) {
        return NextResponse.json(
          { error: 'Estoque insuficiente para essa operação' },
          { status: 400 }
        );
      }
    }

    // Atualizar estoque
    const [updatedProduct] = await db
      .update(products)
      .set({ 
        stockQuantity: newStock,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId))
      .returning();

    return NextResponse.json({
      success: true,
      product: updatedProduct,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Update stock error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar estoque' },
      { status: 500 }
    );
  }
});