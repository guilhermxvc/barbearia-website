import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { appointments, barbershops, barbers, clients, sales, paymentMethodEnum } from '@/lib/db/schema';
import { withAuth } from '@/lib/middleware';
import { eq, and } from 'drizzle-orm';

// GET /api/appointments/[id] - Obter agendamento específico
export const GET = withAuth()(async (req, context) => {
  try {
    const { params } = context;
    const { id } = params;

    const appointment = await db.query.appointments.findFirst({
      where: eq(appointments.id, id),
    });

    if (!appointment) {
      return NextResponse.json(
        { error: 'Agendamento não encontrado' },
        { status: 404 }
      );
    }

    // Verificar permissões baseadas no tipo de usuário
    if (req.user!.userType === 'client') {
      // Cliente só pode ver seus próprios agendamentos
      const client = await db.query.clients.findFirst({
        where: eq(clients.userId, req.user!.id),
      });

      if (!client || appointment.clientId !== client.id) {
        return NextResponse.json(
          { error: 'Acesso negado' },
          { status: 403 }
        );
      }
    } else if (req.user!.userType === 'barber') {
      // Barbeiro pode ver agendamentos da sua barbearia
      const barber = await db.query.barbers.findFirst({
        where: eq(barbers.userId, req.user!.id),
      });

      if (!barber || appointment.barbershopId !== barber.barbershopId) {
        return NextResponse.json(
          { error: 'Acesso negado' },
          { status: 403 }
        );
      }
    } else if (req.user!.userType === 'manager') {
      // Manager pode ver agendamentos da sua barbearia
      const barbershop = await db.query.barbershops.findFirst({
        where: eq(barbershops.id, appointment.barbershopId),
      });

      if (!barbershop || barbershop.ownerId !== req.user!.id) {
        return NextResponse.json(
          { error: 'Acesso negado' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      appointment,
    });
  } catch (error) {
    console.error('Get appointment error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar agendamento' },
      { status: 500 }
    );
  }
});

// PUT /api/appointments/[id] - Atualizar status do agendamento
export const PUT = withAuth(['manager', 'barber'])(async (req, context) => {
  try {
    const { params } = context;
    const { id } = params;
    const body = await req.json();
    const { status, notes, paymentMethod } = body;

    if (!status || !['pending', 'confirmed', 'in_progress', 'finished', 'completed', 'cancelled', 'no_show'].includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      );
    }

    // Se status é 'completed', paymentMethod é obrigatório
    if (status === 'completed' && !paymentMethod) {
      return NextResponse.json(
        { error: 'Método de pagamento é obrigatório para concluir' },
        { status: 400 }
      );
    }

    // Validar método de pagamento
    if (paymentMethod && !paymentMethodEnum.includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Método de pagamento inválido' },
        { status: 400 }
      );
    }

    // Verificar se o agendamento existe
    const appointment = await db.query.appointments.findFirst({
      where: eq(appointments.id, id),
    });

    if (!appointment) {
      return NextResponse.json(
        { error: 'Agendamento não encontrado' },
        { status: 404 }
      );
    }

    // Verificar permissões
    if (req.user!.userType === 'manager') {
      // Manager pode atualizar qualquer agendamento da sua barbearia
      const barbershop = await db.query.barbershops.findFirst({
        where: eq(barbershops.id, appointment.barbershopId),
      });

      if (!barbershop || barbershop.ownerId !== req.user!.id) {
        return NextResponse.json(
          { error: 'Acesso negado' },
          { status: 403 }
        );
      }
    } else if (req.user!.userType === 'barber') {
      // Barbeiro só pode atualizar seus próprios agendamentos
      const barber = await db.query.barbers.findFirst({
        where: eq(barbers.userId, req.user!.id),
      });

      if (!barber || appointment.barberId !== barber.id) {
        return NextResponse.json(
          { error: 'Acesso negado' },
          { status: 403 }
        );
      }
    }

    // Atualizar o agendamento
    const updateData: any = {
      status: status as any,
      notes: notes || appointment.notes,
      updatedAt: new Date(),
    };
    
    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod;
    }

    const [updatedAppointment] = await db
      .update(appointments)
      .set(updateData)
      .where(eq(appointments.id, id))
      .returning();

    // Se o status mudou para 'completed', criar uma venda (sale) para o financeiro
    // Só criar se ainda não existe uma venda para este agendamento
    if (status === 'completed' && paymentMethod) {
      const existingSale = await db.query.sales.findFirst({
        where: eq(sales.appointmentId, appointment.id),
      });

      if (!existingSale) {
        await db.insert(sales).values({
          barbershopId: appointment.barbershopId,
          clientId: appointment.clientId,
          barberId: appointment.barberId,
          appointmentId: appointment.id,
          items: JSON.stringify([{
            type: 'service',
            serviceId: appointment.serviceId,
            quantity: 1,
            price: appointment.totalPrice
          }]),
          totalAmount: appointment.totalPrice,
          discount: '0.00',
          paymentMethod: paymentMethod,
        });
      }
    }

    return NextResponse.json({
      success: true,
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar agendamento' },
      { status: 500 }
    );
  }
});

// DELETE /api/appointments/[id] - Cancelar agendamento
export const DELETE = withAuth(['manager', 'barber', 'client'])(async (req, context) => {
  try {
    const { params } = context;
    const { id } = params;

    // Verificar se o agendamento existe
    const appointment = await db.query.appointments.findFirst({
      where: eq(appointments.id, id),
    });

    if (!appointment) {
      return NextResponse.json(
        { error: 'Agendamento não encontrado' },
        { status: 404 }
      );
    }

    // Verificar permissões baseadas no tipo de usuário
    if (req.user!.userType === 'client') {
      // Cliente só pode cancelar seus próprios agendamentos
      const client = await db.query.clients.findFirst({
        where: eq(clients.userId, req.user!.id),
      });

      if (!client || appointment.clientId !== client.id) {
        return NextResponse.json(
          { error: 'Acesso negado' },
          { status: 403 }
        );
      }
    } else if (req.user!.userType === 'barber') {
      // Barbeiro pode cancelar seus agendamentos
      const barber = await db.query.barbers.findFirst({
        where: eq(barbers.userId, req.user!.id),
      });

      if (!barber || appointment.barberId !== barber.id) {
        return NextResponse.json(
          { error: 'Acesso negado' },
          { status: 403 }
        );
      }
    } else if (req.user!.userType === 'manager') {
      // Manager pode cancelar qualquer agendamento da sua barbearia
      const barbershop = await db.query.barbershops.findFirst({
        where: eq(barbershops.id, appointment.barbershopId),
      });

      if (!barbershop || barbershop.ownerId !== req.user!.id) {
        return NextResponse.json(
          { error: 'Acesso negado' },
          { status: 403 }
        );
      }
    }

    // Se já está cancelado, deletar definitivamente; caso contrário, apenas cancelar
    if (appointment.status === 'cancelled') {
      await db.delete(appointments).where(eq(appointments.id, id));
      return NextResponse.json({
        success: true,
        message: 'Agendamento removido da agenda',
      });
    }

    // Cancelar o agendamento
    const [cancelledAppointment] = await db
      .update(appointments)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      appointment: cancelledAppointment,
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    return NextResponse.json(
      { error: 'Erro ao cancelar agendamento' },
      { status: 500 }
    );
  }
});