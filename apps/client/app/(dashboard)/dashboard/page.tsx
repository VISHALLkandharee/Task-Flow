"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { useProjects } from "@/hooks/useProjects";
import { useMembers } from "@/hooks/useMembers";
import { useMyTasks } from "@/hooks/useTasks";
import { Loader2, AlertCircle, TrendingUp, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { user, workspace } = useAuthStore();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: members, isLoading: membersLoading } = useMembers();
  const { data: taskData, isLoading: tasksLoading } = useMyTasks();

  const isLoading = projectsLoading || membersLoading || tasksLoading;

  const allTasks = taskData?.tasks || [];
  const activeTasks = allTasks.filter((t) => t.status !== "DONE");
  const completedTasks = allTasks.filter((t) => t.status === "DONE");
  const overdueTasks = allTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE",
  );

  const completionRate =
    allTasks.length > 0
      ? Math.round((completedTasks.length / allTasks.length) * 100)
      : 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1 text-sm flex items-center gap-2">
          Here's what's happening in{" "}
          <span className="font-medium text-gray-700">{workspace?.name}</span>
          {workspace?.plan === "PRO" && (
            <span
              className="bg-indigo-600 text-white text-[10px]
              font-bold px-1.5 py-0.5 rounded uppercase tracking-wider
              flex items-center gap-0.5"
            >
              Pro
            </span>
          )}
        </p>
      </div>
      

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Projects"
          value={isLoading ? "..." : String(projects?.length || 0)}
        />
        <StatCard
          label="My Active Tasks"
          value={isLoading ? "..." : String(activeTasks.length)}
        />
        <StatCard
          label="Team Members"
          value={isLoading ? "..." : String(members?.length || 0)}
        />
        <StatCard
          label="Overdue Tasks"
          value={isLoading ? "..." : String(overdueTasks.length)}
          highlight={overdueTasks.length > 0}
        />
      </div>

      {/* Progress bar — only show if tasks exist */}
      {!isLoading && allTasks.length > 0 && (
        <div
          className="bg-white rounded-xl border border-gray-200
        p-5 mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-indigo-600" />
              <span className="text-sm font-semibold text-gray-900">
                Your Task Progress
              </span>
            </div>
            <span className="text-sm font-bold text-indigo-600">
              {completionRate}%
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className="bg-indigo-600 h-2.5 rounded-full
              transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">
              {completedTasks.length} of {allTasks.length} tasks completed
            </span>
            <span className="text-xs text-gray-400">
              {activeTasks.length} remaining
            </span>
          </div>
        </div>
      )}

      {/* Recent Projects */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Recent Projects</h2>
          <Link
            href="/projects"
            className="text-sm text-indigo-600 hover:underline"
          >
            View all
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-gray-400" size={24} />
          </div>
        ) : projects?.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">No projects yet</p>
            <Link
              href="/projects"
              className="text-indigo-600 text-sm font-medium
              hover:underline mt-2 inline-block"
            >
              Create your first project →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {projects?.slice(0, 3).map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex items-center gap-3 p-3 rounded-lg
                hover:bg-gray-50 transition-colors group"
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: project.color }}
                />
                <span
                  className="text-sm font-medium text-gray-900
                  group-hover:text-indigo-600 transition-colors flex-1"
                >
                  {project.name}
                </span>
                <span className="text-xs text-gray-400">
                  {project._count?.tasks || 0} tasks
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Overdue alert */}
      {!isLoading && overdueTasks.length > 0 && (
        <div
          className="mt-4 bg-red-50 border border-red-200
        rounded-xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Clock size={16} className="text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">
                {overdueTasks.length} overdue task
                {overdueTasks.length > 1 ? "s" : ""}
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                These tasks are past their due date
              </p>
            </div>
          </div>
          <Link
            href="/tasks"
            className="text-xs bg-red-600 text-white px-3
            py-1.5 rounded-lg hover:bg-red-700 transition-colors
            font-medium shrink-0"
          >
            View Tasks
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-5 transition-all",
        highlight ? "bg-red-50 border-red-200" : "bg-white border-gray-200",
      )}
    >
      <p className="text-sm text-gray-500">{label}</p>
      <p
        className={cn(
          "text-3xl font-bold mt-1",
          highlight ? "text-red-600" : "text-gray-900",
        )}
      >
        {value}
      </p>
    </div>
  );
}
