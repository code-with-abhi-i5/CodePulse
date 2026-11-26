'use client';

import React from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  MessageSquare,
  Clock,
  Radio,
  Star,
  ShieldCheck,
  Award,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Mentor, LanguageMastery } from '@/services/mentorship';

export interface MentorCardProps {
  mentor: Mentor | {
    id?: string;
    username: string;
    name: string;
    role?: string;
    company?: string;
    avatarUrl: string;
    bio: string;
    similarityScore: number;
    matchingTech: string[];
    topLanguages?: LanguageMastery[];
    timezoneOffset?: string;
    experienceGap?: number;
    isAvailableNow?: boolean;
    rating?: number;
    sessionsCompleted?: number;
    availableSlots?: number;
  };
  onRequestMentorship?: (mentor: any) => void;
  onLaunchShadowCoding?: (mentor: any) => void;
  className?: string;
}

export const MentorCard: React.FC<MentorCardProps> = ({
  mentor,
  onRequestMentorship,
  onLaunchShadowCoding,
  className,
}) => {
  // Derive top 3 language mastery badges
  const topLanguages: LanguageMastery[] =
    mentor.topLanguages && mentor.topLanguages.length > 0
      ? mentor.topLanguages.slice(0, 3)
      : mentor.matchingTech.slice(0, 3).map((tech, idx) => ({
          name: tech,
          level: idx === 0 ? 'Master' : idx === 1 ? 'Expert' : 'Advanced',
          mastery: 95 - idx * 5,
        }));

  const timezone = mentor.timezoneOffset || 'UTC+0';
  const matchScore = mentor.similarityScore ?? 94;

  return (
    <motion.div
      data-testid={`mentor-card-${mentor.username}`}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'group relative rounded-2xl border border-white/10 bg-[#0B0F19]/90 backdrop-blur-xl p-5 sm:p-6 shadow-xl flex flex-col justify-between hover:border-indigo-500/40 transition-all text-slate-100 space-y-4 overflow-hidden',
        className
      )}
    >
      {/* Subtle background glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/15 transition-all" />

      <div className="space-y-4">
        {/* Card Header: Avatar, Name, and Synergy Pill */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <img
                src={mentor.avatarUrl}
                alt={mentor.name}
                className="w-13 h-13 rounded-full border border-white/15 object-cover shadow-md"
              />
              {mentor.isAvailableNow && (
                <span
                  data-testid={`available-pulse-${mentor.username}`}
                  className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0B0F19] ring-2 ring-emerald-500/40 animate-pulse"
                  title="Available for immediate pairing"
                />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-black text-white text-base leading-tight truncate">
                  {mentor.name}
                </h3>
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" title="Verified Senior Mentor" />
              </div>
              <div className="text-xs text-slate-400 font-mono truncate">
                @{mentor.username} {mentor.role ? `• ${mentor.role}` : ''}
              </div>
              {mentor.company && (
                <div className="text-[11px] text-slate-500 truncate">{mentor.company}</div>
              )}
            </div>
          </div>

          {/* '94% Match' Synergy Pill */}
          <div
            data-testid={`match-badge-${mentor.username}`}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-xs shrink-0 shadow-sm shadow-emerald-500/10 backdrop-blur-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>{matchScore}% Match</span>
          </div>
        </div>

        {/* Bio */}
        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
          {mentor.bio}
        </p>

        {/* Top 3 Language Mastery Badges */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            <span>Top Language Mastery</span>
            <span className="text-slate-500">Top 3</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {topLanguages.map((lang) => (
              <div
                key={lang.name}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/10 hover:border-indigo-400/30 text-xs font-mono transition-colors"
              >
                <Award className="w-3 h-3 text-amber-400" />
                <span className="text-slate-200 font-semibold">{lang.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-medium border border-indigo-500/30">
                  {lang.level} ({lang.mastery}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Timezone Offset & Meta Information */}
        <div className="flex items-center justify-between pt-1 text-xs text-slate-400 font-mono">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/10 text-cyan-300 text-[11px]">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span>Timezone: {timezone}</span>
          </div>

          {mentor.experienceGap !== undefined && (
            <span className="text-indigo-400 font-bold text-[11px]">
              +{mentor.experienceGap} yrs senior exp
            </span>
          )}
        </div>
      </div>

      {/* Footer Stats & Actions */}
      <div className="space-y-3 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="font-bold text-slate-200">{mentor.rating ?? 4.9}</span>
            <span>({mentor.sessionsCompleted ?? 25} sessions)</span>
          </div>
          {mentor.availableSlots !== undefined && (
            <span className="text-emerald-400 font-medium text-[11px]">
              {mentor.availableSlots} slot{mentor.availableSlots === 1 ? '' : 's'} open
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Request Mentorship Button */}
          <button
            type="button"
            data-testid={`request-mentor-btn-${mentor.username}`}
            onClick={() => onRequestMentorship?.(mentor)}
            className="py-2.5 px-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-white font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-sm shadow-indigo-500/10"
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
            <span>Request Mentorship</span>
          </button>

          {/* Shadow Code Button */}
          <button
            type="button"
            data-testid={`shadow-code-btn-${mentor.username}`}
            onClick={() => onLaunchShadowCoding?.(mentor)}
            className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>Shadow Code</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
