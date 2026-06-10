import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsApi, CreateProjectInput } from '@/lib/api/projects';
import { useAuthStore } from '@/store/authStore';

// ─────────────────────────────────────────
// Fetch all projects
// ─────────────────────────────────────────
export function useProjects() {
  const { workspace } = useAuthStore();

  return useQuery({
    queryKey: ['projects', workspace?.id],
    queryFn: () => projectsApi.getAll(workspace!.id),
    enabled: !!workspace?.id, // only run if workspaceId exists
    staleTime: 2 * 60 * 1000, // fresh for 2 minutes
  });
}

// ─────────────────────────────────────────
// Create project with optimistic UI
// ─────────────────────────────────────────
export function useCreateProject() {
  const queryClient = useQueryClient();
  const { workspace } = useAuthStore();

  return useMutation({
    mutationFn: (data: CreateProjectInput) => projectsApi.create(data),

    // 1. Optimistically add project to cache immediately
    onMutate: async (newProject) => {
      await queryClient.cancelQueries({
        queryKey: ['projects', workspace?.id],
      });

      const previous = queryClient.getQueryData([
        'projects',
        workspace?.id,
      ]);

      queryClient.setQueryData(
        ['projects', workspace?.id],
        (old: any[]) => [
          {
            ...newProject,
            id: 'temp-' + Date.now(),
            createdAt: new Date().toISOString(),
            _count: { tasks: 0 },
          },
          ...(old || []),
        ]
      );

      return { previous };
    },

    // 2. If error — roll back to previous state
    onError: (err, newProject, context) => {
      queryClient.setQueryData(
        ['projects', workspace?.id],
        context?.previous
      );
    },

    // 3. Always refetch after success or error
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['projects', workspace?.id],
      });
    },
  });
}

// ─────────────────────────────────────────
// Delete project
// ─────────────────────────────────────────
export function useDeleteProject() {
  const queryClient = useQueryClient();
  const { workspace } = useAuthStore();

  return useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),

    // Optimistically remove from cache
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({
        queryKey: ['projects', workspace?.id],
      });

      const previous = queryClient.getQueryData([
        'projects',
        workspace?.id,
      ]);

      queryClient.setQueryData(
        ['projects', workspace?.id],
        (old: any[]) => (old || []).filter((p) => p.id !== deletedId)
      );

      return { previous };
    },

    onError: (err, id, context) => {
      queryClient.setQueryData(
        ['projects', workspace?.id],
        context?.previous
      );
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['projects', workspace?.id],
      });
    },
  });
}