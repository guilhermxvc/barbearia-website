CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"barbershop_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"barber_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"duration" integer NOT NULL,
	"status" text DEFAULT 'pending',
	"notes" text,
	"total_price" numeric(8, 2) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "barber_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"barbershop_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" text DEFAULT 'pending',
	"message" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "barbers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"barbershop_id" uuid,
	"specialties" json,
	"commission_rate" numeric(5, 2) DEFAULT '40.00',
	"is_approved" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "barbershops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"phone" text,
	"email" text,
	"subscription_plan" text DEFAULT 'basico',
	"business_hours" json,
	"code" varchar(10) NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "barbershops_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"preferences" json,
	"total_visits" integer DEFAULT 0,
	"total_spent" numeric(10, 2) DEFAULT '0.00',
	"last_visit" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "commissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"barbershop_id" uuid NOT NULL,
	"barber_id" uuid NOT NULL,
	"sale_id" uuid NOT NULL,
	"amount" numeric(8, 2) NOT NULL,
	"rate" numeric(5, 2) NOT NULL,
	"is_paid" boolean DEFAULT false,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"barbershop_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" numeric(8, 2) NOT NULL,
	"cost" numeric(8, 2),
	"stock_quantity" integer DEFAULT 0,
	"min_stock_level" integer DEFAULT 5,
	"category" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"barbershop_id" uuid NOT NULL,
	"client_id" uuid,
	"barber_id" uuid,
	"appointment_id" uuid,
	"items" json,
	"total_amount" numeric(10, 2) NOT NULL,
	"discount" numeric(8, 2) DEFAULT '0.00',
	"payment_method" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"barbershop_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" numeric(8, 2) NOT NULL,
	"duration" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"user_type" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_barbershop_id_barbershops_id_fk" FOREIGN KEY ("barbershop_id") REFERENCES "public"."barbershops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_barber_id_barbers_id_fk" FOREIGN KEY ("barber_id") REFERENCES "public"."barbers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "barber_requests" ADD CONSTRAINT "barber_requests_barbershop_id_barbershops_id_fk" FOREIGN KEY ("barbershop_id") REFERENCES "public"."barbershops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "barber_requests" ADD CONSTRAINT "barber_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "barbers" ADD CONSTRAINT "barbers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "barbers" ADD CONSTRAINT "barbers_barbershop_id_barbershops_id_fk" FOREIGN KEY ("barbershop_id") REFERENCES "public"."barbershops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "barbershops" ADD CONSTRAINT "barbershops_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_barbershop_id_barbershops_id_fk" FOREIGN KEY ("barbershop_id") REFERENCES "public"."barbershops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_barber_id_barbers_id_fk" FOREIGN KEY ("barber_id") REFERENCES "public"."barbers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_barbershop_id_barbershops_id_fk" FOREIGN KEY ("barbershop_id") REFERENCES "public"."barbershops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_barbershop_id_barbershops_id_fk" FOREIGN KEY ("barbershop_id") REFERENCES "public"."barbershops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_barber_id_barbers_id_fk" FOREIGN KEY ("barber_id") REFERENCES "public"."barbers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_barbershop_id_barbershops_id_fk" FOREIGN KEY ("barbershop_id") REFERENCES "public"."barbershops"("id") ON DELETE no action ON UPDATE no action;