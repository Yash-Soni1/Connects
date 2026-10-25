'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  PhoneOff,
  Maximize2,
  Minimize2,
  Users,
  MessageSquare,
  Sparkles,
  Volume2
} from 'lucide-react';
import { useSocket } from './socket-provider';

interface VideoMeetingModalProps {
  roomId: string;
  roomTitle: string;
  currentUser: any;
  onClose: () => void;
}

export function VideoMeetingModal({
  roomId,
  roomTitle,
  currentUser,
  onClose
}: VideoMeetingModalProps) {
  const { socket } = useSocket();

  const [audioMuted, setAudioMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Call duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  // Setup media stream
  useEffect(() => {
    let active = true;

    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn('Webcam/mic unavailable, creating synthetic canvas media stream:', err);
        // Fallback: create mock canvas video stream so testing works even without camera
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          let frame = 0;
          const draw = () => {
            if (!active) return;
            frame++;
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw simulated avatar & waveform
            ctx.fillStyle = '#6366f1';
            ctx.beginPath();
            ctx.arc(320, 160, 60, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = '24px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(currentUser?.name?.[0] || 'C', 320, 168);

            ctx.fillStyle = '#94a3b8';
            ctx.font = '14px sans-serif';
            ctx.fillText(`${currentUser?.name || 'User'} (Camera Active)`, 320, 260);

            requestAnimationFrame(draw);
          };
          draw();
          const mockStream = canvas.captureStream(30);
          localStreamRef.current = mockStream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = mockStream;
          }
        }
      }
    }

    initMedia();

    // Socket video meeting room handlers
    if (socket) {
      socket.emit('meeting:join', {
        roomId,
        user: currentUser,
        audioMuted: false,
        videoOff: false,
      });

      socket.on('meeting:existing-participants', (existing: any[]) => {
        setParticipants(existing);
      });

      socket.on('meeting:user-joined', (newParticipant: any) => {
        setParticipants((prev) => {
          if (prev.some((p) => p.socketId === newParticipant.socketId)) return prev;
          return [...prev, newParticipant];
        });
      });

      socket.on('meeting:user-left', ({ socketId }: { socketId: string }) => {
        setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
      });

      socket.on('meeting:participant-updated', ({ socketId, field, value }: any) => {
        setParticipants((prev) =>
          prev.map((p) => (p.socketId === socketId ? { ...p, [field]: value } : p))
        );
      });
    }

    return () => {
      active = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (socket) {
        socket.emit('meeting:leave', { roomId });
        socket.off('meeting:existing-participants');
        socket.off('meeting:user-joined');
        socket.off('meeting:user-left');
        socket.off('meeting:participant-updated');
      }
    };
  }, [roomId, socket, currentUser]);

  const toggleAudio = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = audioMuted));
    }
    const nextVal = !audioMuted;
    setAudioMuted(nextVal);
    socket?.emit('meeting:state-toggle', { roomId, field: 'audioMuted', value: nextVal });
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = videoOff));
    }
    const nextVal = !videoOff;
    setVideoOff(nextVal);
    socket?.emit('meeting:state-toggle', { roomId, field: 'videoOff', value: nextVal });
  };

  const toggleScreenShare = async () => {
    if (!screenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setScreenSharing(true);
        socket?.emit('meeting:state-toggle', { roomId, field: 'screenSharing', value: true });

        screenStream.getVideoTracks()[0].onended = () => {
          if (localStreamRef.current && localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
          setScreenSharing(false);
          socket?.emit('meeting:state-toggle', { roomId, field: 'screenSharing', value: false });
        };
      } catch (err) {
        console.warn('Screen share canceled or not permitted:', err);
      }
    } else {
      if (localStreamRef.current && localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      setScreenSharing(false);
      socket?.emit('meeting:state-toggle', { roomId, field: 'screenSharing', value: false });
    }
  };

  const totalInCall = participants.length + 1;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-fade-in text-white">
      {/* Meeting Header */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-white">{roomTitle}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live • {formatDuration(callDuration)}</span>
              <span>• {totalInCall} participant{totalInCall > 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs flex items-center gap-2 transition-colors shadow-lg shadow-red-600/30"
        >
          <PhoneOff className="w-4 h-4" />
          <span>Leave Call</span>
        </button>
      </div>

      {/* Video Grid */}
      <div className="flex-1 my-4 flex items-center justify-center">
        <div
          className={`w-full max-w-6xl h-full grid gap-4 items-center justify-center ${
            totalInCall === 1
              ? 'grid-cols-1 max-w-3xl max-h-[500px]'
              : totalInCall === 2
              ? 'grid-cols-1 md:grid-cols-2 max-h-[520px]'
              : 'grid-cols-2 md:grid-cols-3 max-h-[580px]'
          }`}
        >
          {/* Local User Tile */}
          <div className="relative w-full h-full min-h-[220px] rounded-3xl bg-slate-900 border-2 border-indigo-500/40 overflow-hidden shadow-2xl flex items-center justify-center">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${videoOff ? 'hidden' : 'block'}`}
            />
            {videoOff && (
              <div className="flex flex-col items-center gap-2">
                <div className="w-20 h-20 rounded-full bg-indigo-600 text-white font-bold text-2xl flex items-center justify-center shadow-lg">
                  {currentUser?.name?.[0] || 'U'}
                </div>
                <span className="text-xs text-slate-400 font-medium">Camera Off</span>
              </div>
            )}
            <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-xs font-semibold flex items-center gap-2">
              <span>{currentUser?.name} (You)</span>
              {audioMuted ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
            </div>
            {screenSharing && (
              <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-indigo-500 text-[10px] font-bold">
                Screen Sharing
              </span>
            )}
          </div>

          {/* Remote Participants */}
          {participants.map((p) => (
            <div
              key={p.socketId}
              className="relative w-full h-full min-h-[220px] rounded-3xl bg-slate-900 border border-white/10 overflow-hidden shadow-2xl flex items-center justify-center"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-2xl flex items-center justify-center shadow-lg">
                  {p.name?.[0] || 'P'}
                </div>
                <span className="text-xs text-slate-400 font-medium">Active Participant</span>
              </div>
              <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-xs font-semibold flex items-center gap-2">
                <span>{p.name}</span>
                {p.audioMuted ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex items-center justify-center gap-3 z-10">
        <button
          onClick={toggleAudio}
          className={`p-3.5 rounded-2xl transition-all ${
            audioMuted
              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
              : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          title={audioMuted ? 'Unmute Mic' : 'Mute Mic'}
        >
          {audioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <button
          onClick={toggleVideo}
          className={`p-3.5 rounded-2xl transition-all ${
            videoOff
              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
              : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          title={videoOff ? 'Turn Camera On' : 'Turn Camera Off'}
        >
          {videoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`p-3.5 rounded-2xl transition-all ${
            screenSharing
              ? 'bg-indigo-600 text-white border border-indigo-400 shadow-lg shadow-indigo-500/30'
              : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          title={screenSharing ? 'Stop Screen Share' : 'Share Screen'}
        >
          <Monitor className="w-5 h-5" />
        </button>

        <button
          onClick={onClose}
          className="p-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white transition-colors shadow-lg shadow-red-600/30"
          title="End Call"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
