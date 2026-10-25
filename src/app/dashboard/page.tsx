'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Zap,
  Plus,
  ArrowRight,
  Users,
  Bell,
  Sun,
  Moon,
  Search,
  Check,
  CheckCheck,
  Sparkles,
  LogOut,
  Building2,
  ExternalLink,
  KeyRound,
  Compass,
  Calendar,
  MessageSquare,
  Shield,
  X
} from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { SocketProvider } from '@/components/socket-provider';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'ALL' | 'MENTIONS' | 'MEETINGS'>('ALL');

  // Form states
  const [newWsName, setNewWsName] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');

  // Fetch initial profile & workspaces
  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setCurrentUser(data.user);
      setWorkspaces(data.workspaces || []);

      // Fetch notifications
      const notifRes = await fetch('/api/notifications');
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications(notifData.notifications || []);
        setUnreadCount(notifData.unreadCount || 0);
      }
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    setCreateLoading(true);
    setCreateError('');

    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWsName, description: newWsDesc })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create workspace');

      setShowCreateModal(false);
      setNewWsName('');
      setNewWsDesc('');
      router.push(`/workspace/${data.workspace.id}`);
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setJoinLoading(true);
    setJoinError('');

    try {
      const res = await fetch('/api/workspaces/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: joinCode.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid invitation code');

      setShowJoinModal(false);
      setJoinCode('');
      router.push(`/workspace/${data.workspace.id}`);
    } catch (err: any) {
      setJoinError(err.message);
    } finally {
      setJoinLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true })
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const filteredNotifications = notifications.filter(n => {
    if (notifFilter === 'MENTIONS') return n.type === 'MENTION' || n.type === 'REPLY';
    if (notifFilter === 'MEETINGS') return n.type === 'MEETING' || n.type === 'CALENDAR';
    return true;
  });

  const filteredWorkspaces = workspaces.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center animate-bounce shadow-lg shadow-indigo-500/30">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
            Loading Connects...
          </span>
        </div>
      </div>
    );
  }

  return (
    <SocketProvider currentUser={currentUser}>
      <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] flex flex-col transition-colors duration-200">
        {/* Dashboard Top Header */}
        <header className="sticky top-0 z-30 w-full glass-panel border-b border-[var(--border-color)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                  Connects
                </span>
              </Link>
            </div>

            {/* Global Search Bar */}
            <div className="hidden sm:flex items-center relative max-w-sm w-full mx-6">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search workspaces..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
              />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Notification Button */}
              <button
                onClick={() => setShowNotifDrawer(true)}
                className="relative p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* User Avatar & Logout */}
              <div className="flex items-center gap-2 pl-2 border-l border-[var(--border-subtle)]">
                <img
                  src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={currentUser?.name}
                  className="w-8 h-8 rounded-xl object-cover ring-2 ring-indigo-500/30"
                />
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
          {/* Welcome Banner */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[var(--border-color)] relative overflow-hidden mb-10 shadow-xl">
            <div className="relative z-10 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Workspace Hub
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Welcome back, {currentUser?.name?.split(' ')[0]}
              </h1>
              <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
                Connect with your teams, jump into active channels, or collaborate on video calls and sprint schedules.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 hover:opacity-95 transition-opacity flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Workspace</span>
                </button>
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="px-4 py-2.5 rounded-xl glass-panel font-semibold text-xs hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                  <KeyRound className="w-4 h-4 text-indigo-400" />
                  <span>Join via Invite Code</span>
                </button>
              </div>
            </div>
          </div>

          {/* Workspaces Section */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Your Workspaces</h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Organizations and teams you belong to
              </p>
            </div>
            <span className="text-xs font-semibold text-[var(--text-muted)]">
              {filteredWorkspaces.length} Total
            </span>
          </div>

          {filteredWorkspaces.length === 0 ? (
            <div className="glass-panel rounded-3xl p-12 text-center border border-[var(--border-color)]">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center mb-4">
                <Building2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold">Your team starts here</h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto mt-1 mb-6">
                You don&apos;t belong to any workspaces yet. Create your own workspace or join an existing team using an invitation code.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
                >
                  Create Workspace
                </button>
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="px-4 py-2 rounded-xl glass-panel text-xs font-semibold"
                >
                  Join with Code
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWorkspaces.map((ws) => (
                <Link
                  key={ws.id}
                  href={`/workspace/${ws.id}`}
                  className="group glass-panel rounded-3xl p-6 border border-[var(--border-color)] hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 overflow-hidden flex items-center justify-center p-0.5 shadow-md">
                        {ws.iconUrl ? (
                          <img src={ws.iconUrl} alt={ws.name} className="w-full h-full object-cover rounded-[14px]" />
                        ) : (
                          <Building2 className="w-7 h-7 text-indigo-400" />
                        )}
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {ws.role || 'Member'}
                      </span>
                    </div>

                    <h3 className="font-bold text-lg text-[var(--text-primary)] group-hover:text-indigo-400 transition-colors">
                      {ws.name}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                      {ws.description || 'General collaboration and team discussion.'}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                      <Users className="w-3.5 h-3.5" />
                      <span>{ws.memberCount || 1} members</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-indigo-400 group-hover:translate-x-1 transition-transform">
                      <span>Enter</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>

        {/* Modal: Create Workspace */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-[var(--border-color)] shadow-2xl relative">
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute top-5 right-5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Create a workspace</h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Workspaces are home for your team and channels.
                  </p>
                </div>
              </div>

              {createError && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateWorkspace} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newWsName}
                    onChange={(e) => setNewWsName(e.target.value)}
                    placeholder="Acme Engineering"
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={newWsDesc}
                    onChange={(e) => setNewWsDesc(e.target.value)}
                    placeholder="Core engineering and design teams."
                    className="w-full px-4 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 hover:opacity-95 disabled:opacity-50"
                  >
                    {createLoading ? 'Creating...' : 'Create & Launch'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Join Workspace */}
        {showJoinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-[var(--border-color)] shadow-2xl relative">
              <button
                onClick={() => setShowJoinModal(false)}
                className="absolute top-5 right-5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Join a Workspace</h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Enter an invitation code provided by an admin.
                  </p>
                </div>
              </div>

              {joinError && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  {joinError}
                </div>
              )}

              <form onSubmit={handleJoinWorkspace} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                    Invitation Code
                  </label>
                  <input
                    type="text"
                    required
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="CNX-7H2K9P"
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                  <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
                    Try the demo code: <span className="font-mono text-indigo-400 font-bold">CNX-7H2K9P</span>
                  </p>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowJoinModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={joinLoading}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-xs shadow-lg shadow-purple-500/25 hover:opacity-95 disabled:opacity-50"
                  >
                    {joinLoading ? 'Validating...' : 'Join Workspace'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Slide-out Notification Drawer */}
        {showNotifDrawer && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md h-full bg-[var(--bg-surface)] border-l border-[var(--border-color)] shadow-2xl p-6 flex flex-col justify-between animate-slide-left">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-bold text-base">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500 text-white">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-indigo-400 hover:underline font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifDrawer(false)}
                      className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Filter pills */}
                <div className="flex gap-2 my-4">
                  {(['ALL', 'MENTIONS', 'MEETINGS'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setNotifFilter(f)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                        notifFilter === f
                          ? 'bg-indigo-600 text-white'
                          : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                {/* List */}
                <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
                  {filteredNotifications.length === 0 ? (
                    <div className="py-12 text-center text-xs text-[var(--text-muted)]">
                      You&apos;re all caught up!
                    </div>
                  ) : (
                    filteredNotifications.map((n) => (
                      <Link
                        key={n.id}
                        href={n.link || '#'}
                        onClick={() => setShowNotifDrawer(false)}
                        className={`block p-3.5 rounded-2xl border transition-all ${
                          n.isRead
                            ? 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
                            : 'glass-panel border-indigo-500/30 text-[var(--text-primary)] shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">
                            {n.type}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold">{n.title}</h4>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border-subtle)] text-center">
                <button
                  onClick={() => setShowNotifDrawer(false)}
                  className="w-full py-2.5 rounded-xl bg-[var(--bg-elevated)] text-xs font-semibold hover:bg-white/10"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SocketProvider>
  );
}
