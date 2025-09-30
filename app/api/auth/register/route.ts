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
  // Formato XX-XXXX (2 letras + hífen + 4 números)
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const letter1 = letters.charAt(Math.floor(Math.random() * letters.length));
  const letter2 = letters.charAt(Math.floor(Math.random() * letters.length));
  const numbers = Math.floor(1000 + Math.random() * 9000); // Gera número entre 1000-9999
  return `${letter1}${letter2}-${numbers}`;
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

    // Para managers, usar transação com retry para garantir atomicidade
    if (data.userType === 'manager') {
      const maxRetries = 5;
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const code = generateBarbershopCode();
          
          const result = await db.transaction(async (tx) => {
            // Criar usuário
            const [newUser] = await tx
              .insert(users)
              .values({
                email: data.email,
                password: hashedPassword,
                name: data.name,
                phone: data.phone,
                userType: data.userType,
              })
              .returning();

            // Criar barbearia
            const [newBarbershop] = await tx
              .insert(barbershops)
              .values({
                ownerId: newUser.id,
                name: data.barbershopName || `${data.name}'s Barbershop`,
                address: data.barbershopAddress,
                phone: data.barbershopPhone,
                email: data.email,
                subscriptionPlan: data.subscriptionPlan || 'basico',
                code,
              })
              .returning();

            return { newUser, newBarbershop };
          });

          // Sucesso - gerar token e retornar
          const token = generateToken(result.newUser);
          return NextResponse.json({
            token,
            user: {
              id: result.newUser.id,
              email: result.newUser.email,
              name: result.newUser.name,
              userType: result.newUser.userType,
            },
            barbershopId: result.newBarbershop.id,
          });
        } catch (error: any) {
          // Se for erro de código duplicado e ainda há tentativas, continuar
          if (error.code === '23505' && error.constraint === 'barbershops_code_unique' && attempt < maxRetries - 1) {
            continue;
          }
          // Se não for erro de código duplicado ou acabaram as tentativas
          if (error.code === '23505' && error.constraint === 'barbershops_code_unique') {
            return NextResponse.json(
              { error: 'Não foi possível gerar um código único para a barbearia. Tente novamente.' },
              { status: 503 }
            );
          }
          // Outros erros
          throw error;
        }
      }
    }

    // Para barbers e clients (sem necessidade de transação complexa)
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