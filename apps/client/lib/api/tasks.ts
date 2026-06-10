import api from '../axios';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  position: number;
  dueDate?: string;
  projectId: string;
  assigneeId?: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  creator: {
    id: string;
    name: string;
  };
  createdAt: string;
    updatedAt: string;

}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: string;
  assigneeId?: string;
  projectId: string;
}


export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: string;
  assigneeId?: string;
}

export const tasksApi = {
  getAll: (projectId: string) =>
    api
      .get<{ tasks: Task[] }>('/tasks', { params: { projectId } })
      .then((r) => r.data.tasks),

  create: (data: CreateTaskInput) =>
    api
      .post<{ task: Task }>('/tasks', data)
      .then((r) => r.data.task),

  update: (id: string, data: Partial<CreateTaskInput>) =>
    api
      .patch<{ task: Task }>(`/tasks/${id}`, data)
      .then((r) => r.data.task),

  move: (id: string, status: TaskStatus, position?: number) =>
    api
      .patch<{ task: Task }>(`/tasks/${id}/move`, { status, position })
      .then((r) => r.data.task),

  delete: (id: string) =>
    api.delete(`/tasks/${id}`).then((r) => r.data),

  getMyTasks: (workspaceId?: string) =>
    api
      .get<{
        tasks: Task[];
        grouped: Record<TaskStatus, Task[]>;
      }>('/tasks/my-tasks', { params: { workspaceId } })
      .then((r) => r.data),
};    