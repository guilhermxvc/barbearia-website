import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { commissionReceipts, barbershops, comandas } from '@/lib/db/schema';
import { withAuth } from '@/lib/middleware';
import { eq, and, desc } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export const GET = withAuth(['manager'])(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const barbershopId = searchParams.get('barbershopId');

    if (!barbershopId) {
      return NextResponse.json({ error: 'barbershopId é obrigatório' }, { status: 400 });
    }

    const barbershop = await db.query.barbershops.findFirst({
      where: and(eq(barbershops.id, barbershopId), eq(barbershops.ownerId, req.user!.id)),
    });

    if (!barbershop) {
      return NextResponse.json({ error: 'Barbearia não encontrada ou sem permissão' }, { status: 403 });
    }

    const receipts = await db
      .select()
      .from(commissionReceipts)
      .where(eq(commissionReceipts.barbershopId, barbershopId))
      .orderBy(desc(commissionReceipts.paidAt));

    return NextResponse.json({ success: true, receipts });
  } catch (error) {
    console.error('Error fetching commission receipts:', error);
    return NextResponse.json({ error: 'Erro ao buscar recibos' }, { status: 500 });
  }
});

export const POST = withAuth(['manager'])(async (req) => {
  try {
    const body = await req.json();
    const {
      barbershopId,
      barberId,
      referenceMonth,
      paymentMethod,
      totalServices,
      totalCommissions,
      serviceDetails,
      barberName,
    } = body;

    if (!barbershopId || !barberId || !referenceMonth || !paymentMethod || !serviceDetails) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const barbershop = await db.query.barbershops.findFirst({
      where: and(eq(barbershops.id, barbershopId), eq(barbershops.ownerId, req.user!.id)),
    });

    if (!barbershop) {
      return NextResponse.json({ error: 'Barbearia não encontrada ou sem permissão' }, { status: 403 });
    }

    const existing = await db.query.commissionReceipts.findFirst({
      where: and(
        eq(commissionReceipts.barbershopId, barbershopId),
        eq(commissionReceipts.barberId, barberId),
        eq(commissionReceipts.referenceMonth, referenceMonth)
      ),
    });

    if (existing) {
      return NextResponse.json({ error: 'Já existe um recibo para este barbeiro neste mês' }, { status: 409 });
    }

    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(commissionReceipts)
      .where(eq(commissionReceipts.barbershopId, barbershopId));

    const seqNumber = (countResult[0]?.count || 0) + 1;
    const year = new Date().getFullYear();
    const receiptNumber = `RB-${year}-${String(seqNumber).padStart(6, '0')}`;

    const [receipt] = await db
      .insert(commissionReceipts)
      .values({
        barbershopId,
        barberId,
        receiptNumber,
        referenceMonth,
        paymentMethod,
        totalServices: String(totalServices),
        totalCommissions: String(totalCommissions),
        serviceDetails,
        barberName,
        barbershopName: barbershop.name,
        barbershopAddress: barbershop.address || '',
        paidAt: new Date(),
      })
      .returning();

    // Auto-fechar comandas abertas deste barbeiro neste mês
    try {
      const openComandas = await db
        .select()
        .from(comandas)
        .where(
          and(
            eq(comandas.barbershopId, barbershopId),
            eq(comandas.barberId, barberId),
            eq(comandas.referenceMonth, referenceMonth),
            eq(comandas.status, 'open')
          )
        );

      if (openComandas.length > 0) {
        await db
          .update(comandas)
          .set({ status: 'closed', closedAt: new Date(), updatedAt: new Date() })
          .where(
            and(
              eq(comandas.barbershopId, barbershopId),
              eq(comandas.barberId, barberId),
              eq(comandas.referenceMonth, referenceMonth),
              eq(comandas.status, 'open')
            )
          );
      }
    } catch (e) {
      console.error('Erro ao fechar comandas ao pagar comissão:', e);
    }

    return NextResponse.json({ success: true, receipt });
  } catch (error) {
    console.error('Error creating commission receipt:', error);
    return NextResponse.json({ error: 'Erro ao criar recibo' }, { status: 500 });
  }
});
