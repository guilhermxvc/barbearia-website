import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, barbers, clients, barbershops } from '@/lib/db/schema';
import { withAuth } from '@/lib/middleware';
import { eq } from 'drizzle-orm';

// GET /api/user/profile - Obter perfil do usuário logado
export const GET = withAuth()(async (req) => {
  try {
    const userId = req.user!.id;

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        password: false, // Não retornar senha
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    let additionalData = {};

    // Se for barbeiro, buscar dados do barbeiro
    if (user.userType === 'barber') {
      const barberData = await db.query.barbers.findFirst({
        where: eq(barbers.userId, userId),
        with: {
          barbershop: {
            columns: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      additionalData = {
        barber: barberData,
      };
    }

    // Se for cliente, buscar dados do cliente
    if (user.userType === 'client') {
      const clientData = await db.query.clients.findFirst({
        where: eq(clients.userId, userId),
      });

      additionalData = {
        client: clientData,
      };
    }

    // Se for manager, buscar dados da barbearia
    if (user.userType === 'manager') {
      const barbershopData = await db.query.barbershops.findFirst({
        where: eq(barbershops.ownerId, userId),
      });

      additionalData = {
        barbershop: barbershopData,
      };
    }

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        ...additionalData,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar perfil' },
      { status: 500 }
    );
  }
});

// PUT /api/user/profile - Atualizar perfil do usuário
export const PUT = withAuth()(async (req) => {
  try {
    const userId = req.user!.id;
    const body = await req.json();
    const { name, phone, ...additionalData } = body;

    // Atualizar dados básicos do usuário
    const [updatedUser] = await db
      .update(users)
      .set({
        name,
        phone,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        phone: users.phone,
        userType: users.userType,
      });

    // Atualizar dados específicos por tipo de usuário
    if (req.user!.userType === 'barber' && additionalData.specialties) {
      await db
        .update(barbers)
        .set({
          specialties: additionalData.specialties,
          updatedAt: new Date(),
        })
        .where(eq(barbers.userId, userId));
    }

    if (req.user!.userType === 'client' && additionalData.preferences) {
      await db
        .update(clients)
        .set({
          preferences: additionalData.preferences,
          updatedAt: new Date(),
        })
        .where(eq(clients.userId, userId));
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar perfil' },
      { status: 500 }
    );
  }
});