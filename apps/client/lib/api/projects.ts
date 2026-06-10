import api from '../axios';

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  workspaceId: string;
  createdAt: string;
  _count?: {
    tasks: number;
  };
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  color?: string;
  workspaceId: string;
}

export const projectsApi = {
  // Get all projects for a workspace
  getAll: (workspaceId: string) =>
    api
      .get<{ projects: Project[] }>('/projects', {
        params: { workspaceId },
      })
      .then((r) => r.data.projects),

  // Get single project
  getOne: (id: string) =>
    api
      .get<{ project: Project }>(`/projects/${id}`)
      .then((r) => r.data.project),

  // Create project
  create: (data: CreateProjectInput) =>
    api
      .post<{ project: Project }>('/projects', data)
      .then((r) => r.data.project),

  // Update project
  update: (id: string, data: Partial<CreateProjectInput>) =>
    api
      .patch<{ project: Project }>(`/projects/${id}`, data)
      .then((r) => r.data.project),

  // Delete project
  delete: (id: string) =>
    api.delete(`/projects/${id}`).then((r) => r.data),
};