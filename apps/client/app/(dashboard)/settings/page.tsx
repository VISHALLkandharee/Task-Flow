"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  Lock,
  Building2,
  Trash2,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "@/lib/api/settings";
import { disconnectSocket } from "@/lib/socket";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────
const ProfileSchema = z.object({
  name: z.string().min(2, "At least 2 characters"),
  email: z.string().email("Invalid email"),
});

const PasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Required"),
    newPassword: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Must have uppercase")
      .regex(/[0-9]/, "Must have number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const WorkspaceSchema = z.object({
  name: z.string().min(2, "At least 2 characters"),
});

type ProfileInput = z.infer<typeof ProfileSchema>;
type PasswordInput = z.infer<typeof PasswordSchema>;
type WorkspaceInput = z.infer<typeof WorkspaceSchema>;

// ─────────────────────────────────────────
// Success message component
// ─────────────────────────────────────────
function SuccessMsg({ message }: { message: string }) {
  return (
    <div
      className="flex items-center gap-2 bg-green-50 border
    border-green-200 text-green-700 text-sm rounded-lg p-3"
    >
      <CheckCircle size={16} />
      {message}
    </div>
  );
}

// ─────────────────────────────────────────
// Error message component
// ─────────────────────────────────────────
function ErrorMsg({ message }: { message: string }) {
  return (
    <div
      className="bg-red-50 border border-red-200 text-red-600
    text-sm rounded-lg p-3"
    >
      {message}
    </div>
  );
}

// ─────────────────────────────────────────
// Input component
// ─────────────────────────────────────────
function Input({
  label,
  error,
  type = "text",
  ...props
}: {
  label: string;
  error?: string;
  type?: string;
  [key: string]: any;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg
        text-sm text-gray-900 focus:outline-none focus:ring-2
        focus:ring-indigo-500 focus:border-transparent"
        {...props}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

// ─────────────────────────────────────────
// Section wrapper
// ─────────────────────────────────────────
function Section({
  icon: Icon,
  title,
  description,
  children,
  danger,
}: {
  icon: any;
  title: string;
  description: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border p-6",
        danger ? "border-red-200" : "border-gray-200",
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon size={18} className={danger ? "text-red-500" : "text-gray-600"} />
        <h2
          className={cn(
            "text-base font-semibold",
            danger ? "text-red-600" : "text-gray-900",
          )}
        >
          {title}
        </h2>
      </div>
      <p className="text-sm text-gray-500 mb-5">{description}</p>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────
// Main Settings Page
// ─────────────────────────────────────────
export default function SettingsPage() {
  const { user, workspace, setUser, setWorkspace, workspaces, setWorkspaces } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  // ── Profile form ──
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  const profileForm = useForm<ProfileInput>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: { name: "", email: "" },
  });

  // Pre-fill profile form when user loads
  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name,
        email: user.email,
      });
    }
  }, [user]);

  const onProfileSubmit = async (data: ProfileInput) => {
    try {
      setProfileLoading(true);
      setProfileError("");
      setProfileSuccess("");

      const res = await settingsApi.updateProfile(data);

      // Update Zustand store — UI updates instantly
      setUser({ ...user!, ...res.user });
      setProfileSuccess("Profile updated successfully!");
    } catch (err: any) {
      setProfileError(
        err.response?.data?.error?.message || "Failed to update profile",
      );
    } finally {
      setProfileLoading(false);
    }
  };

  // ── Password form ──
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const passwordForm = useForm<PasswordInput>({
    resolver: zodResolver(PasswordSchema),
  });

  const onPasswordSubmit = async (data: PasswordInput) => {
    try {
      setPasswordLoading(true);
      setPasswordError("");
      setPasswordSuccess("");

      await settingsApi.changePassword(data);

      setPasswordSuccess("Password changed successfully!");
      passwordForm.reset();
    } catch (err: any) {
      setPasswordError(
        err.response?.data?.error?.message || "Failed to change password",
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  // ── Workspace form ──
  const [workspaceSuccess, setWorkspaceSuccess] = useState("");
  const [workspaceError, setWorkspaceError] = useState("");
  const [workspaceLoading, setWorkspaceLoading] = useState(false);

  const workspaceForm = useForm<WorkspaceInput>({
    resolver: zodResolver(WorkspaceSchema),
    defaultValues: { name: "" },
  });

  // Pre-fill workspace form
  useEffect(() => {
    if (workspace) {
      workspaceForm.reset({ name: workspace.name });
    }
  }, [workspace]);

  const onWorkspaceSubmit = async (data: WorkspaceInput) => {
    try {
      setWorkspaceLoading(true);
      setWorkspaceError("");
      setWorkspaceSuccess("");

      const res = await settingsApi.updateWorkspace({
        name: data.name,
        workspaceId: workspace!.id,
      });

      // Update store
      setWorkspace({ ...workspace!, name: res.workspace.name });
      
      const updatedWorkspaces = workspaces.map((w) =>
        w.id === workspace?.id ? { ...w, name: res.workspace.name } : w
      );
      setWorkspaces(updatedWorkspaces);
      
      setWorkspaceSuccess("Workspace updated successfully!");
    } catch (err: any) {
      setWorkspaceError(
        err.response?.data?.error?.message || "Failed to update workspace",
      );
    } finally {
      setWorkspaceLoading(false);
    }
  };

  // ── Delete workspace ──
  const [confirmName, setConfirmName] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const canDelete = confirmName === workspace?.name;

  const handleDeleteWorkspace = async () => {
    if (!canDelete) return;

    try {
      setDeleteLoading(true);
      setDeleteError("");

      await settingsApi.deleteWorkspace({
        workspaceId: workspace!.id,
        confirmName,
      });

      // Clear workspace and redirect
      disconnectSocket();
      
      const currentWorkspaces = useAuthStore.getState().workspaces;
      const remainingWorkspaces = currentWorkspaces.filter(w => w.id !== workspace!.id);
      
      useAuthStore.getState().setWorkspaces(remainingWorkspaces);
      await queryClient.invalidateQueries({ queryKey: ["me"] });

      if (remainingWorkspaces.length > 0) {
         setWorkspace(remainingWorkspaces[0]);
         router.push("/dashboard");
      } else {
         setWorkspace(null as any);
         router.push("/create-workspace");
      }
    } catch (err: any) {
      setDeleteError(
        err.response?.data?.error?.message || "Failed to delete workspace",
      );
      setDeleteLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage your profile and workspace settings
        </p>
      </div>

      {/* ── Profile Settings ── */}
      <Section
        icon={User}
        title="Profile Information"
        description="Update your name and email address"
      >
        <form
          onSubmit={profileForm.handleSubmit(onProfileSubmit)}
          className="space-y-4"
        >
          {profileSuccess && <SuccessMsg message={profileSuccess} />}
          {profileError && <ErrorMsg message={profileError} />}

          <Input
            label="Full Name"
            error={profileForm.formState.errors.name?.message}
            {...profileForm.register("name")}
          />
          <Input
            label="Email Address"
            type="email"
            error={profileForm.formState.errors.email?.message}
            {...profileForm.register("email")}
          />

          <button
            type="submit"
            disabled={profileLoading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600
            text-white rounded-lg text-sm font-medium hover:bg-indigo-700
            disabled:opacity-50 transition-colors"
          >
            {profileLoading && <Loader2 size={14} className="animate-spin" />}
            {profileLoading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </Section>

      {/* ── Change Password ── */}
      <Section
        icon={Lock}
        title="Change Password"
        description="Make sure your password is strong and unique"
      >
        <form
          onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
          className="space-y-4"
        >
          {passwordSuccess && <SuccessMsg message={passwordSuccess} />}
          {passwordError && <ErrorMsg message={passwordError} />}

          <Input
            label="Current Password"
            type="password"
            placeholder="••••••••"
            error={passwordForm.formState.errors.currentPassword?.message}
            {...passwordForm.register("currentPassword")}
          />
          <Input
            label="New Password"
            type="password"
            placeholder="••••••••"
            error={passwordForm.formState.errors.newPassword?.message}
            {...passwordForm.register("newPassword")}
          />
          <Input
            label="Confirm New Password"
            type="password"
            placeholder="••••••••"
            error={passwordForm.formState.errors.confirmPassword?.message}
            {...passwordForm.register("confirmPassword")}
          />

          <button
            type="submit"
            disabled={passwordLoading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600
            text-white rounded-lg text-sm font-medium hover:bg-indigo-700
            disabled:opacity-50 transition-colors"
          >
            {passwordLoading && <Loader2 size={14} className="animate-spin" />}
            {passwordLoading ? "Changing..." : "Change Password"}
          </button>
        </form>
      </Section>

      {/* ── Workspace Settings ── */}
      <Section
        icon={Building2}
        title="Workspace Settings"
        description="Update your workspace name and settings"
      >
        <form
          onSubmit={workspaceForm.handleSubmit(onWorkspaceSubmit)}
          className="space-y-4"
        >
          {workspaceSuccess && <SuccessMsg message={workspaceSuccess} />}
          {workspaceError && <ErrorMsg message={workspaceError} />}

          <Input
            label="Workspace Name"
            error={workspaceForm.formState.errors.name?.message}
            {...workspaceForm.register("name")}
          />

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={workspaceLoading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600
              text-white rounded-lg text-sm font-medium hover:bg-indigo-700
              disabled:opacity-50 transition-colors"
            >
              {workspaceLoading && (
                <Loader2 size={14} className="animate-spin" />
              )}
              {workspaceLoading ? "Saving..." : "Save Workspace"}
            </button>

            {/* Current plan badge */}
            <span
              className={cn(
                "text-xs font-medium px-2.5 py-1 rounded-full",
                workspace?.plan === "PRO"
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-gray-100 text-gray-600",
              )}
            >
              {workspace?.plan === "PRO" ? "⚡ Pro Plan" : "🆓 Free Plan"}
            </span>
          </div>
        </form>
      </Section>

      {/* ── Danger Zone ── */}
      <Section
        icon={Trash2}
        title="Danger Zone"
        description="Permanently delete your workspace and all its data"
        danger
      >
        <div className="space-y-4">
          {deleteError && <ErrorMsg message={deleteError} />}

          <div className="bg-red-50 border border-red-100 rounded-lg p-4">
            <p className="text-sm text-red-700 font-medium mb-1">
              Delete "{workspace?.name}"
            </p>
            <p className="text-xs text-red-600">
              This will permanently delete the workspace, all projects, tasks,
              and remove all members. This action cannot be undone.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type{" "}
              <span className="font-mono font-bold text-gray-900">
                {workspace?.name}
              </span>{" "}
              to confirm:
            </label>
            <input
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={workspace?.name}
              className="w-full px-3 py-2 border border-red-300 rounded-lg
              text-sm text-gray-900 focus:outline-none focus:ring-2
              focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleDeleteWorkspace}
            disabled={!canDelete || deleteLoading}
            className="flex items-center gap-2 px-4 py-2 bg-red-600
            text-white rounded-lg text-sm font-medium hover:bg-red-700
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors"
          >
            {deleteLoading && <Loader2 size={14} className="animate-spin" />}
            <Trash2 size={14} />
            {deleteLoading ? "Deleting..." : "Delete Workspace"}
          </button>
        </div>
      </Section>
    </div>
  );
}
