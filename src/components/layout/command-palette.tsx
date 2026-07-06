"use client";

import { useEffect, useCallback, type ElementType } from "react";
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
import { NAV_ITEMS } from "@/lib/constants";

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
};

// ===========================
// Quick Actions
// ===========================

const QUICK_ACTIONS = [
  {
    title: "New Battle",
    icon: "Swords",
    description: "Challenge someone to a coding battle",
    shortcut: "B",
  },
  {
    title: "Compare Developers",
    icon: "GitCompareArrows",
    description: "Compare two developer profiles",
    shortcut: "C",
  },
  {
    title: "Search Users",
    icon: "Search",
    description: "Find GitHub developers",
    shortcut: "U",
  },
];

const SEARCH_SUGGESTIONS = [
  {
    title: "Recent repositories",
    icon: "Code",
    description: "View your recently accessed repos",
  },
  {
    title: "Pull requests",
    icon: "GitPullRequest",
    description: "View open pull requests",
  },
  {
    title: "Starred projects",
    icon: "Star",
    description: "View your starred repositories",
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

  // Cmd+K keyboard shortcut
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    },
    [open, onOpenChange]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleSelect = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Command Palette"
      description="Search commands, navigate, or perform quick actions"
      className="glass-strong max-w-[560px] rounded-2xl! border border-white/[0.08] bg-[#0d1117]/95! shadow-2xl shadow-purple-500/5"
    >
      <Command className="bg-transparent!">
        <CommandInput placeholder="Type a command or search..." />
        <CommandList className="max-h-80 custom-scrollbar">
          <CommandEmpty className="py-8 text-center text-sm text-muted-foreground">
            No results found.
          </CommandEmpty>

          {/* Navigation */}
          {NAV_ITEMS.map((group) => (
            <CommandGroup key={group.group} heading={group.group}>
              {group.items.map((item) => {
                const IconComponent =
                  CMD_ICON_MAP[item.icon] ?? LayoutDashboard;
                return (
                  <CommandItem
                    key={item.href}
                    value={`${item.title} ${group.group}`}
                    onSelect={() => handleSelect(item.href)}
                    className="gap-3 rounded-lg px-3 py-2.5 data-selected:bg-white/[0.06]"
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
          <CommandGroup heading="Search">
            {SEARCH_SUGGESTIONS.map((item) => {
              const IconComponent = CMD_ICON_MAP[item.icon] ?? Search;
              return (
                <CommandItem
                  key={item.title}
                  value={item.title}
                  className="gap-3 rounded-lg px-3 py-2.5 data-selected:bg-white/[0.06]"
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

          <CommandSeparator className="bg-white/[0.06]" />

          {/* Quick Actions */}
          <CommandGroup heading="Quick Actions">
            {QUICK_ACTIONS.map((action) => {
              const IconComponent =
                CMD_ICON_MAP[action.icon] ?? Zap;
              return (
                <CommandItem
                  key={action.title}
                  value={action.title}
                  className="gap-3 rounded-lg px-3 py-2.5 data-selected:bg-white/[0.06]"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10 text-purple-400">
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
                Close
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-purple-400" />
            <span className="text-[11px] text-muted-foreground">
              DevBattle
            </span>
          </div>
        </div>
      </Command>
    </CommandDialog>
  );
}
