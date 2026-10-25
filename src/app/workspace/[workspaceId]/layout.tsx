'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Zap,
  Hash,
  Lock,
  Plus,
  Users,
  Calendar,
  Settings,
  Bell,
  Search,
  MessageSquare,
  Video,
  ChevronDown,
  LogOut,
  Sparkles,
  KeyRound,
  Check,
  Copy,
  LayoutDashboard,
  X,
  Compass,
  Sun,
  Moon
} from 'lucide-react';
import { SocketProvider, useSocket } from '@/components/socket-provider';
import { useTheme } from '@/components/theme-provider';
import { SearchModal } from '@/components/search-modal';
import { ProfileModal } from '@/components/profile-modal';

export const dynamic = 'force-dynamic';

export default function WorkspaceLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
}) {
  const resolvedParams = use(params);
  const workspaceId = resolvedParams.workspaceId;
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [workspaceData, setWorkspaceData] = useState<any>(null);
  const [allWorkspaces, setAllWorkspaces] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modals & UI States
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [showNewDMModal, setShowNewDMModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Channel Creation State
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelTopic, setNewChannelTopic] = useState('');
  const [isPrivateChannel, setIsPrivateChannel] = useState(false);
  const [channelCreating, setChannelCreating] = useState(false);

  const fetchWorkspace = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/login');
        return;
      }
      const meData = await meRes.json();
      setCurrentUser(meData.user);
      setAllWorkspaces(meData.workspaces || []);

      const wsRes = await fetch(`/api/workspaces/${workspaceId}`);
      if (!wsRes.ok) {
        router.push('/dashboard');
        return;
      }
      const wsData = await wsRes.json();
      setWorkspaceData(wsData);
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspace();
  }, [workspaceId]);

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    setChannelCreating(true);

    try {
      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          name: newChannelName.trim(),
          topic: newChannelTopic.trim(),
          isPrivate: isPrivateChannel
        })
      });

      if (res.ok) {
        const data = await res.json();
        setShowCreateChannelModal(false);
        setNewChannelName('');
        setNewChannelTopic('');
        setIsPrivateChannel(false);
        // Refresh workspace
        fetchWorkspace();
        router.push(`/workspace/${workspaceId}/channel/${data.channel.id}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setChannelCreating(false);
    }
  };

  const handleStartDM = async (targetUserId: string) => {
    try {
      const res = await fetch('/api/dms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, targetUserId })
      });
      if (res.ok) {
        const data = await res.json();
        setShowNewDMModal(false);
        fetchWorkspace();
        router.push(`/workspace/${workspaceId}/dm/${data.dmId}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyInviteCode = () => {
    const code = workspaceData?.invitation?.code || 'CNX-7H2K9P';
    navigator.clipboard.writeText(code);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center animate-bounce shadow-lg shadow-indigo-500/30">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
            Entering Workspace...
          </span>
        </div>
      </div>
    );
  }

  const workspace = workspaceData?.workspace;
  const channels = workspaceData?.channels || [];
  const dms = workspaceData?.dms || [];
  const members = workspaceData?.members || [];
  const isAdmin = workspaceData?.currentRole === 'OWNER' || workspaceData?.currentRole === 'ADMIN';

  return (
    <SocketProvider currentUser={currentUser}>
      <div className="h-screen w-screen overflow-hidden flex bg-[var(--bg-main)] text-[var(--text-primary)]">
        {/* RAIL 1: Workspace Switcher */}
        <div className="w-16 h-full bg-[var(--bg-sidebar)] border-r border-[var(--border-subtle)] flex flex-col items-center py-3 justify-between z-20 shrink-0">
          <div className="flex flex-col items-center gap-2.5 w-full">
            {/* Dashboard Link / Connects Logo */}
            <Link
              href="/dashboard"
              className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 hover:scale-105 transition-transform mb-2 group relative"
              title="Dashboard"
            >
              <Zap className="w-5 h-5" />
              <div className="absolute left-14 px-2 py-1 bg-slate-900 text-white text-xs rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                Dashboard
              </div>
            </Link>

            <div className="w-8 h-[1px] bg-white/10 my-1" />

            {/* List of Workspaces */}
            {allWorkspaces.map((ws) => {
              const isActive = ws.id === workspaceId;
              return (
                <Link
                  key={ws.id}
                  href={`/workspace/${ws.id}`}
                  className={`relative w-10 h-10 rounded-2xl overflow-hidden flex items-center justify-center transition-all group ${
                    isActive
                      ? 'ring-2 ring-indigo-500 scale-105'
                      : 'hover:rounded-xl hover:bg-white/10 opacity-75 hover:opacity-100'
                  }`}
                  title={ws.name}
                >
                  {isActive && (
                    <div className="absolute -left-3 w-1.5 h-6 rounded-r-full bg-indigo-500" />
                  )}
                  {ws.iconUrl ? (
                    <img src={ws.iconUrl} alt={ws.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-indigo-950 flex items-center justify-center text-indigo-300 font-bold text-xs uppercase">
                      {ws.name.slice(0, 2)}
                    </div>
                  )}
                  <div className="absolute left-14 px-2 py-1 bg-slate-900 text-white text-xs rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                    {ws.name}
                  </div>
                </Link>
              );
            })}

            {/* Add Workspace (+) */}
            <Link
              href="/dashboard"
              className="w-10 h-10 rounded-2xl border border-dashed border-white/20 hover:border-indigo-400 flex items-center justify-center text-slate-400 hover:text-indigo-400 hover:bg-white/5 transition-all group relative mt-1"
              title="Create or Join Workspace"
            >
              <Plus className="w-4 h-4" />
              <div className="absolute left-14 px-2 py-1 bg-slate-900 text-white text-xs rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                Add Workspace
              </div>
            </Link>
          </div>

          {/* Bottom Settings & Theme */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowProfileModal(true)}
              className="relative group"
              title="User Profile"
            >
              <img
                src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={currentUser?.name}
                className="w-8 h-8 rounded-xl object-cover ring-2 ring-indigo-500/50"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[var(--bg-sidebar)]" />
            </button>
          </div>
        </div>

        {/* SIDEBAR 2: Workspace Navigation & Channels */}
        <div className="w-64 h-full bg-[var(--bg-surface)] border-r border-[var(--border-color)] flex flex-col justify-between shrink-0">
          <div>
            {/* Workspace Header Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
                className="w-full h-14 px-4 border-b border-[var(--border-subtle)] flex items-center justify-between hover:bg-[var(--bg-elevated)] transition-colors text-left"
              >
                <div className="truncate">
                  <h2 className="font-bold text-sm text-[var(--text-primary)] truncate">
                    {workspace?.name || 'Workspace'}
                  </h2>
                  <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">
                    {workspaceData?.currentRole || 'Member'}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
              </button>

              {/* Dropdown Menu */}
              {showWorkspaceMenu && (
                <div className="absolute top-14 left-2 right-2 z-30 glass-panel rounded-2xl p-1.5 border border-[var(--border-color)] shadow-2xl animate-fade-in text-xs">
                  <button
                    onClick={() => {
                      setShowWorkspaceMenu(false);
                      handleCopyInviteCode();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left hover:bg-[var(--bg-elevated)] flex items-center justify-between transition-colors"
                  >
                    <span>Copy Invite Code</span>
                    {copiedInvite ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[var(--text-muted)]" />}
                  </button>

                  <button
                    onClick={() => {
                      setShowWorkspaceMenu(false);
                      setShowCreateChannelModal(true);
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left hover:bg-[var(--bg-elevated)] flex items-center gap-2 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Create Channel</span>
                  </button>

                  {isAdmin && (
                    <Link
                      href={`/workspace/${workspaceId}/settings`}
                      onClick={() => setShowWorkspaceMenu(false)}
                      className="w-full px-3 py-2 rounded-xl text-left hover:bg-[var(--bg-elevated)] flex items-center gap-2 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      <span>Workspace Settings</span>
                    </Link>
                  )}

                  <div className="my-1 border-t border-[var(--border-subtle)]" />

                  <Link
                    href="/dashboard"
                    onClick={() => setShowWorkspaceMenu(false)}
                    className="w-full px-3 py-2 rounded-xl text-left hover:bg-[var(--bg-elevated)] flex items-center gap-2 text-[var(--text-secondary)]"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Return to Dashboard</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Navigation Items */}
            <div className="px-3 pt-3 pb-2 space-y-0.5">
              <button
                onClick={() => setShowSearchModal(true)}
                className="w-full px-3 py-1.5 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] flex items-center gap-2.5 transition-colors"
              >
                <Search className="w-4 h-4 text-indigo-400" />
                <span>Search</span>
                <span className="ml-auto text-[10px] text-[var(--text-muted)] font-mono">⌘K</span>
              </button>

              <Link
                href={`/workspace/${workspaceId}/calendar`}
                className={`w-full px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2.5 transition-colors ${
                  pathname.includes('/calendar')
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                }`}
              >
                <Calendar className="w-4 h-4 text-purple-400" />
                <span>Team Calendar</span>
              </Link>

              {isAdmin && (
                <Link
                  href={`/workspace/${workspaceId}/settings`}
                  className={`w-full px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2.5 transition-colors ${
                    pathname.includes('/settings')
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                  }`}
                >
                  <Settings className="w-4 h-4 text-indigo-400" />
                  <span>Admin Settings</span>
                </Link>
              )}
            </div>

            {/* CHANNELS SECTION */}
            <div className="mt-3 px-3">
              <div className="flex items-center justify-between px-2 mb-1">
                <span className="text-[11px] uppercase tracking-wider font-bold text-[var(--text-muted)]">
                  Channels
                </span>
                <button
                  onClick={() => setShowCreateChannelModal(true)}
                  className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                  title="Create Channel"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-0.5 overflow-y-auto max-h-[180px] pr-1">
                {channels.map((ch: any) => {
                  const isCurrent = pathname.includes(`/channel/${ch.id}`);
                  return (
                    <Link
                      key={ch.id}
                      href={`/workspace/${workspaceId}/channel/${ch.id}`}
                      className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                        isCurrent
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {ch.isPrivate ? (
                          <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        ) : (
                          <Hash className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        )}
                        <span className="truncate">{ch.name}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* DIRECT MESSAGES SECTION */}
            <div className="mt-4 px-3">
              <div className="flex items-center justify-between px-2 mb-1">
                <span className="text-[11px] uppercase tracking-wider font-bold text-[var(--text-muted)]">
                  Direct Messages
                </span>
                <button
                  onClick={() => setShowNewDMModal(true)}
                  className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                  title="New Message"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-0.5 overflow-y-auto max-h-[160px] pr-1">
                {dms.map((dm: any) => {
                  const isCurrent = pathname.includes(`/dm/${dm.id}`);
                  return (
                    <Link
                      key={dm.id}
                      href={`/workspace/${workspaceId}/dm/${dm.id}`}
                      className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors ${
                        isCurrent
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          dm.otherUserStatus === 'ONLINE'
                            ? 'bg-emerald-400'
                            : dm.otherUserStatus === 'AWAY'
                            ? 'bg-amber-400'
                            : dm.otherUserStatus === 'DND'
                            ? 'bg-red-400'
                            : 'bg-slate-400'
                        }`}
                      />
                      <span className="truncate">{dm.otherUserName}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Current User Bar */}
          <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex items-center justify-between">
            <div
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2.5 cursor-pointer hover:opacity-85 transition-opacity truncate mr-2"
            >
              <div className="relative shrink-0">
                <img
                  src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={currentUser?.name}
                  className="w-8 h-8 rounded-xl object-cover ring-2 ring-indigo-500/40"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[var(--bg-elevated)]" />
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-[var(--text-primary)] truncate">{currentUser?.name}</p>
                <p className="text-[10px] text-[var(--text-muted)] truncate">{currentUser?.customStatus || 'Online'}</p>
              </div>
            </div>

            <button
              onClick={() => setShowProfileModal(true)}
              className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors"
              title="Edit Profile"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MAIN WORKSPACE CONTENT */}
        <div className="flex-1 h-full overflow-hidden flex flex-col">
          {children}
        </div>

        {/* Modal: Create Channel */}
        {showCreateChannelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-[var(--border-color)] shadow-2xl relative">
              <button onClick={() => setShowCreateChannelModal(false)} className="absolute top-5 right-5 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <Hash className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Create a Channel</h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Channels are where your team communicates on specific topics.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateChannel} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                    Channel Name
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">#</span>
                    <input
                      type="text"
                      required
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value)}
                      placeholder="design-critique"
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                    Topic / Description
                  </label>
                  <textarea
                    rows={2}
                    value={newChannelTopic}
                    onChange={(e) => setNewChannelTopic(e.target.value)}
                    placeholder="Weekly design reviews and component discussions."
                    className="w-full px-4 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Lock className={`w-4 h-4 ${isPrivateChannel ? 'text-amber-400' : 'text-[var(--text-muted)]'}`} />
                    <div>
                      <span className="text-xs font-bold block">Make Private</span>
                      <span className="text-[10px] text-[var(--text-muted)] block">
                        When private, can only be joined or seen by invitation.
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isPrivateChannel}
                    onChange={(e) => setIsPrivateChannel(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateChannelModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={channelCreating}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 hover:opacity-95"
                  >
                    {channelCreating ? 'Creating...' : 'Create Channel'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: New Direct Message */}
        {showNewDMModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-[var(--border-color)] shadow-2xl relative">
              <button onClick={() => setShowNewDMModal(false)} className="absolute top-5 right-5 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Direct Messages</h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Start a 1:1 conversation with a workspace member.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                {members.filter((m: any) => m.userId !== currentUser?.id).map((m: any) => (
                  <button
                    key={m.userId}
                    onClick={() => handleStartDM(m.userId)}
                    className="w-full p-2.5 rounded-2xl hover:bg-[var(--bg-elevated)] flex items-center justify-between transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={m.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={m.name}
                          className="w-8 h-8 rounded-xl object-cover"
                        />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[var(--bg-surface)] ${
                            m.status === 'ONLINE' ? 'bg-emerald-400' : 'bg-slate-400'
                          }`}
                        />
                      </div>
                      <div>
                        <span className="text-xs font-bold block">{m.name}</span>
                        <span className="text-[10px] text-[var(--text-muted)] block">{m.email}</span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      Chat →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search Modal */}
        {showSearchModal && (
          <SearchModal workspaceId={workspaceId} onClose={() => setShowSearchModal(false)} />
        )}

        {/* Profile Modal */}
        {showProfileModal && (
          <ProfileModal
            currentUser={currentUser}
            onClose={() => setShowProfileModal(false)}
            onUpdate={(updated) => {
              setCurrentUser(updated);
              fetchWorkspace();
            }}
          />
        )}
      </div>
    </SocketProvider>
  );
}
