'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function WorkspaceIndexPage({
  params
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  useEffect(() => {
    async function redirect() {
      try {
        const res = await fetch(`/api/workspaces/${resolvedParams.workspaceId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.channels && data.channels.length > 0) {
            router.replace(`/workspace/${resolvedParams.workspaceId}/channel/${data.channels[0].id}`);
            return;
          }
        }
      } catch (err) {
        console.error(err);
      }
      router.replace('/dashboard');
    }
    redirect();
  }, [resolvedParams.workspaceId, router]);

  return null;
}
