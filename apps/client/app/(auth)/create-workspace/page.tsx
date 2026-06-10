"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";

const Schema = z.object({
  workspaceName: z.string().min(2, "At least 2 characters").max(50, "Too long"),
});

type Input = z.infer<typeof Schema>;

export default function CreateWorkspacePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setWorkspace } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Input>({
    resolver: zodResolver(Schema),
  });

  const onSubmit = async (data: Input) => {
    try {
      setIsLoading(true);
      setServerError("");

      const response = await api.post("/workspaces", {
        name: data.workspaceName,
      });

      // Invalidate 'me' query to ensure the layout fetches fresh data with the new workspace
      await queryClient.invalidateQueries({ queryKey: ["me"] });

      const newWorkspace = response.data.workspace;

      // Add to workspaces list
      const currentWorkspaces = useAuthStore.getState().workspaces;
      useAuthStore.getState().setWorkspaces([
        ...currentWorkspaces,
        { ...newWorkspace, role: 'OWNER' },
      ]);

      // Switch to new workspace
      setWorkspace(newWorkspace);
      router.push("/dashboard");
    } catch (error: any) {
      setServerError(
        error.response?.data?.error?.message || "Failed to create workspace",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border
    border-gray-200 p-8"
    >
      <h2 className="text-2xl font-semibold text-gray-900 mb-1">
        Create a Workspace
      </h2>
      <p className="text-gray-500 text-sm mb-6">
        Create a new workspace to organize your projects and collaborate with your team.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div
            className="bg-red-50 border border-red-200 text-red-600
          text-sm rounded-lg p-3"
          >
            {serverError}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Workspace Name
          </label>
          <input
            {...register("workspaceName")}
            placeholder="My New Startup"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg
            text-sm text-gray-900 focus:outline-none focus:ring-2
            focus:ring-indigo-500 focus:border-transparent"
          />
          {errors.workspaceName && (
            <p className="text-red-500 text-xs mt-1">
              {errors.workspaceName.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 text-white py-2 px-4
          rounded-lg text-sm font-medium hover:bg-indigo-700
          disabled:opacity-50 transition-colors"
        >
          {isLoading ? "Creating..." : "Create Workspace"}
        </button>
      </form>
    </div>
  );
}
