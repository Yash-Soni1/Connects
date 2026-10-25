'use client';

import React, { useState } from 'react';
import { X, User, Sparkles, Check, Moon, Sun, Shield } from 'lucide-react';
import { useTheme } from './theme-provider';

interface ProfileModalProps {
  currentUser: any;
  onClose: () => void;
  onUpdate: (updatedUser: any) => void;
}

export function ProfileModal({ currentUser, onClose, onUpdate }: ProfileModalProps) {
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState(currentUser?.name || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [customStatus, setCustomStatus] = useState(currentUser?.customStatus || '');
  const [presenceStatus, setPresenceStatus] = useState(currentUser?.status || 'ONLINE');
  const [loading, setLoading] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          bio,
          avatarUrl,
          customStatus,
          status: presenceStatus
        })
      });

      if (res.ok) {
        const data = await res.json();
        onUpdate(data.user);
        setSavedToast(true);
        setTimeout(() => {
          setSavedToast(false);
          onClose();
        }, 800);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-[var(--border-color)] shadow-2xl relative">
        <button onClick={onClose} className="absolute top-5 right-5 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Edit Profile & Presence</h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Customize how team members see you across Connects.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              Custom Status
            </label>
            <input
              type="text"
              value={customStatus}
              onChange={(e) => setCustomStatus(e.target.value)}
              placeholder="🚀 Shipping Connects v2.0"
              className="w-full px-4 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              Online Presence
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { val: 'ONLINE', label: 'Online', color: 'bg-emerald-400' },
                { val: 'AWAY', label: 'Away', color: 'bg-amber-400' },
                { val: 'DND', label: 'DND', color: 'bg-red-400' },
                { val: 'OFFLINE', label: 'Offline', color: 'bg-slate-400' }
              ].map((s) => (
                <button
                  key={s.val}
                  type="button"
                  onClick={() => setPresenceStatus(s.val)}
                  className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    presenceStatus === s.val
                      ? 'border-indigo-500 bg-indigo-500/15 text-indigo-400'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-white/5'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${s.color}`} />
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              Bio / Role
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Staff Software Engineer & System Architect"
              className="w-full px-4 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              Theme Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 ${
                  theme === 'dark' ? 'border-indigo-500 bg-indigo-500/15 text-indigo-400' : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)]'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>Dark Mode</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 ${
                  theme === 'light' ? 'border-indigo-500 bg-indigo-500/15 text-indigo-400' : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)]'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Light Mode</span>
              </button>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 hover:opacity-95"
            >
              {savedToast ? 'Saved!' : loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
