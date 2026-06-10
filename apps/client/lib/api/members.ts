import api from '../axios';

export interface Member {
  id: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
  userId: string;
  workspaceId: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

export interface Invite {
  id: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED';
  expiresAt: string;
  invitedBy: { name: string };
}

export const membersApi = {
  getAll: (workspaceId: string) =>
    api
      .get<{ members: Member[] }>('/members', { params: { workspaceId } })
      .then((r) => r.data.members),

  updateRole: (id: string, role: string) =>
    api.patch(`/members/${id}`, { role }).then((r) => r.data),

  remove: (id: string) =>
    api.delete(`/members/${id}`).then((r) => r.data),
};

export const invitesApi = {
  send: (data: { email: string; workspaceId: string; role?: string }) =>
    api.post('/invites', data).then((r) => r.data),

  getAll: (workspaceId: string) =>
    api
      .get<{ invites: Invite[] }>('/invites', { params: { workspaceId } })
      .then((r) => r.data.invites),

  getByToken: (token: string) =>
    api.get(`/invites/${token}`).then((r) => r.data.invite),

  accept: (token: string) =>
    api.post(`/invites/${token}/accept`).then((r) => r.data),
};