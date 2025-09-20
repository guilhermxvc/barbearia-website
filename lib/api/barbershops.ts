import { apiClient } from './client';

export interface Barbershop {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  subscriptionPlan: 'basico' | 'profissional' | 'premium';
  businessHours?: any;
  code: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BarbershopWithDetails extends Barbershop {
  services: Service[];
  barbers: Barber[];
  rating?: number;
  reviewCount?: number;
  distance?: string;
  openNow?: boolean;
  nextAvailable?: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: string;
  duration: number;
}

export interface Barber {
  id: string;
  name: string;
  specialties?: string[];
}

export interface BarbershopStats {
  appointments: {
    total: number;
    completed: number;
  };
  revenue: {
    total: string;
    sales: number;
  };
  barbers: {
    active: number;
  };
  clients: {
    new: number;
  };
  period: number;
}

export const barbershopsApi = {
  async list(): Promise<{ success: boolean; data?: { barbershops: BarbershopWithDetails[] }; error?: string }> {
    return apiClient.get('/barbershops');
  },

  async getById(id: string): Promise<{ success: boolean; data?: { barbershop: Barbershop }; error?: string }> {
    return apiClient.get(`/barbershops/${id}`);
  },

  async update(id: string, data: Partial<Barbershop>): Promise<{ success: boolean; data?: { barbershop: Barbershop }; error?: string }> {
    return apiClient.put(`/barbershops/${id}`, data);
  },

  async getStats(id: string, period = 30): Promise<{ success: boolean; data?: { stats: BarbershopStats }; error?: string }> {
    return apiClient.get(`/barbershops/${id}/stats?period=${period}`);
  }
};