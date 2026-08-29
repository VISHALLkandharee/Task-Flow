"use client";

import { Task, TaskStatus } from "@/lib/api/tasks";
import { AlertCircle, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";
import TaskCommentsPanel from "./TaskCommentsPanel";

export const STATUS_OPTIONS = [
  { value: "TODO", label: "To Do", color: "#9ca3af" },
  { value: "IN_PROGRESS", label: "In Progress", color: "#60a5fa" },
  { value: "IN_REVIEW", label: "In Review", color: "#fbbf24" },
  { value: "DONE", label: "Done", color: "#4ade80" },
];

export const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low", bg: "#f3f4f6", color: "#4b5563" },
  { value: "MEDIUM", label: "Medium", bg: "#dbeafe", color: "#1e40af" },
  { value: "HIGH", label: "High", bg: "#ffedd5", color: "#9a3412" },
  { value: "URGENT", label: "Urgent", bg: "#fee2e2", color: "#991b1b" },
];

interface TaskReadOnlyViewProps {
  task: Task;
  isOverdue?: boolean;
  readOnlyStatus: TaskStatus;
  onStatusChange: (status: TaskStatus) => void;
}

export default function TaskReadOnlyView({
  task,
  isOverdue,
  readOnlyStatus,
  onStatusChange,
}: TaskReadOnlyViewProps) {
  const currentPriority = PRIORITY_OPTIONS.find((p) => p.value === task.priority);

  return (
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
          onChange={(e) => onStatusChange(e.target.value as TaskStatus)}
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
            backgroundColor: currentPriority?.bg,
            color: currentPriority?.color,
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
        <TaskCommentsPanel taskId={task.id} />
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
  );
}
