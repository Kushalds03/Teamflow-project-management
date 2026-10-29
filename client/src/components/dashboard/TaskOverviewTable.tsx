import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import type { TaskStatus } from '../../types';
import {
  Search,
  Calendar,
  ArrowRight,
  Check,
  ChevronDown
} from 'lucide-react';

export const TaskOverviewTable: React.FC = () => {
  const { tasks, changeTaskStatus, searchTerm } = useApp();
  const navigate = useNavigate();

  const [tableSearch, setTableSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const effectiveSearch = tableSearch || searchTerm;

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      task.projectName.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      task.assignee.name.toLowerCase().includes(effectiveSearch.toLowerCase());

    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const statuses: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Done'];

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] overflow-hidden">
      {/* Table Header and Filtering Bar */}
      <div className="p-5 pb-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-slate-900 tracking-tight">
            Task Overview
          </h2>
          <p className="text-xs text-slate-500">
            Real-time status tracking, assignees, and delivery timelines
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Table local search */}
          <div className="relative min-w-44">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter tasks..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
            />
          </div>

          {/* Status filter dropdown */}
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

          {/* Priority filter dropdown */}
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

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4 w-10">Done</th>
              <th className="py-3 px-4">Task Name</th>
              <th className="py-3 px-4">Project</th>
              <th className="py-3 px-4">Assignee</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                  No tasks found matching your filter criteria.
                </td>
              </tr>
            ) : (
              filteredTasks.slice(0, 8).map((task) => {
                const isDone = task.status === 'Done';
                const isOverdue =
                  task.dueDate < new Date().toISOString().split('T')[0] && !isDone;

                return (
                  <tr
                    key={task.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Done toggle checkbox */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() =>
                          changeTaskStatus(task.id, isDone ? 'In Progress' : 'Done')
                        }
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                          isDone
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 hover:border-indigo-500 bg-white'
                        }`}
                        title={isDone ? 'Mark as incomplete' : 'Mark as Done'}
                      >
                        {isDone && <Check className="w-3 h-3" />}
                      </button>
                    </td>

                    {/* Task Title */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors max-w-xs truncate">
                        {task.title}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {task.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Project */}
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-700 bg-slate-100/80 border border-slate-200 px-2 py-0.5 rounded-md truncate block max-w-36 text-[11px]">
                        {task.projectName}
                      </span>
                    </td>

                    {/* Assignee */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Avatar user={task.assignee} size="xs" />
                        <span className="text-slate-700 truncate max-w-28 font-medium">
                          {task.assignee.name}
                        </span>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-4">
                      <Badge priority={task.priority}>{task.priority}</Badge>
                    </td>

                    {/* Status with quick switcher */}
                    <td className="py-3 px-4 relative">
                      <div className="relative inline-block">
                        <select
                          value={task.status}
                          onChange={(e) =>
                            changeTaskStatus(task.id, e.target.value as TaskStatus)
                          }
                          className="text-xs rounded-full border px-2.5 py-0.5 font-medium cursor-pointer appearance-none pr-6 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          {statuses.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </td>

                    {/* Due Date */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                          isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-500'
                        }`}
                      >
                        <Calendar className="w-3 h-3" />
                        {task.dueDate}
                        {isOverdue && ' (Overdue)'}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => navigate('/my-tasks')}
                        className="text-slate-400 hover:text-indigo-600 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                        title="View details in Tasks"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="p-3.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 px-4">
        <span>Showing {Math.min(filteredTasks.length, 8)} of {tasks.length} tasks</span>
        <button
          onClick={() => navigate('/my-tasks')}
          className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>View all in Tasks</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
