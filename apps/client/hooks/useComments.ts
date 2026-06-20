import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { commentsApi } from '@/lib/api/comments';

export function useComments(taskId: string | null) {
  return useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => commentsApi.getAll(taskId!),
    enabled: !!taskId && !taskId.startsWith('temp-'),
    staleTime: 30_000,
  });
}

export function useCreateComment(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) =>
      commentsApi.create(taskId, content),

    // Optimistically add comment
    onMutate: async (content) => {
      await queryClient.cancelQueries({
        queryKey: ['comments', taskId],
      });

      const previous = queryClient.getQueryData(['comments', taskId]);

      queryClient.setQueryData(
        ['comments', taskId],
        (old: any[] = []) => [
          ...old,
          {
            id: 'temp-' + Date.now(),
            content,
            createdAt: new Date().toISOString(),
            taskId,
            author: { id: 'temp', name: 'You' },
          },
        ]
      );

      return { previous };
    },

    onError: (err, content, context) => {
      queryClient.setQueryData(
        ['comments', taskId],
        context?.previous
      );
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['comments', taskId],
      });
    },
  });
}

export function useDeleteComment(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => commentsApi.delete(id),

    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({
        queryKey: ['comments', taskId],
      });

      const previous = queryClient.getQueryData(['comments', taskId]);

      queryClient.setQueryData(
        ['comments', taskId],
        (old: any[] = []) => old.filter((c) => c.id !== deletedId)
      );

      return { previous };
    },

    onError: (err, id, context) => {
      queryClient.setQueryData(
        ['comments', taskId],
        context?.previous
      );
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['comments', taskId],
      });
    },
  });
}