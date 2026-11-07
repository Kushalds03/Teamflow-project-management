import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { LogIn, UserPlus, Lock, Mail, User, ShieldCheck, Briefcase } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, addToast } = useApp();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('alex.morgan@teamflow.io');
  const [loginPassword, setLoginPassword] = useState('DevPassword123!');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regJobTitle, setRegJobTitle] = useState('Software Engineer');
  const [regDepartment, setRegDepartment] = useState('Engineering');

  const demoAccounts = [
    { name: 'Alex Morgan', role: 'System Admin', email: 'alex.morgan@teamflow.io' },
    { name: 'Sarah Chen', role: 'Frontend Engineer', email: 'sarah.chen@teamflow.io' },
    { name: 'David Miller', role: 'Backend Engineer', email: 'david.miller@teamflow.io' }
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setError('Please provide email and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(loginEmail, loginPassword);
      addToast('Signed in successfully!', 'success');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      setError('Please provide name, email, and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await register({
        name: regName,
        email: regEmail,
        password: regPassword,
        jobTitle: regJobTitle,
        department: regDepartment
      });
      addToast('Account created and signed in!', 'success');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check input requirements.');
    } finally {
      setLoading(false);
    }
  };

  const selectDemoAccount = (email: string) => {
    setLoginEmail(email);
    setLoginPassword('DevPassword123!');
    setError(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={activeTab === 'login' ? 'Sign in to TeamFlow' : 'Create TeamFlow Account'}
      description="Access enterprise project management, task tracking, and real-time collaboration."
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Tab switcher */}
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setError(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'login'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setError(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'register'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Account</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
            <span className="font-semibold shrink-0">Error:</span>
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: Login */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="alex.morgan@teamflow.io"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Quick Demo Logins */}
            <div className="pt-2">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Quick Demo Accounts (One-Click)
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => selectDemoAccount(acc.email)}
                    className={`flex items-center justify-between px-3 py-2 text-left rounded-lg border text-xs transition-colors cursor-pointer ${
                      loginEmail === acc.email
                        ? 'border-indigo-500 bg-indigo-50/60 text-indigo-900 font-medium'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{acc.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {acc.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </div>
          </form>
        )}

        {/* Tab 2: Register */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Rachel Green"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="rachel.green@teamflow.io"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="At least 8 characters..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Job Title
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={regJobTitle}
                    onChange={(e) => setRegJobTitle(e.target.value)}
                    placeholder="e.g. QA Engineer"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department
                </label>
                <select
                  value={regDepartment}
                  onChange={(e) => setRegDepartment(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Design">Design</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Product">Product</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={loading}>
                {loading ? 'Creating...' : 'Register & Sign In'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

