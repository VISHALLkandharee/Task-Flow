import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { membersApi, invitesApi } from '@/lib/api/members';
import { useAuthStore } from '@/store/authStore';

export function useMembers() {
  const { workspace } = useAuthStore();

  return useQuery({
    queryKey: ['members', workspace?.id],
    queryFn: () => membersApi.getAll(workspace!.id),
    enabled: !!workspace?.id,
  });
}

export function useInvites() {
  const { workspace } = useAuthStore();

  return useQuery({
    queryKey: ['invites', workspace?.id],
    queryFn: () => invitesApi.getAll(workspace!.id),
    enabled: !!workspace?.id,
  });
}

export function useSendInvite() {
  const queryClient = useQueryClient();
  const { workspace } = useAuthStore();

  return useMutation({
    mutationFn: (data: { email: string; role?: string }) =>
      invitesApi.send({ ...data, workspaceId: workspace!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['invites', workspace?.id],
      });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  const { workspace } = useAuthStore();

  return useMutation({
    mutationFn: (id: string) => membersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['members', workspace?.id],
      });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  const { workspace } = useAuthStore();

  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      membersApi.updateRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['members', workspace?.id],
      });
    },
  });
}