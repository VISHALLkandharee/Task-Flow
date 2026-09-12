/**
 * BillingPage unit tests
 *
 * Tests the conditional rendering logic for:
 * - Success/cancel banners (from Stripe redirect ?success=true / ?canceled=true)
 * - Free vs Pro plan badges and CTAs
 * - Loading state
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

// ─── Module mocks ────────────────────────────────────────────────────────────

// Mock next/navigation so we can control searchParams without a real Next.js router
const mockSearchParams = new URLSearchParams();
jest.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/',
}));

// Mock hooks that fetch remote data
jest.mock('@/hooks/useBilling', () => ({
  useBillingStatus: jest.fn(),
  useCreateCheckout: jest.fn(),
  useCreatePortal: jest.fn(),
}));

// Mock the auth store (we don't need real Zustand state for these banner tests)
jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(() => ({
    workspace: { id: 'ws-1', name: 'My Workspace', plan: 'FREE' },
    setWorkspace: jest.fn(),
    setWorkspaces: jest.fn(),
    workspaces: [],
  })),
}));

// lucide-react ESM stub
jest.mock('lucide-react', () => {
  const make = (name: string) =>
    function Icon() {
      return <span data-testid={`icon-${name}`} />;
    };
  return {
    Zap: make('zap'),
    CheckCircle: make('check-circle'),
    XCircle: make('x-circle'),
    Loader2: make('loader2'),
    Crown: make('crown'),
    BarChart3: make('bar-chart3'),
    Users: make('users'),
    FolderKanban: make('folder-kanban'),
  };
});

import BillingPage from '@/app/(dashboard)/billing/page';
import {
  useBillingStatus,
  useCreateCheckout,
  useCreatePortal,
} from '@/hooks/useBilling';

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface BillingData {
  plan: 'FREE' | 'PRO';
  usage: { projects: number; members: number; projectLimit: string; memberLimit: string };
}

function setupHooks(billingData: BillingData, isLoading = false) {
  (useBillingStatus as jest.Mock).mockReturnValue({
    data: billingData,
    isLoading,
    refetch: jest.fn().mockResolvedValue({ data: billingData }),
  });
  (useCreateCheckout as jest.Mock).mockReturnValue({
    mutate: jest.fn(),
    isPending: false,
  });
  (useCreatePortal as jest.Mock).mockReturnValue({
    mutate: jest.fn(),
    isPending: false,
  });
}

const freeBilling: BillingData = {
  plan: 'FREE',
  usage: { projects: 1, members: 2, projectLimit: '3', memberLimit: '5' },
};

const proBilling: BillingData = {
  plan: 'PRO',
  usage: { projects: 5, members: 10, projectLimit: 'Unlimited', memberLimit: 'Unlimited' },
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('BillingPage', () => {
  beforeEach(() => {
    // Clear search params before each test
    mockSearchParams.delete('success');
    mockSearchParams.delete('canceled');
    jest.clearAllMocks();
  });

  describe('loading state', () => {
    it('renders a loading spinner when billing data is loading', () => {
      setupHooks(freeBilling, true);
      render(<BillingPage />);
      expect(screen.getByTestId('icon-loader2')).toBeInTheDocument();
    });
  });

  describe('FREE plan', () => {
    it('renders the Free plan badge', () => {
      setupHooks(freeBilling);
      render(<BillingPage />);
      expect(screen.getByText('🆓 Free')).toBeInTheDocument();
    });

    it('renders the "Unlock Everything" upgrade CTA button', () => {
      setupHooks(freeBilling);
      render(<BillingPage />);
      expect(
        screen.getByRole('button', { name: /unlock everything/i }),
      ).toBeInTheDocument();
    });

    it('does NOT render "Manage Subscription" for FREE users', () => {
      setupHooks(freeBilling);
      render(<BillingPage />);
      expect(
        screen.queryByRole('button', { name: /manage subscription/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe('PRO plan', () => {
    it('renders the Pro plan badge', () => {
      setupHooks(proBilling);
      render(<BillingPage />);
      expect(screen.getByText('⚡ Pro')).toBeInTheDocument();
    });

    it('renders the "Manage Subscription" portal button for PRO users', () => {
      setupHooks(proBilling);
      render(<BillingPage />);
      expect(
        screen.getByRole('button', { name: /manage subscription/i }),
      ).toBeInTheDocument();
    });
  });

  describe('Stripe redirect banners', () => {
    it('shows the success banner when ?success=true is in the URL', () => {
      mockSearchParams.set('success', 'true');
      setupHooks(freeBilling);
      render(<BillingPage />);
      expect(
        screen.getByText(/successfully upgraded to pro/i),
      ).toBeInTheDocument();
    });

    it('shows the canceled banner when ?canceled=true is in the URL', () => {
      mockSearchParams.set('canceled', 'true');
      setupHooks(freeBilling);
      render(<BillingPage />);
      expect(
        screen.getByText(/payment was canceled/i),
      ).toBeInTheDocument();
    });

    it('shows neither banner with no search params', () => {
      setupHooks(freeBilling);
      render(<BillingPage />);
      expect(
        screen.queryByText(/successfully upgraded/i),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/payment was canceled/i),
      ).not.toBeInTheDocument();
    });
  });

  describe('page structure', () => {
    it('renders the Billing page heading', () => {
      setupHooks(freeBilling);
      render(<BillingPage />);
      expect(
        screen.getByRole('heading', { name: /billing/i }),
      ).toBeInTheDocument();
    });

    it('renders both Free and Pro plan cards', () => {
      setupHooks(freeBilling);
      render(<BillingPage />);
      // Plan comparison section renders "Free" and "Pro" headings
      expect(screen.getAllByText(/free/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/pro/i).length).toBeGreaterThan(0);
    });
  });
});
