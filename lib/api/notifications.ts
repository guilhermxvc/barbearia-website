import { apiClient } from './client';

export interface Notification {
  id: string;
  type: 'appointment' | 'review' | 'promotion' | 'system' | 'reminder';
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  userId: string;
}

export const notificationsApi = {
  async getNotifications(unreadOnly?: boolean): Promise<{ success: boolean; notifications?: Notification[]; error?: string }> {
    const params = new URLSearchParams();
    if (unreadOnly) params.append('unreadOnly', 'true');
    
    return apiClient.get(`/notifications?${params.toString()}`);
  },

  async markAsRead(notificationId: string): Promise<{ success: boolean; notification?: Notification; error?: string }> {
    return apiClient.put(`/notifications/${notificationId}/read`);
  },

  async markAllAsRead(): Promise<{ success: boolean; count?: number; error?: string }> {
    return apiClient.put('/notifications/read-all');
  },

  async createNotification(data: {
    userId: string;
    type: Notification['type'];
    title: string;
    message: string;
    priority?: Notification['priority'];
  }): Promise<{ success: boolean; notification?: Notification; error?: string }> {
    return apiClient.post('/notifications', data);
  }
};