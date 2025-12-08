import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { barbers, users } from '@/lib/db/schema';
import { withAuth } from '@/lib/middleware';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateProfileSchema = z.object({
  phone: z.string().optional(),
  specialties: z.string().optional(),
  photoUrl: z.string().optional(),
});

export const PUT = withAuth(['barber'])(async (req) => {
  try {
    const body = await req.json();
    const validatedData = updateProfileSchema.parse(body);

    const barber = await db.query.barbers.findFirst({
      where: eq(barbers.userId, req.user!.id),
    });

    if (!barber) {
      return NextResponse.json(
        { error: 'Barbeiro não encontrado' },
        { status: 404 }
      );
    }

    const userUpdates: { phone?: string; photoUrl?: string; updatedAt: Date } = {
      updatedAt: new Date(),
    };
    
    if (validatedData.phone !== undefined) {
      userUpdates.phone = validatedData.phone;
    }
    
    if (validatedData.photoUrl !== undefined) {
      userUpdates.photoUrl = validatedData.photoUrl;
    }
    
    if (userUpdates.phone !== undefined || userUpdates.photoUrl !== undefined) {
      await db
        .update(users)
        .set(userUpdates)
        .where(eq(users.id, req.user!.id));
    }

    if (validatedData.specialties !== undefined) {
      const specialtiesArray = validatedData.specialties
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      await db
        .update(barbers)
        .set({
          specialties: specialtiesArray,
          updatedAt: new Date(),
        })
        .where(eq(barbers.id, barber.id));
    }

    return NextResponse.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Update barber profile error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar perfil' },
      { status: 500 }
    );
  }
});
