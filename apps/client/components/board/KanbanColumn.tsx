"use client";

import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { Task, TaskStatus } from "@/lib/api/tasks";
import TaskCard from "./TaskCard";
import { cn } from "@/lib/utils";

interface Props {
  status: TaskStatus;
  tasks: Task[];
  onAddTask: (status: TaskStatus) => void;
  onDeleteTask: (id: string) => void;
  onTaskClick: (task: Task) => void; // ← add this
}

const COLUMN_CONFIG = {
  TODO: {
    label: "To Do",
    color: "bg-gray-400",
    light: "bg-gray-50",
    border: "border-gray-200",
    count: "bg-gray-200 text-gray-700",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "bg-blue-400",
    light: "bg-blue-50",
    border: "border-blue-100",
    count: "bg-blue-100 text-blue-700",
  },
  IN_REVIEW: {
    label: "In Review",
    color: "bg-yellow-400",
    light: "bg-yellow-50",
    border: "border-yellow-100",
    count: "bg-yellow-100 text-yellow-700",
  },
  DONE: {
    label: "Done",
    color: "bg-green-400",
    light: "bg-green-50",
    border: "border-green-100",
    count: "bg-green-100 text-green-700",
  },
};

export default function KanbanColumn({
  status,
  tasks,
  onAddTask,
  onDeleteTask,
  onTaskClick,
}: Props) {
  const config = COLUMN_CONFIG[status];

  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn("w-2.5 h-2.5 rounded-full", config.color)} />
          <span className="text-sm font-semibold text-gray-900">
            {config.label}
          </span>
          <span
            className={cn(
              "text-xs font-medium px-1.5 py-0.5 rounded-full",
              config.count,
            )}
          >
            {tasks.length}
          </span>
        </div>

        {/* Add task button */}
        <button
          onClick={() => onAddTask(status)}
          className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50
          rounded p-0.5 transition-colors"
          title="Add task"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 rounded-xl p-2 min-h-[500px]",
          "transition-colors duration-200",
          "flex flex-col gap-2",
          isOver
            ? `${config.light} ${config.border} border-2 border-dashed`
            : "bg-gray-50/80 border-2 border-transparent",
        )}
      >
        {/* Tasks */}
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onDelete={onDeleteTask}
            onClick={onTaskClick}
          />
        ))}

        {/* Empty column hint */}
        {tasks.length === 0 && !isOver && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-gray-400 text-center">Drop tasks here</p>
          </div>
        )}

        {/* Drop indicator */}
        {isOver && (
          <div
            className={cn(
              "h-1.5 rounded-full mx-2",
              config.color,
              "opacity-50",
            )}
          />
        )}
      </div>
    </div>
  );
}
