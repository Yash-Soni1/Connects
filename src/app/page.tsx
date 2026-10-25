'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Video,
  Calendar,
  Bell,
  Shield,
  Zap,
  Users,
  Compass,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
  Moon,
  Sun,
  Laptop
} from 'lucide-react';
import { Hero3D } from '@/components/hero-3d';
import { useTheme } from '@/components/theme-provider';

export default function LandingPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  const handleQuickDemoLogin = async (email: string) => {
    try {
      setDemoLoading(email);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'password123' })
      });
      if (res.ok) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    } catch {
      router.push('/login');
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-200">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
              Connects
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--text-secondary)]">
            <a href="#features" className="hover:text-[var(--text-primary)] transition-colors">Features</a>
            <a href="#preview" className="hover:text-[var(--text-primary)] transition-colors">Preview</a>
            <a href="#security" className="hover:text-[var(--text-primary)] transition-colors">Security</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors"
            >
              Sign In
            </Link>

            <Link
              href="/signup"
              className="px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:opacity-95 transition-opacity"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-6 backdrop-blur-md"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Next-Gen Real-Time Collaboration</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight"
          >
            Everything your team needs to{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              stay connected.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-lg sm:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed"
          >
            Unify high-velocity workspaces, real-time channels, rich direct messaging,
            WebRTC video meetings, notifications, and shared digital calendars in one fluid platform.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              href="/signup"
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 text-white font-semibold text-sm shadow-xl shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 group"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/login"
              className="px-6 py-3.5 rounded-2xl glass-panel font-semibold text-sm hover:bg-white/10 transition-colors"
            >
              Sign In to Workspace
            </Link>
          </motion.div>

          {/* Quick 1-Click Demo Accounts Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 pt-6 border-t border-[var(--border-subtle)] max-w-xl mx-auto"
          >
            <p className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-3">
              1-Click Demo Accounts (Instant Test Access)
            </p>
            <div className="flex flex-wrap justify-center gap-2.5">
              <button
                onClick={() => handleQuickDemoLogin('alex@connects.io')}
                disabled={!!demoLoading}
                className="px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-medium border border-indigo-500/30 transition-colors flex items-center gap-1.5"
              >
                <span>👑 Alex Rivers (Owner)</span>
                {demoLoading === 'alex@connects.io' && <span className="animate-spin text-[10px]">●</span>}
              </button>
              <button
                onClick={() => handleQuickDemoLogin('sarah@connects.io')}
                disabled={!!demoLoading}
                className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-xs font-medium border border-purple-500/30 transition-colors flex items-center gap-1.5"
              >
                <span>⚡ Sarah Chen (Admin)</span>
                {demoLoading === 'sarah@connects.io' && <span className="animate-spin text-[10px]">●</span>}
              </button>
              <button
                onClick={() => handleQuickDemoLogin('marcus@connects.io')}
                disabled={!!demoLoading}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium border border-emerald-500/30 transition-colors flex items-center gap-1.5"
              >
                <span>💻 Marcus Brody (Member)</span>
                {demoLoading === 'marcus@connects.io' && <span className="animate-spin text-[10px]">●</span>}
              </button>
            </div>
          </motion.div>
        </div>

        {/* 3D Visual Experience */}
        <div className="mt-8">
          <Hero3D />
        </div>
      </section>

      {/* Interactive Product Preview Section */}
      <section id="preview" className="py-20 border-t border-[var(--border-color)] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs uppercase tracking-widest text-indigo-400 font-bold mb-3">Live Platform Preview</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Designed for speed, crafted for teams.
            </h3>
            <p className="mt-4 text-[var(--text-secondary)]">
              Experience the harmony of Slack&apos;s real-time messaging, Linear&apos;s typography, and Discord&apos;s fluid video rooms.
            </p>
          </div>

          <div className="glass-panel rounded-3xl p-4 sm:p-6 shadow-2xl border border-[var(--border-color)] overflow-hidden">
            <div className="flex items-center gap-2 pb-4 mb-4 border-b border-[var(--border-subtle)]">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs text-[var(--text-muted)] font-mono ml-3">connects.app/workspace/connects-hq/channel/development</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 min-h-[420px]">
              {/* Mock Sidebar */}
              <div className="hidden md:block md:col-span-3 p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-4">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs">C</div>
                  <span>Connects HQ</span>
                </div>
                <div className="space-y-1 text-xs text-[var(--text-secondary)]">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 font-medium flex items-center gap-2">
                    <span>#</span> development
                  </div>
                  <div className="p-1.5 rounded-lg hover:bg-white/5 flex items-center gap-2">
                    <span>#</span> announcements
                  </div>
                  <div className="p-1.5 rounded-lg hover:bg-white/5 flex items-center gap-2">
                    <span>#</span> design
                  </div>
                </div>
                <div className="pt-4 border-t border-[var(--border-subtle)] space-y-2">
                  <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-bold">Direct Messages</span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Alex Rivers</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Sarah Chen</span>
                  </div>
                </div>
              </div>

              {/* Mock Chat & Meeting Area */}
              <div className="col-span-1 md:col-span-9 p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col justify-between">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">#development</span>
                    <span className="text-xs text-[var(--text-muted)] hidden sm:inline">• 8 members</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Active Call
                    </span>
                  </div>
                </div>

                <div className="py-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                      MB
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-bold">Marcus Brody</span>
                        <span className="text-[10px] text-[var(--text-muted)]">10:40 AM</span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        All WebSocket connections are verified with sub-10ms delivery latency.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold text-white">
                      SC
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-bold">Sarah Chen</span>
                        <span className="text-[10px] text-[var(--text-muted)]">10:41 AM</span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        Verified reactions and threads. The WebRTC video room is ready for testing!
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span className="px-2 py-0.5 rounded-full text-[11px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                          👍 5
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] bg-purple-500/15 text-purple-400 border border-purple-500/30">
                          🚀 4
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <span>Message #development...</span>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-colors">
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-20 border-t border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs uppercase tracking-widest text-indigo-400 font-bold mb-3">Engineered for Excellence</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Powerful tools built into one unified experience.
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-3xl border border-[var(--border-color)] hover:border-indigo-500/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center mb-5">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold mb-2">Real-Time Messaging</h4>
              <p className="text-sm text-[var(--text-secondary)]">
                Instant bidirectional message delivery, rich replies, live typing indicators, and emoji reactions powered by WebSockets.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-[var(--border-color)] hover:border-indigo-500/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/15 text-violet-400 flex items-center justify-center mb-5">
                <Video className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold mb-2">WebRTC Video Meetings</h4>
              <p className="text-sm text-[var(--text-secondary)]">
                Launch calls directly from channels and DMs. Enjoy HD audio, camera toggles, and live screen sharing without leaving your chat.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-[var(--border-color)] hover:border-indigo-500/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/15 text-pink-400 flex items-center justify-center mb-5">
                <Calendar className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold mb-2">Shared Digital Calendar</h4>
              <p className="text-sm text-[var(--text-secondary)]">
                Coordinate team schedules with Day/Week/Month views, team availability badges, and 1-click video meeting generation.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-[var(--border-color)] hover:border-indigo-500/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-5">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold mb-2">Dynamic Workspaces</h4>
              <p className="text-sm text-[var(--text-secondary)]">
                Switch between organizations seamlessly. Manage public and private channels with custom topic controls and membership rules.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-[var(--border-color)] hover:border-indigo-500/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-5">
                <Bell className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold mb-2">Unified Notifications</h4>
              <p className="text-sm text-[var(--text-secondary)]">
                Never miss an update. Persistent notifications for @mentions, thread replies, direct messages, and upcoming calendar meetings.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-[var(--border-color)] hover:border-indigo-500/40 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center mb-5">
                <Shield className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold mb-2">Role-Based Admin Control</h4>
              <p className="text-sm text-[var(--text-secondary)]">
                Complete permissions hierarchy (Owner, Admin, Member), invite codes with limits and expiration, and audit controls.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 border-t border-[var(--border-color)] relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Bring your team together with <span className="text-indigo-400">Connects</span>.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[var(--text-secondary)] max-w-xl mx-auto">
            Experience the future of team communication. Zero friction setup, lightning fast real-time messaging, and complete peace of mind.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/signup"
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm shadow-xl shadow-indigo-500/30 hover:scale-105 transition-transform"
            >
              Create your workspace
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-color)] py-8 text-center text-xs text-[var(--text-muted)]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-500" />
            <span className="font-semibold text-[var(--text-primary)]">Connects</span>
            <span>— Everything your team needs to stay connected.</span>
          </div>
          <div>© 2026 Connects Inc. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
