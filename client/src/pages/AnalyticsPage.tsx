import React from 'react';
import { useApp } from '../context/AppContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  AlertTriangle,
  Users,
  CheckCircle,
  Layers
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { tasks, projects, users } = useApp();

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Done').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'In Progress').length;
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasks = tasks.filter((t) => t.dueDate < todayStr && t.status !== 'Done');

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Chart 1: Project Progress Data
  const projectProgressData = projects.map((p) => ({
    name: p.name.length > 18 ? p.name.slice(0, 16) + '...' : p.name,
    progress: p.progress,
    tasksCount: tasks.filter((t) => t.projectId === p.id).length
  }));

  // Chart 2: Task Status Breakdown
  const statusCounts = {
    Done: tasks.filter((t) => t.status === 'Done').length,
    'In Progress': tasks.filter((t) => t.status === 'In Progress').length,
    'In Review': tasks.filter((t) => t.status === 'In Review').length,
    'To Do': tasks.filter((t) => t.status === 'To Do').length
  };

  const statusPieData = [
    { name: 'Done', value: statusCounts.Done, color: '#10B981' },
    { name: 'In Progress', value: statusCounts['In Progress'], color: '#4F46E5' },
    { name: 'In Review', value: statusCounts['In Review'], color: '#8B5CF6' },
    { name: 'To Do', value: statusCounts['To Do'], color: '#94A3B8' }
  ];

  // Chart 3: Team Workload Distribution
  const teamWorkloadData = users.map((u) => {
    const userTasks = tasks.filter((t) => t.assignee.id === u.id);
    return {
      name: u.name.split(' ')[0],
      active: userTasks.filter((t) => t.status !== 'Done').length,
      completed: userTasks.filter((t) => t.status === 'Done').length
    };
  });

  // Chart 4: Sprint Velocity History
  const sprintBurnData = [
    { sprint: 'Sprint 21', velocity: 22, commitment: 24 },
    { sprint: 'Sprint 22', velocity: 25, commitment: 26 },
    { sprint: 'Sprint 23', velocity: 28, commitment: 28 },
    { sprint: 'Sprint 24', velocity: 24, commitment: 25 },
    { sprint: 'Sprint 25', velocity: 30, commitment: 30 },
    { sprint: 'Sprint 26 (Current)', velocity: completedTasks + 14, commitment: 32 }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Analytics & Performance Metrics
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Real-time delivery velocity, capacity utilization, and project health indicators
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase">
              Overall Completion Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
            {completionRate}%
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +4.2% from previous sprint
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase">
              Active Sprint Workload
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
            {inProgressTasks} Tasks
          </div>
          <p className="text-xs text-slate-500 mt-1">Distributed across {projects.length} projects</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase">
              Overdue Tickets
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                overdueTasks.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl sm:text-3xl font-bold mt-2 ${
              overdueTasks.length > 0 ? 'text-rose-600' : 'text-slate-900'
            }`}
          >
            {overdueTasks.length}
          </div>
          <p
            className={`text-xs mt-1 font-medium ${
              overdueTasks.length > 0 ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {overdueTasks.length > 0 ? 'Requires escalation' : 'No SLA breaches'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase">
              Team Headcount
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
            {users.length} Engineers
          </div>
          <p className="text-xs text-slate-500 mt-1">100% active capacity</p>
        </div>
      </div>

      {/* Row 1: Project Progress & Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Completion Progress */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="pb-3 border-b border-slate-100 mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-slate-900">Project Completion Pacing</h3>
              <p className="text-xs text-slate-500">Progress percentage achieved across active initiatives</p>
            </div>
            <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
              % Done
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={projectProgressData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" domain={[0, 100]} stroke="#94A3B8" fontSize={11} />
                <YAxis dataKey="name" type="category" width={95} stroke="#64748B" fontSize={11} />
                <Tooltip
                  formatter={(val: number | string | readonly (number | string)[] | undefined) => [`${val}%`, 'Progress']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="progress" fill="#4F46E5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Distribution Status */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="pb-3 border-b border-slate-100 mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-slate-900">Task Status Distribution</h3>
              <p className="text-xs text-slate-500">Breakdown of tickets across Kanban statuses</p>
            </div>
            <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded">
              {tasks.length} Total
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px'
                  }}
                />
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Team Workload & Sprint Burnup */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Workload */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="pb-3 border-b border-slate-100 mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-slate-900">Team Workload Distribution</h3>
              <p className="text-xs text-slate-500">Active vs completed assignments per engineer</p>
            </div>
            <span className="text-xs font-semibold text-slate-600">Capacity Balancing</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamWorkloadData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px'
                  }}
                />
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="active" name="Active Tasks" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sprint Velocity Trend */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="pb-3 border-b border-slate-100 mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-slate-900">Sprint Delivery Velocity</h3>
              <p className="text-xs text-slate-500">Story points planned vs achieved across sprints</p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              96% Predictability
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sprintBurnData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="sprint" stroke="#94A3B8" fontSize={10} />
                <YAxis stroke="#94A3B8" fontSize={11} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px'
                  }}
                />
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="commitment" name="Committed Points" stroke="#94A3B8" strokeDasharray="4 4" fill="transparent" />
                <Area type="monotone" dataKey="velocity" name="Delivered Velocity" stroke="#4F46E5" strokeWidth={2} fillOpacity={1} fill="url(#velocityGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
