import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { WelcomeSection } from '../components/dashboard/WelcomeSection';
import { MetricsOverview } from '../components/dashboard/MetricsOverview';
import { ProjectProgressList } from '../components/dashboard/ProjectProgressList';
import { TaskOverviewTable } from '../components/dashboard/TaskOverviewTable';
import { AnalyticsOverview } from '../components/dashboard/AnalyticsOverview';
import { RecentActivityFeed } from '../components/dashboard/RecentActivityFeed';

export const DashboardPage: React.FC = () => {
  const { onOpenCreateProject, onOpenCreateTask } = useOutletContext<{
    onOpenCreateProject: () => void;
    onOpenCreateTask: () => void;
  }>();

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Personalized Welcome Section */}
      <WelcomeSection
        onOpenCreateProject={onOpenCreateProject}
        onOpenCreateTask={onOpenCreateTask}
      />

      {/* 2. Responsive 4 Metric Cards */}
      <MetricsOverview />

      {/* 3. Analytics Charts Grid */}
      <AnalyticsOverview />

      {/* 4. Project Progress and Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProjectProgressList />
        </div>
        <div className="lg:col-span-1">
          <RecentActivityFeed />
        </div>
      </div>

      {/* 5. Comprehensive Task Overview Table */}
      <TaskOverviewTable />
    </div>
  );
};
