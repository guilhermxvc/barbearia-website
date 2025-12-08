import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { subscriptionPlans } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const plans = await db.query.subscriptionPlans.findMany({
      where: eq(subscriptionPlans.isActive, true),
      orderBy: (plans, { asc }) => [asc(plans.price)],
    });

    const formattedPlans = plans.map((plan) => {
      const priceNum = parseFloat(plan.price)
      const priceFormatted = priceNum % 1 === 0 
        ? `R$ ${priceNum.toFixed(0)}` 
        : `R$ ${priceNum.toFixed(2).replace('.', ',')}`
      
      return {
        id: plan.id,
        name: plan.name,
        displayName: plan.displayName,
        price: plan.price,
        priceFormatted,
        maxBarbers: plan.maxBarbers,
        hasInventoryManagement: plan.hasInventoryManagement,
        hasAIChatbot: plan.hasAIChatbot,
        features: plan.features || [],
      }
    });

    return NextResponse.json({
      success: true,
      plans: formattedPlans,
    });
  } catch (error) {
    console.error('Get subscription plans error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar planos' },
      { status: 500 }
    );
  }
}
