import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import {
  User,
  Bell,
  Sliders,
  Save,
  Info,
  Moon,
  Sun
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, currentUser } = useApp();

  const [formData, setFormData] = useState({
    name: settings.name,
    email: settings.email,
    role: settings.role,
    department: settings.department,
    bio: settings.bio,
    theme: settings.theme,
    compactMode: settings.compactMode,
    emailNotifications: settings.emailNotifications,
    pushNotifications: settings.pushNotifications,
    weeklyDigest: settings.weeklyDigest,
    taskAssignmentAlerts: settings.taskAssignmentAlerts
  });

  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'appearance'>('profile');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Application Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Customize your user profile, notification channels, and workspace display preferences
        </p>
      </div>

      {/* Info notice about local persistence */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 flex items-start gap-3 text-xs text-indigo-900">
        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Local Workspace State:</span> Your interface preferences, layout toggles, and notification settings are persisted locally in your browser storage for this Phase 1 demonstration.
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'profile'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile Settings</span>
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'notifications'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notification Preferences</span>
        </button>
        <button
          onClick={() => setActiveTab('appearance')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'appearance'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Appearance & Layout</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Tab 1: Profile */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">User Profile</h3>
              <p className="text-xs text-slate-500 mt-0.5">Manage your public information and identity</p>
            </div>

            {/* Avatar display */}
            <div className="flex items-center gap-4 pt-2">
              <Avatar user={currentUser} size="xl" showStatus status="active" />
              <div>
                <h4 className="text-xs font-semibold text-slate-900">{formData.name}</h4>
                <p className="text-xs text-slate-500">{formData.email}</p>
                <span className="inline-block text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 mt-1">
                  {formData.role}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Engineering Role
                </label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Design">Design</option>
                  <option value="Product">Product</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Professional Bio
              </label>
              <textarea
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Tab 2: Notifications */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Notification Preferences</h3>
              <p className="text-xs text-slate-500 mt-0.5">Control how and when you receive team updates</p>
            </div>

            <div className="divide-y divide-slate-100 space-y-4">
              <div className="flex items-center justify-between pt-2">
                <div>
                  <h4 className="text-xs font-semibold text-slate-800">Email Notifications</h4>
                  <p className="text-[11px] text-slate-500">Receive email alerts for project deadlines and sprint milestones</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.emailNotifications}
                  onChange={(e) =>
                    setFormData({ ...formData, emailNotifications: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate-800">Push Notifications</h4>
                  <p className="text-[11px] text-slate-500">Get browser notifications when tasks are moved or updated</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.pushNotifications}
                  onChange={(e) =>
                    setFormData({ ...formData, pushNotifications: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate-800">Weekly Sprint Digest</h4>
                  <p className="text-[11px] text-slate-500">A weekly summary of completed velocity and sprint progress</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.weeklyDigest}
                  onChange={(e) =>
                    setFormData({ ...formData, weeklyDigest: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate-800">Task Assignment Alerts</h4>
                  <p className="text-[11px] text-slate-500">Instant notification when a teammate assigns you a new task</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.taskAssignmentAlerts}
                  onChange={(e) =>
                    setFormData({ ...formData, taskAssignmentAlerts: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Appearance */}
        {activeTab === 'appearance' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Appearance & Display</h3>
              <p className="text-xs text-slate-500 mt-0.5">Customize UI contrast, layout density, and theme</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Theme Preset
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <div
                    onClick={() => setFormData({ ...formData, theme: 'light' })}
                    className={`p-3.5 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition-all ${
                      formData.theme === 'light'
                        ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <Sun className="w-4 h-4 text-amber-500" />
                    <div>
                      <div className="text-xs font-semibold">Light SaaS (Default)</div>
                      <div className="text-[10px] text-slate-500">Clean enterprise contrast</div>
                    </div>
                  </div>

                  <div
                    onClick={() => setFormData({ ...formData, theme: 'dark' })}
                    className={`p-3.5 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition-all opacity-80 ${
                      formData.theme === 'dark'
                        ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <Moon className="w-4 h-4 text-indigo-500" />
                    <div>
                      <div className="text-xs font-semibold">Deep Navy Contrast</div>
                      <div className="text-[10px] text-slate-500">Dark navigation palette</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-800">Compact Table Mode</h4>
                  <p className="text-[11px] text-slate-500">Reduces row padding in task and project tables for high-density screens</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.compactMode}
                  onChange={(e) => setFormData({ ...formData, compactMode: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Save Actions Button */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={<Save className="w-4 h-4" />}
            className="shadow-sm shadow-indigo-600/20"
          >
            Save Preferences
          </Button>
        </div>
      </form>
    </div>
  );
};
