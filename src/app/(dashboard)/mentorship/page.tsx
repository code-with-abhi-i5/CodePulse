'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Sparkles,
  Users,
  Compass,
  Radio,
  X,
  Code2,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { MentorCard } from '@/components/cards/mentor-card';
import { RequestMentorshipModal } from '@/components/modals/request-mentorship-modal';
import { Mentor, INITIAL_MENTORS, fetchMentors } from '@/services/mentorship';

const TECH_FILTERS = ['All', 'Go', 'Rust', 'TypeScript', 'Python', 'C++'];

export default function MentorshipPage() {
  const [mentors, setMentors] = useState<Mentor[]>(INITIAL_MENTORS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [isLoading, setIsLoading] = useState(false);

  // Modals state
  const [requestModalMentor, setRequestModalMentor] = useState<Mentor | null>(null);
  const [shadowModalMentor, setShadowModalMentor] = useState<Mentor | null>(null);

  // Fetch mentors from API on mount
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchMentors({ search: searchQuery, language: selectedLanguage })
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          setMentors(data);
        }
      })
      .catch(() => {
        // Fallback already handled in fetchMentors
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter mentors locally for instant reactivity
  const filteredMentors = useMemo(() => {
    return mentors.filter((mentor) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        mentor.name.toLowerCase().includes(q) ||
        mentor.username.toLowerCase().includes(q) ||
        mentor.bio.toLowerCase().includes(q) ||
        mentor.matchingTech.some((tech) => tech.toLowerCase().includes(q));

      const matchesLanguage =
        selectedLanguage === 'All' ||
        mentor.topLanguages.some(
          (lang) => lang.name.toLowerCase() === selectedLanguage.toLowerCase()
        ) ||
        mentor.matchingTech.some(
          (tech) => tech.toLowerCase() === selectedLanguage.toLowerCase()
        );

      return matchesSearch && matchesLanguage;
    });
  }, [mentors, searchQuery, selectedLanguage]);

  const handleLaunchShadow = (mentor: Mentor) => {
    setShadowModalMentor(mentor);
  };

  const handleConfirmShadowLaunch = () => {
    if (shadowModalMentor) {
      toast.success(`Shadow coding session started with ${shadowModalMentor.name}!`);
    }
    setShadowModalMentor(null);
  };

  return (
    <div
      data-testid="mentorship-page-container"
      className="min-h-screen space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto text-slate-100"
    >
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-950/40 via-[#0B0F19] to-cyan-950/30 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-xs font-semibold">
              <Compass className="w-3.5 h-3.5" />
              <span>Interactive Pairing & Discovery</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              Developer Pairing & Mentorship
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Find experienced mentors with high tech-stack synergy. Request 1:1 project guidance,
              code reviews, or launch live interactive shadow-coding sessions.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Link
              href="/settings"
              className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2"
            >
              <span>Become a Mentor</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>
        </div>
      </div>

      {/* Discovery Controls: Search and Language Filters */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              data-testid="mentorship-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by mentor name, bio, or tech stack..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Language Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-xs font-mono text-slate-400 font-semibold mr-1 shrink-0 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Language:
            </span>
            {TECH_FILTERS.map((tech) => {
              const isSelected = selectedLanguage === tech;
              return (
                <button
                  key={tech}
                  type="button"
                  data-testid={`tech-filter-${tech}`}
                  onClick={() => setSelectedLanguage(tech)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/30'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
                  }`}
                >
                  {tech}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Filter Summary */}
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <div>
            Showing <span className="font-bold text-white">{filteredMentors.length}</span> matching
            mentor{filteredMentors.length === 1 ? '' : 's'}
          </div>
          {(searchQuery || selectedLanguage !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedLanguage('All');
              }}
              className="text-indigo-400 hover:underline cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Mentor Cards Grid */}
      {filteredMentors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMentors.map((mentor) => (
            <MentorCard
              key={mentor.id || mentor.username}
              mentor={mentor}
              onRequestMentorship={(m) => setRequestModalMentor(m)}
              onLaunchShadowCoding={(m) => handleLaunchShadow(m)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center space-y-3">
          <Users className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No mentors found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            We couldn't find any mentors matching your search query or language filter. Try clearing
            filters or adjusting your criteria.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedLanguage('All');
            }}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Request Mentorship Modal */}
      <RequestMentorshipModal
        isOpen={Boolean(requestModalMentor)}
        onClose={() => setRequestModalMentor(null)}
        mentor={requestModalMentor}
      />

      {/* Shadow Coding Launcher Modal */}
      {shadowModalMentor && (
        <div
          role="dialog"
          aria-modal="true"
          data-testid="shadow-coding-launch-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in-0"
        >
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0B0F19] p-6 shadow-2xl text-slate-100 space-y-5">
            <button
              type="button"
              onClick={() => setShadowModalMentor(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center text-cyan-400">
                <Radio className="w-5 h-5 animate-pulse text-rose-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  Shadow Session with {shadowModalMentor.name}
                </h2>
                <p className="text-xs text-slate-400">
                  Real-time interactive code stream pairing
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              You are about to launch a live shadow coding stream with{' '}
              <span className="font-bold text-white">{shadowModalMentor.name}</span>. You will be
              able to follow keystrokes in real time, view AST overlays, and engage in voice/chat
              pairing.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShadowModalMentor(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="confirm-shadow-launch-btn"
                onClick={handleConfirmShadowLaunch}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/20 active:scale-95 flex items-center gap-1.5"
              >
                <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span>Launch Session</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
