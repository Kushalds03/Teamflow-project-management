import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import {
  Users,
  Search,
  UserPlus,
  Mail,
  Send
} from 'lucide-react';

export const TeamPage: React.FC = () => {
  const { users, tasks, projects, addToast } = useApp();

  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('Frontend Engineer');
  const [inviteDepartment, setInviteDepartment] = useState('Engineering');

  const departments = ['Engineering', 'Design', 'Infrastructure', 'DevOps', 'Product'];

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.role.toLowerCase().includes(search.toLowerCase());

    const matchesDept =
      departmentFilter === 'all' || user.department === departmentFilter;

    return matchesSearch && matchesDept;
  });

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName) return;

    addToast(`Invitation sent to ${inviteEmail} for ${inviteRole}`, 'success');
    setInviteEmail('');
    setInviteName('');
    setInviteModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Team Members
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Engineering directory, capacity allocation, and role management
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setInviteModalOpen(true)}
          icon={<UserPlus className="w-4 h-4" />}
          className="shadow-sm shadow-indigo-600/20"
        >
          Invite Member
        </Button>
      </div>

      {/* Search and Role Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          {/* Search */}
          <div className="relative min-w-56 flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search member by name, email, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
            />
          </div>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-500">
          Showing {filteredUsers.length} of {users.length} members
        </span>
      </div>

      {/* Member Cards Grid */}
      {filteredUsers.length === 0 ? (
        <EmptyState
          icon={<Users className="w-6 h-6 text-slate-400" />}
          title="No team members found"
          description="We couldn't find any team members matching your search criteria."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearch('');
            setDepartmentFilter('all');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredUsers.map((user) => {
            const userTasks = tasks.filter((t) => t.assignee.id === user.id);
            const userActiveTasks = userTasks.filter((t) => t.status !== 'Done');
            const userProjects = projects.filter((p) =>
              p.members.some((m) => m.id === user.id)
            );

            return (
              <div
                key={user.id}
                className="bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] p-5 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top user row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar user={user} size="lg" showStatus status={user.status} />
                      <div>
                        <h3 className="font-semibold text-sm text-slate-900 leading-tight">
                          {user.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">{user.role}</p>
                        <span className="inline-block text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200 mt-1">
                          {user.department}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Email & Contact */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-500">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-medium block">
                        Assigned Projects
                      </span>
                      <span className="text-base font-bold text-slate-800">
                        {userProjects.length}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-medium block">
                        Open Tasks
                      </span>
                      <span className="text-base font-bold text-indigo-600">
                        {userActiveTasks.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {user.status === 'active' ? 'Active now' : user.status === 'away' ? 'Away' : 'Offline'}
                  </span>
                  <a
                    href={`mailto:${user.email}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send Message</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Invite Member Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite New Team Member"
        description="Add a teammate to collaborate on TeamFlow projects and sprints."
        maxWidth="md"
      >
        <form onSubmit={handleSendInvite} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Jessica Taylor"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="e.g. jessica.taylor@company.io"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
              >
                <option value="Frontend Engineer">Frontend Engineer</option>
                <option value="Backend Engineer">Backend Engineer</option>
                <option value="DevOps Specialist">DevOps Specialist</option>
                <option value="Product Designer">Product Designer</option>
                <option value="QA Engineer">QA Engineer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department
              </label>
              <select
                value={inviteDepartment}
                onChange={(e) => setInviteDepartment(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
              >
                <option value="Engineering">Engineering</option>
                <option value="Design">Design</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="DevOps">DevOps</option>
                <option value="Product">Product</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setInviteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Send Invite
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
