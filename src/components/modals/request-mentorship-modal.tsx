'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Clock,
  Sparkles,
  X,
  Send,
  Loader2,
  Calendar,
  CheckCircle2,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';
import { Mentor, submitMentorshipRequest } from '@/services/mentorship';

export interface RequestMentorshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentor: Mentor | null;
  onSuccess?: () => void;
}

export function RequestMentorshipModal({
  isOpen,
  onClose,
  mentor,
  onSuccess,
}: RequestMentorshipModalProps) {
  const [projectGoals, setProjectGoals] = useState('');
  const [expectedHours, setExpectedHours] = useState('4');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !mentor) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectGoals.trim()) {
      toast.error('Please describe your project goals.');
      return;
    }

    const hoursNum = parseFloat(expectedHours);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      toast.error('Please enter a valid number of expected hours.');
      return;
    }

    if (!message.trim()) {
      toast.error('Please provide a message for your mentor.');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitMentorshipRequest({
        mentorId: mentor.id || `m-${mentor.username}`,
        mentorUsername: mentor.username,
        projectGoals: projectGoals.trim(),
        expectedHours: hoursNum,
        message: message.trim(),
      });

      toast.success(`Mentorship request sent to ${mentor.name}!`);
      setProjectGoals('');
      setMessage('');
      setExpectedHours('4');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send mentorship request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="request-mentorship-title"
      data-testid="request-mentorship-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in-0"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0B0F19] p-6 shadow-2xl text-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          data-testid="close-mentorship-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 id="request-mentorship-title" className="text-lg font-bold text-white">
              Request Mentorship
            </h2>
            <p className="text-xs text-slate-400">
              Set expectations and initiate a pairing relationship
            </p>
          </div>
        </div>

        {/* Mentor Preview Card */}
        <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
          <img
            src={mentor.avatarUrl}
            alt={mentor.name}
            className="w-12 h-12 rounded-full border border-white/15 object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white truncate">{mentor.name}</h3>
              <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                {mentor.similarityScore}% Match
              </span>
            </div>
            <div className="text-xs text-slate-400 font-mono truncate">
              @{mentor.username} • {mentor.role}
            </div>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-cyan-300 font-mono">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>Timezone: {mentor.timezoneOffset || 'UTC+0'}</span>
            </div>
          </div>
        </div>

        {/* Request Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Goals */}
          <div className="space-y-1.5">
            <label
              htmlFor="mentorship-project-goals"
              className="text-xs font-semibold text-slate-300 flex items-center gap-1.5"
            >
              <Target className="w-3.5 h-3.5 text-indigo-400" />
              Project Goals & Objectives
            </label>
            <textarea
              id="mentorship-project-goals"
              data-testid="mentorship-project-goals-input"
              rows={3}
              value={projectGoals}
              onChange={(e) => setProjectGoals(e.target.value)}
              placeholder="e.g. Build an eBPF network telemetry daemon, improve Rust concurrency patterns, prepare for Staff role..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
              required
            />
          </div>

          {/* Expected Hours */}
          <div className="space-y-1.5">
            <label
              htmlFor="mentorship-expected-hours"
              className="text-xs font-semibold text-slate-300 flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              Expected Commitment (Hours / Week)
            </label>
            <input
              id="mentorship-expected-hours"
              data-testid="mentorship-expected-hours-input"
              type="number"
              min="1"
              max="40"
              step="1"
              value={expectedHours}
              onChange={(e) => setExpectedHours(e.target.value)}
              placeholder="e.g. 4"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              required
            />
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <label
              htmlFor="mentorship-message"
              className="text-xs font-semibold text-slate-300 flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              Personal Message to Mentor
            </label>
            <textarea
              id="mentorship-message"
              data-testid="mentorship-message-input"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi Elena, I've been working on a distributed consensus prototype and would love your guidance on memory safety and fault recovery..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="submit-mentorship-request-btn"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/20 active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
