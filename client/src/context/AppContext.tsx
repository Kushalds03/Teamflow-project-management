import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Project, Task, User, ActivityItem, NotificationItem, UserSettings, TaskStatus } from '../types';
import { initialProjects, initialTasks, mockUsers, initialActivities, initialNotifications, defaultSettings, currentUser } from '../data/mockData';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

interface AppContextType {
  projects: Project[];
  tasks: Task[];
  users: User[];
  activities: ActivityItem[];
  notifications: NotificationItem[];
  unreadCount: number;
  settings: UserSettings;
  currentUser: User;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeWorkspace: string;
  setActiveWorkspace: (ws: string) => void;
  workspaces: string[];
  toasts: Toast[];
  addToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  removeToast: (id: string) => void;
  createProject: (projectData: {
    name: string;
    description: string;
    dueDate: string;
    priority: Project['priority'];
    category: string;
    leadId: string;
    memberIds: string[];
  }) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  createTask: (taskData: {
    title: string;
    description: string;
    projectId: string;
    assigneeId: string;
    priority: Task['priority'];
    status: TaskStatus;
    dueDate: string;
    tags: string[];
  }) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  changeTaskStatus: (id: string, newStatus: TaskStatus) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const generateUniqueId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('teamflow_projects');
    return saved ? JSON.parse(saved) : initialProjects;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('teamflow_tasks');
    return saved ? JSON.parse(saved) : initialTasks;
  });

  const [users] = useState<User[]>(mockUsers);

  const [activities, setActivities] = useState<ActivityItem[]>(() => {
    const saved = localStorage.getItem('teamflow_activities');
    return saved ? JSON.parse(saved) : initialActivities;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('teamflow_settings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [workspaces] = useState<string[]>([
    'Acme Core Engineering',
    'Mobile Platform Team',
    'Enterprise Cloud Services'
  ]);
  const [activeWorkspace, setActiveWorkspace] = useState(workspaces[0]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('teamflow_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('teamflow_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('teamflow_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('teamflow_settings', JSON.stringify(settings));
  }, [settings]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = generateUniqueId('toast');
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const createProject = (projectData: {
    name: string;
    description: string;
    dueDate: string;
    priority: Project['priority'];
    category: string;
    leadId: string;
    memberIds: string[];
  }) => {
    const lead = users.find((u) => u.id === projectData.leadId) || currentUser;
    const selectedMembers = users.filter((u) => projectData.memberIds.includes(u.id));
    if (!selectedMembers.some((m) => m.id === lead.id)) {
      selectedMembers.push(lead);
    }

    const newProject: Project = {
      id: `proj-${Date.now().toString().slice(-4)}`,
      name: projectData.name,
      description: projectData.description,
      status: 'In Progress',
      progress: 0,
      dueDate: projectData.dueDate,
      startDate: new Date().toISOString().split('T')[0],
      leadId: lead.id,
      leadName: lead.name,
      members: selectedMembers,
      category: projectData.category,
      priority: projectData.priority,
      totalTasks: 0,
      completedTasks: 0
    };

    setProjects((prev) => [newProject, ...prev]);

    // Add activity
    const newActivity: ActivityItem = {
      id: `act-${Date.now()}`,
      type: 'project_created',
      title: 'New project created',
      description: `${currentUser.name} launched project "${newProject.name}"`,
      timestamp: 'Just now',
      user: currentUser,
      entityId: newProject.id
    };
    setActivities((prev) => [newActivity, ...prev]);

    addToast(`Project "${newProject.name}" created successfully!`, 'success');
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    addToast('Project updated successfully', 'success');
  };

  const deleteProject = (id: string) => {
    const proj = projects.find((p) => p.id === id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    // Remove tasks associated with project
    setTasks((prev) => prev.filter((t) => t.projectId !== id));
    addToast(`Project "${proj?.name || 'Item'}" deleted`, 'info');
  };

  const createTask = (taskData: {
    title: string;
    description: string;
    projectId: string;
    assigneeId: string;
    priority: Task['priority'];
    status: TaskStatus;
    dueDate: string;
    tags: string[];
  }) => {
    const project = projects.find((p) => p.id === taskData.projectId) || projects[0];
    const assignee = users.find((u) => u.id === taskData.assigneeId) || currentUser;

    const newTask: Task = {
      id: `task-${Date.now().toString().slice(-4)}`,
      title: taskData.title,
      description: taskData.description,
      projectId: project.id,
      projectName: project.name,
      assignee,
      priority: taskData.priority,
      status: taskData.status,
      dueDate: taskData.dueDate,
      tags: taskData.tags,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setTasks((prev) => [newTask, ...prev]);

    // Update project task counts and recalculate progress
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === project.id) {
          const newTotal = p.totalTasks + 1;
          const newCompleted = taskData.status === 'Done' ? p.completedTasks + 1 : p.completedTasks;
          const progress = Math.round((newCompleted / newTotal) * 100);
          return {
            ...p,
            totalTasks: newTotal,
            completedTasks: newCompleted,
            progress
          };
        }
        return p;
      })
    );

    // Add activity
    const newActivity: ActivityItem = {
      id: `act-${Date.now()}`,
      type: 'task_created',
      title: 'New task created',
      description: `${currentUser.name} created "${newTask.title}"`,
      timestamp: 'Just now',
      user: currentUser,
      entityId: newTask.id
    };
    setActivities((prev) => [newActivity, ...prev]);

    addToast(`Task "${newTask.title.slice(0, 30)}..." added`, 'success');
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
    addToast('Task updated', 'success');
  };

  const deleteTask = (id: string) => {
    const taskToDelete = tasks.find((t) => t.id === id);
    if (!taskToDelete) return;

    setTasks((prev) => prev.filter((t) => t.id !== id));

    // Update project metrics
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === taskToDelete.projectId) {
          const newTotal = Math.max(0, p.totalTasks - 1);
          const newCompleted =
            taskToDelete.status === 'Done' ? Math.max(0, p.completedTasks - 1) : p.completedTasks;
          const progress = newTotal > 0 ? Math.round((newCompleted / newTotal) * 100) : 0;
          return {
            ...p,
            totalTasks: newTotal,
            completedTasks: newCompleted,
            progress
          };
        }
        return p;
      })
    );

    addToast('Task deleted', 'info');
  };

  const changeTaskStatus = (id: string, newStatus: TaskStatus) => {
    const task = tasks.find((t) => t.id === id);
    if (!task || task.status === newStatus) return;

    const oldStatus = task.status;
    const isNowDone = newStatus === 'Done';
    const wasDone = oldStatus === 'Done';

    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );

    // Update project progress
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === task.projectId) {
          let completedChange = 0;
          if (isNowDone && !wasDone) completedChange = 1;
          if (!isNowDone && wasDone) completedChange = -1;
          const newCompleted = Math.max(0, p.completedTasks + completedChange);
          const progress = p.totalTasks > 0 ? Math.round((newCompleted / p.totalTasks) * 100) : 0;
          return {
            ...p,
            completedTasks: newCompleted,
            progress,
            status: progress === 100 ? 'Completed' : p.status === 'Completed' ? 'In Progress' : p.status
          };
        }
        return p;
      })
    );

    // Add activity
    const activityType: ActivityItem['type'] = isNowDone ? 'task_completed' : 'task_status_changed';
    const newActivity: ActivityItem = {
      id: `act-${Date.now()}`,
      type: activityType,
      title: isNowDone ? 'Task marked as Done' : `Status changed to ${newStatus}`,
      description: `${currentUser.name} updated "${task.title}" to ${newStatus}`,
      timestamp: 'Just now',
      user: currentUser,
      entityId: task.id
    };
    setActivities((prev) => [newActivity, ...prev]);

    addToast(`Task moved to "${newStatus}"`, 'success');
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    addToast('All notifications marked as read', 'info');
  };

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    addToast('Preferences saved successfully', 'success');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        projects,
        tasks,
        users,
        activities,
        notifications,
        unreadCount,
        settings,
        currentUser,
        searchTerm,
        setSearchTerm,
        activeWorkspace,
        setActiveWorkspace,
        workspaces,
        toasts,
        addToast,
        removeToast,
        createProject,
        updateProject,
        deleteProject,
        createTask,
        updateTask,
        deleteTask,
        changeTaskStatus,
        markNotificationRead,
        markAllNotificationsRead,
        updateSettings,
        sidebarCollapsed,
        setSidebarCollapsed,
        mobileMenuOpen,
        setMobileMenuOpen
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
