import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { barbershops, services, barbers, users } from '@/lib/db/schema';
import { withAuth } from '@/lib/middleware';
import { eq, sql } from 'drizzle-orm';

// GET /api/barbershops - Listar barbearias (para clientes)
export const GET = withAuth(['client'])(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const location = searchParams.get('location');
    const openNow = searchParams.get('openNow') === 'true';

    // Por enquanto, retornar todas as barbearias ativas
    const barbershopsList = await db
      .select({
        id: barbershops.id,
        name: barbershops.name,
        address: barbershops.address,
        phone: barbershops.phone,
        businessHours: barbershops.businessHours,
        subscriptionPlan: barbershops.subscriptionPlan,
      })
      .from(barbershops)
      .where(eq(barbershops.isActive, true));

    // Para cada barbearia, buscar serviços e barbeiros
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
            specialties: barbers.specialties,
          })
          .from(barbers)
          .innerJoin(users, eq(barbers.userId, users.id))
          .where(
            sql`${barbers.barbershopId} = ${barbershop.id} AND ${barbers.isApproved} = true AND ${barbers.isActive} = true`
          );

        return {
          ...barbershop,
          services: barbershopServices,
          barbers: barbershopBarbers,
          rating: 4.8, // Mock rating - implementar sistema de avaliações depois
          reviewCount: Math.floor(Math.random() * 200) + 50,
          distance: `${(Math.random() * 5).toFixed(1)} km`, // Mock distance
          openNow: true, // Mock - implementar lógica de horário depois
          nextAvailable: '09:30', // Mock - implementar agenda real depois
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