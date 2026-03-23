import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { commissionReceipts, barbers } from '@/lib/db/schema';
import { withAuth } from '@/lib/middleware';
import { eq, desc } from 'drizzle-orm';

export const GET = withAuth(['barber'])(async (req) => {
  try {
    const barber = await db.query.barbers.findFirst({
      where: eq(barbers.userId, req.user!.id),
    });

    if (!barber) {
      return NextResponse.json({ error: 'Barbeiro não encontrado' }, { status: 404 });
    }

    const receipts = await db
      .select()
      .from(commissionReceipts)
      .where(eq(commissionReceipts.barberId, barber.id))
      .orderBy(desc(commissionReceipts.paidAt));

    return NextResponse.json({ success: true, receipts });
  } catch (error) {
    console.error('Error fetching barber receipts:', error);
    return NextResponse.json({ error: 'Erro ao buscar recibos' }, { status: 500 });
  }
});
