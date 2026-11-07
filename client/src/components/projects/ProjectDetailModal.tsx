import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { ProgressBar } from '../ui/ProgressBar';
import { projectService } from '../../services/project.service';
import { activityService } from '../../services/activity.service';
import type { Project, ProjectStatus, TaskPriority, ActivityItem } from '../../types';
import {
  Calendar,
  Users,
  Activity,
  Trash2,
  Edit3,
  UserPlus,
  Tag,
  CheckCircle2,
  FolderKanban
} from 'lucide-react';

interface ProjectDetailModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  isOpen,
  onClose
}) => {
  const {
    updateProject,
    deleteProject,
    users,
    addToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'edit' | 'members' | 'activities'>('overview');
  const [projectActivities, setProjectActivities] = useState<ActivityItem[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  // Edit form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('In Progress');
  const [priority, setPriority] = useState<TaskPriority>('High');
  const [category, setCategory] = useState('Frontend & UX');
  const [dueDate, setDueDate] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Add member state
  const [newMemberId, setNewMemberId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('CONTRIBUTOR');
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => {
    if (!project || !isOpen) return;

    setName(project.name);
    setDescription(project.description);
    setStatus(project.status);
    setPriority(project.priority);
    setCategory(project.category);
    setDueDate(project.dueDate);

    if (activeTab === 'activities') {
      loadActivities(project.id);
    }
  }, [project, isOpen, activeTab]);

  const loadActivities = async (projectId: string) => {
    try {
      setLoadingActivities(true);
      const data = await activityService.getProjectActivities(projectId, { limit: 15 });
      setProjectActivities(data);
    } catch {
      setProjectActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    try {
      setSavingEdit(true);
      await updateProject(project.id, {
        name,
        description,
        status,
        priority,
        category,
        dueDate
      });
      setActiveTab('overview');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !newMemberId) return;

    try {
      setAddingMember(true);
      await projectService.addMember(project.id, newMemberId, newMemberRole);
      const addedUser = users.find((u) => u.id === newMemberId);
      if (addedUser && !project.members.some((m) => m.id === addedUser.id)) {
        project.members.push(addedUser);
      }
      setNewMemberId('');
      addToast('Team member added to project', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to add member to project', 'error');
    } finally {
      setAddingMember(false);
    }
  };

  const handleDelete = async () => {
    if (!project) return;
    await deleteProject(project.id);
    onClose();
  };

  if (!project) return null;

  const projectStatuses: ProjectStatus[] = ['In Progress', 'Completed', 'On Hold', 'Planning'];
  const projectPriorities: TaskPriority[] = ['High', 'Medium', 'Low'];
  const availableUsersToAdd = users.filter(
    (u) => !project.members.some((m) => m.id === u.id)
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={project.name}
      description={`Project ID: ${project.id} • Lead: ${project.leadName}`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('edit')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'edit'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Project</span>
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'members'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team Members</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-mono">
              {project.members.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'activities'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
              {project.description || 'No description provided.'}
            </div>

            {/* Progress Bar */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Milestone Progress
                </span>
                <span className="font-bold text-slate-900">
                  {project.progress}% ({project.completedTasks} / {project.totalTasks} tasks)
                </span>
              </div>
              <ProgressBar value={project.progress} size="md" />
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Status</span>
                <Badge status={project.status}>{project.status}</Badge>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Priority</span>
                <Badge priority={project.priority}>{project.priority}</Badge>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Target Date</span>
                <span className="font-medium text-slate-800 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {project.dueDate || 'Open'}
                </span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Category</span>
                <span className="font-medium text-slate-800 truncate flex items-center gap-1 mt-0.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  {project.category}
                </span>
              </div>
            </div>

            {/* Team Members preview */}
            <div>
              <span className="block text-xs font-semibold text-slate-700 mb-2">
                Assigned Team ({project.members.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {project.members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 p-1.5 pr-3 rounded-lg bg-white border border-slate-200 shadow-xs text-xs"
                  >
                    <Avatar user={m} size="sm" />
                    <div>
                      <div className="font-semibold text-slate-900 leading-tight">{m.name}</div>
                      <div className="text-[10px] text-slate-500">{m.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Edit Form */}
        {activeTab === 'edit' && (
          <form onSubmit={handleSaveEdit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {projectStatuses.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {projectPriorities.map((pr) => (
                    <option key={pr} value={pr}>
                      {pr}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <Button type="button" variant="ghost" size="sm" onClick={() => setActiveTab('overview')}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={savingEdit}>
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}

        {/* Tab 3: Team Members */}
        {activeTab === 'members' && (
          <div className="space-y-4">
            {/* Add Member Bar */}
            {availableUsersToAdd.length > 0 && (
              <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <select
                  value={newMemberId}
                  onChange={(e) => setNewMemberId(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select team member to assign...</option>
                  {availableUsersToAdd.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.role} ({u.department})
                    </option>
                  ))}
                </select>

                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="CONTRIBUTOR">Contributor</option>
                  <option value="MAINTAINER">Maintainer</option>
                  <option value="VIEWER">Viewer</option>
                </select>

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={addingMember || !newMemberId}
                  icon={<UserPlus className="w-3.5 h-3.5" />}
                >
                  {addingMember ? 'Adding...' : 'Add Member'}
                </Button>
              </form>
            )}

            {/* Existing Member List */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {project.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <Avatar user={member} size="sm" showStatus status="active" />
                    <div>
                      <div className="font-semibold text-xs text-slate-900">{member.name}</div>
                      <div className="text-[11px] text-slate-500">{member.role} • {member.department}</div>
                    </div>
                  </div>

                  <span className="text-[11px] px-2.5 py-0.5 rounded-full font-mono bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {member.id === project.leadId ? 'PROJECT LEAD' : 'MEMBER'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Audit Trail Activities */}
        {activeTab === 'activities' && (
          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {loadingActivities ? (
              <div className="py-6 text-center text-xs text-slate-400">Loading activity feed...</div>
            ) : projectActivities.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No activity history recorded for this project yet.
              </div>
            ) : (
              projectActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-3 text-xs"
                >
                  <Avatar user={act.user} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{act.user.name}</span>
                      <span className="text-[10px] text-slate-400">{act.timestamp}</span>
                    </div>
                    <p className="text-slate-600 mt-0.5 leading-relaxed">{act.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            icon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Delete Project
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
