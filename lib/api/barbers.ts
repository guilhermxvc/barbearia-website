import { apiClient } from './client';

export interface Barber {
  id: string;
  name: string;
  email: string;
  phone?: string;
  specialties: string[];
  commissionRate: string;
  isApproved: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface BarberRequest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
  createdAt: string;
  barber?: {
    specialties: string[];
  };
}

export const barbersApi = {
  // Listar barbeiros de uma barbearia
  async getAll(barbershopId: string): Promise<{ success: boolean; data?: Barber[]; error?: string }> {
    const response = await apiClient.get<{ barbers: Barber[] }>(`/barbers?barbershopId=${barbershopId}`);
    
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.barbers,
      };
    }
    
    return {
      success: false,
      error: response.error,
    };
  },

  // Obter um barbeiro específico
  async getById(id: string): Promise<{ success: boolean; data?: Barber; error?: string }> {
    const response = await apiClient.get<{ barber: Barber }>(`/barbers/${id}`);
    
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.barber,
      };
    }
    
    return {
      success: false,
      error: response.error,
    };
  },

  // Atualizar um barbeiro
  async update(id: string, data: {
    specialties?: string[];
    commissionRate?: string;
    isActive?: boolean;
    isApproved?: boolean;
  }): Promise<{ success: boolean; error?: string }> {
    return await apiClient.put(`/barbers/${id}`, data);
  },

  // Desativar um barbeiro
  async deactivate(id: string): Promise<{ success: boolean; error?: string }> {
    return await apiClient.delete(`/barbers/${id}`);
  },

  // Listar solicitações de barbeiros
  async getRequests(barbershopId: string): Promise<{ success: boolean; data?: BarberRequest[]; error?: string }> {
    const response = await apiClient.get<{ requests: BarberRequest[] }>(`/barbers/requests?barbershopId=${barbershopId}`);
    
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.requests,
      };
    }
    
    return {
      success: false,
      error: response.error,
    };
  },

  // Aprovar ou rejeitar solicitação
  async handleRequest(requestId: string, action: 'approve' | 'reject'): Promise<{ success: boolean; error?: string }> {
    return await apiClient.put(`/barbers/requests/${requestId}`, { action });
  },
};