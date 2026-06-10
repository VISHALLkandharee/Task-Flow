"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { setUser, setWorkspace } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar on path change (mobile navigation)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // Fetch current user
  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await api.get("/auth/me");
      return res.data.user;
    },
    retry: false,
    staleTime: 0,
  });

  const isActuallyLoading = isLoading;

  // Sync to Zustand store
  useEffect(() => {
    if (data) {
      setUser({
        id: data.id,
        name: data.name,
        email: data.email,
        avatarUrl: data.avatarUrl,
      });

      // Save ALL workspaces
      if (data.members?.length > 0) {
        const allWorkspaces = data.members.map((m: any) => ({
          ...m.workspace,
          role: m.role,
        }));
        useAuthStore.getState().setWorkspaces(allWorkspaces);

        // Keep active workspace details (plan, name, role) in sync with latest server state
        const currentWorkspace = useAuthStore.getState().workspace;
        if (currentWorkspace) {
          const freshWorkspace = allWorkspaces.find(
            (w: any) => w.id === currentWorkspace.id
          );
          if (freshWorkspace) {
            // Check if any property changed before setting to avoid unnecessary state updates
            if (
              freshWorkspace.name !== currentWorkspace.name ||
              freshWorkspace.plan !== currentWorkspace.plan ||
              freshWorkspace.role !== currentWorkspace.role ||
              freshWorkspace.slug !== currentWorkspace.slug
            ) {
              setWorkspace({
                id: freshWorkspace.id,
                name: freshWorkspace.name,
                slug: freshWorkspace.slug,
                plan: freshWorkspace.plan,
                role: freshWorkspace.role,
              });
            }
          } else {
            // Active workspace was deleted or user was removed — fall back to first workspace
            setWorkspace({
              id: allWorkspaces[0].id,
              name: allWorkspaces[0].name,
              slug: allWorkspaces[0].slug,
              plan: allWorkspaces[0].plan,
              role: allWorkspaces[0].role,
            });
          }
        } else {
          // No active workspace set — default to first available
          setWorkspace({
            id: allWorkspaces[0].id,
            name: allWorkspaces[0].name,
            slug: allWorkspaces[0].slug,
            plan: allWorkspaces[0].plan,
            role: allWorkspaces[0].role,
          });
        }
      }
    }
  }, [data]);

  useEffect(() => {
    // Only redirect if we have data, it says no workspace, AND we aren't currently fetching/refreshing
    if (data && !data.members?.[0]?.workspace && !isFetching) {
      router.push("/create-workspace");
    }
  }, [data, isFetching]);

  // Redirect if not authenticated
  useEffect(() => {
    if (isError) {
      router.push("/login");
    }
  }, [isError]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div
            className="w-8 h-8 border-4 border-indigo-600 border-t-transparent
          rounded-full animate-spin mx-auto mb-3"
          />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex relative overflow-x-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
