import { useMutation, useQuery } from '@tanstack/react-query';
import { billingApi } from '@/lib/api/billing';
import { useAuthStore } from '@/store/authStore';

export function useBillingStatus() {
  const { workspace } = useAuthStore();

  return useQuery({
    queryKey: ['billing', workspace?.id],
    queryFn: () => billingApi.getStatus(workspace!.id),
    enabled: !!workspace?.id,
  });
}

export function useCreateCheckout() {
  const { workspace } = useAuthStore();

  return useMutation({
    mutationFn: () => billingApi.createCheckout(workspace!.id),
    onSuccess: (url) => {
      // Redirect to Stripe checkout page
      window.location.href = url;
    },
  });
}

export function useCreatePortal() {
  const { workspace } = useAuthStore();

  return useMutation({
    mutationFn: () => billingApi.createPortal(workspace!.id),
    onSuccess: (url) => {
      window.location.href = url;
    },
  });
}