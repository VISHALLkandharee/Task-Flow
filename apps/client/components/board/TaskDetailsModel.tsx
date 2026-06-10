"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  X,
  Calendar,
  User,
  CheckSquare,
  Trash2,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Task, TaskStatus } from "@/lib/api/tasks";
import { useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import { useMembers } from "@/hooks/useMembers";
import { cn } from "@/lib/utils";
import {
  useComments,
  useCreateComment,
  useDeleteComment,
} from "@/hooks/useComments";
import { useAuthStore } from "@/store/authStore";

const UpdateSchema = z.object({
  title: z.string().min(1, "Title required").max(100),
  description: z.string().max(500).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
});

type UpdateInput = z.infer<typeof UpdateSchema>;

const STATUS_OPTIONS = [
  { value: "TODO", label: "To Do", color: "#9ca3af" },
  { value: "IN_PROGRESS", label: "In Progress", color: "#60a5fa" },
  { value: "IN_REVIEW", label: "In Review", color: "#fbbf24" },
  { value: "DONE", label: "Done", color: "#4ade80" },
];

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low", bg: "#f3f4f6", color: "#4b5563" },
  { value: "MEDIUM", label: "Medium", bg: "#dbeafe", color: "#1e40af" },
  { value: "HIGH", label: "High", bg: "#ffedd5", color: "#9a3412" },
  { value: "URGENT", label: "Urgent", bg: "#fee2e2", color: "#991b1b" },
];

interface Props {
  task: Task | null;
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  readOnly?: boolean;
}

export default function TaskDetailModal({
  task,
  projectId,
  isOpen,
  onClose,
  readOnly = false,
}: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [serverError, setServerError] = useState("");
  const [readOnlyStatus, setReadOnlyStatus] = useState<TaskStatus>(
    task?.status || "TODO",
  );

  const { mutate: updateTask } = useUpdateTask(projectId);
  const { mutate: deleteTask } = useDeleteTask(projectId);
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
      setReadOnlyStatus(task.status);
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

  const isOverdue =
    task?.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "DONE";

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

  const handleDelete = () => {
    if (!task) return;
    if (!confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    setIsDeleting(true);
    deleteTask(task.id, {
      onSuccess: () => onClose(),
      onError: () => setIsDeleting(false),
    });
  };

  const handleReadOnlyStatusChange = (newStatus: TaskStatus) => {
    if (!task) return;
    setReadOnlyStatus(newStatus);
    updateTask({
      id: task.id,
      data: { status: newStatus },
    });
  };

  if (!isOpen || !task) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-start
      justify-end z-50"
      onClick={onClose}
    >
      <div
        className="bg-white h-full w-full max-w-md shadow-xl
        overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div
          className="sticky top-0 bg-white border-b border-gray-200
          px-5 py-4 flex items-center justify-between z-10"
        >
          <div className="flex items-center gap-2">
            <CheckSquare size={16} className="text-indigo-600" />
            <span className="text-sm font-medium text-gray-500">
              Task Detail
            </span>
            {readOnly && (
              <span
                className="text-xs bg-gray-100 text-gray-500
                px-2 py-0.5 rounded-full"
              >
                View only
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!readOnly && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1.5 text-gray-400 hover:text-red-500
                hover:bg-red-50 rounded-lg transition-colors"
                title="Delete task"
              >
                {isDeleting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Trash2 size={15} />
                )}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600
              hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── READ ONLY VIEW ── */}
        {readOnly ? (
          <div className="p-5 space-y-5">
            {/* Overdue warning */}
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
                className="block text-xs font-medium text-gray-400
                uppercase tracking-wide mb-1.5"
              >
                Title
              </label>
              <p
                className="text-sm font-medium text-gray-900 px-3 py-2
                bg-gray-50 rounded-lg border border-gray-200"
              >
                {task.title}
              </p>
            </div>

            {/* Status — editable */}
            <div>
              <label
                className="block text-xs font-medium text-gray-400
                uppercase tracking-wide mb-1.5"
              >
                Status
                <span
                  className="ml-1 normal-case tracking-normal
                  text-indigo-600 font-normal"
                >
                  (you can update this)
                </span>
              </label>
              <select
                value={readOnlyStatus}
                onChange={(e) =>
                  handleReadOnlyStatusChange(e.target.value as TaskStatus)
                }
                className="w-full px-3 py-2 border border-indigo-200
                rounded-lg text-sm text-gray-900 focus:outline-none
                focus:ring-2 focus:ring-indigo-500 bg-indigo-50
                cursor-pointer"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label
                className="block text-xs font-medium text-gray-400
                uppercase tracking-wide mb-1.5"
              >
                Priority
              </label>
              <div
                className="px-3 py-2 rounded-lg text-sm font-medium
                border border-gray-200 w-fit"
                style={{
                  backgroundColor: PRIORITY_OPTIONS.find(
                    (p) => p.value === task.priority,
                  )?.bg,
                  color: PRIORITY_OPTIONS.find((p) => p.value === task.priority)
                    ?.color,
                }}
              >
                {task.priority}
              </div>
            </div>

            {/* Due date */}
            <div>
              <label
                className={cn(
                  "block text-xs font-medium uppercase tracking-wide mb-1.5",
                  "flex items-center gap-1.5",
                  isOverdue ? "text-orange-500" : "text-gray-400",
                )}
              >
                <Calendar size={11} />
                Due Date
              </label>
              {task.dueDate ? (
                <p
                  className={cn(
                    "text-sm px-3 py-2 rounded-lg border",
                    isOverdue
                      ? "bg-orange-50 border-orange-200 text-orange-700"
                      : "bg-gray-50 border-gray-200 text-gray-700",
                  )}
                >
                  {new Date(task.dueDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {isOverdue && " — Overdue!"}
                </p>
              ) : (
                <p
                  className="text-sm text-gray-400 px-3 py-2 bg-gray-50
                  rounded-lg border border-gray-200"
                >
                  No due date set
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                className="block text-xs font-medium text-gray-400
                uppercase tracking-wide mb-1.5"
              >
                Description
              </label>
              {task.description ? (
                <p
                  className="text-sm text-gray-700 px-3 py-2 bg-gray-50
                  rounded-lg border border-gray-200 leading-relaxed"
                >
                  {task.description}
                </p>
              ) : (
                <p
                  className="text-sm text-gray-400 px-3 py-2 bg-gray-50
                  rounded-lg border border-gray-200"
                >
                  No description
                </p>
              )}
            </div>

            {/* Assignee */}
            <div>
              <label
                className="block text-xs font-medium text-gray-400
                uppercase tracking-wide mb-1.5 flex items-center gap-1.5"
              >
                <User size={11} />
                Assigned to
              </label>
              <div
                className="flex items-center gap-2 px-3 py-2
                bg-gray-50 rounded-lg border border-gray-200"
              >
                {task.assignee ? (
                  <>
                    <div
                      className="w-6 h-6 bg-indigo-100 rounded-full
                      flex items-center justify-center"
                    >
                      <span className="text-xs font-medium text-indigo-700">
                        {task.assignee.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-700">
                      {task.assignee.name}
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-gray-400">Unassigned</span>
                )}
              </div>
            </div>

            {/* Meta */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Created by</span>
                <span className="text-gray-600 font-medium">
                  {task.creator?.name}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Created</span>
                <span className="text-gray-600">
                  {new Date(task.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            {/* ── Comments section ── */}
            <div className="border-t border-gray-100 pt-4">
              <CommentsSection taskId={task.id} />
            </div>

            {/* Footer note */}
            <div
              className="sticky bottom-0 bg-white pt-3 pb-2
              border-t border-gray-100"
            >
              <p className="text-xs text-center text-gray-400">
                Only the task creator can edit other details
              </p>
            </div>
          </div>
        ) : (
          // ── EDITABLE VIEW ──
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
              <CommentsSection taskId={task.id} />
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
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Comments Section Component
// ─────────────────────────────────────────
function CommentsSection({ taskId }: { taskId: string }) {
  const [content, setContent] = useState("");
  const { user } = useAuthStore();
  const { data: comments, isLoading } = useComments(taskId);
  const { mutate: createComment, isPending } = useCreateComment(taskId);
  const { mutate: deleteComment } = useDeleteComment(taskId);

  const submitComment = () => {
    if (!content.trim()) return;
    createComment(content.trim(), {
      onSuccess: () => setContent(""),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitComment();
    }
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / 1000,
    );
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div>
      <label
        className="block text-xs font-medium text-gray-500
        uppercase tracking-wide mb-3"
      >
        Comments ({comments?.length || 0})
      </label>

      {/* Comment list */}
      <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 size={16} className="animate-spin text-gray-400" />
          </div>
        ) : comments?.length === 0 ? (
          <p
            className="text-xs text-gray-400 text-center py-4
            bg-gray-50 rounded-lg border border-gray-200"
          >
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments?.map((comment) => (
            <div key={comment.id} className="flex gap-2.5 group">
              {/* Avatar */}
              <div
                className="w-6 h-6 bg-indigo-100 rounded-full flex
                items-center justify-center shrink-0 mt-0.5"
              >
                <span className="text-xs font-medium text-indigo-700">
                  {comment.author.name.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-900">
                    {comment.author.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {timeAgo(comment.createdAt)}
                  </span>
                  {comment.author.id === user?.id && (
                    <button
                      onClick={() => deleteComment(comment.id)}
                      className="opacity-0 group-hover:opacity-100
                      text-gray-300 hover:text-red-500 transition-all
                      ml-auto"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
                <p
                  className="text-xs text-gray-700 leading-relaxed
                  bg-gray-50 rounded-lg px-3 py-2 border border-gray-200"
                >
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add comment form */}
      <div className="flex gap-2">
        <div
          className="w-6 h-6 bg-indigo-100 rounded-full flex
          items-center justify-center shrink-0 mt-1"
        >
          <span className="text-xs font-medium text-indigo-700">
            {user?.name?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment..."
            className="flex-1 px-3 py-1.5 text-xs border
            border-gray-200 rounded-lg text-gray-900 bg-white
            focus:outline-none focus:ring-1 focus:ring-indigo-500
            placeholder:text-gray-400"
          />
          <button
            type="button"
            onClick={submitComment}
            disabled={isPending || !content.trim()}
            className="px-3 py-1.5 bg-indigo-600 text-white text-xs
            rounded-lg hover:bg-indigo-700 disabled:opacity-50
            disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isPending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              "Send"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
