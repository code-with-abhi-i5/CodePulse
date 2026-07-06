"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { mockCurrentUser } from "@/lib/mock-data";
import { toast } from "sonner";
import {
  Settings as SettingsIcon, User, Bell, Shield, Palette, Globe,
  Moon, Sun, Monitor, Save, Loader2, Mail, Key, Eye,
  Smartphone, LogOut,
} from "lucide-react";
import { GithubIcon } from "@/components/icons/github";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

const sections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "privacy", label: "Privacy & Security", icon: Shield },
  { id: "integrations", label: "Integrations", icon: Globe },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const user = mockCurrentUser;

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsSaving(false);
    toast.success("Settings saved successfully!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your account preferences
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium text-sm disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </motion.button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-56 shrink-0">
          <div className="glass-card rounded-[20px] p-2 space-y-0.5">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all",
                    activeSection === section.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {section.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeSection === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="glass-card rounded-[20px] p-6">
                <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
                <div className="flex items-center gap-4 mb-6">
                  <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-2xl" />
                  <div>
                    <button className="text-sm px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                      Change Avatar
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: "Full Name", value: user.name, icon: User },
                    { label: "Username", value: `@${user.username}`, icon: User },
                    { label: "Email", value: "alex@example.com", icon: Mail },
                    { label: "Location", value: user.location || "", icon: Globe },
                    { label: "Company", value: user.company || "", icon: Globe },
                    { label: "Website", value: user.website || "", icon: Globe },
                  ].map((field) => {
                    const Icon = field.icon;
                    return (
                      <div key={field.label}>
                        <label className="text-sm font-medium mb-1.5 block">{field.label}</label>
                        <div className="relative">
                          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            type="text"
                            defaultValue={field.value}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4">
                  <label className="text-sm font-medium mb-1.5 block">Bio</label>
                  <textarea
                    defaultValue={user.bio}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === "notifications" && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card rounded-[20px] p-6"
            >
              <h2 className="text-lg font-semibold mb-4">Notification Preferences</h2>
              <div className="space-y-4">
                {[
                  { title: "Battle Challenges", desc: "Get notified when someone challenges you", default: true },
                  { title: "Achievement Unlocked", desc: "Notifications for new achievements", default: true },
                  { title: "Leaderboard Updates", desc: "Weekly leaderboard rank changes", default: false },
                  { title: "Challenge Reminders", desc: "Reminders for expiring challenges", default: true },
                  { title: "Friend Activity", desc: "When friends complete milestones", default: false },
                  { title: "Product Updates", desc: "New features and improvements", default: true },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div>
                      <div className="text-sm font-medium">{item.title}</div>
                      <div className="text-xs text-muted-foreground">{item.desc}</div>
                    </div>
                    <Switch defaultChecked={item.default} />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeSection === "appearance" && (
            <motion.div
              key="appearance"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card rounded-[20px] p-6"
            >
              <h2 className="text-lg font-semibold mb-4">Appearance</h2>
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-3 block">Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "dark", label: "Dark", icon: Moon, active: true },
                      { id: "light", label: "Light", icon: Sun, active: false },
                      { id: "system", label: "System", icon: Monitor, active: false },
                    ].map((theme) => {
                      const Icon = theme.icon;
                      return (
                        <button
                          key={theme.id}
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                            theme.active
                              ? "bg-primary/10 border-primary/50"
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                          )}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-xs font-medium">{theme.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-3 block">Accent Color</label>
                  <div className="flex gap-3">
                    {[
                      { color: "bg-purple-500", label: "Purple", active: true },
                      { color: "bg-blue-500", label: "Blue", active: false },
                      { color: "bg-emerald-500", label: "Green", active: false },
                      { color: "bg-orange-500", label: "Orange", active: false },
                      { color: "bg-pink-500", label: "Pink", active: false },
                    ].map((accent) => (
                      <button
                        key={accent.label}
                        className={cn(
                          "w-10 h-10 rounded-xl transition-transform hover:scale-110",
                          accent.color,
                          accent.active && "ring-2 ring-white ring-offset-2 ring-offset-[#111827]"
                        )}
                        title={accent.label}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

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
                    { title: "Public Profile", desc: "Allow others to see your profile", default: true },
                    { title: "Show Activity", desc: "Display your activity on your profile", default: true },
                    { title: "Show Leaderboard Rank", desc: "Display your rank publicly", default: true },
                    { title: "Allow Challenges", desc: "Let others send you battle challenges", default: true },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2">
                      <div>
                        <div className="text-sm font-medium">{item.title}</div>
                        <div className="text-xs text-muted-foreground">{item.desc}</div>
                      </div>
                      <Switch defaultChecked={item.default} />
                    </div>
                  ))}
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
                  <button className="flex items-center gap-2 w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    <span>Active Sessions</span>
                  </button>
                </div>
              </div>
              <div className="glass-card rounded-[20px] p-6 border border-red-500/10">
                <h2 className="text-lg font-semibold mb-2 text-red-400">Danger Zone</h2>
                <p className="text-xs text-muted-foreground mb-4">These actions are irreversible.</p>
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
                  { name: "GitHub", desc: "Connected as @alexchen", icon: GithubIcon, connected: true },
                  { name: "Discord", desc: "Receive notifications via Discord", icon: Globe, connected: false },
                  { name: "Slack", desc: "Post updates to Slack channels", icon: Globe, connected: false },
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
                          <div className="text-sm font-medium">{integration.name}</div>
                          <div className="text-xs text-muted-foreground">{integration.desc}</div>
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
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
