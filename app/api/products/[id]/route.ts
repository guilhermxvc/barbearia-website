import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, barbershops, insertProductSchema } from '@/lib/db/schema';
import { withAuth } from '@/lib/middleware';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const updateProductSchema = insertProductSchema.partial().omit({ barbershopId: true, createdAt: true });

// PUT /api/products/[id] - Atualizar produto
export const PUT = withAuth(['manager'])(async (req, { params }) => {
  try {
    const productId = params?.id as string;
    const body = await req.json();

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

    // Verificar permissão do usuário
    if (existingProduct.barbershop?.ownerId !== req.user!.id) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    // Validar dados
    const data = updateProductSchema.parse({
      ...body,
      updatedAt: new Date(),
    });

    const [updatedProduct] = await db
      .update(products)
      .set(data)
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

    console.error('Update product error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar produto' },
      { status: 500 }
    );
  }
});

// DELETE /api/products/[id] - Desativar produto (soft delete)
export const DELETE = withAuth(['manager'])(async (req, { params }) => {
  try {
    const productId = params?.id as string;

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

    // Verificar permissão do usuário
    if (existingProduct.barbershop?.ownerId !== req.user!.id) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    // Soft delete - marcar como inativo
    await db
      .update(products)
      .set({ 
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir produto' },
      { status: 500 }
    );
  }
});