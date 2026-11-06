"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Download,
  FileImage,
  FileSpreadsheet,
  Loader2,
  Trophy,
  GitCommit,
  Star,
  GitFork,
  Code2,
  Flame,
  CheckCircle2,
  Sparkles,
  Zap,
} from "lucide-react";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { formatNumber } from "@/lib/utils";

interface AnalyticsExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  stats: any;
  rating: any;
  languages: any[];
  repos: any[];
  longestStreak: number;
}

export function AnalyticsExportModal({
  isOpen,
  onClose,
  currentUser,
  stats,
  rating,
  languages,
  repos,
  longestStreak,
}: AnalyticsExportModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const scorecardRef = useRef<HTMLDivElement>(null);

  if (!currentUser) return null;

  const username = currentUser.username || "developer";
  const displayName = currentUser.name || username;
  const avatarUrl = currentUser.avatar;
  const totalCommits = stats.totalCommits || 0;
  const totalPRs = stats.totalPRs || 0;
  const totalStars = stats.totalStars || 0;
  const tier = rating.tier || "GOLD";
  const globalRank = rating.rank || 1;
  const overallScore = rating.overall || 0;

  // Top 4 languages for scorecard
  const topLanguages = Array.isArray(languages) ? languages.slice(0, 4) : [];

  // ===========================
  // PNG Export Handler
  // ===========================
  const handleDownloadPng = async () => {
    if (!scorecardRef.current) return;
    setIsGenerating(true);

    try {
      const canvas = await html2canvas(scorecardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#0B0F19",
        logging: false,
      });

      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${username}-codepulse-scorecard.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Analytics scorecard PNG downloaded!");
    } catch (err) {
      console.error("Failed to generate image:", err);
      toast.error("Failed to generate PNG image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // ===========================
  // CSV Export Handler
  // ===========================
  const handleExportCsv = () => {
    try {
      const escapeCsv = (val: any) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const rows: string[] = [];

      // 1. Report Header
      rows.push("CODEPULSE DEVELOPER ANALYTICS REPORT");
      rows.push(`Exported At,${new Date().toISOString()}`);
      rows.push(`Platform,CodePulse (Nexus Spring of Code 2026)`);
      rows.push("");

      // 2. Overview Summary
      rows.push("DEVELOPER PROFILE SUMMARY");
      rows.push(
        "Username,Name,Global Rank,Overall Score,Tier,Growth Score,Total Commits,Total PRs,Total Issues,Total Stars,Longest Streak (Days),Total Repositories"
      );
      rows.push(
        [
          escapeCsv(username),
          escapeCsv(displayName),
          escapeCsv(globalRank),
          escapeCsv(overallScore),
          escapeCsv(tier),
          escapeCsv(rating.growthScore || 0),
          escapeCsv(totalCommits),
          escapeCsv(totalPRs),
          escapeCsv(stats.totalIssues || 0),
          escapeCsv(totalStars),
          escapeCsv(longestStreak),
          escapeCsv(repos.length),
        ].join(",")
      );

      rows.push("");

      // 3. Repositories
      rows.push("REPOSITORIES METRICS");
      rows.push(
        "Repository Name,Language,Stars,Forks,Commits,Issues,Pull Requests,Created At,Updated At,URL"
      );
      if (Array.isArray(repos) && repos.length > 0) {
        repos.forEach((repo: any) => {
          rows.push(
            [
              escapeCsv(repo.name || "Untitled"),
              escapeCsv(repo.language || "Unknown"),
              escapeCsv(repo.stars || 0),
              escapeCsv(repo.forks || 0),
              escapeCsv(repo.commits || 0),
              escapeCsv(repo.issues || 0),
              escapeCsv(repo.pullRequests || 0),
              escapeCsv(repo.createdAt || ""),
              escapeCsv(repo.updatedAt || ""),
              escapeCsv(repo.url || ""),
            ].join(",")
          );
        });
      } else {
        rows.push("No repositories available");
      }

      rows.push("");

      // 4. Languages
      rows.push("LANGUAGE BREAKDOWN");
      rows.push("Language,Percentage,Lines of Code,Repositories Count");
      if (Array.isArray(languages) && languages.length > 0) {
        languages.forEach((lang: any) => {
          rows.push(
            [
              escapeCsv(lang.name || "Unknown"),
              escapeCsv(`${lang.percentage || 0}%`),
              escapeCsv(lang.linesOfCode || 0),
              escapeCsv(lang.repos || 0),
            ].join(",")
          );
        });
      } else {
        rows.push("No language data available");
      }

      const csvContent = rows.join("\r\n");
      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `${username}-codepulse-analytics-data.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Analytics CSV exported successfully!");
    } catch (err) {
      console.error("Failed to export CSV:", err);
      toast.error("Failed to export CSV file");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl sm:max-w-3xl bg-[#0B0F19]/95 backdrop-blur-2xl border border-white/10 text-white rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-4">
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Export & Share Report
          </div>
          <DialogTitle className="text-2xl sm:text-3xl font-black text-white">
            Export Developer Analytics
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-sm">
            Download your developer scorecard as a high-resolution PNG image or
            export full repository and commit statistics as a CSV file.
          </DialogDescription>
        </DialogHeader>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Option 1: PNG Card */}
          <div className="glass-card rounded-2xl p-5 border border-white/10 bg-white/[0.02] flex flex-col justify-between hover:border-purple-500/30 transition-all">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
                <FileImage className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base mb-1">
                Download Image (.PNG)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                High-resolution branded scorecard summary showing your rank,
                total score, commits, and top languages.
              </p>
            </div>
            <button
              onClick={handleDownloadPng}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-500/20 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating PNG...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download PNG</span>
                </>
              )}
            </button>
          </div>

          {/* Option 2: CSV Card */}
          <div className="glass-card rounded-2xl p-5 border border-white/10 bg-white/[0.02] flex flex-col justify-between hover:border-blue-500/30 transition-all">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base mb-1">
                Export Raw Data (.CSV)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Structured spreadsheet containing all repository metrics, commit
                tallies, PRs, and language distributions.
              </p>
            </div>
            <button
              onClick={handleExportCsv}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-white/10 hover:bg-white/15 border border-white/10 text-white transition-all active:scale-[0.98] cursor-pointer"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>

        {/* Live Card Preview Section */}
        <div className="relative">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">
            <span>Scorecard Image Preview</span>
            <span className="text-[11px] text-purple-400">Captured in 2x HD</span>
          </div>

          {/* Branded Developer Scorecard Container (Captured by html2canvas) */}
          <div
            ref={scorecardRef}
            className="w-full rounded-2xl bg-[#0B0F19] border border-white/15 p-6 text-white shadow-2xl relative overflow-hidden"
            style={{ minHeight: "340px" }}
          >
            {/* Ambient Background Gradient for sharp export */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Scorecard Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center font-black text-white text-base shadow-md">
                  ⚡
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-white tracking-tight">
                      CodePulse
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold uppercase tracking-wider">
                      Developer Scorecard
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-mono">
                  codepulse.dev
                </span>
              </div>
            </div>

            {/* Profile Identity Bar */}
            <div className="flex items-center justify-between gap-4 mb-5 relative z-10">
              <div className="flex items-center gap-3">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={username}
                    crossOrigin="anonymous"
                    className="w-12 h-12 rounded-xl border border-white/20 object-cover shadow-md"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg border border-white/20">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="text-lg font-black text-white leading-tight">
                    {displayName}
                  </h4>
                  <p className="text-xs text-purple-400 font-mono">@{username}</p>
                </div>
              </div>

              {/* Tier Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs uppercase tracking-wider shadow-sm">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                {tier} TIER
              </div>
            </div>

            {/* Core Stats Bento Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 relative z-10">
              <div className="rounded-xl bg-white/[0.04] border border-white/10 p-3 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider flex items-center justify-center gap-1 mb-1">
                  <Trophy className="w-3 h-3 text-amber-400" /> Global Rank
                </div>
                <div className="text-xl font-black text-white">#{globalRank}</div>
              </div>

              <div className="rounded-xl bg-white/[0.04] border border-white/10 p-3 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider flex items-center justify-center gap-1 mb-1">
                  <Zap className="w-3 h-3 text-purple-400" /> Rating Score
                </div>
                <div className="text-xl font-black text-purple-300">
                  {overallScore}
                </div>
              </div>

              <div className="rounded-xl bg-white/[0.04] border border-white/10 p-3 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider flex items-center justify-center gap-1 mb-1">
                  <GitCommit className="w-3 h-3 text-emerald-400" /> Commits
                </div>
                <div className="text-xl font-black text-emerald-300">
                  {formatNumber(totalCommits)}
                </div>
              </div>

              <div className="rounded-xl bg-white/[0.04] border border-white/10 p-3 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider flex items-center justify-center gap-1 mb-1">
                  <Flame className="w-3 h-3 text-orange-400" /> Max Streak
                </div>
                <div className="text-xl font-black text-orange-300">
                  {longestStreak}d
                </div>
              </div>
            </div>

            {/* Top Languages Section */}
            {topLanguages.length > 0 && (
              <div className="relative z-10 mb-4 rounded-xl bg-white/[0.03] border border-white/10 p-3">
                <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-2 flex items-center gap-1.5">
                  <Code2 className="w-3 h-3 text-blue-400" /> Top Languages
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {topLanguages.map((lang: any) => (
                    <div
                      key={lang.name}
                      className="flex items-center gap-2 bg-white/5 rounded-lg px-2.5 py-1.5 border border-white/5"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: lang.color || "#3b82f6" }}
                      />
                      <div className="truncate text-xs">
                        <span className="font-semibold text-slate-200">
                          {lang.name}
                        </span>{" "}
                        <span className="text-slate-400 text-[10px]">
                          {lang.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scorecard Footer */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-white/10 relative z-10 font-medium">
              <span>CodePulse • Nexus Spring of Code 2026</span>
              <span>
                Generated {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

