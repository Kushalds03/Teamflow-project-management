import React from 'react';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../ui/Avatar';
import {
  Activity,
  CheckCircle2,
  FolderPlus,
  UserPlus,
  RefreshCw,
  MessageSquare,
  Sparkles
} from 'lucide-react';

export const RecentActivityFeed: React.FC = () => {
  const { activities } = useApp();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task_completed':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'project_created':
        return <FolderPlus className="w-3.5 h-3.5 text-indigo-600" />;
      case 'member_assigned':
        return <UserPlus className="w-3.5 h-3.5 text-blue-600" />;
      case 'task_status_changed':
        return <RefreshCw className="w-3.5 h-3.5 text-purple-600" />;
      case 'comment_added':
        return <MessageSquare className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const getActivityBadgeColor = (type: string) => {
    switch (type) {
      case 'task_completed':
        return 'bg-emerald-50 border-emerald-100';
      case 'project_created':
        return 'bg-indigo-50 border-indigo-100';
      case 'member_assigned':
        return 'bg-blue-50 border-blue-100';
      case 'task_status_changed':
        return 'bg-purple-50 border-purple-100';
      case 'comment_added':
        return 'bg-amber-50 border-amber-100';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] p-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
              Recent Activity
            </h3>
            <p className="text-xs text-slate-500">Live feed of team actions and audit events</p>
          </div>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">Live Sync</span>
      </div>

      <div className="divide-y divide-slate-100">
        {activities.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No recent activity recorded yet.
          </div>
        ) : (
          activities.slice(0, 5).map((act) => (
          <div key={act.id} className="py-3 flex items-start gap-3 first:pt-0 last:pb-0">
            <div className="relative">
              <Avatar user={act.user} size="sm" />
              <div
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border ${getActivityBadgeColor(
                  act.type
                )} flex items-center justify-center shadow-xs bg-white`}
              >
                {getActivityIcon(act.type)}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-900 truncate">
                  {act.title}
                </span>
                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                  {act.timestamp}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 leading-snug break-words">
                {act.description}
              </p>
            </div>
          </div>
        )))
      }
      </div>
    </div>
  );
};
