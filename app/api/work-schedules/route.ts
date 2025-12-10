import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { barberWorkSchedules, barbers, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
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

    if (!barbershopId) {
      return NextResponse.json({ success: false, error: 'ID da barbearia é obrigatório' }, { status: 400 });
    }

    let schedules;
    if (barberId) {
      schedules = await db.select()
        .from(barberWorkSchedules)
        .where(and(
          eq(barberWorkSchedules.barbershopId, barbershopId),
          eq(barberWorkSchedules.barberId, barberId),
          eq(barberWorkSchedules.isActive, true)
        ));
    } else {
      schedules = await db.select({
        schedule: barberWorkSchedules,
        barber: barbers,
        user: users
      })
        .from(barberWorkSchedules)
        .leftJoin(barbers, eq(barberWorkSchedules.barberId, barbers.id))
        .leftJoin(users, eq(barbers.userId, users.id))
        .where(and(
          eq(barberWorkSchedules.barbershopId, barbershopId),
          eq(barberWorkSchedules.isActive, true)
        ));
    }

    return NextResponse.json({ success: true, schedules });
  } catch (error) {
    console.error('Error fetching work schedules:', error);
    return NextResponse.json({ success: false, error: 'Erro ao buscar jornadas de trabalho' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { barbershopId, barberId, dayOfWeek, startTime, endTime } = body;

    if (!barbershopId || !barberId || dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json({ success: false, error: 'Dados obrigatórios faltando' }, { status: 400 });
    }

    const existingSchedule = await db.select()
      .from(barberWorkSchedules)
      .where(and(
        eq(barberWorkSchedules.barberId, barberId),
        eq(barberWorkSchedules.dayOfWeek, dayOfWeek),
        eq(barberWorkSchedules.isActive, true)
      ))
      .limit(1);

    if (existingSchedule.length > 0) {
      const [updated] = await db.update(barberWorkSchedules)
        .set({ startTime, endTime, updatedAt: new Date() })
        .where(eq(barberWorkSchedules.id, existingSchedule[0].id))
        .returning();
      return NextResponse.json({ success: true, schedule: updated });
    }

    const [schedule] = await db.insert(barberWorkSchedules)
      .values({
        barbershopId,
        barberId,
        dayOfWeek,
        startTime,
        endTime,
      })
      .returning();

    return NextResponse.json({ success: true, schedule });
  } catch (error) {
    console.error('Error creating work schedule:', error);
    return NextResponse.json({ success: false, error: 'Erro ao criar jornada de trabalho' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('id');
    const barberId = searchParams.get('barberId');
    const dayOfWeek = searchParams.get('dayOfWeek');

    if (scheduleId) {
      await db.update(barberWorkSchedules)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(barberWorkSchedules.id, scheduleId));
    } else if (barberId && dayOfWeek !== null) {
      await db.update(barberWorkSchedules)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(
          eq(barberWorkSchedules.barberId, barberId),
          eq(barberWorkSchedules.dayOfWeek, parseInt(dayOfWeek)),
          eq(barberWorkSchedules.isActive, true)
        ));
    } else {
      return NextResponse.json({ success: false, error: 'ID do horário ou barberId+dayOfWeek são obrigatórios' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting work schedule:', error);
    return NextResponse.json({ success: false, error: 'Erro ao remover jornada de trabalho' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { barbershopId, barberId, schedules } = body;

    if (!barbershopId || !barberId || !Array.isArray(schedules)) {
      return NextResponse.json({ success: false, error: 'Dados obrigatórios faltando' }, { status: 400 });
    }

    await db.update(barberWorkSchedules)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(
        eq(barberWorkSchedules.barberId, barberId),
        eq(barberWorkSchedules.isActive, true)
      ));

    const activeSchedules = schedules.filter((s: any) => s.isActive);
    const createdSchedules = [];

    for (const schedule of activeSchedules) {
      const [newSchedule] = await db.insert(barberWorkSchedules)
        .values({
          barbershopId,
          barberId,
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          isActive: true,
        })
        .returning();
      createdSchedules.push(newSchedule);
    }

    return NextResponse.json({ success: true, schedules: createdSchedules });
  } catch (error) {
    console.error('Error updating work schedules:', error);
    return NextResponse.json({ success: false, error: 'Erro ao atualizar jornadas de trabalho' }, { status: 500 });
  }
}
