"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  Search,
  Bell,
  Sun,
  Moon,
  Command,
  ChevronRight,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { mockNotifications } from "@/lib/mock-data";
import { useCurrentUser } from "@/hooks/api/use-auth";
import { NAV_ITEMS } from "@/lib/constants";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useLogout } from "@/hooks/api/use-auth";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// ===========================
// Breadcrumb Builder
// ===========================

function useBreadcrumbs() {
  const pathname = usePathname();

  const allItems = NAV_ITEMS.flatMap((g) => g.items);
  const activeItem = allItems.find((item) => item.href === pathname);

  const crumbs: { title: string; href?: string }[] = [
    { title: "DevBattle", href: "/dashboard" },
  ];

  if (activeItem) {
    const group = NAV_ITEMS.find((g) =>
      g.items.some((i) => i.href === pathname)
    );
    if (group) {
      crumbs.push({ title: group.group });
    }
    crumbs.push({ title: activeItem.title });
  }

  return crumbs;
}

// ===========================
// Search Trigger
// ===========================

interface SearchTriggerProps {
  onOpen: () => void;
}

function SearchTrigger({ onOpen }: SearchTriggerProps) {
  return (
    <motion.button
      id="topbar-search-trigger"
      onClick={onOpen}
      className={cn(
        "group flex h-9 items-center gap-2 rounded-xl border border-white/[0.06] px-3",
        "bg-white/[0.03] text-muted-foreground transition-colors",
        "hover:border-white/[0.1] hover:bg-white/[0.06] hover:text-foreground",
        "w-64"
      )}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <Search className="h-3.5 w-3.5" />
      <span className="flex-1 text-left text-sm">Search...</span>
      <kbd className="pointer-events-none flex h-5 items-center gap-0.5 rounded-md border border-white/[0.08] bg-white/[0.04] px-1.5 font-mono text-[10px] text-muted-foreground">
        <Command className="h-2.5 w-2.5" />K
      </kbd>
    </motion.button>
  );
}

// ===========================
// Notification Bell
// ===========================

function NotificationBell() {
  const unreadCount = mockNotifications.filter((n) => !n.isRead).length;

  return (
    <motion.button
      id="topbar-notifications"
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-xl",
        "text-muted-foreground transition-colors",
        "hover:bg-white/[0.06] hover:text-foreground"
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`${unreadCount} unread notifications`}
    >
      <Bell className="h-[18px] w-[18px]" />

      {unreadCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn(
            "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1",
            "bg-gradient-to-br from-purple-500 to-blue-500 text-[10px] font-bold text-white",
            "ring-2 ring-[#070B14]"
          )}
        >
          {unreadCount}
        </motion.div>
      )}
    </motion.button>
  );
}

// ===========================
// Theme Toggle
// ===========================

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-xl" />
    );
  }

  return (
    <motion.button
      id="topbar-theme-toggle"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-xl",
        "text-muted-foreground transition-colors",
        "hover:bg-white/[0.06] hover:text-foreground"
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Toggle theme"
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === "dark" ? 0 : 180 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        {theme === "dark" ? (
          <Sun className="h-[18px] w-[18px]" />
        ) : (
          <Moon className="h-[18px] w-[18px]" />
        )}
      </motion.div>
    </motion.button>
  );
}

// ===========================
// User Dropdown
// ===========================

function UserDropdown() {
  const { data: currentUser, isLoading } = useCurrentUser();
  const { mutate: logout } = useLogout();

  if (isLoading) {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />;
  }

  if (!currentUser) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <motion.button
            id="topbar-user-dropdown"
            className={cn(
              "flex items-center gap-2 rounded-xl px-2 py-1.5",
              "transition-colors hover:bg-white/[0.06]"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          />
        }
      >
        <Avatar size="sm">
          <AvatarImage
            src={currentUser.avatar || ''}
            alt={currentUser.name || currentUser.username}
          />
          <AvatarFallback>
            {(currentUser.name || currentUser.username).slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-56 glass-strong rounded-xl border-white/[0.08]"
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium text-foreground">
              {currentUser.name || currentUser.username}
            </p>
            <p className="text-xs text-muted-foreground">
              @{currentUser.username}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/[0.06]" />
        <DropdownMenuItem render={<Link href="/profile" />}>
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/settings" />}>
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/[0.06]" />
        <DropdownMenuItem 
          onClick={() => logout()}
          className="text-red-400 focus:text-red-400 cursor-pointer"
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ===========================
// Main Topbar Export
// ===========================

interface TopbarProps {
  onOpenCommandPalette: () => void;
}

export function Topbar({ onOpenCommandPalette }: TopbarProps) {
  const crumbs = useBreadcrumbs();

  return (
    <motion.header
      id="topbar"
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center justify-between gap-4 px-6",
        "border-b border-white/[0.04]",
        "bg-[#070B14]/80 backdrop-blur-xl"
      )}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Left: Breadcrumbs */}
      <Breadcrumb className="hidden md:block">
        <BreadcrumbList>
          {crumbs.map((crumb, index) => (
            <div key={crumb.title} className="flex items-center gap-1.5">
              <BreadcrumbItem>
                {index < crumbs.length - 1 ? (
                  <BreadcrumbLink
                    href={crumb.href ?? "#"}
                    className="text-muted-foreground/70 hover:text-foreground"
                  >
                    {crumb.title}
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="font-medium text-foreground">
                    {crumb.title}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {index < crumbs.length - 1 && (
                <BreadcrumbSeparator>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                </BreadcrumbSeparator>
              )}
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5">
        <div className="hidden lg:block">
          <SearchTrigger onOpen={onOpenCommandPalette} />
        </div>

        {/* Mobile search icon */}
        <motion.button
          onClick={onOpenCommandPalette}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl lg:hidden",
            "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Search"
        >
          <Search className="h-[18px] w-[18px]" />
        </motion.button>

        <NotificationBell />
        <ThemeToggle />

        {/* Vertical separator */}
        <div className="mx-1 h-6 w-px bg-white/[0.06]" />

        <UserDropdown />
      </div>
    </motion.header>
  );
}
