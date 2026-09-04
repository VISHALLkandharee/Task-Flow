"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Zap,
  CheckCircle,
  XCircle,
  Loader2,
  Crown,
  BarChart3,
  Users,
  FolderKanban,
} from "lucide-react";
import {
  useBillingStatus,
  useCreateCheckout,
  useCreatePortal,
} from "@/hooks/useBilling";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

export default function BillingPage() {
  const searchParams = useSearchParams();
  const { data: billing, isLoading, refetch } = useBillingStatus();
  const { mutate: checkout, isPending: isCheckingOut } = useCreateCheckout();
  const { mutate: portal, isPending: isPortaling } = useCreatePortal();
  const { workspace, setWorkspace, setWorkspaces } = useAuthStore();

  // Handle redirect back from Stripe
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  // Refetch billing status when returning from Stripe
  useEffect(() => {
    if (success === "true") {
      // Setup a polling mechanism due to Stripe Webhook race condition
      const checkInterval = setInterval(() => {
        refetch().then((result) => {
          // If the webhook finished processing and the plan is now PRO
          if (result.data && result.data.plan === "PRO") {

            // 1. Update the active workspace object in Zustand
            if (workspace && workspace.plan !== "PRO") {
              setWorkspace({
                ...workspace,
                plan: "PRO",
              });
            }

            // 2. Also sync the same workspace inside the global workspaces[] array
            // so the sidebar switcher dropdown immediately shows ⚡ Pro for this workspace
            const currentWorkspaces = useAuthStore.getState().workspaces;
            const hasStaleEntry = currentWorkspaces.some(
              (w) => w.id === workspace?.id && w.plan !== "PRO"
            );
            if (hasStaleEntry) {
              const updatedWorkspaces = currentWorkspaces.map((w) =>
                w.id === workspace?.id ? { ...w, plan: "PRO" as const } : w
              );
              setWorkspaces(updatedWorkspaces);
            }

            // Stop polling once successful
            clearInterval(checkInterval);
          }
        });
      }, 2000); // Check every 2 seconds

      // Cleanup interval after 15 seconds to prevent unbounded polling
      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
      }, 15000);

      return () => {
        clearInterval(checkInterval);
        clearTimeout(timeout);
      };
    }
  }, [success]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  const isPro = billing?.plan === "PRO";

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage your workspace plan and subscription
        </p>
      </div>

      {/* Success banner */}
      {success === "true" && (
        <div
          className="bg-green-50 border border-green-200 rounded-xl
        p-4 flex items-center gap-3 mb-6"
        >
          <CheckCircle size={20} className="text-green-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-800">
              Successfully upgraded to Pro! 🎉
            </p>
            <p className="text-xs text-green-600 mt-0.5">
              All Pro features are now unlocked for your workspace.
            </p>
          </div>
        </div>
      )}

      {/* Canceled banner */}
      {canceled === "true" && (
        <div
          className="bg-yellow-50 border border-yellow-200 rounded-xl
        p-4 flex items-center gap-3 mb-6"
        >
          <XCircle size={20} className="text-yellow-500 shrink-0" />
          <p className="text-sm text-yellow-800">
            Payment was canceled. You're still on the Free plan.
          </p>
        </div>
      )}

      {/* Current Plan */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">
              Current Plan
            </h2>
            <span
              className={cn(
                "text-xs font-medium px-2.5 py-1 rounded-full",
                isPro
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-gray-100 text-gray-600",
              )}
            >
              {isPro ? "⚡ Pro" : "🆓 Free"}
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {isPro ? "$9/mo" : "$0/mo"}
          </p>
        </div>

        {/* Usage bars with urgency */}
        {!isPro && (
          <div className="space-y-4 mb-6">
            {(() => {
              const pLimit = Number(billing?.usage.projectLimit) || 3;
              const mLimit = Number(billing?.usage.memberLimit) || 5;
              const pCount = billing?.usage.projects || 0;
              const mCount = billing?.usage.members || 0;

              return (
                <>
                  {/* Projects usage */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-500 font-medium">
                        Projects Usage
                      </span>
                      <span
                        className={cn(
                          "font-bold",
                          pCount >= pLimit
                            ? "text-red-600"
                            : pCount >= pLimit - 1
                              ? "text-orange-500"
                              : "text-gray-600",
                        )}
                      >
                        {pCount} / {pLimit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={cn(
                          "h-2 rounded-full transition-all duration-500",
                          pCount >= pLimit
                            ? "bg-red-500"
                            : pCount >= pLimit - 1
                              ? "bg-orange-400"
                              : "bg-indigo-500",
                        )}
                        style={{
                          width: `${Math.min((pCount / pLimit) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    {pCount >= pLimit && (
                      <p className="text-[10px] text-red-500 mt-1 font-medium">
                        ⚠️ Project limit reached — upgrade to create more
                      </p>
                    )}
                  </div>

                  {/* Members usage */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-500 font-medium">
                        Members Usage
                      </span>
                      <span
                        className={cn(
                          "font-bold",
                          mCount >= mLimit
                            ? "text-red-600"
                            : mCount >= mLimit - 1
                              ? "text-orange-500"
                              : "text-gray-600",
                        )}
                      >
                        {mCount} / {mLimit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={cn(
                          "h-2 rounded-full transition-all duration-500",
                          mCount >= mLimit
                            ? "bg-red-500"
                            : mCount >= mLimit - 1
                              ? "bg-orange-400"
                              : "bg-indigo-500",
                        )}
                        style={{
                          width: `${Math.min((mCount / mLimit) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    {mCount >= mLimit && (
                      <p className="text-[10px] text-red-500 mt-1 font-medium">
                        ⚠️ Member limit reached — upgrade to invite more
                      </p>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Legacy Grid usage (backup/isPro view) */}
        {isPro && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <FolderKanban size={15} className="text-gray-400" />
                <span className="text-xs text-gray-500">Projects</span>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {billing?.usage.projects}
                <span className="text-sm font-normal text-gray-400 ml-1">
                  / ∞
                </span>
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users size={15} className="text-gray-400" />
                <span className="text-xs text-gray-500">Members</span>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {billing?.usage.members}
                <span className="text-sm font-normal text-gray-400 ml-1">
                  / ∞
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Action button */}
        {isPro ? (
          <button
            onClick={() => portal()}
            disabled={isPortaling}
            className="w-full flex items-center justify-center gap-2
            px-4 py-2.5 border border-gray-300 rounded-lg text-sm
            font-medium text-gray-700 hover:bg-gray-50
            disabled:opacity-50 transition-colors"
          >
            {isPortaling ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <BarChart3 size={16} />
            )}
            {isPortaling ? "Opening portal..." : "Manage Subscription"}
          </button>
        ) : (
          <button
            onClick={() => checkout()}
            disabled={isCheckingOut}
            className="w-full flex items-center justify-center gap-2
            px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm
            font-medium hover:bg-indigo-700 disabled:opacity-50
            transition-colors"
          >
            {isCheckingOut ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Zap size={16} />
            )}
            {isCheckingOut ? "Redirecting..." : "Unlock Everything — $9/mo"}
          </button>
        )}
      </div>

      {/* Plan comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Free */}
        <div
          className={cn(
            "bg-white rounded-xl border p-5",
            !isPro
              ? "border-indigo-200 ring-1 ring-indigo-200"
              : "border-gray-200",
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Free</h3>
            <span className="text-lg font-bold text-gray-900">$0</span>
          </div>
          <ul className="space-y-2">
            {[
              "3 projects",
              "5 members",
              "Unlimited tasks",
              "Kanban board",
              "Email invites",
            ].map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-2
              text-sm text-gray-600"
              >
                <CheckCircle size={14} className="text-gray-400" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Pro */}
        <div
          className={cn(
            "rounded-xl border p-5",
            isPro
              ? "bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200"
              : "bg-white border-gray-200",
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <Crown size={15} className="text-indigo-600" />
              <h3 className="font-semibold text-gray-900">Pro</h3>
            </div>
            <span className="text-lg font-bold text-gray-900">$9/mo</span>
          </div>
          <ul className="space-y-3">
            {[
              { text: "Unlimited projects", highlight: true },
              { text: "Unlimited team members", highlight: true },
              { text: "Unlimited tasks & comments", highlight: false },
              { text: "Remove all plan limits forever", highlight: true },
              { text: "Priority email support", highlight: false },
              { text: "Early access to new features", highlight: false },
            ].map((feature) => (
              <li
                key={feature.text}
                className={cn(
                  "flex items-center gap-2 text-sm",
                  feature.highlight
                    ? "text-gray-900 font-medium"
                    : "text-gray-600",
                )}
              >
                <CheckCircle
                  size={14}
                  className={cn(
                    feature.highlight ? "text-indigo-600" : "text-indigo-400",
                  )}
                />
                {feature.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
