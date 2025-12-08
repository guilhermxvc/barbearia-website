import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clients, users } from '@/lib/db/schema';
import { withAuth } from '@/lib/middleware';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateProfileSchema = z.object({
  phone: z.string().optional(),
  photoUrl: z.string().url().optional().or(z.literal('')),
});

export const PUT = withAuth(['client'])(async (req) => {
  try {
    const body = await req.json();
    const validatedData = updateProfileSchema.parse(body);

    const existingClient = await db.query.clients.findFirst({
      where: eq(clients.userId, req.user!.id),
    });

    if (!existingClient) {
      return NextResponse.json(
        { success: false, error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    const updateData: { phone?: string; photoUrl?: string | null; updatedAt: Date } = {
      updatedAt: new Date(),
    };
    
    if (validatedData.phone !== undefined) {
      updateData.phone = validatedData.phone;
    }
    
    if (validatedData.photoUrl !== undefined) {
      updateData.photoUrl = validatedData.photoUrl || null;
    }

    if (Object.keys(updateData).length > 1) {
      await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, req.user!.id));
    }

    return NextResponse.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Update client profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar perfil' },
      { status: 500 }
    );
  }
});

export const GET = withAuth(['client'])(async (req) => {
  try {
    const result = await db
      .select({
        id: clients.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        photoUrl: users.photoUrl,
        totalVisits: clients.totalVisits,
        totalSpent: clients.totalSpent,
        lastVisit: clients.lastVisit,
        preferences: clients.preferences,
        createdAt: clients.createdAt,
      })
      .from(clients)
      .innerJoin(users, eq(clients.userId, users.id))
      .where(eq(clients.userId, req.user!.id))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: result[0],
    });
  } catch (error) {
    console.error('Get client profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar perfil' },
      { status: 500 }
    );
  }
});
