import { db } from '../lib/db';
import { subscriptionPlans } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function seedSubscriptionPlans() {
  console.log('🌱 Seeding subscription plans...');

  const plans = [
    {
      name: 'basico' as const,
      displayName: 'Plano Básico',
      price: '39.00',
      maxBarbers: 1,
      hasInventoryManagement: false,
      hasAIChatbot: false,
      features: ['1 barbeiro', 'Agendamentos ilimitados', 'Gestão de clientes', 'Relatórios básicos'],
      isActive: true,
    },
    {
      name: 'profissional' as const,
      displayName: 'Plano Profissional',
      price: '79.00',
      maxBarbers: 3,
      hasInventoryManagement: false,
      hasAIChatbot: false,
      features: ['Até 3 barbeiros', 'Agendamentos ilimitados', 'Gestão de clientes', 'Relatórios avançados', 'Gestão de serviços'],
      isActive: true,
    },
    {
      name: 'premium' as const,
      displayName: 'Plano Premium',
      price: '129.00',
      maxBarbers: 999,
      hasInventoryManagement: true,
      hasAIChatbot: true,
      features: ['Barbeiros ilimitados', 'Agendamentos ilimitados', 'Gestão de clientes', 'Relatórios avançados', 'Gestão de serviços', 'Gestão de estoque', 'Chatbot com IA'],
      isActive: true,
    },
  ];

  for (const plan of plans) {
    const existingPlan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.name, plan.name),
    });

    if (existingPlan) {
      console.log(`✓ Plano "${plan.displayName}" já existe`);
      await db
        .update(subscriptionPlans)
        .set({
          displayName: plan.displayName,
          price: plan.price,
          maxBarbers: plan.maxBarbers,
          hasInventoryManagement: plan.hasInventoryManagement,
          hasAIChatbot: plan.hasAIChatbot,
          features: plan.features,
          isActive: plan.isActive,
          updatedAt: new Date(),
        })
        .where(eq(subscriptionPlans.name, plan.name));
      console.log(`  → Atualizado`);
    } else {
      await db.insert(subscriptionPlans).values(plan);
      console.log(`✓ Plano "${plan.displayName}" criado`);
    }
  }

  console.log('✅ Subscription plans seeded successfully!');
  process.exit(0);
}

seedSubscriptionPlans().catch((error) => {
  console.error('❌ Error seeding subscription plans:', error);
  process.exit(1);
});
