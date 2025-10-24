import { apiClient } from './client';

export interface Appointment {
  id: string;
  scheduledAt: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  totalPrice: string;
  client: {
    id: string;
    name: string;
    phone?: string;
  };
  barber: {
    id: string;
    name: string;
  };
  service: {
    id: string;
    name: string;
    price: string;
  };
  barbershop?: {
    name: string;
  };
}

export interface CreateAppointmentRequest {
  barbershopId: string;
  clientId: string;
  barberId: string;
  serviceId: string;
  scheduledAt: string;
  duration: number;
  totalPrice: string;
  notes?: string;
}

export const appointmentsApi = {
  async list(filters?: {
    barbershopId?: string;
    barberId?: string;
    clientId?: string;
    status?: string;
    date?: string;
  }): Promise<{ success: boolean; data?: { appointments: Appointment[] }; error?: string }> {
    const params = new URLSearchParams();
    if (filters?.barbershopId) params.append('barbershopId', filters.barbershopId);
    if (filters?.barberId) params.append('barberId', filters.barberId);
    if (filters?.clientId) params.append('clientId', filters.clientId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.date) params.append('date', filters.date);

    const queryString = params.toString();
    return apiClient.get(`/appointments${queryString ? '?' + queryString : ''}`);
  },

  async create(data: CreateAppointmentRequest): Promise<{ success: boolean; data?: { appointment: Appointment }; error?: string }> {
    return apiClient.post('/appointments', data);
  },

  async updateStatus(id: string, status: string): Promise<{ success: boolean; data?: { appointment: Appointment }; error?: string }> {
    return apiClient.put(`/appointments/${id}`, { status });
  }
};