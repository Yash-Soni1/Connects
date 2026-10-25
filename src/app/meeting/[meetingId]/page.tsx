'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { VideoMeetingModal } from '@/components/video-meeting-modal';
import { SocketProvider } from '@/components/socket-provider';

export const dynamic = 'force-dynamic';

export default function MeetingRoomPage({
  params
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const resolvedParams = use(params);
  const { meetingId } = resolvedParams;
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
        } else {
          router.push(`/login?redirect=/meeting/${meetingId}`);
        }
      } catch {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [meetingId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-xs font-semibold">
        Connecting to video meeting room...
      </div>
    );
  }

  return (
    <SocketProvider currentUser={currentUser}>
      <VideoMeetingModal
        roomId={meetingId}
        roomTitle={`Meeting Room: ${meetingId}`}
        currentUser={currentUser}
        onClose={() => router.push('/dashboard')}
      />
    </SocketProvider>
  );
}
