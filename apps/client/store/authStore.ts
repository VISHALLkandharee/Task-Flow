import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: 'FREE' | 'PRO';
  role?: 'OWNER' | 'ADMIN' | 'MEMBER';
}

interface AuthState {
  user: User | null;
  workspace: Workspace | null;
  workspaces: Workspace[];
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  setWorkspace: (workspace: Workspace) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  switchWorkspace: (workspaceId: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      workspace: null,
      workspaces: [],
      isAuthenticated: false,

      setUser: (user) =>
        set({ user, isAuthenticated: true }),

      setWorkspace: (workspace) =>
        set({ workspace }),

      setWorkspaces: (workspaces) =>
        set({ workspaces }),

      // Switch to a different workspace
      switchWorkspace: (workspaceId: string) => {
        const { workspaces } = get();
        const target = workspaces.find((w) => w.id === workspaceId);
        if (target) {
          set({ workspace: target });
        }
      },

      logout: () => {
        set({
          user: null,
          workspace: null,
          workspaces: [],
          isAuthenticated: false,
        });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage');
        }
      },
    }),
    { name: 'auth-storage' }
  )
);