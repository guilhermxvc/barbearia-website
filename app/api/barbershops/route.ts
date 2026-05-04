import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { barbershops, services, barbers, users } from '@/lib/db/schema';
import { withAuth } from '@/lib/middleware';
import { eq, sql } from 'drizzle-orm';

// GET /api/barbershops - Listar barbearias (para clientes)
export const GET = withAuth(['client'])(async (req) => {
  try {
    const { searchParams } = new URL(req.url);

    const barbershopsList = await db
      .select()
      .from(barbershops)
      .where(eq(barbershops.isActive, true));

    const barbershopsWithDetails = await Promise.all(
      barbershopsList.map(async (barbershop) => {
        const barbershopServices = await db
          .select({
            id: services.id,
            name: services.name,
            price: services.price,
            duration: services.duration,
          })
          .from(services)
          .where(
            sql`${services.barbershopId} = ${barbershop.id} AND ${services.isActive} = true`
          );

        const barbershopBarbers = await db
          .select({
            id: barbers.id,
            name: users.name,
            photoUrl: users.photoUrl,
            specialties: barbers.specialties,
            rating: barbers.rating,
            totalRatings: barbers.totalRatings,
          })
          .from(barbers)
          .innerJoin(users, eq(barbers.userId, users.id))
          .where(
            sql`${barbers.barbershopId} = ${barbershop.id} AND ${barbers.isApproved} = true AND ${barbers.isActive} = true`
          );

        // Calcular nota média ponderada da barbearia a partir dos barbeiros
        let rating = 0;
        let totalRatings = 0;
        const ratingsData = barbershopBarbers.filter(b => Number(b.totalRatings) > 0);
        if (ratingsData.length > 0) {
          const weightedSum = ratingsData.reduce((acc, b) => acc + Number(b.rating) * Number(b.totalRatings), 0);
          totalRatings = ratingsData.reduce((acc, b) => acc + Number(b.totalRatings), 0);
          rating = totalRatings > 0 ? weightedSum / totalRatings : 0;
        }

        return {
          ...barbershop,
          services: barbershopServices,
          barbers: barbershopBarbers,
          rating: parseFloat(rating.toFixed(1)),
          totalRatings,
        };
      })
    );

    return NextResponse.json({
      success: true,
      barbershops: barbershopsWithDetails,
    });
  } catch (error) {
    console.error('Get barbershops error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar barbearias' },
      { status: 500 }
    );
  }
});
