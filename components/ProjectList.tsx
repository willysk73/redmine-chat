"use client";

import { useRedmine } from "@/lib/context";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";

export default function ProjectList() {
  const { projects, selectedProject, selectProject, logout } = useRedmine();

  return (
    <div className="w-56 bg-gray-900 flex flex-col py-4 border-r border-gray-800 h-full">
      <div className="px-4 mb-2">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Projects</h2>
      </div>
      <div className="flex-1 flex flex-col space-y-1 px-2 w-full overflow-y-auto no-scrollbar">
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => selectProject(project)}
            className={cn(
              "w-full text-left px-3 py-2 rounded-md transition-colors duration-200 flex items-center space-x-3",
              selectedProject?.id === project.id
                ? "bg-indigo-600 text-white"
                : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
            )}
            title={project.name}
          >
            <span className="truncate text-sm font-medium">
              {project.name}
            </span>
          </button>
        ))}
      </div>

      <div className="pt-4 border-t border-gray-800 w-full px-4">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center px-3 py-2 rounded-md text-gray-400 hover:bg-red-900/20 hover:text-red-400 transition-colors"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
