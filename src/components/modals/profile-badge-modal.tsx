"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, Shield, ExternalLink, Moon, Sun, Code2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { User } from "@/hooks/api/use-auth";

interface ProfileBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export type BadgeTheme = "dark" | "light";

export function ProfileBadgeModal({ isOpen, onClose, user }: ProfileBadgeModalProps) {
  const [selectedTheme, setSelectedTheme] = useState<BadgeTheme>("dark");
  const [copiedType, setCopiedType] = useState<"markdown" | "html" | "url" | null>(null);

  const username = user?.username || "developer";
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://codepulse.dev";
  const badgeUrl = `${baseUrl}/api/badge/${username}?theme=${selectedTheme}`;
  const profileUrl = `${baseUrl}/profile`;

  const markdownSnippet = `[![CodePulse Stats](${badgeUrl})](${profileUrl})`;
  const htmlSnippet = `<a href="${profileUrl}"><img src="${badgeUrl}" alt="CodePulse Developer Stats" /></a>`;

  const copyToClipboard = async (text: string, type: "markdown" | "html" | "url", label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      toast.success(`${label} copied to clipboard.`);
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      toast.error("Failed to copy snippet. Please copy manually.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-[#0d1117] border-white/10 text-slate-100 p-6 rounded-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Shield className="w-4 h-4" />
            </div>
            <DialogTitle className="text-lg font-semibold text-white">
              GitHub Profile Badge
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-400">
            Showcase your CodePulse developer tier, ranking, and contributions on your GitHub README.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Theme Selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300">
              Badge Theme
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "dark" as const, label: "Dark Mode", icon: Moon },
                { id: "light" as const, label: "Light Mode", icon: Sun },
              ].map((theme) => {
                const Icon = theme.icon;
                const isSelected = selectedTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setSelectedTheme(theme.id)}
                    className={cn(
                      "flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer",
                      isSelected
                        ? "bg-primary/15 border-primary/40 text-primary ring-1 ring-primary/20"
                        : "bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{theme.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Preview Container */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300">
                Live SVG Preview
              </label>
              <a
                href={badgeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <span>Open direct</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div
              className={cn(
                "rounded-xl border p-4 flex items-center justify-center transition-colors overflow-hidden",
                selectedTheme === "light"
                  ? "bg-slate-100 border-slate-300"
                  : "bg-[#090d16] border-white/10"
              )}
            >
              <img
                src={badgeUrl}
                alt={`${username}'s CodePulse developer badge`}
                className="max-w-full h-auto drop-shadow-md rounded-lg"
              />
            </div>
          </div>

          {/* Markdown Snippet */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300 flex items-center gap-1">
                <Code2 className="w-3.5 h-3.5 text-primary" />
                Markdown Code (for GitHub README)
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(markdownSnippet, "markdown", "Markdown")}
                className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors cursor-pointer"
              >
                {copiedType === "markdown" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Markdown</span>
                  </>
                )}
              </button>
            </div>
            <div className="relative">
              <pre className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap break-all">
                {markdownSnippet}
              </pre>
            </div>
          </div>

          {/* HTML Snippet */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300 flex items-center gap-1">
                <Code2 className="w-3.5 h-3.5 text-purple-400" />
                HTML Code (for Portfolio websites)
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(htmlSnippet, "html", "HTML")}
                className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors cursor-pointer"
              >
                {copiedType === "html" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy HTML</span>
                  </>
                )}
              </button>
            </div>
            <div className="relative">
              <pre className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap break-all">
                {htmlSnippet}
              </pre>
            </div>
          </div>

          {/* Footer Action */}
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => copyToClipboard(badgeUrl, "url", "Image URL")}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Direct Image URL</span>
            </button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white text-xs h-9 px-4"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
