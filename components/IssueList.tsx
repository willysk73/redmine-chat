'use client';

import { useRedmine } from "@/lib/context";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Plus, Circle, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import CreateIssueModal from "./CreateIssueModal";

export default function IssueList() {
  const { issues, selectedIssue, selectIssue, selectedProject, isLoadingIssues } = useRedmine();
  const [filter, setFilter] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const filteredIssues = issues.filter(issue => 
    issue.subject.toLowerCase().includes(filter.toLowerCase()) ||
    String(issue.id).includes(filter)
  );

  const getStatusIcon = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'new') return <Circle className="w-4 h-4 text-green-400" />;
    if (s === 'in progress') return <Clock className="w-4 h-4 text-yellow-400" />;
    if (s === 'closed' || s === 'resolved') return <CheckCircle2 className="w-4 h-4 text-gray-500" />;
    return <AlertCircle className="w-4 h-4 text-blue-400" />;
  };

  if (!selectedProject) {
    return (
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col items-center justify-center text-gray-500 p-4 text-center">
        <p>Select a project to view issues</p>
      </div>
    );
  }

  return (
    <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-white truncate" title={selectedProject.name}>{selectedProject.name}</h2>
            <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                title="New Issue"
            >
                <Plus className="w-5 h-5" />
            </button>
        </div>
        <input
          type="text"
          placeholder="Filter issues..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full bg-gray-900 text-white text-sm rounded px-3 py-2 border border-gray-600 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoadingIssues ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500 space-y-2">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs">Loading issues...</span>
            </div>
        ) : filteredIssues.length === 0 ? (
             <div className="text-center text-gray-500 mt-10 text-sm">No issues found</div>
        ) : (
            filteredIssues.map((issue) => (
            <button
                key={issue.id}
                onClick={() => selectIssue(issue)}
                className={cn(
                "w-full text-left px-2 py-2 rounded group flex items-start space-x-2 transition-colors",
                selectedIssue?.id === issue.id
                    ? "bg-gray-700 text-white"
                    : "text-gray-400 hover:bg-gray-700/50 hover:text-gray-200"
                )}
            >
                <div className="mt-0.5 flex-shrink-0">
                    {getStatusIcon(issue.status.name)}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">#{issue.id}</span>
                        {issue.priority.id > 3 && (
                            <span className="w-2 h-2 rounded-full bg-red-500" title="High Priority"></span>
                        )}
                    </div>
                    <p className="text-sm truncate opacity-90">{issue.subject}</p>
                </div>
            </button>
            ))
        )}
      </div>
      
      <CreateIssueModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
}
