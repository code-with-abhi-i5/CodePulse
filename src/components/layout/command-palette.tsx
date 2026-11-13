"use client";

import { useEffect, useCallback, useState, useMemo, type ElementType } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  GitBranch,
  GitCompareArrows,
  Swords,
  Trophy,
  Target,
  Award,
  Users,
  User,
  Play,
  FileText,
  Search,
  Settings,
  Zap,
  Code,
  GitPullRequest,
  Star,
  FolderGit2,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import {
  CommandDialog,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { NAV_ITEMS } from "@/lib/constants";
import { useCurrentUser } from "@/hooks/api/use-auth";
import { mockRepositories } from "@/lib/mock-data";
import { formatNumber, cn } from "@/lib/utils";
import type { Repository } from "@/types";
import { toast } from "sonner";

// ===========================
// Icon Map
// ===========================

const CMD_ICON_MAP: Record<string, ElementType> = {
  LayoutDashboard,
  BarChart3,
  GitBranch,
  GitCompareArrows,
  Swords,
  Trophy,
  Target,
  Award,
  Users,
  User,
  Play,
  FileText,
  Search,
  Settings,
  Zap,
  Code,
  GitPullRequest,
  Star,
  FolderGit2,
};

// ===========================
// Quick Actions
// ===========================

interface QuickActionItem {
  title: string;
  icon: string;
  description: string;
  shortcut: string;
  action?: "battle";
  href?: string;
}

const QUICK_ACTIONS: QuickActionItem[] = [
  {
    title: "Start Quick Battle",
    icon: "Swords",
    description: "Challenge any developer to a 1v1 coding battle",
    shortcut: "B",
    action: "battle",
  },
  {
    title: "All Repositories",
    icon: "FolderGit2",
    description: "View and filter your GitHub repositories",
    shortcut: "R",
    href: "/repositories",
  },
  {
    title: "Compare Developers",
    icon: "GitCompareArrows",
    description: "Compare two developer profiles side-by-side",
    shortcut: "C",
    href: "/compare",
  },
  {
    title: "Search Users",
    icon: "Search",
    description: "Find and explore GitHub developers",
    shortcut: "U",
    href: "/users",
  },
];

const SEARCH_SUGGESTIONS = [
  {
    title: "Recent repositories",
    icon: "Code",
    description: "View your recently accessed repos",
    href: "/repositories",
  },
  {
    title: "Open Pull Requests",
    icon: "GitPullRequest",
    description: "View open pull requests and code reviews",
    href: "/activity",
  },
  {
    title: "Starred projects",
    icon: "Star",
    description: "View your starred repositories",
    href: "/repositories",
  },
];

// ===========================
// Popular Developers to Challenge
// ===========================

const POPULAR_CHALLENGERS = [
  {
    username: "torvalds",
    name: "Linus Torvalds",
    role: "Creator of Linux & Git",
    avatar: "https://avatars.githubusercontent.com/u/1024025?v=4",
  },
  {
    username: "gaearon",
    name: "Dan Abramov",
    role: "Redux & React core alumnus",
    avatar: "https://avatars.githubusercontent.com/u/810438?v=4",
  },
  {
    username: "yyx990803",
    name: "Evan You",
    role: "Creator of Vue.js & Vite",
    avatar: "https://avatars.githubusercontent.com/u/499550?v=4",
  },
  {
    username: "sindresorhus",
    name: "Sindre Sorhus",
    role: "Prolific open source creator",
    avatar: "https://avatars.githubusercontent.com/u/170270?v=4",
  },
  {
    username: "shadcn",
    name: "shadcn",
    role: "Creator of shadcn/ui",
    avatar: "https://avatars.githubusercontent.com/u/124599?v=4",
  },
  {
    username: "developit",
    name: "Jason Miller",
    role: "Creator of Preact",
    avatar: "https://avatars.githubusercontent.com/u/105127?v=4",
  },
];

// ===========================
// Command Palette Component
// ===========================

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const [mode, setMode] = useState<"main" | "battle">("main");
  const [searchQuery, setSearchQuery] = useState("");

  const cleanQuery = useMemo(() => {
    return searchQuery.trim().replace(/^@/, "");
  }, [searchQuery]);

  // Active Repositories for the user (falling back to mock repositories)
  const repositories: Repository[] = useMemo(() => {
    const userRepos = (currentUser as any)?.repositories;
    if (Array.isArray(userRepos) && userRepos.length > 0) {
      return userRepos;
    }
    return mockRepositories;
  }, [currentUser]);

  // Reset internal state when dialog closes
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setMode("main");
        setSearchQuery("");
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange]
  );

  // Global Keyboard Shortcuts (Cmd+K and Cmd+B)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Toggle palette on Cmd+K / Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) {
          handleOpenChange(false);
        } else {
          setMode("main");
          setSearchQuery("");
          onOpenChange(true);
        }
      }

      // Open directly into Quick Battle mode on Cmd+B / Ctrl+B
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setMode("battle");
        setSearchQuery("");
        onOpenChange(true);
      }
    },
    [open, onOpenChange, handleOpenChange]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Navigate to standard routes
  const handleSelect = (href: string) => {
    handleOpenChange(false);
    router.push(href);
  };

  // Navigate to a repository deep-analysis view
  const handleSelectRepo = (repo: Repository) => {
    handleOpenChange(false);
    toast.info(`Opening repository analysis for ${repo.name}...`);
    router.push(`/repositories/${encodeURIComponent(repo.name)}`);
  };

  // Launch a 1v1 developer battle
  const handleStartBattle = (rawUsername: string) => {
    const targetUser = rawUsername.replace(/^@/, "").trim();
    if (!targetUser) return;

    handleOpenChange(false);
    const p1 = currentUser?.username || "code-with-abhi-i5";
    toast.success(`Launching battle against @${targetUser}...`);
    router.push(
      `/battles?p1=${encodeURIComponent(p1)}&p2=${encodeURIComponent(targetUser)}`
    );
  };

  // Intercept Escape key when in "battle" mode to return to "main"
  const handleDialogKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && mode === "battle") {
      e.preventDefault();
      e.stopPropagation();
      setMode("main");
      setSearchQuery("");
    }
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={mode === "battle" ? "Start Quick Battle" : "Command Palette"}
      description={
        mode === "battle"
          ? "Type a GitHub username and hit Enter to jump directly into battle"
          : "Search repositories, navigation routes, or launch quick battles"
      }
      className="glass-strong max-w-[580px] rounded-2xl! border border-white/[0.08] bg-[#0d1117]/95! shadow-2xl shadow-purple-500/5"
    >
      <Command
        className="bg-transparent!"
        onKeyDown={handleDialogKeyDown}
      >
        {/* Quick Battle Header Banner (when in battle mode) */}
        {mode === "battle" && (
          <div className="flex items-center justify-between border-b border-white/[0.06] bg-purple-500/10 px-4 py-2 text-xs text-purple-200">
            <div className="flex items-center gap-2 font-medium">
              <Swords className="h-3.5 w-3.5 text-purple-400" />
              <span>Quick Battle Challenger</span>
            </div>
            <button
              onClick={() => {
                setMode("main");
                setSearchQuery("");
              }}
              className="inline-flex items-center gap-1 rounded bg-white/[0.06] px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-white/[0.1] hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" />
              Back (Esc)
            </button>
          </div>
        )}

        <CommandInput
          value={searchQuery}
          onValueChange={setSearchQuery}
          placeholder={
            mode === "battle"
              ? "Type GitHub username (e.g. torvalds, gaearon)..."
              : "Search repositories, commands, or @username..."
          }
        />

        <CommandList className="max-h-84 custom-scrollbar">
          <CommandEmpty className="py-8 text-center text-sm text-muted-foreground">
            <div className="flex flex-col items-center justify-center gap-2">
              <Search className="h-8 w-8 text-muted-foreground/30" />
              <p>No results found for &ldquo;{searchQuery}&rdquo;</p>
              {cleanQuery.length > 0 && mode === "main" && (
                <button
                  type="button"
                  onClick={() => handleStartBattle(cleanQuery)}
                  className="mt-2 inline-flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-300 transition-colors hover:bg-purple-500/20"
                >
                  <Swords className="h-3.5 w-3.5 text-purple-400" />
                  Battle @{cleanQuery} instead
                </button>
              )}
            </div>
          </CommandEmpty>

          {/* ======================================================== */}
          {/* MODE: BATTLE ONLY                                        */}
          {/* ======================================================== */}
          {mode === "battle" && (
            <>
              {cleanQuery.length > 0 && (
                <CommandGroup heading="Launch Battle">
                  <CommandItem
                    value={`battle ${cleanQuery} ${cleanQuery}`}
                    onSelect={() => handleStartBattle(cleanQuery)}
                    className="gap-3 rounded-lg px-3 py-2.5 data-selected:bg-white/[0.06] cursor-pointer"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-400 border border-purple-500/30">
                      <Swords className="h-4 w-4" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="text-sm font-medium text-foreground">
                        Battle @{cleanQuery}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Jump directly into 1v1 developer battle
                      </span>
                    </div>
                    <CommandShortcut>↵ Battle</CommandShortcut>
                  </CommandItem>
                </CommandGroup>
              )}

              <CommandGroup heading="Popular Challengers">
                {POPULAR_CHALLENGERS.map((dev) => (
                  <CommandItem
                    key={dev.username}
                    value={`battle ${dev.username} ${dev.name} ${dev.role}`}
                    onSelect={() => handleStartBattle(dev.username)}
                    className="gap-3 rounded-lg px-3 py-2.5 data-selected:bg-white/[0.06] cursor-pointer"
                  >
                    <Avatar className="h-8 w-8 rounded-lg border border-white/[0.08]">
                      <AvatarImage src={dev.avatar} alt={dev.name} />
                      <AvatarFallback className="rounded-lg bg-purple-500/10 text-xs text-purple-300">
                        {dev.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {dev.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          @{dev.username}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground truncate">
                        {dev.role}
                      </span>
                    </div>
                    <CommandShortcut>↵ Battle</CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* ======================================================== */}
          {/* MODE: MAIN COMMAND PALETTE                               */}
          {/* ======================================================== */}
          {mode === "main" && (
            <>
              {/* Dynamic Quick Battle action when user types a query */}
              {cleanQuery.length > 0 && (
                <CommandGroup heading="Quick Battle">
                  <CommandItem
                    value={`battle ${cleanQuery} quick-battle challenge vs`}
                    onSelect={() => handleStartBattle(cleanQuery)}
                    className="gap-3 rounded-lg px-3 py-2.5 data-selected:bg-white/[0.06] cursor-pointer"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-400 border border-purple-500/30">
                      <Swords className="h-4 w-4" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="text-sm font-medium text-foreground">
                        Start Quick Battle vs @{cleanQuery}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Hit Enter to jump directly into battle
                      </span>
                    </div>
                    <CommandShortcut>↵ Battle</CommandShortcut>
                  </CommandItem>
                </CommandGroup>
              )}

              {/* Repositories Group */}
              {repositories.length > 0 && (
                <CommandGroup heading="Repositories">
                  {repositories.map((repo) => {
                    const matchKeywords = `${repo.name} ${repo.fullName || ""} ${repo.language || ""} ${repo.topics?.join(" ") || ""} ${repo.description || ""} repo repository`;
                    return (
                      <CommandItem
                        key={repo.id || repo.name}
                        value={matchKeywords}
                        onSelect={() => handleSelectRepo(repo)}
                        className="gap-3 rounded-lg px-3 py-2.5 data-selected:bg-white/[0.06] cursor-pointer"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <FolderGit2 className="h-4 w-4" />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium text-foreground">
                              {repo.name}
                            </span>
                            {repo.isPrivate && (
                              <span className="rounded bg-white/[0.08] px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                Private
                              </span>
                            )}
                          </div>
                          <span className="truncate text-xs text-muted-foreground">
                            {repo.description || "GitHub repository"}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {repo.language && (
                            <span className="hidden items-center gap-1 text-[11px] text-muted-foreground sm:inline-flex">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{
                                  backgroundColor:
                                    repo.languageColor || "#38bdf8",
                                }}
                              />
                              {repo.language}
                            </span>
                          )}
                          {typeof repo.stars === "number" && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Star className="h-3 w-3 fill-amber-400/20 text-amber-400" />
                              {formatNumber(repo.stars)}
                            </span>
                          )}
                          <CommandShortcut className="hidden md:inline">
                            ↵ View
                          </CommandShortcut>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}

              <CommandSeparator className="bg-white/[0.06]" />

              {/* Quick Actions */}
              <CommandGroup heading="Quick Actions">
                {QUICK_ACTIONS.map((action) => {
                  const IconComponent =
                    CMD_ICON_MAP[action.icon] ?? Zap;
                  return (
                    <CommandItem
                      key={action.title}
                      value={`${action.title} quick action battle ${action.description}`}
                      onSelect={() => {
                        if (action.action === "battle") {
                          setMode("battle");
                          setSearchQuery("");
                        } else if (action.href) {
                          handleSelect(action.href);
                        }
                      }}
                      className="gap-3 rounded-lg px-3 py-2.5 data-selected:bg-white/[0.06] cursor-pointer"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10 text-purple-400 border border-purple-500/20">
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <span className="text-sm font-medium">
                          {action.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {action.description}
                        </span>
                      </div>
                      <CommandShortcut>⌘{action.shortcut}</CommandShortcut>
                    </CommandItem>
                  );
                })}
              </CommandGroup>

              <CommandSeparator className="bg-white/[0.06]" />

              {/* Navigation */}
              {NAV_ITEMS.map((group) => (
                <CommandGroup key={group.group} heading={group.group}>
                  {group.items.map((item) => {
                    const IconComponent =
                      CMD_ICON_MAP[item.icon] ?? LayoutDashboard;
                    return (
                      <CommandItem
                        key={item.href}
                        value={`${item.title} ${group.group} navigation link`}
                        onSelect={() => handleSelect(item.href)}
                        className="gap-3 rounded-lg px-3 py-2.5 data-selected:bg-white/[0.06] cursor-pointer"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-muted-foreground">
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {item.title}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {group.group}
                          </span>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ))}

              <CommandSeparator className="bg-white/[0.06]" />

              {/* Search Suggestions */}
              <CommandGroup heading="Shortcuts">
                {SEARCH_SUGGESTIONS.map((item) => {
                  const IconComponent = CMD_ICON_MAP[item.icon] ?? Search;
                  return (
                    <CommandItem
                      key={item.title}
                      value={`${item.title} ${item.description}`}
                      onSelect={() => handleSelect(item.href)}
                      className="gap-3 rounded-lg px-3 py-2.5 data-selected:bg-white/[0.06] cursor-pointer"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-muted-foreground">
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{item.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </>
          )}
        </CommandList>

        {/* Footer hint */}
        <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <kbd className="flex h-5 items-center rounded border border-white/[0.08] bg-white/[0.04] px-1.5 font-mono text-[10px] text-muted-foreground">
                ↑↓
              </kbd>
              <span className="text-[11px] text-muted-foreground">
                Navigate
              </span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="flex h-5 items-center rounded border border-white/[0.08] bg-white/[0.04] px-1.5 font-mono text-[10px] text-muted-foreground">
                ↵
              </kbd>
              <span className="text-[11px] text-muted-foreground">
                Select
              </span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="flex h-5 items-center rounded border border-white/[0.08] bg-white/[0.04] px-1.5 font-mono text-[10px] text-muted-foreground">
                esc
              </kbd>
              <span className="text-[11px] text-muted-foreground">
                {mode === "battle" ? "Back" : "Close"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1 text-[11px] text-purple-400 sm:inline-flex">
              <kbd className="flex h-5 items-center rounded border border-purple-500/30 bg-purple-500/10 px-1 font-mono text-[10px]">
                ⌘B
              </kbd>
              Quick Battle
            </span>
            <div className="flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-purple-400" />
              <span className="text-[11px] text-muted-foreground">
                CodePulse
              </span>
            </div>
          </div>
        </div>
      </Command>
    </CommandDialog>
  );
}
