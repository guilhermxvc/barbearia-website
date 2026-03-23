import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comandas, comandaItems, barbershops, barbers, users, clients } from '@/lib/db/schema';
import { withAuth } from '@/lib/middleware';
import { eq, and, desc, sql } from 'drizzle-orm';

export const GET = withAuth(['manager', 'barber'])(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const barbershopId = searchParams.get('barbershopId');
    const status = searchParams.get('status');
    const month = searchParams.get('month');

    // ── Barbeiro: busca as próprias comandas pelo userId ──────────
    if (req.user!.userType === 'barber') {
      const barber = await db.query.barbers.findFirst({
        where: eq(barbers.userId, req.user!.id),
      });

      if (!barber) {
        return NextResponse.json({ error: 'Barbeiro não encontrado' }, { status: 404 });
      }

      let conditions: any[] = [eq(comandas.barberId, barber.id)];
      if (status && status !== 'all') conditions.push(eq(comandas.status, status));
      if (month) conditions.push(eq(comandas.referenceMonth, month));

      const list = await db
        .select()
        .from(comandas)
        .where(and(...conditions))
        .orderBy(desc(comandas.createdAt));

      const result = await Promise.all(
        list.map(async (c) => {
          const items = await db
            .select()
            .from(comandaItems)
            .where(eq(comandaItems.comandaId, c.id))
            .orderBy(comandaItems.createdAt);
          return { ...c, items };
        })
      );

      return NextResponse.json({ success: true, comandas: result });
    }

    // ── Manager: comportamento original ───────────────────────────
    if (!barbershopId) {
      return NextResponse.json({ error: 'barbershopId é obrigatório' }, { status: 400 });
    }

    const barbershop = await db.query.barbershops.findFirst({
      where: and(eq(barbershops.id, barbershopId), eq(barbershops.ownerId, req.user!.id)),
    });

    if (!barbershop) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    let conditions: any[] = [eq(comandas.barbershopId, barbershopId)];
    if (status && status !== 'all') conditions.push(eq(comandas.status, status));
    if (month) conditions.push(eq(comandas.referenceMonth, month));

    const list = await db
      .select()
      .from(comandas)
      .where(and(...conditions))
      .orderBy(desc(comandas.createdAt));

    const result = await Promise.all(
      list.map(async (c) => {
        const items = await db
          .select()
          .from(comandaItems)
          .where(eq(comandaItems.comandaId, c.id))
          .orderBy(comandaItems.createdAt);
        return { ...c, items };
      })
    );

    return NextResponse.json({ success: true, comandas: result });
  } catch (error) {
    console.error('Error fetching comandas:', error);
    return NextResponse.json({ error: 'Erro ao buscar comandas' }, { status: 500 });
  }
});

export const POST = withAuth(['manager', 'barber', 'client'])(async (req) => {
  try {
    const body = await req.json();
    const { barbershopId, barberId, appointmentId, clientId, clientName, barberName, initialService } = body;

    if (!barbershopId || !barberId || !clientName || !barberName) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const now = new Date();
    const referenceMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(comandas)
      .where(and(eq(comandas.barbershopId, barbershopId), eq(comandas.referenceMonth, referenceMonth)));

    const seq = (countResult[0]?.count || 0) + 1;
    const ym = referenceMonth.replace('-', '');
    const code = `CMD-${ym}-${String(seq).padStart(4, '0')}`;

    const [newComanda] = await db
      .insert(comandas)
      .values({
        barbershopId,
        barberId,
        appointmentId: appointmentId || null,
        clientId: clientId || null,
        clientName,
        barberName,
        code,
        status: 'open',
        referenceMonth,
        totalAmount: initialService ? String(parseFloat(initialService.price) * (initialService.qty || 1)) : '0.00',
      })
      .returning();

    if (initialService) {
      const qty = initialService.qty || 1;
      const price = parseFloat(initialService.price);
      await db.insert(comandaItems).values({
        comandaId: newComanda.id,
        type: 'service',
        itemId: initialService.id || null,
        name: initialService.name,
        price: String(price),
        qty,
        subtotal: String(price * qty),
      });
    }

    const items = await db.select().from(comandaItems).where(eq(comandaItems.comandaId, newComanda.id));
    return NextResponse.json({ success: true, comanda: { ...newComanda, items } }, { status: 201 });
  } catch (error) {
    console.error('Error creating comanda:', error);
    return NextResponse.json({ error: 'Erro ao criar comanda' }, { status: 500 });
  }
});
