"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { useCreateProject } from "@/hooks/useProjects";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import Link from "next/link";

const CreateProjectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  description: z.string().max(200).optional(),
  color: z.string().optional(),
});

type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

const COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateProjectModal({ isOpen, onClose }: Props) {
  const { workspace } = useAuthStore();
  const { mutate: createProject, isPending } = useCreateProject();
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isFreePlanError =
    serverError.includes("Free plan") ||
    serverError.includes("3 projects") ||
    serverError.includes("Upgrade");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(CreateProjectSchema),
  });

  const onSubmit = (data: CreateProjectInput) => {
    setServerError("");
    createProject(
      {
        name: data.name,
        description: data.description,
        color: selectedColor,
        workspaceId: workspace!.id,
      },
      {
        onSuccess: () => {
          reset();
          setSelectedColor(COLORS[0]);
          onClose();
        },
        onError: (error: any) => {
          setServerError(
            error.response?.data?.error?.message ||
              error.response?.data?.message ||
              "Failed to create project",
          );
        },
      },
    );
  };

  const handleClose = () => {
    reset();
    setServerError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center
      justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6
        border-b border-gray-200"
        >
          <h2 className="text-lg font-semibold text-gray-900">
            Create Project
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Server error */}
          {serverError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{serverError}</p>
              {/* Show upgrade link if it's a plan limit error */}
              {isFreePlanError && (
                <Link
                  href="/billing"
                  onClick={handleClose}
                  className="inline-flex items-center gap-1 text-indigo-600
                  font-medium hover:underline text-xs mt-2"
                >
                  Upgrade to Pro for unlimited projects →
                </Link>
              )}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Name
            </label>
            <input
              {...register("name")}
              placeholder="e.g. Website Redesign"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg
              text-sm text-gray-900 focus:outline-none focus:ring-2
              focus:ring-indigo-500 focus:border-transparent"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
              <span className="text-gray-400 font-normal ml-1">(optional)</span>
            </label>
            <textarea
              {...register("description")}
              placeholder="What is this project about?"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg
              text-sm text-gray-900 focus:outline-none focus:ring-2
              focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    "w-8 h-8 rounded-full transition-transform",
                    selectedColor === color
                      ? "scale-125 ring-2 ring-offset-2 ring-gray-400"
                      : "hover:scale-110",
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full shrink-0"
              style={{ backgroundColor: selectedColor }}
            />
            <span className="text-sm text-gray-600">Project preview</span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg
              text-sm font-medium text-gray-700 hover:bg-gray-50
              transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white
              rounded-lg text-sm font-medium hover:bg-indigo-700
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors"
            >
              {isPending ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
