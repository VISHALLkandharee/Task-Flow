"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { TaskStatus, Priority } from "@/lib/api/tasks";
import { useCreateTask } from "@/hooks/useTasks";
import { useMembers } from "@/hooks/useMembers";

const CreateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
});

type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  defaultStatus: TaskStatus;
}

export default function CreateTaskModal({
  isOpen,
  onClose,
  projectId,
  defaultStatus,
}: Props) {
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { mutate: createTask } = useCreateTask(projectId);

  // Fetch workspace members for assignee dropdown
  const { data: members } = useMembers();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(CreateTaskSchema),
    defaultValues: { priority: "MEDIUM" },
  });

  const onSubmit = async (data: CreateTaskInput) => {
    try {
      setIsLoading(true);
      setServerError("");

      createTask(
        {
          title: data.title,
          description: data.description,
          priority: data.priority as Priority,
          dueDate: data.dueDate,
          assigneeId: data.assigneeId || undefined,
          status: defaultStatus,
          projectId,
        },
        {
          onSuccess: () => {
            reset();
            onClose();
          },
          onError: (error: any) => {
            setServerError(
              error.response?.data?.error?.message || "Failed to create task",
            );
          },
        },
      );
    } finally {
      setIsLoading(false);
    }
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
          <h2 className="text-lg font-semibold text-gray-900">Create Task</h2>
          <button onClick={handleClose}>
            <X size={20} className="text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {serverError && (
            <div
              className="bg-red-50 border border-red-200 text-red-600
            text-sm rounded-lg p-3"
            >
              {serverError}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Title
            </label>
            <input
              {...register("title")}
              placeholder="e.g. Fix login bug"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg
              text-sm text-gray-900 focus:outline-none focus:ring-2
              focus:ring-indigo-500 focus:border-transparent"
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">
                {errors.title.message}
              </p>
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
              placeholder="Add more details..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg
              text-sm text-gray-900 focus:outline-none focus:ring-2
              focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Priority + Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                {...register("priority")}
                className="w-full px-3 py-2 border border-gray-300
                rounded-lg text-sm text-gray-900 focus:outline-none
                focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                {...register("dueDate")}
                type="date"
                className="w-full px-3 py-2 border border-gray-300
                rounded-lg text-sm text-gray-900 focus:outline-none
                focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign To
              <span className="text-gray-400 font-normal ml-1">(optional)</span>
            </label>
            <select
              {...register("assigneeId")}
              className="w-full px-3 py-2 border border-gray-300
              rounded-lg text-sm text-gray-900 focus:outline-none
              focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Unassigned</option>
              {members?.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.user.name} ({member.role})
                </option>
              ))}
            </select>
          </div>

          {/* Status indicator */}
          <div
            className="bg-gray-50 rounded-lg px-3 py-2 text-xs
          text-gray-500"
          >
            Adding to:{" "}
            <span className="font-medium text-gray-700">
              {defaultStatus.replace("_", " ")}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300
              rounded-lg text-sm font-medium text-gray-700
              hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white
              rounded-lg text-sm font-medium hover:bg-indigo-700
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors"
            >
              {isLoading ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
