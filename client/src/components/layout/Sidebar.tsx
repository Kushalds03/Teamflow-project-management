import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../ui/Avatar';
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Kanban,
  Users,
  BarChart3,
  Settings,
  ChevronDown,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    currentUser,
    tasks,
    projects,
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileMenuOpen,
    setMobileMenuOpen,
    workspaces,
    activeWorkspace,
    setActiveWorkspace
  } = useApp();

  const [workspaceMenuOpen, setWorkspaceMenuOpen] = React.useState(false);
  const navigate = useNavigate();

  // Tasks assigned to current user that are not Done
  const myPendingTasksCount = tasks.filter(
    (t) => t.assignee.id === currentUser.id && t.status !== 'Done'
  ).length;

  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      to: '/my-tasks',
      label: 'My Tasks',
      icon: CheckSquare,
      badge: myPendingTasksCount > 0 ? myPendingTasksCount : null
    },
    {
      to: '/projects',
      label: 'Projects',
      icon: FolderKanban,
      badge: projects.length
    },
    {
      to: '/kanban',
      label: 'Kanban Board',
      icon: Kanban,
      badge: null
    },
    {
      to: '/team',
      label: 'Team Members',
      icon: Users,
      badge: null
    },
    {
      to: '/analytics',
      label: 'Analytics',
      icon: BarChart3,
      badge: null
    },
    {
      to: '/settings',
      label: 'Settings',
      icon: Settings,
      badge: null
    }
  ];

  const handleNavClick = () => {
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-[#111827] text-slate-300 flex flex-col border-r border-slate-800 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo and Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
          <div
            className={`flex items-center gap-3 cursor-pointer overflow-hidden transition-all ${
              sidebarCollapsed ? 'justify-center w-full' : ''
            }`}
            onClick={() => navigate('/')}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-indigo-900/30 shrink-0">
              <Layers className="w-5 h-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-white text-base tracking-tight leading-none flex items-center gap-1.5">
                  TeamFlow
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded-full font-mono font-medium">
                    PRO
                  </span>
                </span>
                <span className="text-[11px] text-slate-400 mt-1">Enterprise PM</span>
              </div>
            )}
          </div>

          {!sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(true)}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Workspace Selector */}
        {!sidebarCollapsed && (
          <div className="px-3 pt-4 pb-2 relative">
            <label className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 px-2 block mb-1.5">
              Workspace
            </label>
            <button
              onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-200 text-xs transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span className="truncate font-medium">{activeWorkspace}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            </button>

            {workspaceMenuOpen && (
              <div className="absolute top-full left-3 right-3 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
                {workspaces.map((ws) => (
                  <button
                    key={ws}
                    onClick={() => {
                      setActiveWorkspace(ws);
                      setWorkspaceMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-700/70 transition-colors cursor-pointer ${
                      ws === activeWorkspace
                        ? 'text-indigo-400 font-semibold bg-indigo-500/10'
                        : 'text-slate-300'
                    }`}
                  >
                    <span className="truncate">{ws}</span>
                    {ws === activeWorkspace && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Navigation list */}
        <div className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {!sidebarCollapsed && (
            <div className="px-2 pt-2 pb-1 text-[10px] font-semibold tracking-wider uppercase text-slate-400">
              Main Menu
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  } ${sidebarCollapsed ? 'justify-center px-0' : ''}`
                }
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                {!sidebarCollapsed && (
                  <div className="flex items-center justify-between w-full">
                    <span>{item.label}</span>
                    {item.badge !== null && (
                      <span className="text-[10px] font-semibold bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-md border border-slate-700">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Workspace Quick Tip / Pro banner */}
        {!sidebarCollapsed && (
          <div className="px-3 pb-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-950/70 to-slate-800/90 border border-indigo-500/20 text-slate-300 text-xs">
              <div className="flex items-center gap-1.5 text-indigo-400 font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sprint Velocity: 94%</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                4 projects on schedule. 1 task requires team review.
              </p>
            </div>
          </div>
        )}

        {/* Expand toggle when collapsed */}
        {sidebarCollapsed && (
          <div className="p-2 border-t border-slate-800 flex justify-center">
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* User Profile Footer */}
        <div className="p-3 border-t border-slate-800 bg-[#0d131f]">
          <div
            className={`flex items-center gap-3 ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <Avatar user={currentUser} size="sm" showStatus status="active" />
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate leading-tight">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{currentUser.role}</p>
              </div>
            )}
            {!sidebarCollapsed && (
              <button
                onClick={() => navigate('/settings')}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Account Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
