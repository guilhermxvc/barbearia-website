import { apiClient } from './client';

export interface Service {
  id: string;
  barbershopId: string;
  name: string;
  description?: string;
  price: string;
  duration: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceRequest {
  barbershopId: string;
  name: string;
  description?: string;
  price: string;
  duration: number;
}

export const servicesApi = {
  async list(barbershopId: string): Promise<{ success: boolean; data?: { services: Service[] }; error?: string }> {
    return apiClient.get(`/services?barbershopId=${barbershopId}`);
  },

  async create(data: CreateServiceRequest): Promise<{ success: boolean; data?: { service: Service }; error?: string }> {
    return apiClient.post('/services', data);
  },

  async update(id: string, data: Partial<CreateServiceRequest>): Promise<{ success: boolean; data?: { service: Service }; error?: string }> {
    return apiClient.put(`/services/${id}`, data);
  },

  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    return apiClient.delete(`/services/${id}`);
  }
};