import api from '../axios';

export const settingsApi = {
  updateProfile: (data: { name: string; email: string }) =>
    api.patch('/settings/profile', data).then((r) => r.data),

  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => api.patch('/settings/password', data).then((r) => r.data),

  updateWorkspace: (data: { name: string; workspaceId: string }) =>
    api.patch('/settings/workspace', data).then((r) => r.data),

  deleteWorkspace: (data: {
    workspaceId: string;
    confirmName: string;
  }) => api.delete('/settings/workspace', { data }).then((r) => r.data),
};