import api from '../axios';

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  taskId: string;
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export const commentsApi = {
  getAll: (taskId: string) =>
    api
      .get<{ comments: Comment[] }>('/comments', {
        params: { taskId },
      })
      .then((r) => r.data.comments),

  create: (taskId: string, content: string) =>
    api
      .post<{ comment: Comment }>('/comments', { taskId, content })
      .then((r) => r.data.comment),

  delete: (id: string) =>
    api.delete(`/comments/${id}`).then((r) => r.data),
};