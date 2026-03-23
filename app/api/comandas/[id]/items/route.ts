import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comandas, comandaItems, barbershops } from '@/lib/db/schema';
import { withAuth } from '@/lib/middleware';
import { eq, and } from 'drizzle-orm';

export const POST = withAuth(['manager', 'barber'])(async (req, { params }: { params: { id: string } }) => {
  try {
    const body = await req.json();
    const { type, itemId, name, price, qty } = body;

    if (!type || !name || !price || !qty) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const comanda = await db.query.comandas.findFirst({ where: eq(comandas.id, params.id) });
    if (!comanda) return NextResponse.json({ error: 'Comanda não encontrada' }, { status: 404 });
    if (comanda.status === 'closed') return NextResponse.json({ error: 'Comanda já está fechada' }, { status: 400 });

    const barbershop = await db.query.barbershops.findFirst({
      where: and(eq(barbershops.id, comanda.barbershopId), eq(barbershops.ownerId, req.user!.id)),
    });
    if (!barbershop) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

    const unitPrice = parseFloat(price);
    const quantity = parseInt(qty);
    const subtotal = unitPrice * quantity;

    const [item] = await db
      .insert(comandaItems)
      .values({
        comandaId: comanda.id,
        type,
        itemId: itemId || null,
        name,
        price: String(unitPrice),
        qty: quantity,
        subtotal: String(subtotal),
      })
      .returning();

    const allItems = await db.select().from(comandaItems).where(eq(comandaItems.comandaId, comanda.id));
    const newTotal = allItems.reduce((acc, i) => acc + parseFloat(i.subtotal), 0);

    await db
      .update(comandas)
      .set({ totalAmount: String(newTotal), updatedAt: new Date() })
      .where(eq(comandas.id, comanda.id));

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error) {
    console.error('Error adding comanda item:', error);
    return NextResponse.json({ error: 'Erro ao adicionar item' }, { status: 500 });
  }
});

export const DELETE = withAuth(['manager', 'barber'])(async (req, { params }: { params: { id: string } }) => {
  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) return NextResponse.json({ error: 'itemId é obrigatório' }, { status: 400 });

    const comanda = await db.query.comandas.findFirst({ where: eq(comandas.id, params.id) });
    if (!comanda) return NextResponse.json({ error: 'Comanda não encontrada' }, { status: 404 });
    if (comanda.status === 'closed') return NextResponse.json({ error: 'Comanda já está fechada' }, { status: 400 });

    const barbershop = await db.query.barbershops.findFirst({
      where: and(eq(barbershops.id, comanda.barbershopId), eq(barbershops.ownerId, req.user!.id)),
    });
    if (!barbershop) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

    await db.delete(comandaItems).where(and(eq(comandaItems.id, itemId), eq(comandaItems.comandaId, comanda.id)));

    const remaining = await db.select().from(comandaItems).where(eq(comandaItems.comandaId, comanda.id));
    const newTotal = remaining.reduce((acc, i) => acc + parseFloat(i.subtotal), 0);
    await db.update(comandas).set({ totalAmount: String(newTotal), updatedAt: new Date() }).where(eq(comandas.id, comanda.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comanda item:', error);
    return NextResponse.json({ error: 'Erro ao remover item' }, { status: 500 });
  }
});
