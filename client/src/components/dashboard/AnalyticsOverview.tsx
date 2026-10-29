import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';
import { BarChart3, PieChart as PieChartIcon } from 'lucide-react';

export const AnalyticsOverview: React.FC = () => {
  const { tasks } = useApp();

  // Status counts for Pie Chart
  const statusCounts = {
    Done: tasks.filter((t) => t.status === 'Done').length,
    'In Progress': tasks.filter((t) => t.status === 'In Progress').length,
    'In Review': tasks.filter((t) => t.status === 'In Review').length,
    'To Do': tasks.filter((t) => t.status === 'To Do').length
  };

  const statusData = [
    { name: 'Done', value: statusCounts.Done, color: '#10B981' },
    { name: 'In Progress', value: statusCounts['In Progress'], color: '#4F46E5' },
    { name: 'In Review', value: statusCounts['In Review'], color: '#8B5CF6' },
    { name: 'To Do', value: statusCounts['To Do'], color: '#94A3B8' }
  ];

  // Weekly completion trend data (realistic sprint velocity)
  const weeklyVelocityData = [
    { week: 'Wk 39', planned: 12, completed: 11 },
    { week: 'Wk 40', planned: 15, completed: 14 },
    { week: 'Wk 41', planned: 14, completed: 16 },
    { week: 'Wk 42', planned: 18, completed: 17 },
    { week: 'Wk 43', planned: 16, completed: 15 },
    { week: 'Wk 44 (Current)', planned: 14, completed: tasks.filter((t) => t.status === 'Done').length }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart 1: Task Distribution by Status */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] p-5">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <PieChartIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                Task Distribution by Status
              </h3>
              <p className="text-xs text-slate-500">Live breakdown across active workload</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
            {tasks.length} Total
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #E2E8F0',
                  fontSize: '12px'
                }}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Sprint Velocity & Task Completion */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] p-5">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                Weekly Task Velocity
              </h3>
              <p className="text-xs text-slate-500">Planned vs completed delivery pacing</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
            94% Velocity
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyVelocityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="week" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #E2E8F0',
                  fontSize: '12px'
                }}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              />
              <Bar dataKey="planned" name="Planned Tasks" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" name="Completed" fill="#4F46E5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
