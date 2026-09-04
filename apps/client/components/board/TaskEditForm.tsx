"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Calendar,
  User,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Task } from "@/lib/api/tasks";
import { useUpdateTask } from "@/hooks/useTasks";
import { useMembers } from "@/hooks/useMembers";
import { cn } from "@/lib/utils";
import TaskCommentsPanel from "./TaskCommentsPanel";
import { STATUS_OPTIONS, PRIORITY_OPTIONS } from "./TaskReadOnlyView";

const UpdateSchema = z.object({
  title: z.string().min(1, "Title required").max(100),
  description: z.string().max(500).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
});

type UpdateInput = z.infer<typeof UpdateSchema>;

interface TaskEditFormProps {
  task: Task;
  projectId: string;
  isOverdue?: boolean;
  onClose: () => void;
}

export default function TaskEditForm({
  task,
  projectId,
  isOverdue,
}: TaskEditFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  const { mutate: updateTask } = useUpdateTask(projectId);
  const { data: members } = useMembers();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<UpdateInput>({
    resolver: zodResolver(UpdateSchema),
  });

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate
          ? new Date(task.dueDate).toISOString().split("T")[0]
          : "",
        assigneeId: task.assigneeId || "",
      });
      setSaveSuccess(false);
      setServerError("");
    }
  }, [task, reset]);

  const watchedStatus = watch("status");
  const watchedPriority = watch("priority");

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === watchedStatus);
  const currentPriority = PRIORITY_OPTIONS.find(
    (p) => p.value === watchedPriority,
  );

  const onSubmit = async (data: UpdateInput) => {
    if (!task) return;
    try {
      setIsSaving(true);
      setServerError("");
      updateTask(
        {
          id: task.id,
          data: {
            title: data.title,
            description: data.description,
            status: data.status,
            priority: data.priority,
            dueDate: data.dueDate || undefined,
            assigneeId: data.assigneeId || undefined,
          },
        },
        {
          onSuccess: () => {
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
          },
          onError: (err: any) => {
            setServerError(
              err.response?.data?.error?.message || "Failed to update task",
            );
          },
        },
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
      {serverError && (
        <div
          className="bg-red-50 border border-red-200 text-red-600
          text-xs rounded-lg p-3 flex items-center gap-2"
        >
          <AlertCircle size={14} />
          {serverError}
        </div>
      )}

      {isOverdue && (
        <div
          className="bg-orange-50 border border-orange-200
          text-orange-700 text-xs rounded-lg p-3
          flex items-center gap-2"
        >
          <AlertCircle size={14} />
          This task is overdue!
        </div>
      )}

      {/* Title */}
      <div>
        <label
          className="block text-xs font-medium text-gray-500
          uppercase tracking-wide mb-1.5"
        >
          Title
        </label>
        <input
          {...register("title")}
          className="w-full px-3 py-2 border border-gray-200
          rounded-lg text-sm text-gray-900 focus:outline-none
          focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        {errors.title && (
          <p className="text-red-500 text-xs mt-1">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* Status + Priority */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            className="block text-xs font-medium text-gray-500
            uppercase tracking-wide mb-1.5"
          >
            Status
          </label>
          <div className="relative">
            <select
              {...register("status")}
              className="w-full px-3 py-2 border border-gray-200
              rounded-lg text-sm text-gray-900 focus:outline-none
              focus:ring-2 focus:ring-indigo-500 bg-white
              appearance-none cursor-pointer"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <div
              className="absolute right-8 top-1/2 -translate-y-1/2
              w-2 h-2 rounded-full pointer-events-none"
              style={{ backgroundColor: currentStatus?.color }}
            />
          </div>
        </div>
        <div>
          <label
            className="block text-xs font-medium text-gray-500
            uppercase tracking-wide mb-1.5"
          >
            Priority
          </label>
          <select
            {...register("priority")}
            className="w-full px-3 py-2 border border-gray-200
            rounded-lg text-sm text-gray-900 focus:outline-none
            focus:ring-2 focus:ring-indigo-500 bg-white cursor-pointer"
            style={{
              backgroundColor: currentPriority?.bg,
              color: currentPriority?.color,
            }}
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Assignee */}
      <div>
        <label
          className="block text-xs font-medium text-gray-500
          uppercase tracking-wide mb-1.5 flex items-center gap-1.5"
        >
          <User size={11} />
          Assignee
        </label>
        <select
          {...register("assigneeId")}
          className="w-full px-3 py-2 border border-gray-200
          rounded-lg text-sm text-gray-900 focus:outline-none
          focus:ring-2 focus:ring-indigo-500 bg-white cursor-pointer"
        >
          <option value="">Unassigned</option>
          {members?.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.user.name}
              {m.role === "OWNER"
                ? " (Owner)"
                : m.role === "ADMIN"
                  ? " (Admin)"
                  : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Due Date */}
      <div>
        <label
          className={cn(
            "block text-xs font-medium uppercase tracking-wide mb-1.5",
            "flex items-center gap-1.5",
            isOverdue ? "text-orange-500" : "text-gray-500",
          )}
        >
          <Calendar size={11} />
          Due Date
          {isOverdue && (
            <span
              className="text-orange-500 normal-case
              tracking-normal font-normal"
            >
              — overdue!
            </span>
          )}
        </label>
        <input
          {...register("dueDate")}
          type="date"
          className={cn(
            "w-full px-3 py-2 border rounded-lg text-sm",
            "text-gray-900 focus:outline-none focus:ring-2",
            "focus:ring-indigo-500 focus:border-transparent",
            isOverdue
              ? "border-orange-300 bg-orange-50"
              : "border-gray-200",
          )}
        />
      </div>

      {/* Description */}
      <div>
        <label
          className="block text-xs font-medium text-gray-500
          uppercase tracking-wide mb-1.5"
        >
          Description
        </label>
        <textarea
          {...register("description")}
          rows={3}
          placeholder="Add more details about this task..."
          className="w-full px-3 py-2 border border-gray-200
          rounded-lg text-sm text-gray-900 focus:outline-none
          focus:ring-2 focus:ring-indigo-500 focus:border-transparent
          resize-none"
        />
      </div>

      {/* Meta */}
      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400 flex items-center gap-1.5">
            <User size={11} />
            Created by
          </span>
          <span className="text-gray-600 font-medium">
            {task.creator?.name}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400 flex items-center gap-1.5">
            <Clock size={11} />
            Created at
          </span>
          <span className="text-gray-600">
            {new Date(task.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
        {task.updatedAt !== task.createdAt && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400 flex items-center gap-1.5">
              <Clock size={11} />
              Last updated
            </span>
            <span className="text-gray-600">
              {new Date(task.updatedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        )}
      </div>

      {/* ── Comments section ── */}
      <div className="border-t border-gray-100 pt-4">
        <TaskCommentsPanel taskId={task.id} />
      </div>

      {/* Save button */}
      <div
        className="sticky bottom-0 bg-white pt-3 pb-2
        border-t border-gray-100"
      >
        <button
          type="submit"
          disabled={isSaving || !isDirty}
          className={cn(
            "w-full py-2.5 rounded-xl text-sm font-medium",
            "transition-all duration-200",
            saveSuccess
              ? "bg-green-500 text-white"
              : isDirty
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "bg-gray-100 text-gray-400 cursor-not-allowed",
          )}
        >
          {isSaving ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Saving...
            </span>
          ) : saveSuccess ? (
            "✓ Saved!"
          ) : isDirty ? (
            "Save Changes"
          ) : (
            "No changes"
          )}
        </button>
      </div>
    </form>
  );
}
