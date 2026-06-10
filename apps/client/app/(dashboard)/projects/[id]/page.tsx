"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { ArrowLeft, Loader2, Filter, Users, X, Search } from "lucide-react";
import { useTasks, useMoveTask, useDeleteTask } from "@/hooks/useTasks";
import { Task, TaskStatus } from "@/lib/api/tasks";
import { useMembers } from "@/hooks/useMembers";
import KanbanColumn from "@/components/board/KanbanColumn";
import TaskCard from "@/components/board/TaskCard";
import CreateTaskModal from "@/components/board/CreateTaskModel";
import TaskDetailModal from "@/components/board/TaskDetailsModel";
import { cn } from "@/lib/utils";

const COLUMNS: TaskStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];

const AVATAR_COLORS = [
  { bg: "#ede9fe", color: "#5b21b6" },
  { bg: "#fce7f3", color: "#9d174d" },
  { bg: "#e0e7ff", color: "#3730a3" },
  { bg: "#dcfce7", color: "#166534" },
  { bg: "#fef3c7", color: "#92400e" },
  { bg: "#fee2e2", color: "#991b1b" },
];

export default function BoardPage() {
  const { id: projectId } = useParams() as { id: string };
  const router = useRouter();

  const { data: tasks, isLoading, isError } = useTasks(projectId);
  const { mutate: moveTask } = useMoveTask(projectId);
  const { mutate: deleteTask } = useDeleteTask(projectId);
  const { data: members } = useMembers();

  // ── Modal state ──
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("TODO");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // ── Search state ──
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // ── Filter state ──
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterOverdue, setFilterOverdue] = useState(false);

  // ── Drag state ──
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  // ── Debounce search ──
  // Wait 300ms after user stops typing before filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.toLowerCase().trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ── Filter + Search tasks ──
  const filteredTasks = (tasks || []).filter((task) => {
    // Search filter
    if (
      searchQuery &&
      !task.title.toLowerCase().includes(searchQuery) &&
      !task.description?.toLowerCase().includes(searchQuery)
    ) {
      return false;
    }
    // Assignee filter
    if (filterAssignee && task.assigneeId !== filterAssignee) {
      return false;
    }
    // Priority filter
    if (filterPriority && task.priority !== filterPriority) {
      return false;
    }
    // Overdue filter
    if (filterOverdue) {
      const isOverdue =
        task.dueDate &&
        new Date(task.dueDate) < new Date() &&
        task.status !== "DONE";
      if (!isOverdue) return false;
    }
    return true;
  });

  // ── Group by status ──
  const tasksByStatus = COLUMNS.reduce(
    (acc, status) => {
      acc[status] = filteredTasks
        .filter((t) => t.status === status)
        .sort((a, b) => a.position - b.position);
      return acc;
    },
    {} as Record<TaskStatus, Task[]>,
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTask(event.active.data.current?.task as Task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;
    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    const task = tasks?.find((t) => t.id === taskId);
    if (task && task.status !== newStatus) {
      moveTask({ id: taskId, status: newStatus });
    }
  };

  const handleAddTask = (status: TaskStatus) => {
    setDefaultStatus(status);
    setIsCreateOpen(true);
  };

  const handleAvatarFilter = (memberId: string) => {
    setFilterAssignee((prev) => (prev === memberId ? "" : memberId));
  };

  const clearAllFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setFilterAssignee("");
    setFilterPriority("");
    setFilterOverdue(false);
  };

  const activeFiltersCount = [
    searchQuery,
    filterAssignee,
    filterPriority,
    filterOverdue,
  ].filter(Boolean).length;

  const isFiltering = filteredTasks.length !== (tasks || []).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">Failed to load board.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/projects")}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Project Board</h1>
            <p className="text-gray-500 text-xs mt-0.5">
              {tasks?.length || 0} total tasks
              {isFiltering && (
                <span className="text-indigo-600 ml-1">
                  · {filteredTasks.length} shown
                </span>
              )}
            </p>
          </div>
        </div>

        {/* ── Member Avatars ── */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Users size={13} className="text-gray-400" />
            <span className="text-xs text-gray-400">Team:</span>
          </div>
          <div className="flex items-center -space-x-1.5">
            {members?.slice(0, 5).map((member, index) => {
              const colorScheme = AVATAR_COLORS[index % AVATAR_COLORS.length];
              const isActive = filterAssignee === member.userId;
              return (
                <button
                  key={member.userId}
                  onClick={() => handleAvatarFilter(member.userId)}
                  title={`${member.user.name} — click to filter`}
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center",
                    "text-xs font-semibold border-2 transition-all",
                    "hover:scale-110 hover:z-10 relative",
                    isActive
                      ? "border-indigo-500 scale-110 z-10 ring-2 ring-indigo-300"
                      : "border-white",
                  )}
                  style={{
                    backgroundColor: colorScheme.bg,
                    color: colorScheme.color,
                  }}
                >
                  {member.user.name.charAt(0).toUpperCase()}
                </button>
              );
            })}
            {(members?.length || 0) > 5 && (
              <div
                className="w-7 h-7 rounded-full flex items-center
                justify-center text-xs font-medium border-2 border-white
                bg-gray-100 text-gray-600"
              >
                +{(members?.length || 0) - 5}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Search + Filters Bar ── */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {/* Search input */}
        <div className="relative flex-1 min-w-48 max-w-64">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2
            text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-8 pr-8 py-1.5 text-xs border
            border-gray-200 rounded-lg text-gray-900 bg-white
            focus:outline-none focus:ring-1 focus:ring-indigo-500
            focus:border-indigo-500 placeholder:text-gray-400"
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput("");
                setSearchQuery("");
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2
              text-gray-400 hover:text-gray-600"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200" />

        {/* Filter icon */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Filter size={13} />
        </div>

        {/* Assignee filter */}
        <select
          value={filterAssignee}
          onChange={(e) => setFilterAssignee(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2.5
          py-1.5 text-gray-700 bg-white focus:outline-none
          focus:ring-1 focus:ring-indigo-500 cursor-pointer"
        >
          <option value="">All Members</option>
          {members?.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.user.name}
            </option>
          ))}
        </select>

        {/* Priority filter */}
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2.5
          py-1.5 text-gray-700 bg-white focus:outline-none
          focus:ring-1 focus:ring-indigo-500 cursor-pointer"
        >
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>

        {/* Overdue toggle */}
        <button
          onClick={() => setFilterOverdue(!filterOverdue)}
          className={cn(
            "text-xs px-2.5 py-1.5 rounded-lg border transition-colors",
            filterOverdue
              ? "bg-orange-50 border-orange-300 text-orange-700"
              : "border-gray-200 text-gray-700 hover:border-gray-300",
          )}
        >
          Overdue only
        </button>

        {/* Active search chip */}
        {searchQuery && (
          <div
            className="flex items-center gap-1.5 bg-indigo-50
            border border-indigo-200 text-indigo-700 text-xs
            px-2.5 py-1.5 rounded-lg"
          >
            <Search size={11} />
            <span>"{searchQuery}"</span>
            <button
              onClick={() => {
                setSearchInput("");
                setSearchQuery("");
              }}
              className="hover:text-indigo-900"
            >
              <X size={11} />
            </button>
          </div>
        )}

        {/* Active assignee chip */}
        {filterAssignee && (
          <div
            className="flex items-center gap-1.5 bg-indigo-50
            border border-indigo-200 text-indigo-700 text-xs
            px-2.5 py-1.5 rounded-lg"
          >
            <span>
              {members?.find((m) => m.userId === filterAssignee)?.user.name}
            </span>
            <button
              onClick={() => setFilterAssignee("")}
              className="hover:text-indigo-900"
            >
              <X size={11} />
            </button>
          </div>
        )}

        {/* Clear all */}
        {activeFiltersCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-red-500 hover:text-red-700
            hover:underline ml-auto"
          >
            Clear all ({activeFiltersCount})
          </button>
        )}
      </div>

      {/* ── No results message ── */}
      {isFiltering && filteredTasks.length === 0 && (
        <div
          className="flex items-center justify-center bg-gray-50
          border border-gray-200 rounded-xl py-8 mb-4"
        >
          <div className="text-center">
            <Search size={24} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No tasks match your search</p>
            <button
              onClick={clearAllFilters}
              className="text-xs text-indigo-600 hover:underline mt-1"
            >
              Clear filters
            </button>
          </div>
        </div>
      )}

      {/* ── Kanban Board ── */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {COLUMNS.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasksByStatus[status]}
              onAddTask={handleAddTask}
              onDeleteTask={(id) => deleteTask(id)}
              onTaskClick={(task) => setSelectedTask(task)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="rotate-3 opacity-90">
              <TaskCard
                task={activeTask}
                onDelete={() => {}}
                onClick={() => {}}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* ── Modals ── */}
      <CreateTaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        projectId={projectId}
        defaultStatus={defaultStatus}
      />

      <TaskDetailModal
        task={selectedTask}
        projectId={projectId}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
}
