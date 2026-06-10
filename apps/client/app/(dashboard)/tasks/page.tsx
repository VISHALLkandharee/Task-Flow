"use client";

import { useState } from "react";
import { useMyTasks, useUpdateMyTask } from "@/hooks/useTasks";
import { Task, TaskStatus } from "@/lib/api/tasks";
import TaskDetailModal from "@/components/board/TaskDetailsModel";
import { cn } from "@/lib/utils";
import { CheckSquare, Loader2, Calendar, AlertCircle } from "lucide-react";

const STATUS_CONFIG = {
  TODO: {
    label: "To Do",
    color: "bg-gray-400",
    badge: "bg-gray-100 text-gray-700",
    selectBg: "#f3f4f6",
    selectColor: "#374151",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "bg-blue-400",
    badge: "bg-blue-100 text-blue-700",
    selectBg: "#dbeafe",
    selectColor: "#1e40af",
  },
  IN_REVIEW: {
    label: "In Review",
    color: "bg-yellow-400",
    badge: "bg-yellow-100 text-yellow-700",
    selectBg: "#fef9c3",
    selectColor: "#854d0e",
  },
  DONE: {
    label: "Done",
    color: "bg-green-400",
    badge: "bg-green-100 text-green-700",
    selectBg: "#dcfce7",
    selectColor: "#166534",
  },
};

const PRIORITY_CONFIG = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

const COLUMNS: TaskStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];

export default function MyTasksPage() {
  const { data, isLoading } = useMyTasks();
  const [filter, setFilter] = useState<TaskStatus | "ALL">("ALL");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const grouped = data?.grouped;
  const allTasks = data?.tasks || [];

  const filteredTasks = filter === "ALL" ? allTasks : grouped?.[filter] || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
        <p className="text-gray-500 text-sm mt-1">
          {allTasks.length} task
          {allTasks.length !== 1 ? "s" : ""} assigned to you
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <FilterTab
          label="All"
          count={allTasks.length}
          active={filter === "ALL"}
          onClick={() => setFilter("ALL")}
        />
        {COLUMNS.map((status) => (
          <FilterTab
            key={status}
            label={STATUS_CONFIG[status].label}
            count={grouped?.[status]?.length || 0}
            active={filter === status}
            onClick={() => setFilter(status)}
            color={STATUS_CONFIG[status].color}
          />
        ))}
      </div>

      {/* Tasks list */}
      {filteredTasks.length === 0 ? (
        <div
          className="bg-white rounded-xl border border-gray-200
          p-12 text-center"
        >
          <CheckSquare size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            No tasks here
          </h3>
          <p className="text-gray-500 text-sm">
            {filter === "ALL"
              ? "No tasks assigned to you yet"
              : `No ${STATUS_CONFIG[filter as TaskStatus].label} tasks`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task as any}
              onOpenDetail={() => setSelectedTask(task)}
            />
          ))}
        </div>
      )}

      {/* Task Detail Modal — readOnly for members */}
      <TaskDetailModal
        task={selectedTask}
        projectId={selectedTask?.projectId || ""}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        readOnly={true}
      />
    </div>
  );
}

// ─────────────────────────────────────────
// Filter Tab
// ─────────────────────────────────────────
function FilterTab({
  label,
  count,
  active,
  onClick,
  color,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm",
        "border transition-colors",
        active
          ? "bg-indigo-600 text-white border-indigo-600"
          : "bg-white text-gray-600 border-gray-200 hover:border-gray-300",
      )}
    >
      {color && <div className={cn("w-2 h-2 rounded-full", color)} />}
      {label}
      <span
        className={cn(
          "text-xs px-1.5 py-0.5 rounded-full font-medium",
          active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600",
        )}
      >
        {count}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────
// Task Row
// ─────────────────────────────────────────
function TaskRow({
  task,
  onOpenDetail,
}: {
  task: Task & {
    project: {
      id: string;
      name: string;
      color: string;
      workspace: { name: string };
    };
  };
  onOpenDetail: () => void;
}) {
  const statusConfig = STATUS_CONFIG[task.status];

  // ← useUpdateMyTask updates my-tasks cache instantly
  const { mutate: updateTask, isPending } = useUpdateMyTask();

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "DONE";

  const handleStatusChange = (newStatus: TaskStatus) => {
    updateTask({
      id: task.id,
      data: { status: newStatus },
    });
  };

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-4
      hover:shadow-sm transition-shadow"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Left side */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Status dot */}
          <div
            className={cn(
              "w-2.5 h-2.5 rounded-full mt-1.5 shrink-0",
              statusConfig.color,
            )}
          />

          <div className="flex-1 min-w-0">
            {/* Title */}
            <button
              onClick={onOpenDetail}
              className="text-sm font-medium text-gray-900 mb-1
              hover:text-indigo-600 transition-colors text-left
              w-full truncate"
            >
              {task.title}
            </button>

            {/* Description */}
            {task.description && (
              <p className="text-xs text-gray-500 mb-2 line-clamp-1">
                {task.description}
              </p>
            )}

            {/* Meta */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Project — label only, no link */}
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: task.project?.color }}
                />
                {task.project?.name}
              </div>

              {/* Workspace */}
              <span className="text-xs text-gray-400">
                {task.project?.workspace?.name}
              </span>

              {/* Due date */}
              {task.dueDate && (
                <div
                  className={cn(
                    "flex items-center gap-1 text-xs",
                    isOverdue ? "text-red-500" : "text-gray-400",
                  )}
                >
                  {isOverdue && <AlertCircle size={11} />}
                  <Calendar size={11} />
                  {new Date(task.dueDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                  {isOverdue && <span className="font-medium"> (overdue)</span>}
                </div>
              )}

              {/* Creator */}
              <span className="text-xs text-gray-400">
                by {task.creator?.name}
              </span>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:shrink-0 justify-end sm:justify-start w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
          {/* Priority badge */}
          <span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              PRIORITY_CONFIG[task.priority],
            )}
          >
            {task.priority}
          </span>

          {/* Status dropdown — instant update */}
          <div className="relative">
            <select
              value={task.status}
              onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
              disabled={isPending}
              className="text-xs font-medium px-2.5 py-1.5 rounded-lg
              border cursor-pointer focus:outline-none
              focus:ring-2 focus:ring-indigo-500 appearance-none
              pr-6 transition-colors"
              style={{
                backgroundColor: statusConfig.selectBg,
                color: statusConfig.selectColor,
                borderColor: statusConfig.selectBg,
              }}
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="DONE">Done</option>
            </select>

            {isPending && (
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                <Loader2 size={10} className="animate-spin" />
              </div>
            )}
          </div>

          {/* Details button */}
          <button
            onClick={onOpenDetail}
            className="text-xs text-gray-400 hover:text-indigo-600
            px-2 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors
            border border-gray-200 hover:border-indigo-200"
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
}
