import React from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Calendar, Plus, FolderPlus } from 'lucide-react';

interface WelcomeSectionProps {
  onOpenCreateProject: () => void;
  onOpenCreateTask: () => void;
}

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({
  onOpenCreateProject,
  onOpenCreateTask
}) => {
  const { currentUser } = useApp();

  // Format date nicely
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{formattedDate}</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          {greeting}, {currentUser.name.split(' ')[0]} 👋
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Here's what's happening with your projects and sprints today.
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenCreateTask}
          icon={<Plus className="w-4 h-4 text-slate-600" />}
        >
          New Task
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenCreateProject}
          icon={<FolderPlus className="w-4 h-4" />}
          className="shadow-sm shadow-indigo-600/20"
        >
          Create Project
        </Button>
      </div>
    </div>
  );
};
