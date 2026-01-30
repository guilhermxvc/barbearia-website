import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sales, barbershops, barbers, commissions, insertSaleSchema } from '@/lib/db/schema';
import { withAuth } from '@/lib/middleware';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { z } from 'zod';

// GET /api/sales - Listar vendas
export const GET = withAuth(['manager', 'barber'])(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const barbershopId = searchParams.get('barbershopId');
    const barberId = searchParams.get('barberId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!barbershopId) {
      return NextResponse.json(
        { error: 'ID da barbearia é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar autorização baseada no tipo de usuário
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
      // Barbeiro só pode ver vendas da sua barbearia
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

    let whereConditions: any = [eq(sales.barbershopId, barbershopId)];

    if (barberId) {
      whereConditions.push(eq(sales.barberId, barberId));
    }

    if (startDate) {
      whereConditions.push(gte(sales.createdAt, new Date(startDate)));
    }

    if (endDate) {
      whereConditions.push(lte(sales.createdAt, new Date(endDate)));
    }

    const salesList = await db
      .select()
      .from(sales)
      .where(and(...whereConditions))
      .orderBy(desc(sales.createdAt));

    return NextResponse.json({
      success: true,
      sales: salesList,
    });
  } catch (error) {
    console.error('Get sales error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar vendas' },
      { status: 500 }
    );
  }
});

// POST /api/sales - Registrar nova venda
export const POST = withAuth(['manager', 'barber'])(async (req) => {
  try {
    const body = await req.json();
    const data = insertSaleSchema.parse(body);

    // Verificar permissões
    const barbershop = await db.query.barbershops.findFirst({
      where: eq(barbershops.id, data.barbershopId),
    });

    if (!barbershop) {
      return NextResponse.json(
        { error: 'Barbearia não encontrada' },
        { status: 404 }
      );
    }

    const isOwner = barbershop.ownerId === req.user!.id;
    const isBarber = req.user!.userType === 'barber' && data.barberId;

    if (!isOwner && !isBarber) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const [newSale] = await db
      .insert(sales)
      .values(data)
      .returning();

    // Se há barbeiro envolvido, calcular comissão
    if (data.barberId) {
      const barber = await db.query.barbers.findFirst({
        where: eq(barbers.id, data.barberId),
      });

      if (barber && barber.commissionRate) {
        const commissionAmount = (parseFloat(data.totalAmount) * parseFloat(barber.commissionRate)) / 100;
        
        await db.insert(commissions).values({
          barbershopId: data.barbershopId,
          barberId: data.barberId,
          saleId: newSale.id,
          amount: commissionAmount.toFixed(2),
          rate: barber.commissionRate,
        });
      }
    }

    return NextResponse.json({
      success: true,
      sale: newSale,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Create sale error:', error);
    return NextResponse.json(
      { error: 'Erro ao registrar venda' },
      { status: 500 }
    );
  }
});