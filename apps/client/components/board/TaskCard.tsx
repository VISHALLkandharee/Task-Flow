"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  Calendar,
  User,
  Trash2,
  AlertCircle,
  GripVertical,
} from "lucide-react";
import { Task } from "@/lib/api/tasks";
import { cn } from "@/lib/utils";

interface Props {
  task: Task;
  onDelete: (id: string) => void;
  onClick: (task: Task) => void;
}

const PRIORITY_STYLES = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

export default function TaskCard({ task, onDelete, onClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      data: { task },
    });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "DONE";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-white rounded-lg border border-gray-200",
        "hover:shadow-md transition-shadow select-none group",
        "flex items-stretch",
        isDragging && "opacity-50 shadow-lg rotate-2 z-50",
      )}
    >
      {/* ── Drag handle — left strip ── */}
      <div
        {...listeners}
        {...attributes}
        className="flex items-center px-1.5 cursor-grab
        active:cursor-grabbing text-gray-300 hover:text-gray-400
        hover:bg-gray-50 rounded-l-lg transition-colors"
      >
        <GripVertical size={14} />
      </div>

      {/* ── Card content — clickable ── */}
      <div
        onClick={() => onClick(task)}
        className="flex-1 p-3 cursor-pointer min-w-0"
      >
        {/* Priority + Delete */}
        <div className="flex items-center justify-between mb-2">
          <span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              PRIORITY_STYLES[task.priority],
            )}
          >
            {task.priority}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm("Delete this task?")) {
                onDelete(task.id);
              }
            }}
            className="opacity-0 group-hover:opacity-100 text-gray-400
            hover:text-red-500 transition-all p-0.5 rounded"
          >
            <Trash2 size={13} />
          </button>
        </div>

        {/* Title */}
        <p
          className="text-sm font-medium text-gray-900 mb-2
        leading-snug hover:text-indigo-600 transition-colors"
        >
          {task.title}
        </p>

        {/* Description */}
        {task.description && (
          <p
            className="text-xs text-gray-500 mb-2 line-clamp-2
          leading-relaxed"
          >
            {task.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-2">
          {task.dueDate ? (
            <div
              className={cn(
                "flex items-center gap-1 text-xs",
                isOverdue ? "text-red-500" : "text-gray-400",
              )}
            >
              {isOverdue && <AlertCircle size={11} />}
              <Calendar size={11} />
              <span>
                {new Date(task.dueDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          ) : (
            <div />
          )}

          {task.assignee ? (
            <div
              className="w-5 h-5 bg-indigo-100 rounded-full flex
              items-center justify-center"
              title={task.assignee.name}
            >
              <span className="text-xs font-medium text-indigo-700">
                {task.assignee.name.charAt(0).toUpperCase()}
              </span>
            </div>
          ) : (
            <User size={13} className="text-gray-300" />
          )}
        </div>
      </div>
    </div>
  );
}
