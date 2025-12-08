"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, apiClient } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  photoUrl?: string;
  userType: 'manager' | 'barber' | 'client';
  barbershop?: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    code?: string;
    logoUrl?: string;
    subscriptionPlan?: string;
    isActive?: boolean;
  };
  barber?: {
    id: string;
    userId: string;
    barbershopId: string | null;
    specialties?: string[];
    commissionRate?: number;
    isApproved?: boolean;
    isActive?: boolean;
    barbershop?: {
      id: string;
      name: string;
      code: string;
      address?: string;
      phone?: string;
      logoUrl?: string;
    } | null;
  };
  client?: {
    id: string;
    userId: string;
    loyaltyPoints?: number;
    preferences?: any;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; userType?: string }>;
  register: (data: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Carregar perfil do usuário ao montar
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      
      // Verificar se há token no localStorage
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('authToken');
        if (token) {
          apiClient.setToken(token);
          
          // Buscar perfil do usuário
          const response = await authApi.getProfile();
          
          if (response.success && response.data) {
            setUser(response.data.user);
            setIsAuthenticated(true);
          } else {
            // Token inválido, limpar
            logout();
          }
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    await loadUserProfile();
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      
      if (response.success && response.data) {
        const { token, user: userData, barbershopId } = response.data;
        
        // Salvar token no localStorage ANTES de tudo
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', token);
        }
        
        // Configurar token no apiClient
        apiClient.setToken(token);
        
        // Buscar perfil completo
        await loadUserProfile();
        
        return { success: true, userType: userData.userType };
      }
      
      return {
        success: false,
        error: response.error || 'Erro ao fazer login',
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Erro ao conectar com o servidor',
      };
    }
  };

  const register = async (data: any) => {
    try {
      const response = await authApi.register(data);
      
      if (response.success && response.data) {
        const { token } = response.data;
        
        // Salvar token no localStorage ANTES de tudo
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', token);
        }
        
        // Configurar token no apiClient
        apiClient.setToken(token);
        
        // Buscar perfil completo
        await loadUserProfile();
        
        return { success: true };
      }
      
      return {
        success: false,
        error: response.error || 'Erro ao fazer cadastro',
      };
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        error: 'Erro ao conectar com o servidor',
      };
    }
  };

  const logout = () => {
    apiClient.setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userEmail');
      window.location.href = '/login';
    }
  };

  const refreshUser = async () => {
    await loadUserProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
        refreshProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
