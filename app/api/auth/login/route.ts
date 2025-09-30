import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, generateToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { barbershops, barbers, clients } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    const user = await authenticateUser(email, password);
    if (!user) {
      return NextResponse.json(
        { error: 'Email ou senha inválidos' },
        { status: 401 }
      );
    }

    const token = generateToken(user);

    // Buscar dados específicos baseados no tipo de usuário
    let userData: any = { 
      id: user.id,
      email: user.email,
      name: user.name,
      userType: user.userType,
    }
    let barbershopId: string | null = null
    
    if (user.userType === 'manager') {
      const barbershop = await db.query.barbershops.findFirst({
        where: eq(barbershops.ownerId, user.id),
      })
      userData.barbershop = barbershop
      barbershopId = barbershop?.id || null
    } else if (user.userType === 'barber') {
      const barber = await db.query.barbers.findFirst({
        where: eq(barbers.userId, user.id),
      })
      if (barber) {
        userData.barber = barber
        barbershopId = barber.barbershopId
      }
    } else if (user.userType === 'client') {
      const client = await db.query.clients.findFirst({
        where: eq(clients.userId, user.id),
      })
      userData.client = client
      // Clientes não têm barbershopId próprio
    }

    return NextResponse.json({
      token,
      user: userData,
      barbershopId, // Incluir barbershopId na resposta
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}