import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksApi, CreateTaskInput, Task, TaskStatus, UpdateTaskInput } from '@/lib/api/tasks';
import { useAuthStore } from '@/store/authStore';

// ─────────────────────────────────────────
// Fetch all tasks for a project
// ─────────────────────────────────────────
export function useTasks(projectId: string) {
  return useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => tasksApi.getAll(projectId),
    enabled: !!projectId,
    staleTime: 1 * 60 * 1000,
  });
}

// ─────────────────────────────────────────
// Create task
// ─────────────────────────────────────────
export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskInput) => tasksApi.create(data),

    onMutate: async (newTask) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', projectId] });
      const previous = queryClient.getQueryData(['tasks', projectId]);

      queryClient.setQueryData(
        ['tasks', projectId],
        (old: Task[] = []) => [
          ...old,
          {
            ...newTask,
            id: 'temp-' + Date.now(),
            position: 9999,
            createdAt: new Date().toISOString(),
            creator: { id: '', name: 'You' },
          },
        ]
      );

      return { previous };
    },

    onError: (err, newTask, context) => {
      queryClient.setQueryData(['tasks', projectId], context?.previous);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });
}

// ─────────────────────────────────────────
// Move task (drag and drop)
// ─────────────────────────────────────────
export function useMoveTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      position,
    }: {
      id: string;
      status: TaskStatus;
      position?: number;
    }) => tasksApi.move(id, status, position),

    // Optimistically update task status in cache
    onMutate: async ({ id, status, position }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', projectId] });
      const previous = queryClient.getQueryData(['tasks', projectId]);

      queryClient.setQueryData(
        ['tasks', projectId],
        (old: Task[] = []) =>
          old.map((task) =>
            task.id === id
              ? { ...task, status, position: position ?? task.position }
              : task
          )
      );

      return { previous };
    },

    onError: (err, variables, context) => {
      queryClient.setQueryData(['tasks', projectId], context?.previous);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });
}

// ─────────────────────────────────────────
// Delete task
// ─────────────────────────────────────────
export function useDeleteTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),

    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', projectId] });
      const previous = queryClient.getQueryData(['tasks', projectId]);

      queryClient.setQueryData(
        ['tasks', projectId],
        (old: Task[] = []) => old.filter((t) => t.id !== deletedId)
      );

      return { previous };
    },

    onError: (err, id, context) => {
      queryClient.setQueryData(['tasks', projectId], context?.previous);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });
  
}


export function useMyTasks() {
  const { workspace } = useAuthStore();
  return useQuery({
    queryKey: ['my-tasks', workspace?.id],
    queryFn: () => tasksApi.getMyTasks(workspace?.id),
    enabled: !!workspace?.id,
    staleTime: 1 * 60 * 1000,
  });
}



// ─────────────────────────────────────────
// Update task (title, description, status,
// priority, assignee, due date)
// ─────────────────────────────────────────
export function useUpdateTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateTaskInput;
    }) => tasksApi.update(id, data),

    // Optimistically update in cache
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({
        queryKey: ['tasks', projectId],
      });

      const previous = queryClient.getQueryData(['tasks', projectId]);

      queryClient.setQueryData(
        ['tasks', projectId],
        (old: Task[] = []) =>
          old.map((t) =>
            t.id === id ? { ...t, ...data } : t
          )
      );

      return { previous };
    },

    onError: (err, variables, context) => {
      queryClient.setQueryData(
        ['tasks', projectId],
        context?.previous
      );
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['tasks', projectId],
      });
    },
  });
}



// ─────────────────────────────────────────
// Update task status from My Tasks page
// Invalidates my-tasks cache instead of
// project-specific cache
// ─────────────────────────────────────────
export function useUpdateMyTask() {
  const queryClient = useQueryClient();
  const { workspace } = useAuthStore();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateTaskInput;
    }) => tasksApi.update(id, data),

    // Optimistically update my-tasks cache
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({
        queryKey: ['my-tasks', workspace?.id],
      });

      const previous = queryClient.getQueryData(['my-tasks', workspace?.id]);

      queryClient.setQueryData(
        ['my-tasks', workspace?.id],
        (old: any) => {
          if (!old) return old;
          const updatedTasks = old.tasks.map((t: Task) =>
            t.id === id ? { ...t, ...data } : t
          );
          return {
            tasks: updatedTasks,
            grouped: {
              TODO: updatedTasks.filter(
                (t: Task) => t.status === 'TODO'
              ),
              IN_PROGRESS: updatedTasks.filter(
                (t: Task) => t.status === 'IN_PROGRESS'
              ),
              IN_REVIEW: updatedTasks.filter(
                (t: Task) => t.status === 'IN_REVIEW'
              ),
              DONE: updatedTasks.filter(
                (t: Task) => t.status === 'DONE'
              ),
            },
          };
        }
      );

      return { previous };
    },

    onError: (err, variables, context) => {
      queryClient.setQueryData(['my-tasks', workspace?.id], context?.previous);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks', workspace?.id] });
    },
  });
}