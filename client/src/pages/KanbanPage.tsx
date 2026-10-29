import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useOutletContext } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import type { TaskStatus } from '../types';
import {
  Plus,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Search
} from 'lucide-react';

export const KanbanPage: React.FC = () => {
  const { tasks, changeTaskStatus, projects, searchTerm } = useApp();
  const { onOpenCreateTask } = useOutletContext<{
    onOpenCreateProject: () => void;
    onOpenCreateTask: () => void;
  }>();

  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const columns: { status: TaskStatus; label: string; color: string; dotColor: string }[] = [
    { status: 'To Do', label: 'To Do', color: 'border-slate-300', dotColor: 'bg-slate-400' },
    { status: 'In Progress', label: 'In Progress', color: 'border-blue-400', dotColor: 'bg-blue-500' },
    { status: 'In Review', label: 'In Review', color: 'border-purple-400', dotColor: 'bg-purple-500' },
    { status: 'Done', label: 'Done', color: 'border-emerald-400', dotColor: 'bg-emerald-500' }
  ];

  const effectiveSearch = search || searchTerm;

  const filteredTasks = tasks.filter((task) => {
    const matchesProject = projectFilter === 'all' || task.projectId === projectFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesSearch =
      task.title.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      task.projectName.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      task.assignee.name.toLowerCase().includes(effectiveSearch.toLowerCase());

    return matchesProject && matchesPriority && matchesSearch;
  });

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      changeTaskStatus(taskId, status);
    }
    setDraggedTaskId(null);
  };

  // Quick move adjacent column helpers
  const getNextStatus = (current: TaskStatus): TaskStatus | null => {
    const order: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Done'];
    const idx = order.indexOf(current);
    return idx < order.length - 1 ? order[idx + 1] : null;
  };

  const getPrevStatus = (current: TaskStatus): TaskStatus | null => {
    const order: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Done'];
    const idx = order.indexOf(current);
    return idx > 0 ? order[idx - 1] : null;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Kanban Board
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Interactive visual sprint pipeline with drag-and-drop task movements
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenCreateTask}
          icon={<Plus className="w-4 h-4" />}
          className="shadow-sm shadow-indigo-600/20"
        >
          Add Task
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          {/* Search */}
          <div className="relative min-w-56 flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search kanban tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
            />
          </div>

          {/* Project filter */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-1.5 self-end md:self-auto">
          <span>Tip: Drag cards or use arrow buttons to move</span>
        </div>
      </div>

      {/* Kanban 4 Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.status);

          return (
            <div
              key={col.status}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.status)}
              className="bg-slate-100/70 rounded-2xl p-3.5 border border-slate-200/80 min-h-[500px] flex flex-col"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-200/60 mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                  <h3 className="font-semibold text-xs text-slate-900 tracking-tight">
                    {col.label}
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-200 px-2 py-0.2 rounded-full">
                    {colTasks.length}
                  </span>
                </div>
                <button
                  onClick={onOpenCreateTask}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                  title={`Add task to ${col.label}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Column Task Cards */}
              <div className="space-y-3 flex-1">
                {colTasks.length === 0 ? (
                  <div className="h-32 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400 text-center p-3">
                    Drag items here or click + to add
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const next = getNextStatus(task.status);
                    const prev = getPrevStatus(task.status);

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] hover:shadow-md hover:border-slate-300 transition-all cursor-grab active:cursor-grabbing group"
                      >
                        {/* Project Name and Priority */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 truncate max-w-36">
                            {task.projectName}
                          </span>
                          <Badge priority={task.priority} size="sm">
                            {task.priority}
                          </Badge>
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                          {task.title}
                        </h4>

                        {/* Tags */}
                        {task.tags.length > 0 && (
                          <div className="flex items-center gap-1 mt-2 flex-wrap">
                            {task.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.2 rounded border border-slate-150"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Due Date & Assignee Footer */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{task.dueDate}</span>
                          </div>
                          <Avatar user={task.assignee} size="xs" />
                        </div>

                        {/* Quick Move Fallback Controls */}
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          {prev ? (
                            <button
                              onClick={() => changeTaskStatus(task.id, prev)}
                              className="text-slate-400 hover:text-indigo-600 flex items-center gap-0.5 hover:bg-slate-50 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                              title={`Move to ${prev}`}
                            >
                              <ArrowLeft className="w-3 h-3" />
                              <span>{prev}</span>
                            </button>
                          ) : (
                            <span />
                          )}

                          {next && (
                            <button
                              onClick={() => changeTaskStatus(task.id, next)}
                              className="text-slate-400 hover:text-indigo-600 flex items-center gap-0.5 hover:bg-slate-50 px-1.5 py-0.5 rounded cursor-pointer transition-colors ml-auto"
                              title={`Move to ${next}`}
                            >
                              <span>{next}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
