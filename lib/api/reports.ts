import { apiClient } from './client';

export interface MonthlyData {
  month: string;
  revenue: number;
  appointments: number;
  newClients: number;
}

export interface TopService {
  name: string;
  count: number;
  revenue: number;
}

export interface TopBarber {
  name: string;
  appointments: number;
  revenue: number;
  rating: number;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalCommissions: number;
  pendingCommissions: number;
  activeBarbers: number;
}

export interface ReportsData {
  monthlyData: MonthlyData[];
  topServices: TopService[];
  topBarbers: TopBarber[];
  financialSummary: FinancialSummary;
}

export const reportsApi = {
  async getReports(barbershopId: string, period?: string): Promise<{ success: boolean; data?: ReportsData; error?: string }> {
    const params = new URLSearchParams();
    params.append('barbershopId', barbershopId);
    if (period) params.append('period', period);
    
    return apiClient.get(`/reports?${params.toString()}`);
  },

  async getFinancialReport(barbershopId: string, startDate?: string, endDate?: string): Promise<{ success: boolean; data?: FinancialSummary; error?: string }> {
    const params = new URLSearchParams();
    params.append('barbershopId', barbershopId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    return apiClient.get(`/reports/financial?${params.toString()}`);
  },

  async exportReport(barbershopId: string, type: 'monthly' | 'services' | 'barbers' | 'financial', format: 'csv' | 'pdf' = 'csv'): Promise<{ success: boolean; data?: Blob; error?: string }> {
    const params = new URLSearchParams();
    params.append('barbershopId', barbershopId);
    params.append('type', type);
    params.append('format', format);
    
    // Para download de arquivos, usamos uma abordagem diferente
    try {
      const response = await fetch(`/api/reports/export?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        return { success: true, data: blob };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error };
      }
    } catch (error) {
      return { success: false, error: 'Erro ao exportar relatório' };
    }
  }
};