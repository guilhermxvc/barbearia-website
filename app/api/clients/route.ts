import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clients, users, barbers, barbershops, appointments } from '@/lib/db/schema';
import { withAuth } from '@/lib/middleware';
import { eq, and, like, desc } from 'drizzle-orm';
import { z } from 'zod';

const createClientSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  preferences: z.object({}).optional(),
});

// GET /api/clients - Listar clientes de uma barbearia
export const GET = withAuth(['manager', 'barber'])(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const barbershopId = searchParams.get('barbershopId');
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    if (!barbershopId) {
      return NextResponse.json(
        { error: 'ID da barbearia é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o usuário tem acesso à barbearia
    if (req.user!.userType === 'barber') {
      const barber = await db.query.barbers.findFirst({
        where: eq(barbers.userId, req.user!.id),
      });
      
      if (!barber || barber.barbershopId !== barbershopId) {
        return NextResponse.json(
          { error: 'Acesso negado' },
          { status: 403 }
        );
      }
    } else if (req.user!.userType === 'manager') {
      const barbershop = await db.query.barbershops.findFirst({
        where: eq(barbershops.id, barbershopId),
      });
      
      if (!barbershop || barbershop.ownerId !== req.user!.id) {
        return NextResponse.json(
          { error: 'Acesso negado' },
          { status: 403 }
        );
      }
    }

    let whereConditions: any = [];

    // Buscar clientes que tenham agendamentos nesta barbearia
    const clientsList = await db
      .select({
        id: clients.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        totalVisits: clients.totalVisits,
        totalSpent: clients.totalSpent,
        lastVisit: clients.lastVisit,
        preferences: clients.preferences,
        createdAt: clients.createdAt,
      })
      .from(clients)
      .innerJoin(users, eq(clients.userId, users.id))
      .leftJoin(appointments, eq(appointments.clientId, clients.id))
      .where(eq(appointments.barbershopId, barbershopId))
      .groupBy(clients.id, users.id)
      .orderBy(desc(clients.createdAt));

    // Filtrar por busca se fornecida
    let filteredClients = clientsList;
    if (search) {
      filteredClients = clientsList.filter(client => 
        client.name?.toLowerCase().includes(search.toLowerCase()) ||
        client.email?.toLowerCase().includes(search.toLowerCase()) ||
        client.phone?.includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      clients: filteredClients,
    });
  } catch (error) {
    console.error('Get clients error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar clientes' },
      { status: 500 }
    );
  }
});

// POST /api/clients - Criar novo cliente
export const POST = withAuth(['manager', 'barber'])(async (req) => {
  try {
    const body = await req.json();
    const { barbershopId, ...clientData } = body;
    const validatedData = createClientSchema.parse(clientData);

    if (!barbershopId) {
      return NextResponse.json(
        { error: 'ID da barbearia é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se já existe um usuário com este email
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, validatedData.email),
    });

    if (existingUser) {
      // Verificar se já é cliente
      const existingClient = await db.query.clients.findFirst({
        where: eq(clients.userId, existingUser.id),
      });

      if (existingClient) {
        return NextResponse.json(
          { error: 'Este email já está cadastrado como cliente' },
          { status: 400 }
        );
      }

      // Criar entrada de cliente para usuário existente
      await db.insert(clients).values({
        userId: existingUser.id,
        preferences: validatedData.preferences || {},
        totalVisits: 0,
        totalSpent: '0.00',
      });
    } else {
      // Criar novo usuário e cliente
      const newUser = await db.insert(users).values({
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        userType: 'client',
        password: '', // Cliente será criado sem senha inicialmente
      }).returning();

      await db.insert(clients).values({
        userId: newUser[0].id,
        preferences: validatedData.preferences || {},
        totalVisits: 0,
        totalSpent: '0.00',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Cliente criado com sucesso',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Create client error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar cliente' },
      { status: 500 }
    );
  }
});