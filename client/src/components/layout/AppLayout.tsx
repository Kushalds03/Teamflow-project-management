import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { ToastContainer } from '../ui/ToastContainer';
import { CreateProjectModal } from '../projects/CreateProjectModal';
import { ProjectDetailModal } from '../projects/ProjectDetailModal';
import { CreateTaskModal } from '../tasks/CreateTaskModal';
import { TaskDetailModal } from '../tasks/TaskDetailModal';
import { AuthModal } from '../auth/AuthModal';
import { useApp } from '../../context/AppContext';

export const AppLayout: React.FC = () => {
  const {
    sidebarCollapsed,
    authModalOpen,
    setAuthModalOpen,
    selectedTask,
    setSelectedTask,
    selectedProject,
    setSelectedProject
  } = useApp();
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Top Navbar */}
        <Navbar
          onOpenCreateProject={() => setCreateProjectOpen(true)}
          onOpenCreateTask={() => setCreateTaskOpen(true)}
        />

        {/* Page Views Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet context={{ onOpenCreateProject: () => setCreateProjectOpen(true), onOpenCreateTask: () => setCreateTaskOpen(true) }} />
        </main>
      </div>

      {/* Toast Feedback System */}
      <ToastContainer />

      {/* Global Quick Creation Modals */}
      <CreateProjectModal
        isOpen={createProjectOpen}
        onClose={() => setCreateProjectOpen(false)}
      />
      <CreateTaskModal
        isOpen={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
      />

      {/* Task Details & Discussion Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={selectedTask !== null}
        onClose={() => setSelectedTask(null)}
      />

      {/* Project Details & Management Modal */}
      <ProjectDetailModal
        project={selectedProject}
        isOpen={selectedProject !== null}
        onClose={() => setSelectedProject(null)}
      />

      {/* User Authentication & Account Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
};
