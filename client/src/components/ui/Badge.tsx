import React from 'react';
import type { TaskPriority, TaskStatus, ProjectStatus } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'priority' | 'status' | 'default' | 'success' | 'warning' | 'danger' | 'indigo' | 'purple';
  priority?: TaskPriority;
  status?: TaskStatus | ProjectStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  priority,
  status,
  size = 'sm',
  className = ''
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  if (priority) {
    switch (priority) {
      case 'High':
        colorClasses = 'bg-rose-50 text-rose-700 border-rose-200 font-medium';
        break;
      case 'Medium':
        colorClasses = 'bg-amber-50 text-amber-700 border-amber-200 font-medium';
        break;
      case 'Low':
        colorClasses = 'bg-slate-100 text-slate-600 border-slate-200 font-medium';
        break;
    }
  } else if (status) {
    switch (status) {
      case 'Done':
      case 'Completed':
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium';
        break;
      case 'In Progress':
        colorClasses = 'bg-blue-50 text-blue-700 border-blue-200 font-medium';
        break;
      case 'In Review':
        colorClasses = 'bg-purple-50 text-purple-700 border-purple-200 font-medium';
        break;
      case 'To Do':
      case 'Planning':
        colorClasses = 'bg-slate-100 text-slate-700 border-slate-200 font-medium';
        break;
      case 'On Hold':
        colorClasses = 'bg-amber-50 text-amber-800 border-amber-200 font-medium';
        break;
    }
  } else {
    switch (variant) {
      case 'success':
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'warning':
        colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'danger':
        colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
        break;
      case 'indigo':
        colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
        break;
      case 'purple':
        colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
        break;
      default:
        colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
        break;
    }
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${sizeClasses} ${colorClasses} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  );
};
