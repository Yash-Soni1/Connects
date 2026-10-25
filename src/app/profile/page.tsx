'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Sparkles, Check, Moon, Sun, Shield, LogOut } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

export const dynamic = 'force-dynamic';

export default function GlobalProfilePage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [customStatus, setCustomStatus] = useState('');
  const [presenceStatus, setPresenceStatus] = useState('ONLINE');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
          setName(data.user.name || '');
          setBio(data.user.bio || '');
          setCustomStatus(data.user.customStatus || '');
          setPresenceStatus(data.user.status || 'ONLINE');
        } else {
          router.push('/login');
        }
      } catch {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, bio, customStatus, status: presenceStatus })
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] p-6">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="glass-panel rounded-3xl p-8 border border-[var(--border-color)] shadow-xl">
          <div className="flex items-center justify-between pb-6 border-b border-[var(--border-subtle)] mb-6">
            <div className="flex items-center gap-3">
              <img
                src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={name}
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-500/40"
              />
              <div>
                <h1 className="text-xl font-bold">{currentUser?.name}</h1>
                <p className="text-xs text-[var(--text-muted)]">{currentUser?.email}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
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
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
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
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Presence Status
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
                Bio
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Theme
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

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 hover:opacity-95"
              >
                {saved ? 'Saved Changes!' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
