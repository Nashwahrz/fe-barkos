import { fetchApi } from '@/lib/api';
import { NotificationResponse } from '@/types/notification';

export const notificationApi = {
  getAll: async () => {
    return fetchApi('/notifications');
  },
  
  markAsRead: async (id: string) => {
    return fetchApi(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },
  
  markAllAsRead: async () => {
    return fetchApi('/notifications/read-all', {
      method: 'PATCH',
    });
  }
};
