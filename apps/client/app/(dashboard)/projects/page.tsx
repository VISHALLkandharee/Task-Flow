"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, FolderKanban, Loader2 } from "lucide-react";
import { useProjects, useDeleteProject } from "@/hooks/useProjects";
import CreateProjectModal from "@/components/projects/CreateProjectModel";
import { cn } from "@/lib/utils";

export default function ProjectsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: projects, isLoading, isError } = useProjects();
  const { mutate: deleteProject } = useDeleteProject();

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
        <p className="text-red-500">Failed to load projects.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 text-sm mt-1">
            {projects?.length || 0} project
            {projects?.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white
          px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700
          transition-colors"
        >
          <Plus size={16} />
          New Project
        </button>
      </div>

      {/* Projects Grid */}
      {projects?.length === 0 ? (
        // Empty state
        <div
          className="bg-white rounded-xl border border-gray-200
        p-12 text-center"
        >
          <FolderKanban size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            No projects yet
          </h3>
          <p className="text-gray-500 text-sm mb-4">
            Create your first project to get started
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg
            text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects?.map((project) => {
            const isOptimistic = project.id.startsWith("temp-");
            return (
              <div
                key={project.id}
                className={cn(
                  "bg-white rounded-xl border border-gray-200 p-5 transition-all group",
                  isOptimistic
                    ? "opacity-60 bg-gray-50/50 border-dashed pointer-events-none shadow-none"
                    : "hover:shadow-md"
                )}
              >
                {/* Color bar */}
                <div
                  className="w-full h-1.5 rounded-full mb-4"
                  style={{ backgroundColor: project.color }}
                />

                {/* Project info */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: project.color }}
                    />
                    <h3 className="font-semibold text-gray-900 truncate">
                      {project.name}
                    </h3>
                  </div>
                </div>

                {/* Description */}
                {project.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {project.description}
                  </p>
                )}

                {/* Task count */}
                <p className="text-xs text-gray-400 mb-4">
                  {project._count?.tasks || 0} task
                  {project._count?.tasks !== 1 ? "s" : ""}
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                  {isOptimistic ? (
                    <span className="flex-1 text-center px-3 py-1.5 bg-gray-100 text-gray-400 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5">
                      <Loader2 className="animate-spin text-gray-400" size={12} />
                      Saving project...
                    </span>
                  ) : (
                    <>
                      <Link
                        href={`/projects/${project.id}`}
                        className="flex-1 text-center px-3 py-1.5 bg-indigo-50
                        text-indigo-700 rounded-lg text-xs font-medium
                        hover:bg-indigo-100 transition-colors"
                      >
                        Open Board
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm("Delete this project?")) {
                            deleteProject(project.id);
                          }
                        }}
                        className="px-3 py-1.5 text-red-500 hover:bg-red-50
                        rounded-lg text-xs font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
