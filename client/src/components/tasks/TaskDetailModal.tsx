import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { commentService, type CommentItem } from '../../services/comment.service';
import { activityService } from '../../services/activity.service';
import type { Task, TaskStatus, TaskPriority, ActivityItem } from '../../types';
import {
  Calendar,
  Clock,
  MessageSquare,
  Activity,
  Send,
  Trash2,
  FolderKanban,
  Tag,
  Edit3
} from 'lucide-react';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose
}) => {
  const {
    changeTaskStatus,
    updateTask,
    deleteTask,
    users,
    currentUser,
    addToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<'details' | 'edit' | 'comments' | 'activities'>('details');
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [taskActivities, setTaskActivities] = useState<ActivityItem[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Edit task state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<TaskPriority>('Medium');
  const [editDueDate, setEditDueDate] = useState('');
  const [editTags, setEditTags] = useState('');
  const [savingTaskEdit, setSavingTaskEdit] = useState(false);

  const statuses: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Done'];
  const priorities: TaskPriority[] = ['High', 'Medium', 'Low'];

  useEffect(() => {
    if (!task || !isOpen) return;

    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditPriority(task.priority);
    setEditDueDate(task.dueDate);
    setEditTags(task.tags ? task.tags.join(', ') : '');

    if (activeTab === 'comments') {
      loadComments(task.id);
    } else if (activeTab === 'activities') {
      loadActivities(task.id);
    }
  }, [task, isOpen, activeTab]);

  const loadComments = async (taskId: string) => {
    try {
      setLoadingComments(true);
      const data = await commentService.getComments(taskId);
      setComments(data);
    } catch {
      // Fallback
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const loadActivities = async (taskId: string) => {
    try {
      setLoadingActivities(true);
      const data = await activityService.getTaskActivities(taskId);
      setTaskActivities(data);
    } catch {
      setTaskActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !newComment.trim()) return;

    try {
      setSubmittingComment(true);
      const added = await commentService.createComment(task.id, newComment.trim());
      setComments((prev) => [added, ...prev]);
      setNewComment('');
      addToast('Comment posted', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to post comment', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentService.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      addToast('Comment removed', 'info');
    } catch (err: any) {
      addToast(err.message || 'Failed to delete comment', 'error');
    }
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    if (!task) return;
    changeTaskStatus(task.id, newStatus);
  };

  const handleAssigneeChange = (assigneeId: string) => {
    if (!task) return;
    const newAssignee = users.find((u) => u.id === assigneeId);
    if (!newAssignee) return;
    updateTask(task.id, { assignee: newAssignee });
  };

  const handleSaveTaskEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    try {
      setSavingTaskEdit(true);
      const tagsList = editTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await updateTask(task.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        priority: editPriority,
        dueDate: editDueDate,
        tags: tagsList
      });
      setActiveTab('details');
    } finally {
      setSavingTaskEdit(false);
    }
  };

  const handleDelete = () => {
    if (!task) return;
    deleteTask(task.id);
    onClose();
  };

  if (!task) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task.title}
      description={`Task ID: ${task.id} • Project: ${task.projectName}`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'details'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Details
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
            <span>Edit Task</span>
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'comments'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Comments</span>
            {comments.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-mono">
                {comments.length}
              </span>
            )}
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
            <span>Activity History</span>
          </button>
        </div>

        {/* Tab 1: Details */}
        {activeTab === 'details' && (
          <div className="space-y-4">
            {/* Quick status & assignee controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Status
                </label>
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {statuses.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Assignee
                </label>
                <select
                  value={task.assignee.id}
                  onChange={(e) => handleAssigneeChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description
              </label>
              <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap min-h-16">
                {task.description || 'No description provided for this work item.'}
              </div>
            </div>

            {/* Metadata pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-semibold text-slate-400">
                  Priority
                </span>
                <Badge
                  variant={
                    task.priority === 'High'
                      ? 'danger'
                      : task.priority === 'Medium'
                      ? 'warning'
                      : 'default'
                  }
                  size="sm"
                >
                  {task.priority}
                </Badge>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-semibold text-slate-400">
                  Due Date
                </span>
                <span className="font-medium text-slate-800 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {task.dueDate || 'No date set'}
                </span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-semibold text-slate-400">
                  Project
                </span>
                <span className="font-medium text-slate-800 truncate flex items-center gap-1 mt-0.5">
                  <FolderKanban className="w-3.5 h-3.5 text-slate-400" />
                  {task.projectName}
                </span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-semibold text-slate-400">
                  Created
                </span>
                <span className="font-medium text-slate-800 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {task.createdAt}
                </span>
              </div>
            </div>

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  Tags
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {task.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-indigo-50 border border-indigo-100 text-indigo-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Edit Task */}
        {activeTab === 'edit' && (
          <form onSubmit={handleSaveTaskEdit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Task Title
              </label>
              <input
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description & Acceptance Criteria
              </label>
              <textarea
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Priority
                </label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {priorities.map((p) => (
                    <option key={p} value={p}>
                      {p} Priority
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. frontend, ui, accessibility"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <Button type="button" variant="ghost" size="sm" onClick={() => setActiveTab('details')}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={savingTaskEdit}>
                {savingTaskEdit ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}

        {/* Tab 2: Comments */}
        {activeTab === 'comments' && (
          <div className="space-y-4">
            {/* New comment input */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Write a comment or update..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={submittingComment || !newComment.trim()}
                icon={<Send className="w-3.5 h-3.5" />}
              >
                Post
              </Button>
            </form>

            {/* Comment list */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1 divide-y divide-slate-100">
              {loadingComments ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  Loading comments...
                </div>
              ) : comments.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No comments yet. Be the first to share an update.
                </div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="pt-3 first:pt-0 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <Avatar user={c.author} size="sm" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-900">
                            {c.author.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {c.relativeTime}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 mt-1 leading-relaxed whitespace-pre-wrap">
                          {c.content}
                        </p>
                      </div>
                    </div>

                    {(c.author.id === currentUser.id || currentUser.role === 'ADMIN') && (
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(c.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Activities */}
        {activeTab === 'activities' && (
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {loadingActivities ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Loading activity history...
              </div>
            ) : taskActivities.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No activity history recorded for this task yet.
              </div>
            ) : (
              taskActivities.map((act) => (
                <div key={act.id} className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <Avatar user={act.user} size="sm" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{act.user.name}</span>
                      <span className="text-[10px] text-slate-400">{act.timestamp}</span>
                    </div>
                    <p className="text-slate-600 mt-0.5">{act.description}</p>
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
            Delete Task
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
