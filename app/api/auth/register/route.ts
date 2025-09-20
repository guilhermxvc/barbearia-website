import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, barbershops, barbers, clients } from '@/lib/db/schema';
import { hashPassword, generateToken } from '@/lib/auth';
import { z } from 'zod';
import { eq } from 'drizzle-orm';

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phone: z.string().optional(),
  userType: z.enum(['manager', 'barber', 'client'], {
    required_error: 'Tipo de usuário é obrigatório',
  }),
  // Campos específicos para manager
  barbershopName: z.string().optional(),
  barbershopAddress: z.string().optional(),
  barbershopPhone: z.string().optional(),
  subscriptionPlan: z.enum(['basico', 'profissional', 'premium']).optional(),
  // Campos específicos para barber
  barbershopCode: z.string().optional(),
  specialties: z.array(z.string()).optional(),
});

function generateBarbershopCode(): string {
  return 'BB' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    // Verificar se o email já existe
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, data.email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já está em uso' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(data.password);

    // Criar usuário
    const [newUser] = await db
      .insert(users)
      .values({
        email: data.email,
        password: hashedPassword,
        name: data.name,
        phone: data.phone,
        userType: data.userType,
      })
      .returning();

    let barbershopId: string | undefined;

    // Se for manager, criar barbearia
    if (data.userType === 'manager') {
      const [newBarbershop] = await db
        .insert(barbershops)
        .values({
          ownerId: newUser.id,
          name: data.barbershopName || `${data.name}'s Barbershop`,
          address: data.barbershopAddress,
          phone: data.barbershopPhone,
          email: data.email,
          subscriptionPlan: data.subscriptionPlan || 'basico',
          code: generateBarbershopCode(),
        })
        .returning();

      barbershopId = newBarbershop.id;
    }

    // Se for barber, criar perfil de barbeiro
    if (data.userType === 'barber') {
      let barbershopToLink: string | undefined;

      // Se forneceu código de barbearia, tentar vincular
      if (data.barbershopCode) {
        const barbershop = await db.query.barbershops.findFirst({
          where: eq(barbershops.code, data.barbershopCode),
        });

        if (barbershop) {
          barbershopToLink = barbershop.id;
        }
      }

      await db.insert(barbers).values({
        userId: newUser.id,
        barbershopId: barbershopToLink,
        specialties: data.specialties || [],
        isApproved: !barbershopToLink, // Se não tem barbearia, já aprovado
      });
    }

    // Se for client, criar perfil de cliente
    if (data.userType === 'client') {
      await db.insert(clients).values({
        userId: newUser.id,
      });
    }

    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      userType: newUser.userType as 'manager' | 'barber' | 'client',
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        userType: newUser.userType,
      },
      barbershopId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}