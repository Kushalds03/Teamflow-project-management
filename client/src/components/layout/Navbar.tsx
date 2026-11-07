import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import {
  Search,
  Bell,
  Plus,
  Menu,
  X,
  CheckCircle,
  AlertTriangle,
  Info,
  User,
  Settings,
  FolderPlus,
  CheckSquare,
  ChevronRight,
  LogIn,
  LogOut
} from 'lucide-react';

interface NavbarProps {
  onOpenCreateProject: () => void;
  onOpenCreateTask: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCreateProject,
  onOpenCreateTask
}) => {
  const {
    currentUser,
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    searchTerm,
    setSearchTerm,
    setMobileMenuOpen,
    isAuthenticated,
    logout,
    setAuthModalOpen
  } = useApp();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const createRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const navigate = useNavigate();

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (createRef.current && !createRef.current.contains(event.target as Node)) {
        setCreateMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard';
      case '/projects':
        return 'Projects';
      case '/my-tasks':
        return 'My Tasks';
      case '/kanban':
        return 'Kanban Board';
      case '/team':
        return 'Team Members';
      case '/analytics':
        return 'Analytics & Reports';
      case '/settings':
        return 'Settings';
      default:
        return 'Overview';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/90 h-16 flex items-center justify-between px-4 sm:px-6 transition-all duration-300">
      {/* Left: Mobile hamburger & breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <span className="text-slate-400 hidden sm:inline">Workspace</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
          <h1 className="font-semibold text-slate-900 tracking-tight text-sm sm:text-base">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Center: Global Search */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search projects, tasks, or members (e.g. 'OAuth', 'Redesign')..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all text-slate-800 placeholder-slate-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right Actions: Quick create, notifications, user avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Create Dropdown */}
        <div className="relative" ref={createRef}>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setCreateMenuOpen(!createMenuOpen)}
            icon={<Plus className="w-4 h-4" />}
            className="shadow-indigo-500/10"
          >
            <span className="hidden sm:inline">Create</span>
          </Button>

          {createMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
              <button
                onClick={() => {
                  setCreateMenuOpen(false);
                  onOpenCreateProject();
                }}
                className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
              >
                <FolderPlus className="w-4 h-4 text-indigo-600" />
                <span>New Project</span>
              </button>
              <button
                onClick={() => {
                  setCreateMenuOpen(false);
                  onOpenCreateTask();
                }}
                className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
              >
                <CheckSquare className="w-4 h-4 text-blue-600" />
                <span>New Task</span>
              </button>
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-slate-900">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold px-1.5 py-0.2 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    No notifications right now
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const icon =
                      notif.type === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : notif.type === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      ) : (
                        <Info className="w-4 h-4 text-blue-500 shrink-0" />
                      );

                    return (
                      <div
                        key={notif.id}
                        onClick={() => markNotificationRead(notif.id)}
                        className={`p-3.5 hover:bg-slate-50 transition-colors flex items-start gap-3 cursor-pointer ${
                          !notif.read ? 'bg-indigo-50/40' : ''
                        }`}
                      >
                        {icon}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-900 leading-tight">
                            {notif.title}
                          </p>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                            {notif.message}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {notif.time}
                          </span>
                        </div>
                        {!notif.read && (
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0 mt-1" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Avatar user={currentUser} size="sm" showStatus status="active" />
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3.5 py-2.5 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900 leading-tight">
                  {currentUser.name}
                </p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {currentUser.email}
                </p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>My Profile</span>
                </button>
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Account Settings</span>
                </button>

                <div className="border-t border-slate-100 my-1" />

                {isAuthenticated ? (
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      logout();
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      setAuthModalOpen(true);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-indigo-600 hover:bg-indigo-50 font-semibold flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <LogIn className="w-4 h-4 text-indigo-600" />
                    <span>Sign In / Demo Accounts</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
