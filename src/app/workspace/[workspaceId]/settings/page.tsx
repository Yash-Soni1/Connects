'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings,
  Users,
  KeyRound,
  Shield,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Building2,
  UserCheck,
  AlertTriangle
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function WorkspaceSettingsPage({
  params
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const resolvedParams = use(params);
  const { workspaceId } = resolvedParams;
  const router = useRouter();

  const [workspace, setWorkspace] = useState<any>(null);
  const [currentRole, setCurrentRole] = useState<string>('MEMBER');
  const [members, setMembers] = useState<any[]>([]);
  const [invitation, setInvitation] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [savingWs, setSavingWs] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Invite states
  const [copiedCode, setCopiedCode] = useState(false);
  const [regeneratingInvite, setRegeneratingInvite] = useState(false);

  const fetchSettings = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (meRes.ok) {
        const meData = await meRes.json();
        setCurrentUser(meData.user);
      }

      const res = await fetch(`/api/workspaces/${workspaceId}`);
      if (!res.ok) {
        router.push('/dashboard');
        return;
      }
      const data = await res.json();
      setWorkspace(data.workspace);
      setCurrentRole(data.currentRole);
      setMembers(data.members || []);
      setInvitation(data.invitation);

      setName(data.workspace.name);
      setDescription(data.workspace.description || '');
      setIconUrl(data.workspace.iconUrl || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [workspaceId]);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingWs(true);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, iconUrl })
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingWs(false);
    }
  };

  const handleCopyInvite = () => {
    if (!invitation?.code) return;
    navigator.clipboard.writeText(invitation.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleRegenerateInvite = async () => {
    setRegeneratingInvite(true);
    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, maxUses: 100 })
      });
      if (res.ok) {
        const data = await res.json();
        setInvitation(data.invitation);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRegeneratingInvite(false);
    }
  };

  const handleChangeMemberRole = async (targetUserId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, newRole })
      });
      if (res.ok) {
        fetchSettings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (!confirm('Are you sure you want to remove this member from the workspace?')) return;
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members?userId=${targetUserId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchSettings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!confirm('DANGER: Are you sure you want to delete this entire workspace and all its channels and messages? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-main)]">
        <div className="text-xs font-semibold text-[var(--text-muted)] animate-pulse">
          Loading settings...
        </div>
      </div>
    );
  }

  const isOwner = currentRole === 'OWNER';
  const isAdmin = currentRole === 'OWNER' || currentRole === 'ADMIN';

  return (
    <div className="flex-1 h-full flex flex-col bg-[var(--bg-main)] text-[var(--text-primary)] overflow-y-auto">
      {/* HEADER */}
      <header className="h-16 px-6 border-b border-[var(--border-color)] glass-panel flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm">Workspace Administration</h1>
            <p className="text-[10px] text-[var(--text-muted)]">
              Manage organization details, members, and access codes
            </p>
          </div>
        </div>
      </header>

      {/* SETTINGS CONTENT */}
      <div className="p-6 max-w-4xl space-y-8">
        {/* Section 1: General Details */}
        <div className="glass-panel rounded-3xl p-6 border border-[var(--border-color)] shadow-xl">
          <h2 className="font-bold text-base mb-1 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>Workspace Profile</span>
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mb-6">
            Basic information about your organization.
          </p>

          <form onSubmit={handleSaveGeneral} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Workspace Name
              </label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Description
              </label>
              <textarea
                rows={2}
                disabled={!isAdmin}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Icon Image URL
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={iconUrl}
                onChange={(e) => setIconUrl(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
              />
            </div>

            {isAdmin && (
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingWs}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/25 transition-all"
                >
                  {savedSuccess ? 'Saved!' : savingWs ? 'Saving...' : 'Save Workspace Changes'}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Section 2: Invitations */}
        <div className="glass-panel rounded-3xl p-6 border border-[var(--border-color)] shadow-xl">
          <h2 className="font-bold text-base mb-1 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-purple-400" />
            <span>Invitation System</span>
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mb-6">
            Share this code with teammates so they can instantly join this workspace.
          </p>

          <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4 max-w-lg">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] block">
                Active Invite Code
              </span>
              <span className="text-xl font-mono font-extrabold text-indigo-400 tracking-wider">
                {invitation?.code || 'CNX-7H2K9P'}
              </span>
              <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Used {invitation?.usedCount || 0} of {invitation?.maxUses || 100} slots
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopyInvite}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>

              {isAdmin && (
                <button
                  onClick={handleRegenerateInvite}
                  disabled={regeneratingInvite}
                  className="p-2 rounded-xl bg-[var(--bg-surface)] hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]"
                  title="Generate new code"
                >
                  <RefreshCw className={`w-4 h-4 ${regeneratingInvite ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Members & Role Management */}
        <div className="glass-panel rounded-3xl p-6 border border-[var(--border-color)] shadow-xl">
          <h2 className="font-bold text-base mb-1 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Team Members ({members.length})</span>
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mb-6">
            Assign roles and manage team access.
          </p>

          <div className="space-y-3">
            {members.map((m) => (
              <div
                key={m.userId}
                className="p-3.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={m.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={m.name}
                    className="w-9 h-9 rounded-xl object-cover ring-1 ring-[var(--border-subtle)]"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">{m.name}</span>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">
                        {m.email}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
                      {m.role}
                    </span>
                  </div>
                </div>

                {isAdmin && m.role !== 'OWNER' && m.userId !== currentUser?.id && (
                  <div className="flex items-center gap-2">
                    <select
                      value={m.role}
                      onChange={(e) => handleChangeMemberRole(m.userId, e.target.value)}
                      className="px-2.5 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-semibold focus:outline-none"
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="MEMBER">Member</option>
                    </select>

                    <button
                      onClick={() => handleRemoveMember(m.userId)}
                      className="p-1.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Remove Member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Owner Danger Zone */}
        {isOwner && (
          <div className="p-6 rounded-3xl border border-red-500/30 bg-red-500/5">
            <h2 className="font-bold text-base text-red-400 mb-1 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Danger Zone</span>
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mb-4">
              Permanently delete this workspace and all associated messages, channels, and meetings.
            </p>
            <button
              onClick={handleDeleteWorkspace}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors shadow-lg shadow-red-600/20"
            >
              Delete Workspace
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
