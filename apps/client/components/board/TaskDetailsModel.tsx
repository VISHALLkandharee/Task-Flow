"use client";

import { useState } from "react";
import { X, CheckSquare, Trash2, Loader2 } from "lucide-react";
import { Task, TaskStatus } from "@/lib/api/tasks";
import { useDeleteTask, useUpdateTask } from "@/hooks/useTasks";
import TaskReadOnlyView from "./TaskReadOnlyView";
import TaskEditForm from "./TaskEditForm";

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [readOnlyStatus, setReadOnlyStatus] = useState<TaskStatus>(
    task?.status || "TODO",
  );

  const { mutate: deleteTask } = useDeleteTask(projectId);
  const { mutate: updateTask } = useUpdateTask(projectId);

  if (!isOpen || !task) return null;

  const isOverdue = Boolean(
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "DONE"
  );

  const handleDelete = () => {
    if (!confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    setIsDeleting(true);
    deleteTask(task.id, {
      onSuccess: () => onClose(),
      onError: () => setIsDeleting(false),
    });
  };

  const handleReadOnlyStatusChange = (newStatus: TaskStatus) => {
    setReadOnlyStatus(newStatus);
    updateTask({
      id: task.id,
      data: { status: newStatus },
    });
  };

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
                type="button"
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
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600
              hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Content ── */}
        {readOnly ? (
          <TaskReadOnlyView
            task={task}
            isOverdue={isOverdue}
            readOnlyStatus={readOnlyStatus}
            onStatusChange={handleReadOnlyStatusChange}
          />
        ) : (
          <TaskEditForm
            task={task}
            projectId={projectId}
            isOverdue={isOverdue}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}
