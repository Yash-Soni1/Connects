'use client';

import React, { useState, useEffect, use } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  Video,
  MapPin,
  Lock,
  Globe,
  Users,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X
} from 'lucide-react';
import { VideoMeetingModal } from '@/components/video-meeting-modal';

export const dynamic = 'force-dynamic';

export default function WorkspaceCalendarPage({
  params
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const resolvedParams = use(params);
  const { workspaceId } = resolvedParams;

  const [events, setEvents] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'MONTH' | 'WEEK' | 'DAY'>('WEEK');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  // Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [location, setLocation] = useState('');
  const [createVideoMeeting, setCreateVideoMeeting] = useState(true);
  const [privacy, setPrivacy] = useState<'PUBLIC' | 'BUSY_ONLY' | 'PRIVATE'>('PUBLIC');
  const [submitting, setSubmitting] = useState(false);

  // Active meeting modal from calendar
  const [activeCallRoom, setActiveCallRoom] = useState<{ id: string; title: string } | null>(null);

  const fetchCalendar = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (meRes.ok) {
        const meData = await meRes.json();
        setCurrentUser(meData.user);
      }

      const wsRes = await fetch(`/api/workspaces/${workspaceId}`);
      if (wsRes.ok) {
        const wsData = await wsRes.json();
        setMembers(wsData.members || []);
      }

      const calRes = await fetch(`/api/calendar?workspaceId=${workspaceId}`);
      if (calRes.ok) {
        const calData = await calRes.json();
        setEvents(calData.events || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [workspaceId]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);

    try {
      const startDateTime = new Date(`${dateStr}T${startTime}:00`).toISOString();
      const endDateTime = new Date(`${dateStr}T${endTime}:00`).toISOString();

      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          title: title.trim(),
          description: description.trim(),
          startTime: startDateTime,
          endTime: endDateTime,
          location: location.trim(),
          createVideoMeeting,
          privacy
        })
      });

      if (res.ok) {
        setShowCreateModal(false);
        setTitle('');
        setDescription('');
        setLocation('');
        fetchCalendar();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-main)]">
        <div className="text-xs font-semibold text-[var(--text-muted)] animate-pulse">
          Loading calendar...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full flex flex-col bg-[var(--bg-main)] text-[var(--text-primary)] overflow-y-auto">
      {/* CALENDAR HEADER */}
      <header className="h-16 px-6 border-b border-[var(--border-color)] glass-panel flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm">Team Schedule & Calendar</h1>
            <p className="text-[10px] text-[var(--text-muted)]">
              Coordinate team syncs and digital meetings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="flex rounded-xl bg-[var(--bg-elevated)] p-1 border border-[var(--border-subtle)] text-xs">
            {(['MONTH', 'WEEK', 'DAY'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  viewMode === m
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 hover:opacity-95 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Event</span>
          </button>
        </div>
      </header>

      {/* TEAM AVAILABILITY BAR */}
      <div className="px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50">
        <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] block mb-2.5">
          Live Team Availability
        </span>
        <div className="flex flex-wrap gap-2.5">
          {members.map((m) => (
            <div
              key={m.userId}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-panel border border-[var(--border-subtle)] text-xs"
            >
              <div className="relative">
                <img
                  src={m.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={m.name}
                  className="w-5 h-5 rounded-lg object-cover"
                />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[var(--bg-surface)] ${
                    m.status === 'ONLINE'
                      ? 'bg-emerald-400'
                      : m.status === 'AWAY'
                      ? 'bg-amber-400'
                      : m.status === 'DND'
                      ? 'bg-red-400'
                      : 'bg-slate-400'
                  }`}
                />
              </div>
              <span className="font-semibold truncate max-w-[100px]">{m.name?.split(' ')[0]}</span>
              <span className="text-[10px] text-[var(--text-muted)]">
                {m.status === 'ONLINE' ? 'Available' : m.status === 'DND' ? 'In Meeting' : m.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* SCHEDULED EVENTS LIST */}
      <div className="p-6 max-w-5xl">
        <h2 className="text-base font-bold mb-4 flex items-center gap-2">
          <span>Upcoming Events & Syncs</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400">
            {events.length}
          </span>
        </h2>

        {events.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl text-center border border-[var(--border-color)]">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 mx-auto flex items-center justify-center mb-3">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm">Your schedule is clear</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1 mb-4">
              Schedule your first team sync or architecture review.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
            >
              Schedule Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((evt) => {
              const start = new Date(evt.startTime);
              const end = new Date(evt.endTime);

              return (
                <div
                  key={evt.id}
                  className="glass-panel rounded-3xl p-5 border border-[var(--border-color)] hover:border-indigo-500/40 hover:shadow-lg transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-400 border border-purple-500/30">
                          {evt.privacy || 'PUBLIC'}
                        </span>
                        {evt.videoMeetingId && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <Video className="w-3 h-3" />
                            <span>Video Room</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">
                        {start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <h3 className="font-bold text-base mb-1 text-[var(--text-primary)]">
                      {evt.title}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mb-4 line-clamp-2">
                      {evt.description || 'Sprint sync and team collaboration session.'}
                    </p>
                  </div>

                  <div>
                    <div className="space-y-1.5 text-xs text-[var(--text-muted)] border-t border-[var(--border-subtle)] pt-3 mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <span>
                          {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {evt.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-amber-400" />
                          <span>{evt.location}</span>
                        </div>
                      )}
                    </div>

                    {evt.videoMeetingId ? (
                      <button
                        onClick={() =>
                          setActiveCallRoom({
                            id: evt.videoMeetingId,
                            title: evt.title
                          })
                        }
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 hover:opacity-95"
                      >
                        <Video className="w-4 h-4" />
                        <span>Join Video Meeting</span>
                      </button>
                    ) : (
                      <div className="text-center text-[11px] text-[var(--text-muted)] py-1">
                        In-person / Standup event
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Schedule Event */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-lg p-6 rounded-3xl border border-[var(--border-color)] shadow-2xl relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-5 right-5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Schedule an Event</h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Add team reviews, demos, or recurring syncs.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Design Sprint & Architecture Demo"
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                    Start
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                    End
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Reviewing Figma components and WebSockets real-time sync."
                  className="w-full px-4 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs focus:outline-none"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Video className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-xs font-bold block">Generate Video Meeting</span>
                    <span className="text-[10px] text-[var(--text-muted)] block">
                      Creates a dedicated 1-click video call room for participants.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={createVideoMeeting}
                  onChange={(e) => setCreateVideoMeeting(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
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
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 hover:opacity-95"
                >
                  {submitting ? 'Scheduling...' : 'Confirm Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Meeting Modal triggered from calendar */}
      {activeCallRoom && (
        <VideoMeetingModal
          roomId={activeCallRoom.id}
          roomTitle={activeCallRoom.title}
          currentUser={currentUser}
          onClose={() => setActiveCallRoom(null)}
        />
      )}
    </div>
  );
}
