import api from '../axios';

export interface Notification {
  id: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export const notificationsApi = {
  getAll: () =>
    api
      .get<NotificationsResponse>('/notifications')
      .then((r) => r.data),

  markAllRead: () =>
    api.patch('/notifications/read-all').then((r) => r.data),

  markOneRead: (id: string) =>
    api.patch(`/notifications/${id}/read`).then((r) => r.data),

  clearAll: () =>
    api.delete('/notifications').then((r) => r.data),
};