import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comandas, comandaItems, barbershops, sales, appointments } from '@/lib/db/schema';
import { withAuth } from '@/lib/middleware';
import { eq, and } from 'drizzle-orm';

export const GET = withAuth(['manager', 'barber'])(async (req, { params }: { params: { id: string } }) => {
  try {
    const comanda = await db.query.comandas.findFirst({ where: eq(comandas.id, params.id) });
    if (!comanda) return NextResponse.json({ error: 'Comanda não encontrada' }, { status: 404 });

    const barbershop = await db.query.barbershops.findFirst({
      where: and(eq(barbershops.id, comanda.barbershopId), eq(barbershops.ownerId, req.user!.id)),
    });
    if (!barbershop) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

    const items = await db.select().from(comandaItems).where(eq(comandaItems.comandaId, comanda.id));
    return NextResponse.json({ success: true, comanda: { ...comanda, items } });
  } catch (error) {
    console.error('Error fetching comanda:', error);
    return NextResponse.json({ error: 'Erro ao buscar comanda' }, { status: 500 });
  }
});

export const PUT = withAuth(['manager'])(async (req, { params }: { params: { id: string } }) => {
  try {
    const body = await req.json();
    const { action, paymentMethod, notes } = body;

    const comanda = await db.query.comandas.findFirst({ where: eq(comandas.id, params.id) });
    if (!comanda) return NextResponse.json({ error: 'Comanda não encontrada' }, { status: 404 });

    const barbershop = await db.query.barbershops.findFirst({
      where: and(eq(barbershops.id, comanda.barbershopId), eq(barbershops.ownerId, req.user!.id)),
    });
    if (!barbershop) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

    if (action === 'close') {
      if (comanda.status === 'closed') {
        return NextResponse.json({ error: 'Comanda já está fechada' }, { status: 400 });
      }

      const items = await db.select().from(comandaItems).where(eq(comandaItems.comandaId, comanda.id));
      const total = items.reduce((acc, i) => acc + parseFloat(i.subtotal), 0);

      const [updated] = await db
        .update(comandas)
        .set({
          status: 'closed',
          paymentMethod: paymentMethod || null,
          totalAmount: String(total),
          notes: notes || comanda.notes,
          closedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(comandas.id, comanda.id))
        .returning();

      if (items.length > 0) {
        await db.insert(sales).values({
          barbershopId: comanda.barbershopId,
          barberId: comanda.barberId,
          clientId: comanda.clientId || null,
          appointmentId: comanda.appointmentId || null,
          items: items.map((i) => ({ name: i.name, type: i.type, qty: i.qty, price: i.price, subtotal: i.subtotal })),
          totalAmount: String(total),
          paymentMethod: paymentMethod || null,
        });
      }

      return NextResponse.json({ success: true, comanda: { ...updated, items } });
    }

    if (action === 'update_notes') {
      const [updated] = await db
        .update(comandas)
        .set({ notes, updatedAt: new Date() })
        .where(eq(comandas.id, comanda.id))
        .returning();
      return NextResponse.json({ success: true, comanda: updated });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('Error updating comanda:', error);
    return NextResponse.json({ error: 'Erro ao atualizar comanda' }, { status: 500 });
  }
});
