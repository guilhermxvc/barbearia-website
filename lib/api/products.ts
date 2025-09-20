import { apiClient } from './client';

export interface Product {
  id: string;
  barbershopId: string;
  name: string;
  description?: string;
  price: string;
  cost?: string;
  stockQuantity?: number;
  minStockLevel?: number;
  category?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  barbershopId: string;
  name: string;
  description?: string;
  price: string;
  cost?: string;
  stockQuantity?: number;
  minStockLevel?: number;
  category?: string;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: string;
  cost?: string;
  stockQuantity?: number;
  minStockLevel?: number;
  category?: string;
  isActive?: boolean;
}

export const productsApi = {
  async list(barbershopId: string): Promise<{ success: boolean; data?: { products: Product[] }; error?: string }> {
    return apiClient.get(`/products?barbershopId=${barbershopId}`);
  },

  async create(data: CreateProductRequest): Promise<{ success: boolean; data?: { product: Product }; error?: string }> {
    return apiClient.post('/products', data);
  },

  async update(id: string, data: UpdateProductRequest): Promise<{ success: boolean; data?: { product: Product }; error?: string }> {
    return apiClient.put(`/products/${id}`, data);
  },

  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    return apiClient.delete(`/products/${id}`);
  },

  async updateStock(id: string, quantity: number, operation: 'add' | 'subtract'): Promise<{ success: boolean; data?: { product: Product }; error?: string }> {
    return apiClient.put(`/products/${id}/stock`, { quantity, operation });
  }
};