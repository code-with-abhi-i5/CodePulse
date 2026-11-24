import React from 'react';
import Link from 'next/link';
import { ArrowLeft, History, Swords } from 'lucide-react';
import { ReplayPlayer } from '@/components/battles/replay-player';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Match Time-Travel Replay — CodePulse',
  description: 'Deterministic 5-second snapshot & delta replay engine with variable playback speeds',
};

export default async function BattleReplayPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  const battleId = resolvedParams.id;

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/battles">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              Back to Battles
            </Button>
          </Link>
          <div className="h-4 w-px bg-border" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <History className="w-6 h-6 text-primary" />
              Battle Time-Travel Replay
            </h1>
            <p className="text-sm text-muted-foreground">
              Deterministic 5-second snapshot reconstruction and millisecond scrubber with key match moments
            </p>
          </div>
        </div>
      </div>

      <ReplayPlayer battleId={battleId} />
    </div>
  );
}

