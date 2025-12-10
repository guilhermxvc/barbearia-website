import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { timeBlocks, barbers, users } from '@/lib/db/schema';
import { eq, and, gte, lte, or } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'barbershop-secret-key';

function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; userType: string };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const barbershopId = searchParams.get('barbershopId');
    const barberId = searchParams.get('barberId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!barbershopId) {
      return NextResponse.json({ success: false, error: 'ID da barbearia é obrigatório' }, { status: 400 });
    }

    let query = db.select({
      block: timeBlocks,
      barber: barbers,
      user: users
    })
      .from(timeBlocks)
      .leftJoin(barbers, eq(timeBlocks.barberId, barbers.id))
      .leftJoin(users, eq(barbers.userId, users.id))
      .where(and(
        eq(timeBlocks.barbershopId, barbershopId),
        eq(timeBlocks.isActive, true)
      ));

    const blocks = await query;

    const formattedBlocks = blocks.map(b => ({
      ...b.block,
      barber: b.barber ? {
        id: b.barber.id,
        name: b.user?.firstName + ' ' + b.user?.lastName
      } : null
    }));

    return NextResponse.json({ success: true, blocks: formattedBlocks });
  } catch (error) {
    console.error('Error fetching time blocks:', error);
    return NextResponse.json({ success: false, error: 'Erro ao buscar bloqueios' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { barbershopId, barberId, title, description, startDate, endDate, allDay, blockType } = body;

    if (!barbershopId || !title || !startDate || !endDate || !blockType) {
      return NextResponse.json({ success: false, error: 'Dados obrigatórios faltando' }, { status: 400 });
    }

    const [block] = await db.insert(timeBlocks)
      .values({
        barbershopId,
        barberId: barberId || null,
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        allDay: allDay || false,
        blockType,
        createdBy: user.userId,
      })
      .returning();

    return NextResponse.json({ success: true, block });
  } catch (error) {
    console.error('Error creating time block:', error);
    return NextResponse.json({ success: false, error: 'Erro ao criar bloqueio' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, description, startDate, endDate, allDay, blockType, barberId } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID do bloqueio é obrigatório' }, { status: 400 });
    }

    const [updated] = await db.update(timeBlocks)
      .set({
        title,
        description,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        allDay,
        blockType,
        barberId: barberId || null,
        updatedAt: new Date()
      })
      .where(eq(timeBlocks.id, id))
      .returning();

    return NextResponse.json({ success: true, block: updated });
  } catch (error) {
    console.error('Error updating time block:', error);
    return NextResponse.json({ success: false, error: 'Erro ao atualizar bloqueio' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const blockId = searchParams.get('id');

    if (!blockId) {
      return NextResponse.json({ success: false, error: 'ID do bloqueio é obrigatório' }, { status: 400 });
    }

    await db.update(timeBlocks)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(timeBlocks.id, blockId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting time block:', error);
    return NextResponse.json({ success: false, error: 'Erro ao remover bloqueio' }, { status: 500 });
  }
}
