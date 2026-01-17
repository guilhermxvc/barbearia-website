import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  appointments,
  barbershops,
  clients,
  barbers,
  services,
  users,
  insertAppointmentSchema,
} from '@/lib/db/schema';
import { withAuth } from '@/lib/middleware';
import { eq, and, desc, gte, lte, inArray } from 'drizzle-orm';
import { z } from 'zod';

async function updateAppointmentStatusesAutomatically() {
  const now = new Date();
  
  const activeAppointments = await db
    .select()
    .from(appointments)
    .where(
      inArray(appointments.status, ['confirmed', 'in_progress'])
    );
  
  for (const apt of activeAppointments) {
    const scheduledAt = new Date(apt.scheduledAt);
    const endTime = new Date(scheduledAt.getTime() + apt.duration * 60000);
    
    if (apt.status === 'confirmed' && now >= scheduledAt && now < endTime) {
      await db
        .update(appointments)
        .set({ status: 'in_progress', updatedAt: now })
        .where(eq(appointments.id, apt.id));
    } else if ((apt.status === 'confirmed' || apt.status === 'in_progress') && now >= endTime) {
      await db
        .update(appointments)
        .set({ status: 'completed', updatedAt: now })
        .where(eq(appointments.id, apt.id));
    }
  }
}

const createAppointmentSchema = z.object({
  barbershopId: z.string().uuid(),
  barberId: z.string().uuid(),
  serviceId: z.string().uuid(),
  scheduledAt: z.string().transform((val) => new Date(val)),
  duration: z.number().min(15).max(480),
  totalPrice: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/appointments - Listar agendamentos
export const GET = withAuth(['client', 'barber', 'manager'])(async (req) => {
  try {
    await updateAppointmentStatusesAutomatically();
    
    const { searchParams } = new URL(req.url);
    const barbershopId = searchParams.get('barbershopId');
    const barberId = searchParams.get('barberId');
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');
    const date = searchParams.get('date');

    let whereConditions: any = [];

    // Aplicar controle de acesso baseado no tipo de usuário
    const userRole = req.user!.userType;

    if (userRole === 'client') {
      // Cliente só pode ver seus próprios agendamentos
      const client = await db.query.clients.findFirst({
        where: eq(clients.userId, req.user!.id),
      });

      if (!client) {
        return NextResponse.json(
          { error: 'Perfil de cliente não encontrado' },
          { status: 404 }
        );
      }

      // Forçar clientId para o cliente logado, ignorar outros filtros
      whereConditions.push(eq(appointments.clientId, client.id));
    } else if (userRole === 'barber') {
      // Barbeiro pode ver APENAS seus próprios agendamentos
      const barber = await db.query.barbers.findFirst({
        where: eq(barbers.userId, req.user!.id),
      });

      if (!barber) {
        return NextResponse.json(
          { error: 'Perfil de barbeiro não encontrado' },
          { status: 404 }
        );
      }

      // Forçar filtro por barbeiro específico (isolamento multi-tenant)
      whereConditions.push(eq(appointments.barberId, barber.id));
      whereConditions.push(eq(appointments.barbershopId, barber.barbershopId));
    } else if (userRole === 'manager') {
      // Manager pode ver agendamentos da sua barbearia
      if (!barbershopId) {
        return NextResponse.json(
          { error: 'ID da barbearia é obrigatório para managers' },
          { status: 400 }
        );
      }

      const barbershop = await db.query.barbershops.findFirst({
        where: eq(barbershops.id, barbershopId),
      });

      if (!barbershop || barbershop.ownerId !== req.user!.id) {
        return NextResponse.json(
          { error: 'Acesso negado' },
          { status: 403 }
        );
      }

      whereConditions.push(eq(appointments.barbershopId, barbershopId));

      if (barberId) {
        whereConditions.push(eq(appointments.barberId, barberId));
      }

      if (clientId) {
        whereConditions.push(eq(appointments.clientId, clientId));
      }
    } else {
      // Tipo de usuário não autorizado
      return NextResponse.json(
        { error: 'Tipo de usuário não autorizado' },
        { status: 403 }
      );
    }

    // Verificação defensiva: garantir que há pelo menos uma condição aplicada
    if (whereConditions.length === 0) {
      return NextResponse.json(
        { error: 'Acesso negado - condições insuficientes' },
        { status: 403 }
      );
    }

    if (status) {
      whereConditions.push(eq(appointments.status, status as any));
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      whereConditions.push(
        and(
          gte(appointments.scheduledAt, startDate),
          lte(appointments.scheduledAt, endDate)
        )
      );
    }

    const appointmentsList = await db
      .select({
        id: appointments.id,
        scheduledAt: appointments.scheduledAt,
        duration: appointments.duration,
        status: appointments.status,
        notes: appointments.notes,
        totalPrice: appointments.totalPrice,
        clientId: clients.id,
        clientName: users.name,
        clientPhone: users.phone,
        barberId: barbers.id,
        serviceId: services.id,
        serviceName: services.name,
        servicePrice: services.price,
        barbershopName: barbershops.name,
      })
      .from(appointments)
      .innerJoin(clients, eq(appointments.clientId, clients.id))
      .innerJoin(users, eq(clients.userId, users.id))
      .innerJoin(barbers, eq(appointments.barberId, barbers.id))
      .innerJoin(services, eq(appointments.serviceId, services.id))
      .innerJoin(barbershops, eq(appointments.barbershopId, barbershops.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(appointments.scheduledAt));

    // Buscar nomes dos barbeiros separadamente para evitar conflito de alias
    const appointmentsWithBarberNames = await Promise.all(
      appointmentsList.map(async (appointment) => {
        const barberUser = await db
          .select({ name: users.name })
          .from(users)
          .innerJoin(barbers, eq(barbers.userId, users.id))
          .where(eq(barbers.id, appointment.barberId))
          .limit(1);

        return {
          id: appointment.id,
          scheduledAt: appointment.scheduledAt,
          duration: appointment.duration,
          status: appointment.status,
          notes: appointment.notes,
          totalPrice: appointment.totalPrice,
          client: {
            id: appointment.clientId,
            name: appointment.clientName,
            phone: appointment.clientPhone,
          },
          barber: {
            id: appointment.barberId,
            name: barberUser[0]?.name || 'N/A',
          },
          service: {
            id: appointment.serviceId,
            name: appointment.serviceName,
            price: appointment.servicePrice,
          },
          barbershop: {
            name: appointment.barbershopName,
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      appointments: appointmentsWithBarberNames,
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar agendamentos' },
      { status: 500 }
    );
  }
});

// POST /api/appointments - Criar novo agendamento
export const POST = withAuth(['client'])(async (req) => {
  try {
    const body = await req.json();
    const data = createAppointmentSchema.parse(body);

    // Verificar se o cliente está fazendo o agendamento para si mesmo
    const client = await db.query.clients.findFirst({
      where: eq(clients.userId, req.user!.id),
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Perfil de cliente não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o barbeiro existe e está ativo
    const barber = await db.query.barbers.findFirst({
      where: eq(barbers.id, data.barberId),
    });

    if (!barber || !barber.isActive) {
      return NextResponse.json(
        { error: 'Barbeiro não encontrado ou inativo' },
        { status: 400 }
      );
    }

    // Verificar horário de funcionamento da barbearia e disponibilidade do barbeiro
    const scheduledDate = data.scheduledAt;
    const dayOfWeek = scheduledDate.getDay();
    const scheduledTime = scheduledDate.toTimeString().slice(0, 5);
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayKey = dayNames[dayOfWeek];

    // Buscar horários de funcionamento da barbearia
    const barbershop = await db.query.barbershops.findFirst({
      where: eq(barbershops.id, data.barbershopId),
    });

    if (!barbershop) {
      return NextResponse.json(
        { error: 'Barbearia não encontrada' },
        { status: 404 }
      );
    }

    const businessHours = barbershop.businessHours as Record<string, any> | null;
    if (businessHours && businessHours[dayKey]) {
      const dayHours = businessHours[dayKey];
      const isOpen = dayHours.isOpen ?? dayHours.enabled ?? false;
      
      if (!isOpen) {
        return NextResponse.json(
          { error: 'A barbearia está fechada neste dia' },
          { status: 400 }
        );
      }

      const openTime = dayHours.openTime || '08:00';
      const closeTime = dayHours.closeTime || '18:00';

      if (scheduledTime < openTime || scheduledTime >= closeTime) {
        return NextResponse.json(
          { error: `A barbearia só funciona entre ${openTime} e ${closeTime} neste dia` },
          { status: 400 }
        );
      }
    }

    // Verificar se há bloqueio de horário para o barbeiro
    const { timeBlocks } = await import('@/lib/db/schema');
    const blocks = await db
      .select()
      .from(timeBlocks)
      .where(
        and(
          eq(timeBlocks.barbershopId, data.barbershopId),
          eq(timeBlocks.isActive, true)
        )
      );

    const appointmentEndTime = new Date(scheduledDate.getTime() + data.duration * 60000);
    const hasBlockConflict = blocks.some(block => {
      if (block.barberId && block.barberId !== data.barberId) return false;
      
      const blockStart = new Date(block.startDate);
      const blockEnd = new Date(block.endDate);
      
      return (scheduledDate < blockEnd && appointmentEndTime > blockStart);
    });

    if (hasBlockConflict) {
      return NextResponse.json(
        { error: 'O barbeiro está bloqueado neste horário' },
        { status: 400 }
      );
    }

    // Verificar se há conflito com agendamentos existentes do barbeiro
    
    const existingAppointments = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.barberId, data.barberId),
          gte(appointments.scheduledAt, new Date(scheduledDate.getTime() - 480 * 60000)),
          lte(appointments.scheduledAt, appointmentEndTime)
        )
      );

    const hasConflict = existingAppointments.some(apt => {
      if (apt.status === 'cancelled' || apt.status === 'no_show') return false;
      
      const aptStart = new Date(apt.scheduledAt);
      const aptEnd = new Date(aptStart.getTime() + apt.duration * 60000);
      
      return (scheduledDate < aptEnd && appointmentEndTime > aptStart);
    });

    if (hasConflict) {
      return NextResponse.json(
        { error: 'O barbeiro já possui um agendamento neste horário' },
        { status: 400 }
      );
    }

    const [newAppointment] = await db
      .insert(appointments)
      .values({
        barbershopId: data.barbershopId,
        barberId: data.barberId,
        serviceId: data.serviceId,
        clientId: client.id,
        scheduledAt: scheduledDate,
        duration: data.duration,
        totalPrice: data.totalPrice || '0',
        notes: data.notes || null,
        status: 'confirmed',
      })
      .returning();

    return NextResponse.json({
      success: true,
      appointment: newAppointment,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Create appointment error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar agendamento' },
      { status: 500 }
    );
  }
});