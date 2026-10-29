import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useOutletContext } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { AvatarGroup } from '../components/ui/Avatar';
import { EmptyState } from '../components/ui/EmptyState';
import type { Project } from '../types';
import {
  FolderKanban,
  Search,
  Plus,
  Calendar,
  CheckCircle2,
  Trash2,
  LayoutGrid,
  List
} from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const { projects, deleteProject, searchTerm } = useApp();
  const { onOpenCreateProject } = useOutletContext<{
    onOpenCreateProject: () => void;
    onOpenCreateTask: () => void;
  }>();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const categories: string[] = Array.from(new Set(projects.map((p) => p.category)));

  const effectiveSearch = search || searchTerm;

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      project.description.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      project.leadName.toLowerCase().includes(effectiveSearch.toLowerCase());

    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || project.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleDeleteConfirm = () => {
    if (projectToDelete) {
      deleteProject(projectToDelete.id);
      setProjectToDelete(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Projects
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage corporate engineering initiatives, milestones, and deliverable roadmaps
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenCreateProject}
          icon={<Plus className="w-4 h-4" />}
          className="shadow-sm shadow-indigo-600/20"
        >
          Create Project
        </Button>
      </div>

      {/* Search, Filters, and View Switcher Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          {/* Search */}
          <div className="relative min-w-56 flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search projects by name, lead, or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Planning">Planning</option>
            <option value="On Hold">On Hold</option>
          </select>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50 self-end md:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Grid view"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Table view"
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Project Content Area */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="w-6 h-6 text-slate-400" />}
          title="No projects found"
          description="We couldn't find any projects matching your search and filter criteria."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearch('');
            setStatusFilter('all');
            setCategoryFilter('all');
          }}
        />
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => {
            return (
              <div
                key={project.id}
                className="bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between p-5 group"
              >
                <div>
                  {/* Top tags & badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 truncate">
                      {project.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Badge priority={project.priority}>{project.priority}</Badge>
                      <Badge status={project.status}>{project.status}</Badge>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {project.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>

                  {/* Lead and Dates */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Lead:</span>
                      <span className="font-medium text-slate-800">{project.leadName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Target Due:</span>
                      <span className="font-medium text-slate-800 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {project.dueDate}
                      </span>
                    </div>
                  </div>

                  {/* Progress section */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                        {project.completedTasks} / {project.totalTasks} tasks
                      </span>
                      <span className="font-semibold text-slate-800">{project.progress}%</span>
                    </div>
                    <ProgressBar value={project.progress} size="sm" />
                  </div>
                </div>

                {/* Footer: Members & Quick Delete */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <AvatarGroup users={project.members} max={3} size="xs" />
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setProjectToDelete(project)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Project Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Lead</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{project.name}</div>
                      <div className="text-[11px] text-slate-500 max-w-xs truncate">
                        {project.description}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                        {project.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={project.status}>{project.status}</Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge priority={project.priority}>{project.priority}</Badge>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {project.leadName}
                    </td>
                    <td className="py-3.5 px-4 min-w-36">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={project.progress} size="sm" />
                        <span className="font-semibold text-[11px]">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {project.dueDate}
                    </td>
                    <td className="py-3.5 px-4">
                      <AvatarGroup users={project.members} max={3} size="xs" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setProjectToDelete(project)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Destructive Action */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setProjectToDelete(null)}
          />
          <div className="relative bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 z-10 animate-in zoom-in-95">
            <h3 className="text-base font-semibold text-slate-900">
              Confirm Delete Project
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-slate-800">"{projectToDelete.name}"</span>?
              This will also remove all associated tasks and activity records. This action cannot be undone.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setProjectToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteConfirm}
              >
                Delete Project
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
