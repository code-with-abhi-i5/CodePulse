"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Trophy,
  Activity,
  Brain,
  Share2,
  TrendingUp,
  Crown,
  Award,
  Sparkles,
  Volume2,
  VolumeX,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { triggerDualCannonConfetti, playVictorySound } from "@/lib/celebration";

interface DevData {
  username: string;
  name: string;
  avatar: string;
  score: number;
  stats: any;
  topLanguages: any[];
}

interface BattleReportProps {
  player1: DevData;
  player2: DevData;
  battleType: string;
  onRematch: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export function BattleReport({
  player1,
  player2,
  battleType,
  onRematch,
  isMuted: initialIsMuted = false,
  onToggleMute,
}: BattleReportProps) {
  const [internalMuted, setInternalMuted] = useState(initialIsMuted);
  const [copied, setCopied] = useState(false);

  // Sync mute state if parent passes it
  useEffect(() => {
    setInternalMuted(initialIsMuted);
  }, [initialIsMuted]);

  // Score calculation for final report
  const calculateScore = (stats: any) =>
    (stats.totalCommits || 0) * 1 +
    (stats.totalPRs || 0) * 5 +
    (stats.totalStars || 0) * 10 +
    (stats.followers || 0) * 2 +
    (stats.streak || 0) * 5;

  const p1Score = calculateScore(player1.stats);
  const p2Score = calculateScore(player2.stats);

  const p1Wins = p1Score >= p2Score;
  const winner = p1Wins ? player1 : player2;
  const loser = p1Wins ? player2 : player1;
  const winnerScore = Math.max(p1Score, p2Score);
  const loserScore = Math.min(p1Score, p2Score);
  const scoreDiff = winnerScore - loserScore;
  const totalPoints = winnerScore + loserScore;
  const winPercent = totalPoints > 0 ? ((winnerScore / totalPoints) * 100).toFixed(1) : "50.0";

  // Trigger celebration on mount
  useEffect(() => {
    // 1. Dual-cannon confetti
    triggerDualCannonConfetti();

    // 2. Victory sound effect
    playVictorySound(internalMuted);
  }, []);

  const handleToggleMute = () => {
    if (onToggleMute) {
      onToggleMute();
    } else {
      setInternalMuted((prev) => !prev);
    }
  };

  const handleCelebrateAgain = () => {
    triggerDualCannonConfetti();
    playVictorySound(internalMuted);
    toast.success("Celebration unleashed! 🎉", {
      description: `Victory to ${winner.name}!`,
    });
  };

  const handleShare = async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const p1User = player1.username || player1.name;
    const p2User = player2.username || player2.name;
    const winnerUser = winner.username || winner.name;
    const shareUrl = `${origin}/battles?p1=${encodeURIComponent(p1User)}&p2=${encodeURIComponent(p2User)}&winner=${encodeURIComponent(winnerUser)}`;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2500);

      toast.success("Battle result copied to clipboard!", {
        description: `${player1.name} vs ${player2.name} — Winner: ${winner.name} (+${scoreDiff} pts)`,
      });
    } catch {
      toast.error("Failed to copy URL to clipboard.");
    }
  };

  // Filter helpers
  const isOverall = battleType === "Overall Battle" || battleType === "AI Battle";
  const isRepo = battleType === "Repository Battle" || battleType === "Open Source Impact";
  const isActivity = battleType === "Activity Battle";
  const isLanguage = battleType === "Language Battle";

  // Dynamic Advantage & AI Analysis
  let biggestAdvantage = "Consistency";
  if (winner.stats.totalStars > loser.stats.totalStars && winner.stats.totalStars - loser.stats.totalStars > 100) {
    biggestAdvantage = "Open Source Impact";
  } else if (winner.stats.totalPRs > loser.stats.totalPRs && winner.stats.totalPRs - loser.stats.totalPRs > 20) {
    biggestAdvantage = "Collaboration";
  } else if (winner.stats.totalCommits > loser.stats.totalCommits) {
    biggestAdvantage = "Raw Output";
  }

  const aiAnalysis = `Developer ${winner.name} secured the victory primarily due to their superior ${biggestAdvantage.toLowerCase()}. While ${loser.name} put up a strong fight, ${winner.name}'s impressive metrics generated a solid ${scoreDiff} point advantage that was insurmountable.`;

  // Dynamic Tags
  const earnedTags = [];
  if (winner.stats.totalStars > 500) earnedTags.push("⭐ Open Source King");
  if (winner.stats.streak > 7) earnedTags.push("⚡ Consistency Champion");
  if (winner.stats.totalCommits > 1000) earnedTags.push("💻 Code Machine");
  if (earnedTags.length === 0) earnedTags.push("🚀 Rising Developer");

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-1000">
      {/* 4. Final Battle Result (Top Card) */}
      <div className="bg-card/50 backdrop-blur-xl border border-border rounded-3xl p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-amber-500 to-destructive" />

        {/* Header Controls: Status Badge + Sound Toggle + Replay */}
        <div className="flex items-center justify-between mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold">
            <Trophy className="w-4 h-4 text-amber-400" /> Battle Completed
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleMute}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background/60 hover:bg-accent text-xs font-medium transition-colors"
              title={internalMuted ? "Unmute sound effects" : "Mute sound effects"}
              aria-label={internalMuted ? "Unmute sound effects" : "Mute sound effects"}
            >
              {internalMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Sound Muted</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-foreground">Sound On</span>
                </>
              )}
            </button>

            <button
              onClick={handleCelebrateAgain}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-semibold text-amber-400 transition-colors"
              title="Trigger victory celebration again"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Celebrate</span>
            </button>
          </div>
        </div>

        {/* Player Comparison Card */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Player 1 */}
          <div className={cn("flex flex-col items-center flex-1 transition-all", !p1Wins && "opacity-60 grayscale")}>
            <div className="relative">
              <img
                src={player1.avatar}
                alt={player1.name}
                className={cn(
                  "w-32 h-32 rounded-2xl border-4 mb-4 object-cover transition-transform",
                  p1Wins ? "border-amber-400 shadow-xl shadow-amber-500/20 scale-105" : "border-border"
                )}
              />
              {p1Wins && (
                <div
                  className="absolute -top-4 -right-4 w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center border-4 border-background shadow-xl text-black animate-bounce"
                  title="Winner Crown"
                >
                  <Crown className="w-6 h-6 fill-current" />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">{player1.name}</h2>
              {p1Wins && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/30 text-xs font-black">
                  WINNER
                </span>
              )}
            </div>

            <div className="text-4xl font-black text-primary mt-2">{p1Score}</div>
            <div className="text-xs text-muted-foreground mt-1">@{player1.username}</div>
          </div>

          {/* VS Divider */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <div className="text-5xl font-black italic text-muted-foreground/30">VS</div>
            <div className="mt-4 text-center">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Score Difference</div>
              <div className="text-xl font-bold text-foreground">+{scoreDiff} points</div>
            </div>
          </div>

          {/* Player 2 */}
          <div className={cn("flex flex-col items-center flex-1 transition-all", p1Wins && "opacity-60 grayscale")}>
            <div className="relative">
              <img
                src={player2.avatar}
                alt={player2.name}
                className={cn(
                  "w-32 h-32 rounded-2xl border-4 mb-4 object-cover transition-transform",
                  !p1Wins ? "border-amber-400 shadow-xl shadow-amber-500/20 scale-105" : "border-border"
                )}
              />
              {!p1Wins && (
                <div
                  className="absolute -top-4 -right-4 w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center border-4 border-background shadow-xl text-black animate-bounce"
                  title="Winner Crown"
                >
                  <Crown className="w-6 h-6 fill-current" />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">{player2.name}</h2>
              {!p1Wins && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/30 text-xs font-black">
                  WINNER
                </span>
              )}
            </div>

            <div className="text-4xl font-black text-destructive mt-2">{p2Score}</div>
            <div className="text-xs text-muted-foreground mt-1">@{player2.username}</div>
          </div>
        </div>
      </div>

      {/* 5. Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard icon={Trophy} label="Winner" value={winner.name} color="text-amber-400" />
        <SummaryCard icon={TrendingUp} label="Biggest Advantage" value={biggestAdvantage} color="text-emerald-400" />
        <SummaryCard
          icon={Activity}
          label="Most Active"
          value={p1Score > p2Score ? player1.name : player2.name}
          color="text-blue-400"
        />
        <SummaryCard icon={Brain} label="AI Confidence" value={`${winPercent}%`} color="text-purple-400" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* 6. AI Battle Analysis */}
        <div className="md:col-span-2 bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-bold">AI Battle Analysis</h3>
          </div>
          <p className="text-muted-foreground leading-relaxed">{aiAnalysis}</p>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">Key Strength</div>
              <div className="font-medium text-emerald-100">{biggestAdvantage}</div>
            </div>
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
              <div className="text-xs font-semibold text-destructive uppercase tracking-wider mb-1">Critical Weakness</div>
              <div className="font-medium text-red-100">Community Engagement</div>
            </div>
          </div>
        </div>

        {/* 11. Achievement Tags */}
        <div className="bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold">Earned Titles</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {earnedTags.map((tag) => (
              <span key={tag} className="px-3 py-1.5 rounded-lg bg-background border border-border text-xs font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 7. Head-to-Head Comparison */}
      <div className="bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-6 overflow-x-auto">
        <h3 className="text-lg font-bold mb-6">Head-to-Head Stats</h3>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border text-muted-foreground text-sm">
              <th className="pb-3 font-medium">Metric</th>
              <th className="pb-3 font-medium text-right">{player1.name}</th>
              <th className="pb-3 font-medium text-right">{player2.name}</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {isOverall && <CompareRow label="Followers" v1={player1.stats?.followers || 0} v2={player2.stats?.followers || 0} />}
            {(isOverall || isRepo) && (
              <CompareRow label="Repositories" v1={player1.stats?.repos || 0} v2={player2.stats?.repos || 0} />
            )}
            {(isOverall || isActivity || isLanguage) && (
              <CompareRow label="Commits" v1={player1.stats?.totalCommits || 0} v2={player2.stats?.totalCommits || 0} />
            )}
            {(isOverall || isActivity || isRepo) && (
              <CompareRow label="Pull Requests" v1={player1.stats?.totalPRs || 0} v2={player2.stats?.totalPRs || 0} />
            )}
            {(isOverall || isActivity || isRepo) && (
              <CompareRow label="Issues" v1={player1.stats?.totalIssues || 0} v2={player2.stats?.totalIssues || 0} />
            )}
            {(isOverall || isRepo) && (
              <CompareRow label="Stars" v1={player1.stats?.totalStars || 0} v2={player2.stats?.totalStars || 0} />
            )}
            {(isOverall || isActivity) && (
              <CompareRow label="Streak" v1={player1.stats?.streak || 0} v2={player2.stats?.streak || 0} />
            )}
            {(isOverall || isLanguage) && (
              <CompareRow
                label="Unique Languages"
                v1={player1.topLanguages?.length || 0}
                v2={player2.topLanguages?.length || 0}
              />
            )}
          </tbody>
        </table>
      </div>

      {/* 13. Share & Rematch Action Controls */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-4 pb-8">
        <button
          onClick={handleShare}
          className="px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
          aria-label="Share Battle Result"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
          <span>{copied ? "URL Copied!" : "Share Battle Result"}</span>
        </button>

        <button
          onClick={handleCelebrateAgain}
          className="px-5 py-3 rounded-xl bg-card border border-border hover:bg-accent font-medium flex items-center gap-2 transition-colors hover:scale-[1.02] active:scale-[0.98]"
          title="Re-run victory confetti and sound effects"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Celebrate Again</span>
        </button>

        <button
          onClick={onRematch}
          className="px-8 py-3 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          Rematch
        </button>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-4 flex flex-col items-center justify-center text-center">
      <Icon className={cn("w-6 h-6 mb-2", color)} />
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-lg font-bold mt-1 text-foreground">{value}</div>
    </div>
  );
}

function CompareRow({ label, v1, v2 }: { label: string; v1: number; v2: number }) {
  const p1Wins = v1 >= v2;
  const p2Wins = v2 >= v1;
  return (
    <tr className="border-b border-border/50 hover:bg-white/5 transition-colors">
      <td className="py-3 text-muted-foreground">{label}</td>
      <td className={cn("py-3 text-right font-medium", p1Wins ? "text-primary" : "text-muted-foreground")}>{v1}</td>
      <td className={cn("py-3 text-right font-medium", p2Wins ? "text-destructive" : "text-muted-foreground")}>{v2}</td>
    </tr>
  );
}
