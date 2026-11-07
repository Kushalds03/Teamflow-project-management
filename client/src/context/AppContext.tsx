import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Project, Task, User, ActivityItem, NotificationItem, UserSettings, TaskStatus } from '../types';
import {
  initialProjects,
  initialTasks,
  mockUsers,
  initialActivities,
  initialNotifications,
  defaultSettings,
  currentUser as fallbackCurrentUser
} from '../data/mockData';
import { authService } from '../services/auth.service';
import { projectService } from '../services/project.service';
import { taskService } from '../services/task.service';
import { userService } from '../services/user.service';
import { workspaceService, type WorkspaceItem } from '../services/workspace.service';
import { activityService } from '../services/activity.service';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

export interface WorkspaceOption {
  id: string;
  name: string;
  slug?: string;
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
  activeWorkspaceId: string;
  setActiveWorkspace: (ws: string) => void;
  workspaces: string[];
  workspaceList: WorkspaceOption[];
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
    workspaceId?: string;
  }) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  createTask: (taskData: {
    title: string;
    description: string;
    projectId: string;
    assigneeId: string;
    priority: Task['priority'];
    status: TaskStatus;
    dueDate: string;
    tags: string[];
  }) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  changeTaskStatus: (id: string, newStatus: TaskStatus) => Promise<void>;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  // Auth state
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  // Task detail modal
  selectedTask: Task | null;
  setSelectedTask: (task: Task | null) => void;
  // Project detail modal
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const generateUniqueId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const DEFAULT_WORKSPACES: WorkspaceOption[] = [
  { id: 'ws-1', name: 'Acme Core Engineering', slug: 'acme-core-engineering' },
  { id: 'ws-2', name: 'Mobile Platform Team', slug: 'mobile-platform-team' },
  { id: 'ws-3', name: 'Enterprise Cloud Services', slug: 'enterprise-cloud-services' }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('teamflow_projects');
    return saved ? JSON.parse(saved) : initialProjects;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('teamflow_tasks');
    return saved ? JSON.parse(saved) : initialTasks;
  });

  const [users, setUsers] = useState<User[]>(mockUsers);

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
  const [workspaceList, setWorkspaceList] = useState<WorkspaceOption[]>(DEFAULT_WORKSPACES);
  const [workspaces, setWorkspaces] = useState<string[]>(DEFAULT_WORKSPACES.map((w) => w.name));
  const [activeWorkspace, setActiveWorkspaceState] = useState<string>(() => {
    return localStorage.getItem('teamflow_active_workspace_name') || DEFAULT_WORKSPACES[0].name;
  });
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(() => {
    return localStorage.getItem('teamflow_active_workspace_id') || DEFAULT_WORKSPACES[0].id;
  });

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auth & Session
  const [currentUser, setCurrentUser] = useState<User>(fallbackCurrentUser);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);

  // Selected modals
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Sync to local storage for offline resilience
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

  const addToast = useCallback(
    (message: string, type: 'success' | 'info' | 'error' = 'success') => {
      const id = generateUniqueId('toast');
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  // Workspace switcher
  const setActiveWorkspace = (wsOrId: string) => {
    const match = workspaceList.find(
      (w) => w.id === wsOrId || w.name.toLowerCase() === wsOrId.toLowerCase()
    );
    if (match) {
      setActiveWorkspaceState(match.name);
      setActiveWorkspaceId(match.id);
      try {
        localStorage.setItem('teamflow_active_workspace_name', match.name);
        localStorage.setItem('teamflow_active_workspace_id', match.id);
      } catch {
        // storage fallback
      }
    } else {
      setActiveWorkspaceState(wsOrId);
      try {
        localStorage.setItem('teamflow_active_workspace_name', wsOrId);
      } catch {
        // storage fallback
      }
    }
  };

  // Fetch live activities for accessible projects
  const refreshActivities = useCallback(async (projsToScan?: Project[]) => {
    const projs = projsToScan || projects;
    if (!projs || projs.length === 0) return;

    try {
      const activityPromises = projs.slice(0, 4).map((p) =>
        activityService.getProjectActivities(p.id, { limit: 10 }).catch(() => [])
      );
      const results = await Promise.all(activityPromises);
      const combined = results.flat();
      if (combined.length > 0) {
        // Unique by id, sorted by timestamp descending
        const map = new Map<string, ActivityItem>();
        combined.forEach((a) => map.set(a.id, a));
        const sorted = Array.from(map.values());
        setActivities(sorted);
      }
    } catch {
      // Keep existing activities
    }
  }, [projects]);

  // Main data sync function
  const refreshData = useCallback(async () => {
    try {
      // 1. Fetch Workspaces
      try {
        const wsData = await workspaceService.getWorkspaces();
        if (wsData && wsData.length > 0) {
          const formattedWs: WorkspaceOption[] = wsData.map((w: WorkspaceItem) => ({
            id: w.id,
            name: w.name,
            slug: w.slug
          }));
          setWorkspaceList(formattedWs);
          setWorkspaces(formattedWs.map((w) => w.name));
          if (!formattedWs.some((w) => w.id === activeWorkspaceId)) {
            setActiveWorkspaceId(formattedWs[0].id);
            setActiveWorkspaceState(formattedWs[0].name);
          }
        }
      } catch {
        // Keep default workspaces
      }

      // 2. Fetch Users
      try {
        const usersData = await userService.getUsers();
        if (usersData && usersData.length > 0) {
          setUsers(usersData);
        }
      } catch {
        // Keep mock users
      }

      // 3. Fetch Projects (filtered by active workspace or all accessible)
      let loadedProjects: Project[] = [];
      try {
        loadedProjects = await projectService.getProjects({ workspaceId: activeWorkspaceId });
        if (!loadedProjects || loadedProjects.length === 0) {
          loadedProjects = await projectService.getProjects();
        }
        if (loadedProjects && loadedProjects.length > 0) {
          setProjects(loadedProjects);
        }
      } catch {
        // Keep local projects
      }

      // 4. Fetch Tasks
      try {
        const tasksRes = await taskService.getTasks({ limit: 100 });
        if (tasksRes && tasksRes.tasks && tasksRes.tasks.length > 0) {
          setTasks(tasksRes.tasks);
        }
      } catch {
        // Keep local tasks
      }

      // 5. Fetch Activities
      if (loadedProjects.length > 0) {
        refreshActivities(loadedProjects);
      }
    } catch {
      // Graceful fallback
    }
  }, [activeWorkspaceId, refreshActivities]);

  // Check auth session on startup
  useEffect(() => {
    const initAuth = async () => {
      setIsLoadingAuth(true);
      try {
        const user = await authService.getMe();
        if (user) {
          setCurrentUser(user);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      } finally {
        setIsLoadingAuth(false);
        refreshData();
      }
    };
    initAuth();
  }, [refreshData]);

  // Auth handlers
  const login = async (email: string, password: string) => {
    const user = await authService.login({ email, password });
    setCurrentUser(user);
    setIsAuthenticated(true);
    await refreshData();
  };

  const register = async (data: any) => {
    const user = await authService.register(data);
    setCurrentUser(user);
    setIsAuthenticated(true);
    await refreshData();
  };

  const logout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
    setCurrentUser(fallbackCurrentUser);
    addToast('Signed out successfully', 'info');
  };

  // CRUD Operations with Real Backend & Optimistic Fallback
  const createProject = async (projectData: {
    name: string;
    description: string;
    dueDate: string;
    priority: Project['priority'];
    category: string;
    leadId: string;
    memberIds: string[];
    workspaceId?: string;
  }) => {
    const targetWsId = projectData.workspaceId || activeWorkspaceId || 'ws-1';

    try {
      const newProj = await projectService.createProject({
        name: projectData.name,
        description: projectData.description,
        workspaceId: targetWsId,
        dueDate: projectData.dueDate,
        priority: projectData.priority,
        category: projectData.category,
        leadId: projectData.leadId
      });

      // Add project members
      if (projectData.memberIds && projectData.memberIds.length > 0) {
        for (const mId of projectData.memberIds) {
          if (mId !== projectData.leadId) {
            try {
              await projectService.addMember(newProj.id, mId, 'CONTRIBUTOR');
            } catch {
              // ignore duplicate
            }
          }
        }
      }

      setProjects((prev) => [newProj, ...prev]);
      addToast(`Project "${newProj.name}" created successfully!`, 'success');
      refreshActivities([newProj, ...projects]);
    } catch (err: any) {
      // Fallback local create if backend call failed
      const lead = users.find((u) => u.id === projectData.leadId) || currentUser;
      const selectedMembers = users.filter((u) => projectData.memberIds.includes(u.id));
      if (!selectedMembers.some((m) => m.id === lead.id)) {
        selectedMembers.push(lead);
      }

      const fallbackProj: Project = {
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

      setProjects((prev) => [fallbackProj, ...prev]);
      addToast(`Project created (Offline mode): ${err.message || ''}`, 'info');
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const updated = await projectService.updateProject(id, updates);
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
      addToast('Project updated successfully', 'success');
    } catch {
      // Local fallback
      setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
      addToast('Project updated locally', 'info');
    }
  };

  const deleteProject = async (id: string) => {
    const proj = projects.find((p) => p.id === id);
    try {
      await projectService.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setTasks((prev) => prev.filter((t) => t.projectId !== id));
      addToast(`Project "${proj?.name || 'Item'}" deleted`, 'info');
    } catch {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setTasks((prev) => prev.filter((t) => t.projectId !== id));
      addToast(`Project removed locally`, 'info');
    }
  };

  const createTask = async (taskData: {
    title: string;
    description: string;
    projectId: string;
    assigneeId: string;
    priority: Task['priority'];
    status: TaskStatus;
    dueDate: string;
    tags: string[];
  }) => {
    try {
      const newTask = await taskService.createTask({
        title: taskData.title,
        description: taskData.description,
        projectId: taskData.projectId,
        assigneeId: taskData.assigneeId,
        priority: taskData.priority,
        status: taskData.status,
        dueDate: taskData.dueDate,
        tags: taskData.tags
      });

      setTasks((prev) => [newTask, ...prev]);

      // Update project metrics
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id === taskData.projectId) {
            const newTotal = p.totalTasks + 1;
            const newCompleted =
              taskData.status === 'Done' ? p.completedTasks + 1 : p.completedTasks;
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

      addToast(`Task "${newTask.title.slice(0, 30)}..." added`, 'success');
      refreshActivities();
    } catch (err: any) {
      // Local fallback
      const project = projects.find((p) => p.id === taskData.projectId) || projects[0];
      const assignee = users.find((u) => u.id === taskData.assigneeId) || currentUser;

      const fallbackTask: Task = {
        id: `task-${Date.now().toString().slice(-4)}`,
        title: taskData.title,
        description: taskData.description,
        projectId: project ? project.id : 'proj-1',
        projectName: project ? project.name : 'Platform Project',
        assignee,
        priority: taskData.priority,
        status: taskData.status,
        dueDate: taskData.dueDate,
        tags: taskData.tags,
        createdAt: new Date().toISOString().split('T')[0]
      };

      setTasks((prev) => [fallbackTask, ...prev]);
      addToast(`Task created (Offline mode): ${err.message || ''}`, 'info');
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const updated = await taskService.updateTask(id, {
        title: updates.title,
        description: updates.description,
        priority: updates.priority,
        status: updates.status,
        dueDate: updates.dueDate,
        assigneeId: updates.assignee?.id,
        tags: updates.tags
      });
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      addToast('Task updated', 'success');
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
      addToast('Task updated locally', 'info');
    }
  };

  const deleteTask = async (id: string) => {
    const taskToDelete = tasks.find((t) => t.id === id);
    if (!taskToDelete) return;

    try {
      await taskService.deleteTask(id);
    } catch {
      // proceed with local removal
    }

    setTasks((prev) => prev.filter((t) => t.id !== id));

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

  const changeTaskStatus = async (id: string, newStatus: TaskStatus) => {
    const task = tasks.find((t) => t.id === id);
    if (!task || task.status === newStatus) return;

    const oldStatus = task.status;
    const isNowDone = newStatus === 'Done';
    const wasDone = oldStatus === 'Done';

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );

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

    try {
      const updated = await taskService.updateTaskStatus(id, newStatus);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      addToast(`Task moved to "${newStatus}"`, 'success');
      refreshActivities();
    } catch (err: any) {
      // Revert if API rejected
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: oldStatus } : t))
      );
      addToast(err.message || 'Failed to update task status', 'error');
    }
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

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));

    // If profile attributes were changed, sync to backend
    if (
      newSettings.name ||
      newSettings.department ||
      newSettings.bio ||
      newSettings.role
    ) {
      try {
        const updated = await userService.updateProfile({
          name: newSettings.name,
          jobTitle: newSettings.role,
          department: newSettings.department,
          bio: newSettings.bio
        });
        setCurrentUser(updated);
      } catch {
        // Ignored
      }
    }

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
        activeWorkspaceId,
        setActiveWorkspace,
        workspaces,
        workspaceList,
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
        setMobileMenuOpen,
        isAuthenticated,
        isLoadingAuth,
        login,
        register,
        logout,
        authModalOpen,
        setAuthModalOpen,
        selectedTask,
        setSelectedTask,
        selectedProject,
        setSelectedProject,
        refreshData
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
