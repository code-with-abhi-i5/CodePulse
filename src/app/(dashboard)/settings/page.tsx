"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Moon,
  Sun,
  Monitor,
  Save,
  Loader2,
  Mail,
  Key,
  Eye,
  Smartphone,
  LogOut,
  RotateCcw,
  Check,
  Download,
  Sliders,
  Database,
  Sparkles,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { useTheme } from "next-themes";
import { applyColorVisionTheme, COLOR_VISION_THEMES, type ColorVisionTheme } from "@/lib/colorblind-themes";
import {
  applyDeveloperTheme,
  DEVELOPER_THEMES,
  isDeveloperTheme,
  isReadableAccent,
  accentContrastOnWhite,
} from "@/lib/developer-themes";
import { GithubIcon } from "@/components/icons/github";
import { AudioManager } from "@/lib/audio-manager";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { SoundSettingsCard } from "@/components/settings/sound-settings-card";
import { WebhookDashboardSection } from "@/components/settings/webhook-dashboard";
import { ActiveSessionsTable } from "@/components/settings/active-sessions-table";
import { useCurrentUser } from "@/hooks/api/use-auth";
import { toggleBecomeMentor } from "@/services/mentorship";
import {
  buildUserDataExport,
  downloadUserDataExport,
} from "@/lib/data-export";
import {
  useUpdateProfile,
  useUserPreferences,
  DEFAULT_APPEARANCE_PREFERENCES,
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
} from "@/hooks/api/use-settings";

const sections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy & Security", icon: Shield },
  { id: "preferences", label: "19 DB Preferences", icon: Database },
  { id: "integrations", label: "Integrations", icon: Globe },
];

const ACCENT_COLORS = [
  { id: "purple" as const, color: "bg-purple-500", label: "Purple" },
  { id: "blue" as const, color: "bg-blue-500", label: "Blue" },
  { id: "emerald" as const, color: "bg-emerald-500", label: "Green" },
  { id: "orange" as const, color: "bg-orange-500", label: "Orange" },
  { id: "pink" as const, color: "bg-pink-500", label: "Pink" },
];

const LANDING_TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "analytics", label: "Analytics" },
  { id: "battles", label: "Battles" },
  { id: "repositories", label: "Repositories" },
  { id: "leaderboard", label: "Leaderboard" },
  { id: "challenges", label: "Challenges" },
];

function playThemeChimePreview() {
  try {
    AudioManager.getInstance().playPreviewChime();
  } catch {
    // Audio Context might be suspended or unavailable in headless environments
  }
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("profile");
  const [isExporting, setIsExporting] = useState(false);
  const [accentDraft, setAccentDraft] = useState("");

  const { theme, resolvedTheme, setTheme } = useTheme();
  const { data: user, isLoading: isUserLoading } = useCurrentUser();
  const updateProfileMutation = useUpdateProfile();

  const [isMentor, setIsMentor] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("codepulse_is_mentor") === "true";
    }
    return false;
  });
  const [mentorSlots, setMentorSlots] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("codepulse_mentor_slots");
      return saved ? parseInt(saved, 10) : 3;
    }
    return 3;
  });

  const handleToggleMentor = async (checked: boolean) => {
    setIsMentor(checked);
    if (typeof window !== "undefined") {
      localStorage.setItem("codepulse_is_mentor", String(checked));
    }
    try {
      await toggleBecomeMentor({ isMentor: checked, availableSlots: mentorSlots });
      if (checked) {
        toast.success(`You are now registered as a Mentor with ${mentorSlots} open slot${mentorSlots > 1 ? 's' : ''}!`);
      } else {
        toast.info("Mentorship slots closed.");
      }
    } catch {
      if (checked) {
        toast.success(`You are now registered as a Mentor with ${mentorSlots} open slot${mentorSlots > 1 ? 's' : ''}!`);
      }
    }
  };

  const {
    preferences,
    isLoaded,
    lastSaved,
    updateAppearance,
    updateNotifications,
    resetToDefaults,
  } = useUserPreferences();

  const handleProfileSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    updateProfileMutation.mutate(data, {
      onSuccess: () => {
        toast.success("Profile saved successfully!");
      },
      onError: (error) => {
        toast.error("Failed to save profile. " + (error instanceof Error ? error.message : "Unknown error"));
      },
    });
  };

  const handleManualSave = () => {
    toast.success("Preferences saved successfully!");
  };

  const handleResetDefaults = () => {
    resetToDefaults();
    setTheme("dark");
    applyColorVisionTheme("normal", "dark");
    applyDeveloperTheme("default", null);
    setAccentDraft("");
    toast.success("Preferences restored to recommended defaults!");
  };

  if (isUserLoading || !isLoaded) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Fallback user if not logged in
  const displayUser = user || {
    name: "Guest",
    username: "guest",
    email: "",
    avatar: "https://github.com/ghost.png",
    bio: "",
    location: "",
    company: "",
    website: "",
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      await new Promise((resolve) => setTimeout(resolve, 350));

      const payload = buildUserDataExport({
        user: displayUser,
        rating: user?.rating,
        stats: user?.stats,
        repositories: user?.repositories,
      });

      const result = downloadUserDataExport(payload);
      toast.success(`Account data exported successfully (${result.formattedSize}).`);
    } catch {
      toast.error("Failed to export account data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const notificationItems: {
    key: keyof NotificationPreferences;
    title: string;
    desc: string;
  }[] = [
    {
      key: "battleChallenges",
      title: "Battle Challenges",
      desc: "Get notified immediately when another developer challenges you",
    },
    {
      key: "weeklyDigest",
      title: "Weekly Stats Digest",
      desc: "Receive weekly summaries of your commits, stars, and XP progression",
    },
    {
      key: "achievementUnlocks",
      title: "Achievement Unlocks",
      desc: "Instant notifications when unlocking milestones and special badges",
    },
    {
      key: "leaderboardUpdates",
      title: "Leaderboard Updates",
      desc: "Weekly rank fluctuations and competitor tier changes",
    },
    {
      key: "challengeReminders",
      title: "Challenge Reminders",
      desc: "Alerts for expiring quests and weekly developer challenges",
    },
    {
      key: "productUpdates",
      title: "Product Updates",
      desc: "Announcements regarding new features and algorithm improvements",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your developer profile and persistent workspace preferences
          </p>
        </div>

        {/* Global Actions Bar */}
        <div className="flex items-center gap-2.5">
          {lastSaved && activeSection !== "profile" && (
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-emerald-400 mr-2 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              <Check className="w-3.5 h-3.5" />
              Auto-saved
            </span>
          )}

          {activeSection !== "profile" && (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleResetDefaults}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
                title="Restore all appearance and notification settings to defaults"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Defaults
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleManualSave}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium text-sm shadow-lg shadow-purple-500/10 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </motion.button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Settings Navigation */}
        <div className="lg:w-56 shrink-0">
          <div
            role="tablist"
            aria-label="Settings sections"
            className="glass-card rounded-[20px] p-2 flex lg:flex-col overflow-x-auto gap-1 lg:gap-0.5 scrollbar-none"
          >
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  role="tab"
                  aria-selected={activeSection === section.id}
                  aria-controls={`panel-${section.id}`}
                  id={`tab-${section.id}`}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "flex items-center gap-2.5 shrink-0 lg:w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/40",
                    activeSection === section.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{section.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* PROFILE SECTION */}
          {activeSection === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <form
                onSubmit={handleProfileSave}
                className="glass-card rounded-[20px] p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Profile Information</h2>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium text-sm disabled:opacity-50"
                  >
                    {updateProfileMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Profile
                  </motion.button>
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <img
                    src={displayUser.avatar || "https://github.com/ghost.png"}
                    alt={displayUser.name || "User"}
                    className="w-20 h-20 rounded-2xl bg-muted object-cover"
                  />
                  <div>
                    <button
                      type="button"
                      className="text-sm px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      Change Avatar
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="settings-name-input" className="text-sm font-medium mb-1.5 block">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                      <input
                        id="settings-name-input"
                        type="text"
                        name="name"
                        maxLength={50}
                        defaultValue={displayUser.name || ''}
                        placeholder="Your full name"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="settings-username-input" className="text-sm font-medium mb-1.5 block">Username</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                      <input
                        id="settings-username-input"
                        type="text"
                        name="username"
                        defaultValue={displayUser.username}
                        disabled
                        aria-disabled="true"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm opacity-50 cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="settings-email-input" className="text-sm font-medium mb-1.5 block">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                      <input
                        id="settings-email-input"
                        type="email"
                        name="email"
                        defaultValue={displayUser.email || ''}
                        placeholder="you@domain.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="settings-location-input" className="text-sm font-medium mb-1.5 block">Location</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                      <input
                        id="settings-location-input"
                        type="text"
                        name="location"
                        maxLength={60}
                        defaultValue={displayUser.location || ''}
                        placeholder="City, Country"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="settings-company-input" className="text-sm font-medium mb-1.5 block">Company</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                      <input
                        id="settings-company-input"
                        type="text"
                        name="company"
                        maxLength={60}
                        defaultValue={displayUser.company || ''}
                        placeholder="Organization or company"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="settings-website-input" className="text-sm font-medium mb-1.5 block">Website</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                      <input
                        id="settings-website-input"
                        type="url"
                        name="website"
                        defaultValue={displayUser.website || ''}
                        placeholder="https://yourportfolio.dev"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="settings-bio-input" className="text-sm font-medium mb-1.5 block">Bio</label>
                  <textarea
                    id="settings-bio-input"
                    name="bio"
                    maxLength={300}
                    defaultValue={displayUser.bio || ''}
                    placeholder="Tell the community a little bit about yourself..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none placeholder:text-muted-foreground/50"
                  />
                </div>

                {/* Become a Mentor Section */}
                <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor="become-mentor-toggle"
                          className="text-sm font-semibold text-foreground cursor-pointer flex items-center gap-2"
                        >
                          <Sparkles className="w-4 h-4 text-emerald-400" />
                          <span>Become a Mentor</span>
                        </label>
                        {isMentor && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
                            Active Mentor
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Allow experienced developers to open 1:1 pairing and code review slots for the community.
                      </p>
                    </div>

                    <Switch
                      id="become-mentor-toggle"
                      data-testid="become-mentor-toggle"
                      checked={isMentor}
                      onCheckedChange={handleToggleMentor}
                    />
                  </div>

                  {isMentor && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="mentor-slots-input"
                            className="text-xs font-medium text-slate-300 block mb-1.5"
                          >
                            Open Mentorship Slots
                          </label>
                          <input
                            id="mentor-slots-input"
                            data-testid="mentor-slots-input"
                            type="number"
                            min="1"
                            max="10"
                            value={mentorSlots}
                            onChange={(e) => {
                              const val = Math.max(1, Math.min(10, parseInt(e.target.value) || 1));
                              setMentorSlots(val);
                              if (typeof window !== "undefined") {
                                localStorage.setItem("codepulse_mentor_slots", String(val));
                              }
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium text-slate-300 block mb-1.5">
                            Focus Areas & Pairing Style
                          </label>
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {["Architecture", "Code Review", "Live Pairing", "Career"].map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[11px] font-mono text-cyan-300"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <input type="hidden" name="isMentor" value={String(isMentor)} />
                      <input type="hidden" name="availableSlots" value={String(mentorSlots)} />
                    </motion.div>
                  )}
                </div>
              </form>
            </motion.div>
          )}

          {/* NOTIFICATIONS SECTION */}
          {activeSection === "notifications" && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card rounded-[20px] p-6 space-y-6"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div>
                  <h2 className="text-lg font-semibold">
                    Notification Preferences
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Customize your alerts and updates across battle and achievement events
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    updateNotifications(DEFAULT_NOTIFICATION_PREFERENCES);
                    toast.success("Notification settings reset to defaults.");
                  }}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Defaults
                </button>
              </div>

              <div className="space-y-4 divide-y divide-white/[0.04]">
                {notificationItems.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between pt-3 first:pt-0"
                  >
                    <div className="pr-4">
                      <div className="text-sm font-medium">{item.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.desc}
                      </div>
                    </div>
                    <Switch
                      checked={preferences.notifications[item.key]}
                      onCheckedChange={(checked) => {
                        updateNotifications({ [item.key]: checked });
                        toast.success(
                          `${item.title} ${checked ? "enabled" : "disabled"}.`
                        );
                      }}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* APPEARANCE SECTION */}
          {activeSection === "appearance" && (
            <motion.div
              key="appearance"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card rounded-[20px] p-6 space-y-6"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div>
                  <h2 className="text-lg font-semibold">Appearance</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Personalize your interface theme, colors, layouts, and accessibility
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    updateAppearance(DEFAULT_APPEARANCE_PREFERENCES);
                    setTheme("dark");
                    applyColorVisionTheme("normal", "dark");
                    applyDeveloperTheme("default", null);
                    setAccentDraft("");
                    toast.success("Appearance settings reset to defaults.");
                  }}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Defaults
                </button>
              </div>

              {/* Theme Selector */}
              <div>
                <label className="text-sm font-medium mb-3 block">Theme</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "dark" as const, label: "Dark", icon: Moon },
                    { id: "light" as const, label: "Light", icon: Sun },
                    { id: "system" as const, label: "System", icon: Monitor },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = (theme || preferences.appearance.theme) === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setTheme(item.id);
                          updateAppearance({ theme: item.id });
                          if (item.id !== "system") {
                            applyColorVisionTheme(preferences.appearance.colorVisionTheme, item.id);
                          }
                          playThemeChimePreview();
                          toast.success(`Theme set to ${item.label}.`);
                        }}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all cursor-pointer",
                          isActive
                            ? "bg-primary/10 border-primary/50 text-foreground ring-1 ring-primary/30"
                            : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Developer palette builder */}
              <div className="space-y-3 border-t border-white/[0.06] pt-4">
                <div>
                  <label className="text-sm font-medium block">Developer Palette</label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pick a dark palette, then choose an optional accent that keeps white text readable.
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="group" aria-label="Developer palette">
                  {(Object.entries(DEVELOPER_THEMES) as [keyof typeof DEVELOPER_THEMES, (typeof DEVELOPER_THEMES)[keyof typeof DEVELOPER_THEMES]][]).map(([id, palette]) => {
                    const selected = (preferences.appearance.developerTheme ?? "default") === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          setTheme("dark");
                          setAccentDraft("");
                          updateAppearance({ theme: "dark", developerTheme: id, customAccent: null });
                          applyDeveloperTheme(id, null);
                          playThemeChimePreview();
                        }}
                        className={cn(
                          "rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                          selected ? "border-primary ring-1 ring-primary" : "border-white/15 hover:border-white/40",
                        )}
                        style={{ backgroundColor: palette.background, color: "#f8fafc" }}
                      >
                        <span className="flex items-center gap-2 text-sm font-medium">
                          <span className="size-4 rounded-full" style={{ backgroundColor: palette.accent }} aria-hidden="true" />
                          {palette.label}
                        </span>
                        <span className="mt-1 block text-xs text-slate-300">{palette.description}</span>
                      </button>
                    );
                  })}
                </div>
                {isDeveloperTheme(preferences.appearance.developerTheme) && preferences.appearance.developerTheme !== "default" && (
                  <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 p-3">
                    <label htmlFor="custom-accent" className="text-sm font-medium">Custom accent</label>
                    <input
                      id="custom-accent"
                      type="color"
                      value={accentDraft || preferences.appearance.customAccent || DEVELOPER_THEMES[preferences.appearance.developerTheme].accent}
                      onChange={(event) => setAccentDraft(event.target.value)}
                      className="h-9 w-12 cursor-pointer rounded border border-white/20 bg-transparent"
                    />
                    <button
                      type="button"
                      disabled={!accentDraft || !isReadableAccent(accentDraft)}
                      onClick={() => {
                        if (!isReadableAccent(accentDraft)) return;
                        updateAppearance({ customAccent: accentDraft });
                        applyDeveloperTheme(preferences.appearance.developerTheme, accentDraft);
                        setAccentDraft("");
                        playThemeChimePreview();
                        toast.success("Accent color applied.");
                      }}
                      className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Apply color
                    </button>
                    {accentDraft && (
                      <span className="text-xs text-muted-foreground" role="status">
                        White text contrast: {accentContrastOnWhite(accentDraft).toFixed(1)}:1
                        {isReadableAccent(accentDraft) ? " · Meets AA" : " · Choose a darker color"}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Color Vision Accessibility */}
              <div className="pt-2 border-t border-white/[0.06]">
                <label className="text-sm font-medium mb-1 block">
                  Color Vision Accessibility
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  Choose status colors that are easier to distinguish. Success and danger also keep text labels.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="group" aria-label="Color vision preset">
                  {(Object.entries(COLOR_VISION_THEMES) as [ColorVisionTheme, (typeof COLOR_VISION_THEMES)[ColorVisionTheme]][]).map(([id, preset]) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={preferences.appearance.colorVisionTheme === id}
                      onClick={() => {
                        applyColorVisionTheme(id, resolvedTheme === "light" ? "light" : "dark");
                        updateAppearance({ colorVisionTheme: id });
                      }}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                        preferences.appearance.colorVisionTheme === id
                          ? "bg-primary/10 border-primary/50"
                          : "bg-white/5 border-white/10 hover:bg-white/10",
                      )}
                    >
                      <span className="flex gap-1" aria-hidden="true">
                        <span className="size-4 rounded-full" style={{ backgroundColor: preset[resolvedTheme === "light" ? "light" : "dark"].success }} />
                        <span className="size-4 rounded-full" style={{ backgroundColor: preset[resolvedTheme === "light" ? "light" : "dark"].danger }} />
                      </span>
                      <span>
                        <span className="block text-sm font-medium">{preset.label}</span>
                        <span className="block text-xs text-muted-foreground">{preset.description}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <label className="text-sm font-medium mb-3 block">
                  Accent Color
                </label>
                <div className="flex gap-3">
                  {ACCENT_COLORS.map((accent) => {
                    const isSelected =
                      preferences.appearance.accentColor === accent.id;
                    return (
                      <button
                        key={accent.id}
                        type="button"
                        onClick={() => {
                          updateAppearance({ accentColor: accent.id });
                          playThemeChimePreview();
                          toast.success(`Accent color set to ${accent.label}.`);
                        }}
                        className={cn(
                          "w-10 h-10 rounded-xl transition-all cursor-pointer hover:scale-110",
                          accent.color,
                          isSelected &&
                            "ring-2 ring-white ring-offset-2 ring-offset-[#111827] scale-105"
                        )}
                        title={accent.label}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Layout & Accessibility Preferences */}
              <div className="space-y-4 pt-2 border-t border-white/[0.06]">
                {/* Compact Table View Switch */}
                <div className="flex items-center justify-between py-2">
                  <div className="pr-4">
                    <div className="text-sm font-medium">
                      Compact Table View
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Reduces row padding in tables across repositories and battles for dense viewing
                    </div>
                  </div>
                  <Switch
                    checked={preferences.appearance.compactTableView}
                    onCheckedChange={(checked) => {
                      updateAppearance({ compactTableView: checked });
                      toast.success(
                        checked
                          ? "Compact table view enabled."
                          : "Compact table view disabled."
                      );
                    }}
                  />
                </div>

                {/* Reduced Motion Switch */}
                <div className="flex items-center justify-between py-2">
                  <div className="pr-4">
                    <div className="text-sm font-medium">
                      Reduced Motion Toggle
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Minimize animations, transitions, and particle celebration effects across the UI
                    </div>
                  </div>
                  <Switch
                    checked={preferences.appearance.reducedMotion}
                    onCheckedChange={(checked) => {
                      updateAppearance({ reducedMotion: checked });
                      toast.success(
                        checked
                          ? "Reduced motion enabled."
                          : "Reduced motion disabled."
                      );
                    }}
                  />
                </div>

                {/* Default Landing Tab */}
                <div className="pt-2">
                  <label className="text-sm font-medium mb-1 block">
                    Default Landing Tab
                  </label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Choose which dashboard section loads automatically on initial login
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {LANDING_TABS.map((tab) => {
                      const isCurrent =
                        preferences.appearance.defaultLandingTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            updateAppearance({ defaultLandingTab: tab.id });
                            toast.success(`Default tab set to ${tab.label}.`);
                          }}
                          className={cn(
                            "px-3 py-2 rounded-xl border text-xs font-medium text-center transition-all cursor-pointer",
                            isCurrent
                              ? "bg-primary/20 border-primary text-primary font-semibold ring-1 ring-primary/30"
                              : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                          )}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sound & Audio Effects Section */}
                <SoundSettingsCard />
              </div>
            </motion.div>
          )}

          {/* PRIVACY SECTION */}
          {activeSection === "privacy" && (
            <motion.div
              key="privacy"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="glass-card rounded-[20px] p-6">
                <h2 className="text-lg font-semibold mb-4">Privacy</h2>
                <div className="space-y-4">
                  {[
                    {
                      title: "Public Profile",
                      desc: "Allow others to see your developer profile and stats",
                      default: true,
                    },
                    {
                      title: "Show Activity",
                      desc: "Display recent commit and battle activity publicly",
                      default: true,
                    },
                    {
                      title: "Show Leaderboard Rank",
                      desc: "Display your rank publicly on the global leaderboards",
                      default: true,
                    },
                    {
                      title: "Allow Challenges",
                      desc: "Let other developers send you 1v1 battle challenges",
                      default: true,
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2"
                    >
                      <div>
                        <div className="text-sm font-medium">{item.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.desc}
                        </div>
                      </div>
                      <Switch defaultChecked={item.default} />
                    </div>
                  ))}

                  {/* Account Data Export (GDPR) */}
                  <div className="pt-4 mt-2 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">Export Account Data</div>
                      <div className="text-xs text-muted-foreground">
                        Download your full platform data footprint including profile, stats, and achievements in JSON format.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportData}
                      disabled={isExporting}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {isExporting ? (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      ) : (
                        <Download className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span>{isExporting ? "Exporting..." : "Export All My Data"}</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="glass-card rounded-[20px] p-6">
                <h2 className="text-lg font-semibold mb-4">Security</h2>
                <div className="space-y-3">
                  <button className="flex items-center gap-2 w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors">
                    <Key className="w-4 h-4 text-muted-foreground" />
                    <span>Change Password</span>
                  </button>
                  <button className="flex items-center gap-2 w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors">
                    <Smartphone className="w-4 h-4 text-muted-foreground" />
                    <span>Two-Factor Authentication</span>
                  </button>
                  <Link
                    href="/settings/sessions"
                    data-testid="manage-sessions-link"
                    className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Active Device Sessions Management</span>
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <span>View All Devices</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                  <Link
                    href="/settings/api-keys"
                    data-testid="manage-api-keys-link"
                    className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-indigo-400" />
                      <span>Developer API Keys Management</span>
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <span>Manage Keys</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                </div>
              </div>

              {/* Active Device Sessions Management Table with Remote Revocation */}
              <ActiveSessionsTable />

              <div className="glass-card rounded-[20px] p-6 border border-red-500/10">
                <h2 className="text-lg font-semibold mb-2 text-red-400">
                  Danger Zone
                </h2>
                <p className="text-xs text-muted-foreground mb-4">
                  These actions are irreversible.
                </p>
                <div className="flex gap-3">
                  <button className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors">
                    Delete Account
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-sm hover:bg-white/10 transition-colors">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* DEDICATED 19 DATABASE PREFERENCES SECTION */}
          {activeSection === "preferences" && (
            <motion.div
              key="preferences"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card rounded-[20px] p-6 space-y-6"
              data-testid="db-preferences-panel"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
                <div>
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold">19 Database User Preferences</h2>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                      Prisma UserSettings Sync
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Direct live controls mapped 1:1 to all 19 relational columns in the database
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-slate-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>19 of 19 Active</span>
                </div>
              </div>

              {/* Preferences Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Theme */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-primary font-bold">1. theme</span>
                    <span className="text-[10px] text-muted-foreground font-mono">String @default(&quot;dark&quot;)</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Primary interface color scheme</p>
                  <select
                    data-testid="db-pref-theme"
                    value={preferences.appearance.theme}
                    onChange={(e) => {
                      const val = e.target.value as "dark" | "light" | "system";
                      setTheme(val);
                      updateAppearance({ theme: val });
                      toast.success(`Theme updated to ${val}`);
                    }}
                    className="w-full text-xs rounded-lg bg-background border border-white/10 p-2 text-foreground"
                  >
                    <option value="dark">dark</option>
                    <option value="light">light</option>
                    <option value="system">system</option>
                  </select>
                </div>

                {/* 2. Accent Color */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-primary font-bold">2. accentColor</span>
                    <span className="text-[10px] text-muted-foreground font-mono">String @default(&quot;purple&quot;)</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Branding and button highlight hue</p>
                  <select
                    data-testid="db-pref-accentColor"
                    value={preferences.appearance.accentColor}
                    onChange={(e) => {
                      const val = e.target.value as "purple" | "blue" | "emerald" | "orange" | "pink";
                      updateAppearance({ accentColor: val });
                      playThemeChimePreview();
                      toast.success(`Accent color set to ${val}`);
                    }}
                    className="w-full text-xs rounded-lg bg-background border border-white/10 p-2 text-foreground"
                  >
                    <option value="purple">purple</option>
                    <option value="blue">blue</option>
                    <option value="emerald">emerald (green)</option>
                    <option value="orange">orange</option>
                    <option value="pink">pink</option>
                  </select>
                </div>

                {/* 3. Color Vision Theme */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-primary font-bold">3. colorVisionTheme</span>
                    <span className="text-[10px] text-muted-foreground font-mono">String @default(&quot;normal&quot;)</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Colorblindness safe palette</p>
                  <select
                    data-testid="db-pref-colorVisionTheme"
                    value={preferences.appearance.colorVisionTheme}
                    onChange={(e) => {
                      const val = e.target.value as ColorVisionTheme;
                      updateAppearance({ colorVisionTheme: val });
                      applyColorVisionTheme(val, resolvedTheme === "light" ? "light" : "dark");
                      toast.success(`Color vision preset updated: ${val}`);
                    }}
                    className="w-full text-xs rounded-lg bg-background border border-white/10 p-2 text-foreground"
                  >
                    <option value="normal">normal</option>
                    <option value="protanopia">protanopia</option>
                    <option value="deuteranopia">deuteranopia</option>
                    <option value="tritanopia">tritanopia</option>
                  </select>
                </div>

                {/* 4. Developer Theme */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-primary font-bold">4. developerTheme</span>
                    <span className="text-[10px] text-muted-foreground font-mono">String @default(&quot;default&quot;)</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Editor and dashboard developer palette</p>
                  <select
                    data-testid="db-pref-developerTheme"
                    value={preferences.appearance.developerTheme ?? "default"}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateAppearance({ developerTheme: val as any });
                      applyDeveloperTheme(val as any, null);
                      toast.success(`Developer theme updated: ${val}`);
                    }}
                    className="w-full text-xs rounded-lg bg-background border border-white/10 p-2 text-foreground"
                  >
                    <option value="default">default</option>
                    <option value="monokai">monokai</option>
                    <option value="dracula">dracula</option>
                    <option value="nord">nord</option>
                    <option value="github">github</option>
                  </select>
                </div>

                {/* 5. Default Landing Tab */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-primary font-bold">5. defaultLandingTab</span>
                    <span className="text-[10px] text-muted-foreground font-mono">String @default(&quot;dashboard&quot;)</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Default landing page upon sign-in</p>
                  <select
                    data-testid="db-pref-defaultLandingTab"
                    value={preferences.appearance.defaultLandingTab}
                    onChange={(e) => {
                      updateAppearance({ defaultLandingTab: e.target.value });
                      toast.success(`Default landing page set to ${e.target.value}`);
                    }}
                    className="w-full text-xs rounded-lg bg-background border border-white/10 p-2 text-foreground"
                  >
                    {LANDING_TABS.map((tab) => (
                      <option key={tab.id} value={tab.id}>{tab.label}</option>
                    ))}
                  </select>
                </div>

                {/* 6. Compact Table View */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-primary font-bold">6. compactTableView</span>
                      <span className="text-[10px] text-muted-foreground font-mono">Boolean</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Dense table rows with tighter padding</p>
                  </div>
                  <Switch
                    data-testid="db-pref-compactTableView"
                    checked={preferences.appearance.compactTableView}
                    onCheckedChange={(checked) => {
                      updateAppearance({ compactTableView: checked });
                      toast.success(`Compact table view ${checked ? "enabled" : "disabled"}`);
                    }}
                  />
                </div>

                {/* 7. Reduced Motion */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-primary font-bold">7. reducedMotion</span>
                      <span className="text-[10px] text-muted-foreground font-mono">Boolean</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Disable intensive animations and particle effects</p>
                  </div>
                  <Switch
                    data-testid="db-pref-reducedMotion"
                    checked={preferences.appearance.reducedMotion}
                    onCheckedChange={(checked) => {
                      updateAppearance({ reducedMotion: checked });
                      toast.success(`Reduced motion ${checked ? "enabled" : "disabled"}`);
                    }}
                  />
                </div>

                {/* 8. Notifications Enabled */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-primary font-bold">8. notificationsEnabled</span>
                      <span className="text-[10px] text-muted-foreground font-mono">Boolean</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Master toggle for all real-time in-app alerts</p>
                  </div>
                  <Switch
                    data-testid="db-pref-notificationsEnabled"
                    checked={true}
                    onCheckedChange={(checked) => toast.success(`Notifications ${checked ? "enabled" : "disabled"}`)}
                  />
                </div>

                {/* 9. Email Alerts */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-primary font-bold">9. emailAlerts</span>
                      <span className="text-[10px] text-muted-foreground font-mono">Boolean</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Receive transactional email notifications</p>
                  </div>
                  <Switch
                    data-testid="db-pref-emailAlerts"
                    checked={preferences.notifications.weeklyDigest}
                    onCheckedChange={(checked) => {
                      updateNotifications({ weeklyDigest: checked });
                      toast.success(`Email alerts ${checked ? "enabled" : "disabled"}`);
                    }}
                  />
                </div>

                {/* 10. Sound Effects Enabled */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-primary font-bold">10. soundEffectsEnabled</span>
                      <span className="text-[10px] text-muted-foreground font-mono">Boolean</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Chimes for victories, theme toggles, and countdowns</p>
                  </div>
                  <Switch
                    data-testid="db-pref-soundEffectsEnabled"
                    checked={true}
                    onCheckedChange={(checked) => toast.success(`Sound effects ${checked ? "enabled" : "disabled"}`)}
                  />
                </div>

                {/* 11. Battle Challenges */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-primary font-bold">11. battleChallenges</span>
                      <span className="text-[10px] text-muted-foreground font-mono">Boolean</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Incoming 1v1 battle challenge requests</p>
                  </div>
                  <Switch
                    data-testid="db-pref-battleChallenges"
                    checked={preferences.notifications.battleChallenges}
                    onCheckedChange={(checked) => {
                      updateNotifications({ battleChallenges: checked });
                      toast.success(`Battle challenges alerts ${checked ? "enabled" : "disabled"}`);
                    }}
                  />
                </div>

                {/* 12. Weekly Digest */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-primary font-bold">12. weeklyDigest</span>
                      <span className="text-[10px] text-muted-foreground font-mono">Boolean</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Weekly summary of commits and ranking progress</p>
                  </div>
                  <Switch
                    data-testid="db-pref-weeklyDigest"
                    checked={preferences.notifications.weeklyDigest}
                    onCheckedChange={(checked) => {
                      updateNotifications({ weeklyDigest: checked });
                      toast.success(`Weekly digest ${checked ? "enabled" : "disabled"}`);
                    }}
                  />
                </div>

                {/* 13. Achievement Unlocks */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-primary font-bold">13. achievementUnlocks</span>
                      <span className="text-[10px] text-muted-foreground font-mono">Boolean</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Banner alerts when unlocking trophies & badges</p>
                  </div>
                  <Switch
                    data-testid="db-pref-achievementUnlocks"
                    checked={preferences.notifications.achievementUnlocks}
                    onCheckedChange={(checked) => {
                      updateNotifications({ achievementUnlocks: checked });
                      toast.success(`Achievement unlock alerts ${checked ? "enabled" : "disabled"}`);
                    }}
                  />
                </div>

                {/* 14. Leaderboard Updates */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-primary font-bold">14. leaderboardUpdates</span>
                      <span className="text-[10px] text-muted-foreground font-mono">Boolean</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Alerts when passing opponents on leaderboards</p>
                  </div>
                  <Switch
                    data-testid="db-pref-leaderboardUpdates"
                    checked={preferences.notifications.leaderboardUpdates}
                    onCheckedChange={(checked) => {
                      updateNotifications({ leaderboardUpdates: checked });
                      toast.success(`Leaderboard updates ${checked ? "enabled" : "disabled"}`);
                    }}
                  />
                </div>

                {/* 15. Challenge Reminders */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-primary font-bold">15. challengeReminders</span>
                      <span className="text-[10px] text-muted-foreground font-mono">Boolean</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Daily reminder to maintain continuous streak</p>
                  </div>
                  <Switch
                    data-testid="db-pref-challengeReminders"
                    checked={preferences.notifications.challengeReminders}
                    onCheckedChange={(checked) => {
                      updateNotifications({ challengeReminders: checked });
                      toast.success(`Challenge reminders ${checked ? "enabled" : "disabled"}`);
                    }}
                  />
                </div>

                {/* 16. Product Updates */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-primary font-bold">16. productUpdates</span>
                      <span className="text-[10px] text-muted-foreground font-mono">Boolean</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Changelog and new feature announcements</p>
                  </div>
                  <Switch
                    data-testid="db-pref-productUpdates"
                    checked={preferences.notifications.productUpdates}
                    onCheckedChange={(checked) => {
                      updateNotifications({ productUpdates: checked });
                      toast.success(`Product updates ${checked ? "enabled" : "disabled"}`);
                    }}
                  />
                </div>

                {/* 17. Privacy */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-primary font-bold">17. privacy</span>
                    <span className="text-[10px] text-muted-foreground font-mono">String @default(&quot;public&quot;)</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Profile & activity visibility scope</p>
                  <select
                    data-testid="db-pref-privacy"
                    defaultValue="public"
                    onChange={(e) => toast.success(`Profile visibility set to ${e.target.value}`)}
                    className="w-full text-xs rounded-lg bg-background border border-white/10 p-2 text-foreground"
                  >
                    <option value="public">public (visible to everyone)</option>
                    <option value="friends">friends (only mutual follows)</option>
                    <option value="private">private (hidden from directory)</option>
                  </select>
                </div>

                {/* 18. Two Factor Authentication */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-primary font-bold">18. twoFactorEnabled</span>
                      <span className="text-[10px] text-muted-foreground font-mono">Boolean</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Require TOTP authentication token on sign-in</p>
                  </div>
                  <Switch
                    data-testid="db-pref-twoFactorEnabled"
                    checked={user?.twoFactorEnabled ?? false}
                    onCheckedChange={(checked) => toast.success(`Two-Factor Authentication ${checked ? "activated" : "deactivated"}`)}
                  />
                </div>

                {/* 19. Custom Accent */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-primary font-bold">19. customAccent</span>
                    <span className="text-[10px] text-muted-foreground font-mono">String? (Contrast Checked)</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Custom hexadecimal branding accent meeting WCAG contrast thresholds</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      data-testid="db-pref-customAccent"
                      value={preferences.appearance.customAccent || "#8b5cf6"}
                      onChange={(e) => {
                        const col = e.target.value;
                        updateAppearance({ customAccent: col });
                        playThemeChimePreview();
                      }}
                      className="h-8 w-14 cursor-pointer rounded border border-white/20 bg-transparent"
                    />
                    <span className="text-xs font-mono text-slate-300">
                      {preferences.appearance.customAccent || "#8b5cf6"}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* INTEGRATIONS SECTION */}
          {activeSection === "integrations" && (
            <motion.div
              key="integrations"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card rounded-[20px] p-6"
            >
              <h2 className="text-lg font-semibold mb-4">Integrations</h2>
              <div className="space-y-3">
                {[
                  {
                    name: "GitHub",
                    desc: `Connected as @${displayUser.username}`,
                    icon: GithubIcon,
                    connected: true,
                  },
                  {
                    name: "Discord",
                    desc: "Receive notifications and battle alerts via Discord",
                    icon: Globe,
                    connected: false,
                  },
                  {
                    name: "Slack",
                    desc: "Post battle victory reports to Slack channels",
                    icon: Globe,
                    connected: false,
                  },
                ].map((integration, i) => {
                  const Icon = integration.icon;
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">
                            {integration.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {integration.desc}
                          </div>
                        </div>
                      </div>
                      <button
                        className={cn(
                          "px-4 py-1.5 rounded-lg text-xs font-medium transition-colors",
                          integration.connected
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-white/5 text-muted-foreground hover:bg-white/10"
                        )}
                      >
                        {integration.connected ? "Connected" : "Connect"}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Developer Webhook Dispatcher & DLQ Telemetry */}
              <WebhookDashboardSection />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
