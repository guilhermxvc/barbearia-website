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
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { z } from 'zod';

const createAppointmentSchema = insertAppointmentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// GET /api/appointments - Listar agendamentos
export const GET = withAuth(['client', 'barber', 'manager'])(async (req) => {
  try {
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

    // Verificar se o horário está disponível
    const conflictingAppointment = await db.query.appointments.findFirst({
      where: and(
        eq(appointments.barberId, data.barberId),
        eq(appointments.scheduledAt, data.scheduledAt),
        eq(appointments.status, 'confirmed')
      ),
    });

    if (conflictingAppointment) {
      return NextResponse.json(
        { error: 'Horário não disponível' },
        { status: 400 }
      );
    }

    const [newAppointment] = await db
      .insert(appointments)
      .values({
        ...data,
        clientId: client.id,
        status: 'pending',
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