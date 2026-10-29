import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useOutletContext } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { EmptyState } from '../components/ui/EmptyState';
import type { Task, TaskStatus } from '../types';
import {
  CheckSquare,
  Search,
  Plus,
  Calendar,
  Check,
  ChevronDown,
  Trash2
} from 'lucide-react';

export const MyTasksPage: React.FC = () => {
  const { tasks, currentUser, changeTaskStatus, deleteTask, projects, searchTerm } = useApp();
  const { onOpenCreateTask } = useOutletContext<{
    onOpenCreateProject: () => void;
    onOpenCreateTask: () => void;
  }>();

  const [tab, setTab] = useState<'my' | 'all'>('my');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const statuses: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Done'];

  const effectiveSearch = search || searchTerm;

  const filteredTasks = tasks.filter((task) => {
    const matchesTab = tab === 'my' ? task.assignee.id === currentUser.id : true;
    const matchesSearch =
      task.title.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      task.description.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      task.projectName.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      task.assignee.name.toLowerCase().includes(effectiveSearch.toLowerCase());

    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesProject = projectFilter === 'all' || task.projectId === projectFilter;

    return matchesTab && matchesSearch && matchesStatus && matchesPriority && matchesProject;
  });

  const myTasksTotal = tasks.filter((t) => t.assignee.id === currentUser.id).length;
  const myCompleted = tasks.filter((t) => t.assignee.id === currentUser.id && t.status === 'Done').length;
  const myPending = myTasksTotal - myCompleted;

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueCount = tasks.filter(
    (t) => (tab === 'my' ? t.assignee.id === currentUser.id : true) && t.dueDate < todayStr && t.status !== 'Done'
  ).length;

  const handleDelete = () => {
    if (taskToDelete) {
      deleteTask(taskToDelete.id);
      setTaskToDelete(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Task Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Organize work items, sprint tickets, and track individual progress
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenCreateTask}
          icon={<Plus className="w-4 h-4" />}
          className="shadow-sm shadow-indigo-600/20"
        >
          Create Task
        </Button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            {tab === 'my' ? 'My Total Tasks' : 'All Tasks'}
          </span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            {tab === 'my' ? myTasksTotal : tasks.length}
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            In Progress
          </span>
          <span className="text-2xl font-bold text-blue-600 mt-1 block">
            {tasks.filter((t) => (tab === 'my' ? t.assignee.id === currentUser.id : true) && t.status === 'In Progress').length}
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Completed
          </span>
          <span className="text-2xl font-bold text-emerald-600 mt-1 block">
            {tasks.filter((t) => (tab === 'my' ? t.assignee.id === currentUser.id : true) && t.status === 'Done').length}
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Overdue
          </span>
          <span className={`text-2xl font-bold mt-1 block ${overdueCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {overdueCount}
          </span>
        </div>
      </div>

      {/* Scope Toggle & Filter controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Toggle Scope: My Tasks vs All Tasks */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0 self-start">
          <button
            onClick={() => setTab('my')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              tab === 'my'
                ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Assigned to Me ({myPending})
          </button>
          <button
            onClick={() => setTab('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              tab === 'all'
                ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Team Tasks ({tasks.length})
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 flex-1 flex-wrap justify-end">
          <div className="relative min-w-48 flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
            />
          </div>

          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="In Review">In Review</option>
            <option value="Done">Done</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="w-6 h-6 text-slate-400" />}
          title="No tasks found"
          description={
            tab === 'my'
              ? "You don't have any tasks matching your filters. You're completely caught up!"
              : 'No team tasks match your search and filter criteria.'
          }
          actionLabel="Clear Filters"
          onAction={() => {
            setSearch('');
            setStatusFilter('all');
            setPriorityFilter('all');
            setProjectFilter('all');
          }}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {filteredTasks.map((task) => {
            const isDone = task.status === 'Done';
            const isOverdue = task.dueDate < todayStr && !isDone;

            return (
              <div
                key={task.id}
                className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                {/* Left: Checkbox + Title + Description + Project tag */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <button
                    onClick={() =>
                      changeTaskStatus(task.id, isDone ? 'In Progress' : 'Done')
                    }
                    className={`w-5 h-5 mt-0.5 rounded border flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                      isDone
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 hover:border-indigo-500 bg-white'
                    }`}
                    title={isDone ? 'Mark as incomplete' : 'Mark as Done'}
                  >
                    {isDone && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        className={`text-sm font-semibold tracking-tight transition-colors ${
                          isDone
                            ? 'line-through text-slate-400'
                            : 'text-slate-900 group-hover:text-indigo-600'
                        }`}
                      >
                        {task.title}
                      </h4>
                      <Badge priority={task.priority}>{task.priority}</Badge>
                    </div>

                    <p className="text-xs text-slate-500 mt-1 line-clamp-1 leading-relaxed">
                      {task.description}
                    </p>

                    <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-slate-500">
                      <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                        {task.projectName}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Avatar user={task.assignee} size="xs" />
                        <span className="text-[11px] text-slate-600 font-medium">{task.assignee.name}</span>
                      </div>
                      <span
                        className={`flex items-center gap-1 text-[11px] ${
                          isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-500'
                        }`}
                      >
                        <Calendar className="w-3 h-3" />
                        {task.dueDate} {isOverdue && '(Overdue)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Status Switcher & Delete */}
                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  <div className="relative">
                    <select
                      value={task.status}
                      onChange={(e) =>
                        changeTaskStatus(task.id, e.target.value as TaskStatus)
                      }
                      className="text-xs rounded-lg border border-slate-200 px-3 py-1.5 font-medium cursor-pointer appearance-none pr-7 bg-white hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  <button
                    onClick={() => setTaskToDelete(task)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Task Confirmation Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setTaskToDelete(null)}
          />
          <div className="relative bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 z-10 animate-in zoom-in-95">
            <h3 className="text-base font-semibold text-slate-900">
              Delete Task
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Are you sure you want to permanently delete <span className="font-semibold text-slate-800">"{taskToDelete.title}"</span>?
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setTaskToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
