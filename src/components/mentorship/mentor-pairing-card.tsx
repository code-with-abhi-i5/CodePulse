"use client";

import React from "react";
import { MentorCard, MentorCardProps } from "@/components/cards/mentor-card";
import { Mentor, LanguageMastery } from "@/services/mentorship";

export type { MentorCardProps };
export { MentorCard };

export interface MentorPairingProfile {
  id?: string;
  name: string;
  username: string;
  role: string;
  company?: string;
  avatarUrl: string;
  similarityScore: number;
  matchingTech: string[];
  topLanguages?: LanguageMastery[];
  timezoneOffset?: string;
  experienceGap: number;
  bio: string;
  isAvailableNow: boolean;
  rating: number;
  sessionsCompleted: number;
  availableSlots?: number;
}

export interface MentorPairingCardProps {
  mentor: MentorPairingProfile | Mentor;
  onLaunchShadowCoding?: (mentor: any) => void;
  onRequestMentorship?: (mentor: any) => void;
  className?: string;
}

export function MentorPairingCard(props: MentorPairingCardProps) {
  return <MentorCard {...props} />;
}
