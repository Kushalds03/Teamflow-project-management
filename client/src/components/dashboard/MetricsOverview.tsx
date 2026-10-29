import React from 'react';
import { useApp } from '../../context/AppContext';
import { FolderKanban, Clock, CheckCircle2, AlertTriangle, TrendingUp, ArrowUpRight } from 'lucide-react';

export const MetricsOverview: React.FC = () => {
  const { projects, tasks, currentUser } = useApp();

  const totalProjects = projects.length;
  const inProgressTasks = tasks.filter((t) => t.status === 'In Progress').length;
  const completedTasks = tasks.filter((t) => t.status === 'Done').length;

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasks = tasks.filter(
    (t) => t.dueDate < todayStr && t.status !== 'Done'
  ).length;

  const myInProgress = tasks.filter(
    (t) => t.assignee.id === currentUser.id && t.status === 'In Progress'
  ).length;

  const metrics = [
    {
      id: 'metric-projects',
      label: 'Total Projects',
      value: totalProjects,
      trend: '+2 this month',
      trendPositive: true,
      subtext: 'Across all workspaces',
      icon: FolderKanban,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50 border-indigo-100'
    },
    {
      id: 'metric-in-progress',
      label: 'Tasks In Progress',
      value: inProgressTasks,
      trend: 'Active sprints',
      trendPositive: true,
      subtext: `${myInProgress} assigned to you`,
      icon: Clock,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50 border-blue-100'
    },
    {
      id: 'metric-completed',
      label: 'Completed Tasks',
      value: completedTasks,
      trend: '+18% velocity',
      trendPositive: true,
      subtext: 'Last 14 days',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50 border-emerald-100'
    },
    {
      id: 'metric-overdue',
      label: 'Overdue Tasks',
      value: overdueTasks,
      trend: overdueTasks > 0 ? 'Requires attention' : 'All on track',
      trendPositive: overdueTasks === 0,
      subtext: overdueTasks > 0 ? 'Exceeds SLA deadline' : 'Zero blockers',
      icon: AlertTriangle,
      iconColor: overdueTasks > 0 ? 'text-rose-600' : 'text-emerald-600',
      iconBg: overdueTasks > 0 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m) => {
        const Icon = m.icon;
        return (
          <div
            key={m.id}
            className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] hover:border-slate-300 hover:shadow-md transition-all duration-200 group"
          >
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {m.label}
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 tracking-tight">
                  {m.value}
                </span>
              </div>
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border ${m.iconBg} ${m.iconColor} shadow-xs group-hover:scale-105 transition-transform`}
              >
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span
                className={`inline-flex items-center gap-1 font-semibold ${
                  m.trendPositive ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {m.trendPositive ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                )}
                {m.trend}
              </span>
              <span className="text-slate-500 truncate">{m.subtext}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
