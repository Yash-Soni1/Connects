'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import {
  Hash,
  Lock,
  Video,
  Send,
  Smile,
  Paperclip,
  Reply,
  Edit2,
  Trash2,
  Users,
  Sparkles,
  PhoneCall,
  Check,
  X
} from 'lucide-react';
import { useSocket } from '@/components/socket-provider';
import { VideoMeetingModal } from '@/components/video-meeting-modal';

export const dynamic = 'force-dynamic';

const EMOJI_OPTIONS = ['👍', '❤️', '🚀', '🔥', '👀', '🎉', '💯'];

export default function ChannelPage({
  params
}: {
  params: Promise<{ workspaceId: string; channelId: string }>;
}) {
  const resolvedParams = use(params);
  const { workspaceId, channelId } = resolvedParams;

  const { socket, joinChannel, leaveChannel, sendTyping, emitNewMessage, emitReaction } = useSocket();

  const [channel, setChannel] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [channelMembers, setChannelMembers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeMeeting, setActiveMeeting] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Message composer
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<any>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null); // messageId or 'composer'

  // Typing state
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Video call modal
  const [showVideoModal, setShowVideoModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initial load
  useEffect(() => {
    async function loadData() {
      try {
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const meData = await meRes.json();
          setCurrentUser(meData.user);
        }

        const chRes = await fetch(`/api/channels/${channelId}`);
        if (chRes.ok) {
          const chData = await chRes.json();
          setChannel(chData.channel);
          setChannelMembers(chData.members || []);
          setActiveMeeting(chData.activeMeeting || null);
        }

        const msgRes = await fetch(`/api/channels/${channelId}/messages`);
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
  }, [channelId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Real-time socket channel subscription
  useEffect(() => {
    if (!socket || !channelId) return;

    joinChannel(channelId);

    const handleNewMessage = (newMsg: any) => {
      if (newMsg.channelId === channelId) {
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

    const handleMessageEdit = (editedMsg: any) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === editedMsg.id ? { ...m, content: editedMsg.content, isEdited: 1 } : m))
      );
    };

    const handleMessageDelete = ({ messageId }: { messageId: string }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    };

    const handleTyping = ({ roomId, user, isTyping }: any) => {
      if (roomId === channelId && user?.id !== currentUser?.id) {
        setTypingUsers((prev) => {
          if (isTyping) {
            if (prev.includes(user.name)) return prev;
            return [...prev, user.name];
          } else {
            return prev.filter((name) => name !== user.name);
          }
        });
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('reaction:update', handleReaction);
    socket.on('message:edited', handleMessageEdit);
    socket.on('message:deleted', handleMessageDelete);
    socket.on('typing:update', handleTyping);

    return () => {
      leaveChannel(channelId);
      socket.off('message:new', handleNewMessage);
      socket.off('reaction:update', handleReaction);
      socket.off('message:edited', handleMessageEdit);
      socket.off('message:deleted', handleMessageDelete);
      socket.off('typing:update', handleTyping);
    };
  }, [socket, channelId, currentUser?.id]);

  // Handle typing input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    if (!currentUser) return;

    sendTyping('channel', channelId, currentUser, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping('channel', channelId, currentUser, false);
    }, 1500);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !currentUser) return;

    const messageContent = text.trim();
    setText('');
    const currentReply = replyTo;
    setReplyTo(null);
    sendTyping('channel', channelId, currentUser, false);

    try {
      const res = await fetch(`/api/channels/${channelId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: messageContent,
          replyToId: currentReply?.id || null
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Optimistic dispatch via socket
        emitNewMessage('channel', channelId, data.message);
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
        emitReaction('channel', channelId, data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!editContent.trim()) return;
    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        socket?.emit('message:update', { roomType: 'channel', roomId: channelId, message: data.message });
        setEditingMessageId(null);
        setEditContent('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        socket?.emit('message:remove', { roomType: 'channel', roomId: channelId, messageId });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartCall = async () => {
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          channelId,
          title: `#${channel?.name || 'general'} Video Meeting`
        })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveMeeting(data.meeting);
        setShowVideoModal(true);
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

  const onlineMembersCount = channelMembers.filter((m) => m.status === 'ONLINE').length;

  return (
    <div className="flex-1 h-full flex flex-col bg-[var(--bg-main)] text-[var(--text-primary)] relative">
      {/* CHANNEL TOP HEADER */}
      <header className="h-14 px-6 border-b border-[var(--border-color)] glass-panel flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3 truncate">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0">
            {channel?.isPrivate ? <Lock className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm text-[var(--text-primary)] truncate">
                {channel?.name}
              </h1>
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {onlineMembersCount} Online
              </span>
            </div>
            {channel?.topic && (
              <p className="text-[11px] text-[var(--text-secondary)] truncate">
                {channel?.topic}
              </p>
            )}
          </div>
        </div>

        {/* Video Call Trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={activeMeeting ? () => setShowVideoModal(true) : handleStartCall}
            className={`px-3.5 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all ${
              activeMeeting
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 animate-soft-pulse'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>{activeMeeting ? 'Join Live Call' : 'Start Video Call'}</span>
          </button>
        </div>
      </header>

      {/* ACTIVE CALL FLOATING BANNER */}
      {activeMeeting && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/30 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-400 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold">Live video meeting is active in this channel</span>
          </div>
          <button
            onClick={() => setShowVideoModal(true)}
            className="px-3 py-1 rounded-lg bg-emerald-500 text-white font-bold text-[11px] hover:bg-emerald-400 transition-colors"
          >
            Join Call
          </button>
        </div>
      )}

      {/* MESSAGES FEED */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
              <Hash className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-base">This is the start of #{channel?.name}</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm">
              Send a message or drop an attachment to get the conversation going.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isEditing = editingMessageId === msg.id;
            const isSender = currentUser?.id === msg.senderId;

            // Group reactions by emoji
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
                {/* Avatar */}
                <img
                  src={msg.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={msg.senderName}
                  className="w-9 h-9 rounded-xl object-cover shrink-0 ring-1 ring-[var(--border-subtle)]"
                />

                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-xs text-[var(--text-primary)]">
                      {msg.senderName}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.isEdited === 1 && (
                      <span className="text-[10px] text-[var(--text-muted)] italic">(edited)</span>
                    )}
                  </div>

                  {/* Reply preview if replying */}
                  {msg.replyContent && (
                    <div className="my-1 pl-2 border-l-2 border-indigo-500/50 text-[11px] text-[var(--text-muted)] truncate">
                      <span className="font-medium text-indigo-400">@{msg.replySenderName}: </span>
                      {msg.replyContent}
                    </div>
                  )}

                  {/* Message Content */}
                  {isEditing ? (
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-indigo-500 text-xs focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveEdit(msg.id)}
                        className="p-1.5 rounded-lg bg-indigo-600 text-white text-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingMessageId(null)}
                        className="p-1.5 rounded-lg bg-[var(--bg-surface)] text-[var(--text-muted)] text-xs"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5 whitespace-pre-wrap leading-relaxed select-text">
                      {msg.content}
                    </p>
                  )}

                  {/* Reactions Pill Display */}
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

                {/* Hover Quick Actions Bar */}
                <div className="absolute right-3 top-2 opacity-0 group-hover:opacity-100 transition-opacity glass-panel rounded-xl p-1 border border-[var(--border-color)] shadow-md flex items-center gap-1">
                  {/* Emoji fast picker */}
                  <div className="relative">
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

                  <button
                    onClick={() => setReplyTo(msg)}
                    className="p-1 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-indigo-400"
                    title="Reply in thread"
                  >
                    <Reply className="w-3.5 h-3.5" />
                  </button>

                  {isSender && (
                    <button
                      onClick={() => {
                        setEditingMessageId(msg.id);
                        setEditContent(msg.content);
                      }}
                      className="p-1 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-purple-400"
                      title="Edit message"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {(isSender || channelMembers.some((m) => m.id === currentUser?.id && m.role !== 'MEMBER')) && (
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="p-1 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-red-400"
                      title="Delete message"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* TYPING INDICATOR */}
      {typingUsers.length > 0 && (
        <div className="px-6 py-1 text-[11px] text-indigo-400 font-medium flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
          <span>
            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </span>
        </div>
      )}

      {/* MESSAGE COMPOSER */}
      <div className="px-6 pb-6 pt-1">
        {/* Reply Preview Bar */}
        {replyTo && (
          <div className="mb-2 px-3 py-1.5 rounded-xl bg-[var(--bg-elevated)] border border-indigo-500/30 flex items-center justify-between text-xs text-[var(--text-muted)]">
            <div className="flex items-center gap-2 truncate">
              <Reply className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                Replying to <span className="font-semibold text-indigo-400">@{replyTo.senderName}</span>
              </span>
            </div>
            <button onClick={() => setReplyTo(null)} className="hover:text-[var(--text-primary)]">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <form
          onSubmit={handleSendMessage}
          className="glass-panel rounded-2xl p-2.5 border border-[var(--border-color)] shadow-xl flex items-center gap-2"
        >
          {/* Quick Reaction / Emoji Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(showEmojiPicker === 'composer' ? null : 'composer')}
              className="p-2 rounded-xl text-[var(--text-muted)] hover:text-amber-400 hover:bg-white/5 transition-colors"
              title="Add Emoji"
            >
              <Smile className="w-4 h-4" />
            </button>

            {showEmojiPicker === 'composer' && (
              <div className="absolute left-0 bottom-12 z-30 glass-panel rounded-2xl p-2 shadow-2xl border border-[var(--border-color)] flex gap-1.5">
                {EMOJI_OPTIONS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => {
                      setText((prev) => prev + em);
                      setShowEmojiPicker(null);
                    }}
                    className="p-1.5 text-base hover:scale-125 transition-transform"
                  >
                    {em}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input Field */}
          <input
            type="text"
            value={text}
            onChange={handleInputChange}
            placeholder={`Message #${channel?.name || 'channel'}...`}
            className="flex-1 bg-transparent text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
          />

          {/* Send Button */}
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
          roomId={activeMeeting?.roomCode || `channel-${channelId}`}
          roomTitle={`#${channel?.name || 'general'} Video Meeting`}
          currentUser={currentUser}
          onClose={() => setShowVideoModal(false)}
        />
      )}
    </div>
  );
}
