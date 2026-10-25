'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Hash, MessageSquare, Users, X, ArrowRight } from 'lucide-react';

interface SearchModalProps {
  workspaceId: string;
  onClose: () => void;
}

export function SearchModal({ workspaceId, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ channels: any[]; members: any[]; messages: any[] }>({
    channels: [],
    members: [],
    messages: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ channels: [], members: [], messages: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?workspaceId=${workspaceId}&q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, workspaceId]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-xl p-5 rounded-3xl border border-[var(--border-color)] shadow-2xl relative">
        <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-subtle)]">
          <Search className="w-5 h-5 text-indigo-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search channels, members, or messages..."
            className="flex-1 bg-transparent text-sm focus:outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)]"
          />
          <button onClick={onClose} className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 max-h-[360px] overflow-y-auto space-y-4 pr-1">
          {loading && <div className="text-center py-6 text-xs text-[var(--text-muted)]">Searching...</div>}

          {!loading && query && results.channels.length === 0 && results.members.length === 0 && results.messages.length === 0 && (
            <div className="text-center py-8 text-xs text-[var(--text-muted)]">
              No results found for &quot;{query}&quot;
            </div>
          )}

          {/* Channels */}
          {results.channels.length > 0 && (
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] block mb-2">
                Channels
              </span>
              <div className="space-y-1">
                {results.channels.map((c) => (
                  <Link
                    key={c.id}
                    href={`/workspace/${workspaceId}/channel/${c.id}`}
                    onClick={onClose}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[var(--bg-elevated)] transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-semibold">{c.name}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:translate-x-1 transition-transform" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Members */}
          {results.members.length > 0 && (
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] block mb-2">
                Members
              </span>
              <div className="space-y-1">
                {results.members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-[var(--bg-elevated)] transition-colors"
                  >
                    <img src={m.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} className="w-7 h-7 rounded-xl object-cover" />
                    <div>
                      <div className="text-xs font-semibold">{m.name}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">{m.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {results.messages.length > 0 && (
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] block mb-2">
                Messages
              </span>
              <div className="space-y-1.5">
                {results.messages.map((m) => (
                  <Link
                    key={m.id}
                    href={m.channelId ? `/workspace/${workspaceId}/channel/${m.channelId}` : '#'}
                    onClick={onClose}
                    className="block p-3 rounded-xl bg-[var(--bg-elevated)] hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-indigo-400">{m.senderName}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                      {m.content}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
