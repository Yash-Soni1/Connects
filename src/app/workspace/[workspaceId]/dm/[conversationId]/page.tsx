'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import {
  Video,
  Send,
  Smile,
  Reply,
  Edit2,
  Trash2,
  Check,
  X,
  PhoneCall
} from 'lucide-react';
import { useSocket } from '@/components/socket-provider';
import { VideoMeetingModal } from '@/components/video-meeting-modal';

export const dynamic = 'force-dynamic';

const EMOJI_OPTIONS = ['👍', '❤️', '🚀', '🔥', '👀', '🎉', '💯'];

export default function DMPage({
  params
}: {
  params: Promise<{ workspaceId: string; conversationId: string }>;
}) {
  const resolvedParams = use(params);
  const { workspaceId, conversationId } = resolvedParams;

  const { socket, joinDM, leaveDM, sendTyping, emitNewMessage, emitReaction } = useSocket();

  const [dm, setDm] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeMeeting, setActiveMeeting] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Composer
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<any>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);

  // Typing state
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Video call
  const [showVideoModal, setShowVideoModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const meData = await meRes.json();
          setCurrentUser(meData.user);
        }

        const dmRes = await fetch(`/api/dms/${conversationId}`);
        if (dmRes.ok) {
          const dmData = await dmRes.json();
          setDm(dmData.dm);
          setOtherUser(dmData.otherUser);
          setActiveMeeting(dmData.activeMeeting || null);
        }

        const msgRes = await fetch(`/api/dms/${conversationId}/messages`);
        if (msgRes.ok) {
          const msgData = await msgRes.json();
          setMessages(msgData.messages || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Real-time DM socket subscription
  useEffect(() => {
    if (!socket || !conversationId) return;

    joinDM(conversationId);

    const handleNewMessage = (newMsg: any) => {
      if (newMsg.directMessageId === conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
    };

    const handleReaction = (rxData: any) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== rxData.messageId) return msg;
          const reactions = [...(msg.reactions || [])];
          if (rxData.added) {
            reactions.push({
              id: rxData.id,
              messageId: rxData.messageId,
              userId: rxData.userId,
              emoji: rxData.emoji,
              userName: rxData.userName
            });
          } else {
            const idx = reactions.findIndex((r) => r.userId === rxData.userId && r.emoji === rxData.emoji);
            if (idx !== -1) reactions.splice(idx, 1);
          }
          return { ...msg, reactions };
        })
      );
    };

    const handleTyping = ({ roomId, user, isTyping }: any) => {
      if (roomId === conversationId && user?.id !== currentUser?.id) {
        setIsOtherTyping(isTyping);
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('reaction:update', handleReaction);
    socket.on('typing:update', handleTyping);

    return () => {
      leaveDM(conversationId);
      socket.off('message:new', handleNewMessage);
      socket.off('reaction:update', handleReaction);
      socket.off('typing:update', handleTyping);
    };
  }, [socket, conversationId, currentUser?.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    if (!currentUser) return;

    sendTyping('dm', conversationId, currentUser, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping('dm', conversationId, currentUser, false);
    }, 1500);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !currentUser) return;

    const messageContent = text.trim();
    setText('');
    const currentReply = replyTo;
    setReplyTo(null);
    sendTyping('dm', conversationId, currentUser, false);

    try {
      const res = await fetch(`/api/dms/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: messageContent,
          replyToId: currentReply?.id || null
        })
      });

      if (res.ok) {
        const data = await res.json();
        emitNewMessage('dm', conversationId, data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji })
      });
      if (res.ok) {
        const data = await res.json();
        emitReaction('dm', conversationId, data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-main)]">
        <div className="text-xs font-semibold text-[var(--text-muted)] animate-pulse">
          Loading conversation...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full flex flex-col bg-[var(--bg-main)] text-[var(--text-primary)] relative">
      {/* HEADER */}
      <header className="h-14 px-6 border-b border-[var(--border-color)] glass-panel flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={otherUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={otherUser?.name}
              className="w-8 h-8 rounded-xl object-cover ring-1 ring-[var(--border-subtle)]"
            />
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[var(--bg-surface)] ${
                otherUser?.status === 'ONLINE' ? 'bg-emerald-400' : 'bg-slate-400'
              }`}
            />
          </div>
          <div>
            <h1 className="font-bold text-sm text-[var(--text-primary)]">
              {otherUser?.name}
            </h1>
            <p className="text-[10px] text-[var(--text-muted)]">
              {otherUser?.customStatus || otherUser?.bio || (otherUser?.status === 'ONLINE' ? 'Active Now' : 'Offline')}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowVideoModal(true)}
          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20"
        >
          <Video className="w-4 h-4" />
          <span>Call {otherUser?.name?.split(' ')[0]}</span>
        </button>
      </header>

      {/* MESSAGES FEED */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <img
              src={otherUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={otherUser?.name}
              className="w-16 h-16 rounded-2xl object-cover mb-3 ring-2 ring-indigo-500/30"
            />
            <h3 className="font-bold text-base">{otherUser?.name}</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm">
              This is the beginning of your direct message history with {otherUser?.name}.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSender = currentUser?.id === msg.senderId;
            const rxCounts: Record<string, { count: number; userIds: string[] }> = {};
            for (const rx of msg.reactions || []) {
              if (!rxCounts[rx.emoji]) rxCounts[rx.emoji] = { count: 0, userIds: [] };
              rxCounts[rx.emoji].count++;
              rxCounts[rx.emoji].userIds.push(rx.userId);
            }

            return (
              <div
                key={msg.id}
                className="group relative flex items-start gap-3 p-2 -mx-2 rounded-2xl hover:bg-[var(--bg-elevated)] transition-colors"
              >
                <img
                  src={msg.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={msg.senderName}
                  className="w-9 h-9 rounded-xl object-cover shrink-0 ring-1 ring-[var(--border-subtle)]"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-xs text-[var(--text-primary)]">
                      {msg.senderName}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] mt-0.5 whitespace-pre-wrap leading-relaxed select-text">
                    {msg.content}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {Object.entries(rxCounts).map(([emoji, data]) => {
                      const userReacted = currentUser && data.userIds.includes(currentUser.id);
                      return (
                        <button
                          key={emoji}
                          onClick={() => handleToggleReaction(msg.id, emoji)}
                          className={`px-2 py-0.5 rounded-full text-[11px] flex items-center gap-1 border transition-all ${
                            userReacted
                              ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400 font-bold'
                              : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-indigo-400'
                          }`}
                        >
                          <span>{emoji}</span>
                          <span>{data.count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Reaction Actions */}
                <div className="absolute right-3 top-2 opacity-0 group-hover:opacity-100 transition-opacity glass-panel rounded-xl p-1 border border-[var(--border-color)] shadow-md flex items-center gap-1">
                  <button
                    onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)}
                    className="p-1 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-amber-400"
                    title="Add reaction"
                  >
                    <Smile className="w-3.5 h-3.5" />
                  </button>

                  {showEmojiPicker === msg.id && (
                    <div className="absolute right-0 bottom-8 z-30 glass-panel rounded-2xl p-1.5 shadow-2xl border border-[var(--border-color)] flex gap-1">
                      {EMOJI_OPTIONS.map((em) => (
                        <button
                          key={em}
                          onClick={() => {
                            handleToggleReaction(msg.id, em);
                            setShowEmojiPicker(null);
                          }}
                          className="p-1.5 text-sm hover:scale-125 transition-transform"
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* TYPING INDICATOR */}
      {isOtherTyping && (
        <div className="px-6 py-1 text-[11px] text-indigo-400 font-medium flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
          <span>{otherUser?.name} is typing...</span>
        </div>
      )}

      {/* COMPOSER */}
      <div className="px-6 pb-6 pt-1">
        <form
          onSubmit={handleSendMessage}
          className="glass-panel rounded-2xl p-2.5 border border-[var(--border-color)] shadow-xl flex items-center gap-2"
        >
          <input
            type="text"
            value={text}
            onChange={handleInputChange}
            placeholder={`Message ${otherUser?.name || 'user'}...`}
            className="flex-1 bg-transparent text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
          />

          <button
            type="submit"
            disabled={!text.trim()}
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-all shadow-md shadow-indigo-600/30"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* VIDEO MEETING MODAL */}
      {showVideoModal && (
        <VideoMeetingModal
          roomId={`dm-${conversationId}`}
          roomTitle={`Call with ${otherUser?.name || 'Direct Message'}`}
          currentUser={currentUser}
          onClose={() => setShowVideoModal(false)}
        />
      )}
    </div>
  );
}
