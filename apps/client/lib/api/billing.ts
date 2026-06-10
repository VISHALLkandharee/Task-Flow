import api from '../axios';

export interface BillingStatus {
  plan: 'FREE' | 'PRO';
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  usage: {
    projects: number;
    members: number;
    projectLimit: string;
    memberLimit: string;
  };
}

export const billingApi = {
  getStatus: (workspaceId: string) =>
    api
      .get<BillingStatus>('/billing/status', {
        params: { workspaceId },
      })
      .then((r) => r.data),

  createCheckout: (workspaceId: string) =>
    api
      .post<{ url: string }>('/billing/checkout', { workspaceId })
      .then((r) => r.data.url),

  createPortal: (workspaceId: string) =>
    api
      .post<{ url: string }>('/billing/portal', { workspaceId })
      .then((r) => r.data.url),
};