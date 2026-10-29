import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { AvatarGroup } from '../ui/Avatar';
import { Calendar, ArrowRight, FolderKanban, CheckCircle } from 'lucide-react';

export const ProjectProgressList: React.FC = () => {
  const { projects } = useApp();
  const navigate = useNavigate();

  // Show top 4 projects sorted by activity/priority
  const displayProjects = projects.slice(0, 4);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] overflow-hidden">
      <div className="p-5 pb-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <FolderKanban className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-slate-900 tracking-tight">
              Project Progress
            </h2>
            <p className="text-xs text-slate-500">
              Active milestones, team allocations, and completion pacing
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/projects')}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer"
        >
          <span>View all ({projects.length})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="divide-y divide-slate-100">
        {displayProjects.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No active projects found. Create a project to start tracking milestones.
          </div>
        ) : (
          displayProjects.map((project) => (
          <div
            key={project.id}
            onClick={() => navigate('/projects')}
            className="p-5 hover:bg-slate-50/80 transition-colors cursor-pointer group"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap mb-1">
                  <h4 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {project.name}
                  </h4>
                  <Badge status={project.status}>{project.status}</Badge>
                  <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    {project.category}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-1 leading-relaxed">
                  {project.description}
                </p>
              </div>

              {/* Members and due date metadata */}
              <div className="flex items-center gap-6 shrink-0">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Due {project.dueDate}</span>
                </div>
                <AvatarGroup users={project.members} max={3} size="xs" />
              </div>
            </div>

            {/* Progress Bar & task counts */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-slate-400" />
                  {project.completedTasks} of {project.totalTasks} tasks completed
                </span>
                <span className="font-semibold text-slate-800">{project.progress}%</span>
              </div>
              <ProgressBar value={project.progress} size="sm" />
            </div>
          </div>
        )))
      }
      </div>
    </div>
  );
};
