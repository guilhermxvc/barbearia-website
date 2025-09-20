import { apiClient } from './client';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  totalVisits: number;
  totalSpent: string;
  lastVisit?: string;
  preferences: any;
  createdAt: string;
}

export interface ClientStats {
  total: number;
  newThisMonth: number;
  activeClients: number;
  birthdaysToday: number;
  birthdaysThisWeek: number;
}

export const clientsApi = {
  // Listar clientes de uma barbearia
  async getAll(barbershopId: string, search?: string, status?: string): Promise<{ success: boolean; data?: Client[]; error?: string }> {
    let url = `/clients?barbershopId=${barbershopId}`;
    if (search) url += `&search=${search}`;
    if (status) url += `&status=${status}`;
    
    const response = await apiClient.get<{ clients: Client[] }>(url);
    
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.clients,
      };
    }
    
    return {
      success: false,
      error: response.error,
    };
  },

  // Obter um cliente específico
  async getById(id: string): Promise<{ success: boolean; data?: Client; error?: string }> {
    const response = await apiClient.get<{ client: Client }>(`/clients/${id}`);
    
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.client,
      };
    }
    
    return {
      success: false,
      error: response.error,
    };
  },

  // Criar um novo cliente
  async create(data: {
    barbershopId: string;
    name: string;
    email: string;
    phone?: string;
    preferences?: any;
  }): Promise<{ success: boolean; error?: string }> {
    return await apiClient.post('/clients', data);
  },

  // Atualizar um cliente
  async update(id: string, data: {
    name?: string;
    phone?: string;
    preferences?: any;
  }): Promise<{ success: boolean; error?: string }> {
    return await apiClient.put(`/clients/${id}`, data);
  },

  // Desativar um cliente
  async deactivate(id: string): Promise<{ success: boolean; error?: string }> {
    return await apiClient.delete(`/clients/${id}`);
  },

  // Obter estatísticas de clientes
  async getStats(barbershopId: string): Promise<{ success: boolean; data?: ClientStats; error?: string }> {
    const response = await apiClient.get<ClientStats>(`/clients/stats?barbershopId=${barbershopId}`);
    
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data,
      };
    }
    
    return {
      success: false,
      error: response.error,
    };
  },
};