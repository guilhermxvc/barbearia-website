import { pgTable, text, timestamp, integer, uuid, boolean, decimal, json, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';
import { z } from 'zod';

// Enums
export const userTypeEnum = ['manager', 'barber', 'client'] as const;
export const subscriptionPlanEnum = ['basico', 'profissional', 'premium'] as const;
export const appointmentStatusEnum = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'] as const;
export const requestStatusEnum = ['pending', 'approved', 'rejected', 'cancelled'] as const;

// Subscription Plans table (separada para fácil manutenção)
export const subscriptionPlans = pgTable('subscription_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name', { enum: subscriptionPlanEnum }).notNull().unique(),
  displayName: text('display_name').notNull(),
  price: decimal('price', { precision: 8, scale: 2 }).notNull(),
  maxBarbers: integer('max_barbers').default(1),
  hasInventoryManagement: boolean('has_inventory_management').default(false),
  hasAIChatbot: boolean('has_ai_chatbot').default(false),
  features: json('features'), // Lista de funcionalidades
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Users table (tabela geral unificada)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name'),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone'),
  photoUrl: text('photo_url'), // URL da foto de perfil
  userType: text('user_type', { enum: userTypeEnum }).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Barbershops table
export const barbershops = pgTable('barbershops', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  logoUrl: text('logo_url'), // URL da logo da barbearia
  latitude: decimal('latitude', { precision: 10, scale: 8 }), // Para busca por localização
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  subscriptionPlanId: uuid('subscription_plan_id').references(() => subscriptionPlans.id),
  subscriptionPlan: text('subscription_plan', { enum: subscriptionPlanEnum }).default('basico'),
  businessHours: json('business_hours'), // Formato: { segunda: { open: '08:00', close: '18:00' } }
  code: varchar('code', { length: 7 }).notNull().unique(), // Formato XX-XXXX (7 caracteres com hífen)
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Barbers table
export const barbers = pgTable('barbers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  barbershopId: uuid('barbershop_id').references(() => barbershops.id),
  specialties: json('specialties'), // Array de especialidades
  commissionRate: decimal('commission_rate', { precision: 5, scale: 2 }).default('40.00'), // Porcentagem de comissão
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0.00'), // Nota média dos feedbacks
  totalRatings: integer('total_ratings').default(0), // Total de avaliações recebidas
  isApproved: boolean('is_approved').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Clients table
export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  preferences: json('preferences'), // Preferências de serviços, barbeiros
  totalVisits: integer('total_visits').default(0),
  totalSpent: decimal('total_spent', { precision: 10, scale: 2 }).default('0.00'),
  lastVisit: timestamp('last_visit'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Services table
export const services = pgTable('services', {
  id: uuid('id').primaryKey().defaultRandom(),
  barbershopId: uuid('barbershop_id').references(() => barbershops.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  price: decimal('price', { precision: 8, scale: 2 }).notNull(),
  duration: integer('duration').notNull(), // Duração em minutos
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Products table (para gestão de estoque)
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  barbershopId: uuid('barbershop_id').references(() => barbershops.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  price: decimal('price', { precision: 8, scale: 2 }).notNull(),
  cost: decimal('cost', { precision: 8, scale: 2 }),
  stockQuantity: integer('stock_quantity').default(0),
  minStockLevel: integer('min_stock_level').default(5),
  category: text('category'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Appointments table
export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  barbershopId: uuid('barbershop_id').references(() => barbershops.id).notNull(),
  clientId: uuid('client_id').references(() => clients.id).notNull(),
  barberId: uuid('barber_id').references(() => barbers.id).notNull(),
  serviceId: uuid('service_id').references(() => services.id).notNull(),
  scheduledAt: timestamp('scheduled_at').notNull(),
  duration: integer('duration').notNull(), // Duração em minutos
  status: text('status', { enum: appointmentStatusEnum }).default('pending'),
  notes: text('notes'),
  totalPrice: decimal('total_price', { precision: 8, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Sales table (para vendas de produtos e serviços)
export const sales = pgTable('sales', {
  id: uuid('id').primaryKey().defaultRandom(),
  barbershopId: uuid('barbershop_id').references(() => barbershops.id).notNull(),
  clientId: uuid('client_id').references(() => clients.id),
  barberId: uuid('barber_id').references(() => barbers.id),
  appointmentId: uuid('appointment_id').references(() => appointments.id),
  items: json('items'), // Array de produtos/serviços vendidos
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  discount: decimal('discount', { precision: 8, scale: 2 }).default('0.00'),
  paymentMethod: text('payment_method'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Commission tracking table
export const commissions = pgTable('commissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  barbershopId: uuid('barbershop_id').references(() => barbershops.id).notNull(),
  barberId: uuid('barber_id').references(() => barbers.id).notNull(),
  saleId: uuid('sale_id').references(() => sales.id).notNull(),
  amount: decimal('amount', { precision: 8, scale: 2 }).notNull(),
  rate: decimal('rate', { precision: 5, scale: 2 }).notNull(),
  isPaid: boolean('is_paid').default(false),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Notifications table
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type'), // 'appointment', 'reminder', 'promotion', etc
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Barber requests table (para solicitações de vinculação)
export const barberRequests = pgTable('barber_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  barbershopId: uuid('barbershop_id').references(() => barbershops.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  status: text('status', { enum: requestStatusEnum }).default('pending'),
  message: text('message'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Feedbacks table (avaliações dos clientes para barbeiros)
export const feedbacks = pgTable('feedbacks', {
  id: uuid('id').primaryKey().defaultRandom(),
  appointmentId: uuid('appointment_id').references(() => appointments.id).notNull(),
  clientId: uuid('client_id').references(() => clients.id).notNull(),
  barberId: uuid('barber_id').references(() => barbers.id).notNull(),
  barbershopId: uuid('barbershop_id').references(() => barbershops.id).notNull(),
  rating: integer('rating').notNull(), // 1-5 estrelas
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow(),
});

// AI Chat History table (histórico de conversas com IA/ChatBot)
export const aiChatHistory = pgTable('ai_chat_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  barbershopId: uuid('barbershop_id').references(() => barbershops.id), // Null se for cliente/barbeiro
  sessionId: uuid('session_id').notNull(), // ID da sessão de conversa
  role: text('role').notNull(), // 'user' ou 'assistant'
  message: text('message').notNull(),
  metadata: json('metadata'), // Dados adicionais da conversa
  createdAt: timestamp('created_at').defaultNow(),
});

// Stock Movements table (movimentações de estoque)
export const stockMovements = pgTable('stock_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  barbershopId: uuid('barbershop_id').references(() => barbershops.id).notNull(),
  quantity: integer('quantity').notNull(), // Positivo = entrada, Negativo = saída
  type: text('type').notNull(), // 'purchase', 'sale', 'adjustment', 'loss'
  reason: text('reason'),
  userId: uuid('user_id').references(() => users.id), // Quem fez a movimentação
  createdAt: timestamp('created_at').defaultNow(),
});

// Barber Work Schedules (jornada de trabalho dos barbeiros)
export const barberWorkSchedules = pgTable('barber_work_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  barberId: uuid('barber_id').references(() => barbers.id).notNull(),
  barbershopId: uuid('barbershop_id').references(() => barbershops.id).notNull(),
  dayOfWeek: integer('day_of_week').notNull(), // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  startTime: text('start_time').notNull(), // "08:00"
  endTime: text('end_time').notNull(), // "18:00"
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Time Blocks (bloqueios de horários - férias, feriados, manutenção)
export const timeBlocks = pgTable('time_blocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  barbershopId: uuid('barbershop_id').references(() => barbershops.id).notNull(),
  barberId: uuid('barber_id').references(() => barbers.id), // Null = bloqueio para toda barbearia
  title: text('title').notNull(),
  description: text('description'),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  allDay: boolean('all_day').default(false),
  blockType: text('block_type').notNull(), // 'vacation', 'holiday', 'maintenance', 'personal', 'other'
  isRecurring: boolean('is_recurring').default(false),
  recurringPattern: text('recurring_pattern'), // 'weekly', 'monthly', 'yearly'
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Recurring Appointments (agendamentos recorrentes)
export const recurringAppointments = pgTable('recurring_appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  barbershopId: uuid('barbershop_id').references(() => barbershops.id).notNull(),
  clientId: uuid('client_id').references(() => clients.id).notNull(),
  barberId: uuid('barber_id').references(() => barbers.id).notNull(),
  serviceId: uuid('service_id').references(() => services.id).notNull(),
  dayOfWeek: integer('day_of_week').notNull(), // 0-6
  startTime: text('start_time').notNull(), // "10:00"
  duration: integer('duration').notNull(),
  totalPrice: decimal('total_price', { precision: 8, scale: 2 }).notNull(),
  repeatWeeks: integer('repeat_weeks').notNull(), // Quantidade de semanas para repetir
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  notes: text('notes'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertBarbershopSchema = createInsertSchema(barbershops);
export const selectBarbershopSchema = createSelectSchema(barbershops);

export const insertBarberSchema = createInsertSchema(barbers);
export const selectBarberSchema = createSelectSchema(barbers);

export const insertClientSchema = createInsertSchema(clients);
export const selectClientSchema = createSelectSchema(clients);

export const insertServiceSchema = createInsertSchema(services);
export const selectServiceSchema = createSelectSchema(services);

export const insertProductSchema = createInsertSchema(products);
export const selectProductSchema = createSelectSchema(products);

export const insertAppointmentSchema = createInsertSchema(appointments);
export const selectAppointmentSchema = createSelectSchema(appointments);

export const insertSaleSchema = createInsertSchema(sales);
export const selectSaleSchema = createSelectSchema(sales);

export const insertNotificationSchema = createInsertSchema(notifications);
export const selectNotificationSchema = createSelectSchema(notifications);

export const insertBarberRequestSchema = createInsertSchema(barberRequests);
export const selectBarberRequestSchema = createSelectSchema(barberRequests);

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans);
export const selectSubscriptionPlanSchema = createSelectSchema(subscriptionPlans);

export const insertFeedbackSchema = createInsertSchema(feedbacks);
export const selectFeedbackSchema = createSelectSchema(feedbacks);

export const insertAiChatHistorySchema = createInsertSchema(aiChatHistory);
export const selectAiChatHistorySchema = createSelectSchema(aiChatHistory);

export const insertStockMovementSchema = createInsertSchema(stockMovements);
export const selectStockMovementSchema = createSelectSchema(stockMovements);

export const insertBarberWorkScheduleSchema = createInsertSchema(barberWorkSchedules);
export const selectBarberWorkScheduleSchema = createSelectSchema(barberWorkSchedules);

export const insertTimeBlockSchema = createInsertSchema(timeBlocks);
export const selectTimeBlockSchema = createSelectSchema(timeBlocks);

export const insertRecurringAppointmentSchema = createInsertSchema(recurringAppointments);
export const selectRecurringAppointmentSchema = createSelectSchema(recurringAppointments);

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Barbershop = typeof barbershops.$inferSelect;
export type NewBarbershop = typeof barbershops.$inferInsert;

export type Barber = typeof barbers.$inferSelect;
export type NewBarber = typeof barbers.$inferInsert;

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;

export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;

export type Sale = typeof sales.$inferSelect;
export type NewSale = typeof sales.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type BarberRequest = typeof barberRequests.$inferSelect;
export type NewBarberRequest = typeof barberRequests.$inferInsert;

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type NewSubscriptionPlan = typeof subscriptionPlans.$inferInsert;

export type Feedback = typeof feedbacks.$inferSelect;
export type NewFeedback = typeof feedbacks.$inferInsert;

export type AiChatHistory = typeof aiChatHistory.$inferSelect;
export type NewAiChatHistory = typeof aiChatHistory.$inferInsert;

export type StockMovement = typeof stockMovements.$inferSelect;
export type NewStockMovement = typeof stockMovements.$inferInsert;

export type BarberWorkSchedule = typeof barberWorkSchedules.$inferSelect;
export type NewBarberWorkSchedule = typeof barberWorkSchedules.$inferInsert;

export type TimeBlock = typeof timeBlocks.$inferSelect;
export type NewTimeBlock = typeof timeBlocks.$inferInsert;

export type RecurringAppointment = typeof recurringAppointments.$inferSelect;
export type NewRecurringAppointment = typeof recurringAppointments.$inferInsert;

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  barbershop: one(barbershops, {
    fields: [users.id],
    references: [barbershops.ownerId],
  }),
  barber: one(barbers, {
    fields: [users.id],
    references: [barbers.userId],
  }),
  client: one(clients, {
    fields: [users.id],
    references: [clients.userId],
  }),
  notifications: many(notifications),
}));

export const barbershopsRelations = relations(barbershops, ({ one, many }) => ({
  owner: one(users, {
    fields: [barbershops.ownerId],
    references: [users.id],
  }),
  barbers: many(barbers),
  services: many(services),
  products: many(products),
  appointments: many(appointments),
  sales: many(sales),
  commissions: many(commissions),
  barberRequests: many(barberRequests),
}));

export const barbersRelations = relations(barbers, ({ one, many }) => ({
  user: one(users, {
    fields: [barbers.userId],
    references: [users.id],
  }),
  barbershop: one(barbershops, {
    fields: [barbers.barbershopId],
    references: [barbershops.id],
  }),
  appointments: many(appointments),
  sales: many(sales),
  commissions: many(commissions),
  feedbacks: many(feedbacks),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, {
    fields: [clients.userId],
    references: [users.id],
  }),
  appointments: many(appointments),
  sales: many(sales),
  feedbacks: many(feedbacks),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  barbershop: one(barbershops, {
    fields: [services.barbershopId],
    references: [barbershops.id],
  }),
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  barbershop: one(barbershops, {
    fields: [appointments.barbershopId],
    references: [barbershops.id],
  }),
  client: one(clients, {
    fields: [appointments.clientId],
    references: [clients.id],
  }),
  barber: one(barbers, {
    fields: [appointments.barberId],
    references: [barbers.id],
  }),
  service: one(services, {
    fields: [appointments.serviceId],
    references: [services.id],
  }),
}));

export const barberRequestsRelations = relations(barberRequests, ({ one }) => ({
  barbershop: one(barbershops, {
    fields: [barberRequests.barbershopId],
    references: [barbershops.id],
  }),
  user: one(users, {
    fields: [barberRequests.userId],
    references: [users.id],
  }),
}));