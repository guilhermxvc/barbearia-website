import { apiClient } from './client';

export interface User {
  id: string;
  email: string;
  name: string;
  userType: 'manager' | 'barber' | 'client';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  userType: 'manager' | 'barber' | 'client';
  // Campos específicos para manager
  barbershopName?: string;
  barbershopAddress?: string;
  barbershopPhone?: string;
  subscriptionPlan?: 'basico' | 'profissional' | 'premium';
  // Campos específicos para barber
  barbershopCode?: string;
  specialties?: string[];
}

export interface AuthResponse {
  token: string;
  user: User;
  barbershopId?: string;
}

export const authApi = {
  async login(data: LoginRequest): Promise<{ success: boolean; data?: AuthResponse; error?: string }> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    
    if (response.success && response.data) {
      // Armazenar token no cliente API
      apiClient.setToken(response.data.token);
      
      // Armazenar dados do usuário no localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('userEmail', response.data.user.email);
        localStorage.setItem('userType', response.data.user.userType);
        localStorage.setItem('userName', response.data.user.name);
        
        if (response.data.barbershopId) {
          localStorage.setItem('barbershopId', response.data.barbershopId);
        }
      }
    }
    
    return response;
  },

  async register(data: RegisterRequest): Promise<{ success: boolean; data?: AuthResponse; error?: string }> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    
    if (response.success && response.data) {
      // Armazenar token no cliente API
      apiClient.setToken(response.data.token);
      
      // Armazenar dados do usuário no localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('userEmail', response.data.user.email);
        localStorage.setItem('userType', response.data.user.userType);
        localStorage.setItem('userName', response.data.user.name);
        
        if (response.data.barbershopId) {
          localStorage.setItem('barbershopId', response.data.barbershopId);
        }
      }
    }
    
    return response;
  },

  async getProfile(): Promise<{ success: boolean; data?: any; error?: string }> {
    return apiClient.get('/user/profile');
  },

  async updateProfile(data: any): Promise<{ success: boolean; data?: any; error?: string }> {
    return apiClient.put('/user/profile', data);
  },

  logout() {
    // Limpar token do cliente API
    apiClient.setToken(null);
    
    // Limpar dados do localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userType');
      localStorage.removeItem('userName');
      localStorage.removeItem('barbershopId');
      
      // Redirecionar para login
      window.location.href = '/login';
    }
  },

  getCurrentUser(): User | null {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  },

  isAuthenticated(): boolean {
    return !!apiClient.getToken();
  }
};