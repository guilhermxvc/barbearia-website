import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clients, users } from '@/lib/db/schema';
import { withAuth } from '@/lib/middleware';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateClientSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos').optional(),
  preferences: z.object({}).optional(),
});

// GET /api/clients/[id] - Obter dados de um cliente específico
export const GET = withAuth(['manager', 'barber', 'client'])(async (req, { params }) => {
  try {
    const { id } = params;

    const client = await db
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
      .where(eq(clients.id, id))
      .limit(1);

    if (client.length === 0) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    // Verificar permissões
    if (req.user!.userType === 'client') {
      const userClient = await db.query.clients.findFirst({
        where: eq(clients.userId, req.user!.id),
      });
      
      if (!userClient || userClient.id !== id) {
        return NextResponse.json(
          { error: 'Acesso negado' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      client: client[0],
    });
  } catch (error) {
    console.error('Get client error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar cliente' },
      { status: 500 }
    );
  }
});

// PUT /api/clients/[id] - Atualizar dados de um cliente
export const PUT = withAuth(['manager', 'barber', 'client'])(async (req, { params }) => {
  try {
    const { id } = params;
    const body = await req.json();
    const validatedData = updateClientSchema.parse(body);

    // Verificar se o cliente existe
    const existingClient = await db.query.clients.findFirst({
      where: eq(clients.id, id),
      with: {
        user: true,
      },
    });

    if (!existingClient) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    // Verificar permissões
    if (req.user!.userType === 'client') {
      if (existingClient.userId !== req.user!.id) {
        return NextResponse.json(
          { error: 'Acesso negado' },
          { status: 403 }
        );
      }
    }

    // Atualizar dados do usuário se fornecidos
    if (validatedData.name || validatedData.phone) {
      await db
        .update(users)
        .set({
          ...(validatedData.name && { name: validatedData.name }),
          ...(validatedData.phone && { phone: validatedData.phone }),
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingClient.userId));
    }

    // Atualizar preferências do cliente se fornecidas
    if (validatedData.preferences) {
      await db
        .update(clients)
        .set({
          preferences: validatedData.preferences,
          updatedAt: new Date(),
        })
        .where(eq(clients.id, id));
    }

    return NextResponse.json({
      success: true,
      message: 'Cliente atualizado com sucesso',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Update client error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar cliente' },
      { status: 500 }
    );
  }
});

// DELETE /api/clients/[id] - Desativar um cliente (soft delete)
export const DELETE = withAuth(['manager'])(async (req, { params }) => {
  try {
    const { id } = params;

    // Verificar se o cliente existe
    const existingClient = await db.query.clients.findFirst({
      where: eq(clients.id, id),
    });

    if (!existingClient) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    // Em vez de deletar, vamos desativar o usuário
    await db
      .update(users)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existingClient.userId));

    return NextResponse.json({
      success: true,
      message: 'Cliente desativado com sucesso',
    });
  } catch (error) {
    console.error('Delete client error:', error);
    return NextResponse.json(
      { error: 'Erro ao desativar cliente' },
      { status: 500 }
    );
  }
});