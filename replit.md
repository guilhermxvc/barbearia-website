# Barbershop Website - Replit Setup

### Overview
This project is a comprehensive Next.js barbershop management system, optimized for the Replit environment. It provides a multi-user platform for managers, barbers, and clients, focusing on appointment scheduling, financial tracking, and client management. The system aims to modernize barbershop operations with a professional UI/UX and robust backend.

### User Preferences
No specific user preferences were provided in the original `replit.md` file. The agent should infer them from the comprehensive nature of the file and the agent's instructions.

### System Architecture
The application is built with Next.js 14.2.16, TypeScript, and Tailwind CSS v4.1.9 for styling. UI components leverage Radix UI and Shadcn/ui. It employs a multi-tenant architecture ensuring data isolation between different user types (Manager, Barber, Client).

**Key Architectural Decisions:**
- **Dynamic Content:** Subscription plan pricing, appointments, barbershops, and client data are entirely database-driven, eliminating hardcoded values.
- **Authentication:** JWT-based authentication with bcrypt ensures secure user access and role-based redirection.
- **Data Isolation:** Strict filtering prevents data leakage between users; barbers see only their appointments, clients see only their barbershops, and managers see only data related to their barbershop.
- **Frontend Redesign:** A complete visual overhaul provides a modern, responsive design with a focus on intuitive user experience across all pages, including a multi-step registration flow and mobile optimization.
- **CRUD Operations:** Comprehensive Create, Read, Update, and Delete functionalities are implemented for Barbershop settings, Barbers, Clients, Services, and Appointments.
- **Drizzle ORM:** Used for database interactions, with explicitly defined relations for robust data fetching.

**Feature Specifications:**
- **Multi-user System:** Manager/Owner, Barber, and Client dashboards.
- **Appointment Booking:** Full scheduling system with real-time data.
- **Google Calendar-style Visual Scheduling:** Week/day views with color-coded appointment states, time slots, and barber filtering.
- **Barber Work Schedules:** Configurable working hours per day with toggle on/off functionality.
- **Time Blocks:** Support for blocking specific date/time ranges (vacation, maintenance, personal, etc).
- **Barbershop Management:** Settings, subscription plan, and code display.
- **Barbers Management:** List, approve, edit, and deactivate barbers.
- **Clients Management:** List, create, edit, and deactivate clients with search/filter.
- **Services Management:** CRUD for services with active/inactive status.
- **Subscription Plans:** Dynamic, database-driven pricing for Básico, Profissional, and Premium tiers.
- **UI/UX:** Modern design with amber/orange gradients, icons, and consistent styling.
- **Technical Fixes:** Proper Tailwind CSS v4 configuration, Next.js dev server optimization for Replit proxy, and clean build process.

### External Dependencies
- **Database:** PostgreSQL (NeonDB)
- **Styling:** Tailwind CSS v4.1.9
- **UI Components:** Radix UI, Shadcn/ui
- **Analytics:** Vercel Analytics
- **Authentication:** JWT (JSON Web Tokens), bcrypt
- **Date/Time Utilities:** `date-fns` (for appointment filtering)