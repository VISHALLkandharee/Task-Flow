import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api/notifications';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';

// ─────────────────────────────────────────
// Fetch notifications + listen for new ones
// ─────────────────────────────────────────
export function useNotifications() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();

  // Fetch from API on load
  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.getAll,
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  // Listen for real-time notifications via Socket.io
  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = getSocket();

    // New notification received
    socket.on('notification:new', (notification) => {
      console.log('🔔 New notification received:', notification);

      // Add to cache immediately — no refetch needed
      queryClient.setQueryData(
        ['notifications'],
        (old: any) => {
          if (!old) return old;
          return {
            notifications: [notification, ...old.notifications],
            unreadCount: old.unreadCount + 1,
          };
        }
      );
    });

    // Notifications cleared (from socket event)
    socket.on('notifications:cleared', () => {
      queryClient.setQueryData(
        ['notifications'],
        (old: any) => {
          if (!old) return old;
          return {
            notifications: old.notifications.map((n: any) => ({
              ...n,
              read: true,
            })),
            unreadCount: 0,
          };
        }
      );
    });

    // Cleanup on unmount
    return () => {
      socket.off('notification:new');
      socket.off('notifications:cleared');
    };
  }, [isAuthenticated]);

  return query;
}

// ─────────────────────────────────────────
// Mark all as read
// ─────────────────────────────────────────
export function useMarkAllRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      queryClient.setQueryData(
        ['notifications'],
        (old: any) => {
          if (!old) return old;
          return {
            notifications: old.notifications.map((n: any) => ({
              ...n,
              read: true,
            })),
            unreadCount: 0,
          };
        }
      );
    },
  });
}

// ─────────────────────────────────────────
// Clear all notifications
// ─────────────────────────────────────────
export function useClearNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationsApi.clearAll,
    onSuccess: () => {
      queryClient.setQueryData(['notifications'], {
        notifications: [],
        unreadCount: 0,
      });
    },
  });
}