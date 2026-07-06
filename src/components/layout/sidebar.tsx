"use client";

import { useState, type ElementType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
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
  ChevronLeft,
  ChevronRight,
  LogOut,
  Zap,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";
import { useCurrentUser, useLogout } from "@/hooks/api/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetHeader,
} from "@/components/ui/sheet";

// ===========================
// Icon Map
// ===========================

const ICON_MAP: Record<string, ElementType> = {
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
  LogOut,
  Zap,
};

// ===========================
// Sidebar Logo
// ===========================

function SidebarLogo({ collapsed }: { collapsed: boolean }) {
  return (
    <Link
      href="/dashboard"
      id="sidebar-logo"
      className="flex items-center gap-3 px-3 py-2"
    >
      {/* Animated logo mark */}
      <motion.div
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        whileHover={{ scale: 1.05, rotate: -3 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
      >
        <Image src="/logo.png" alt="DevBattle Logo" width={36} height={36} className="rounded-xl relative z-10" />
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500 to-emerald-500 opacity-40 blur-lg" />
      </motion.div>

      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <span className="gradient-text whitespace-nowrap text-xl font-bold tracking-tight">
              DevBattle
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </Link>
  );
}

// ===========================
// Nav Item Component
// ===========================

interface NavItemProps {
  title: string;
  href: string;
  icon: string;
  isActive: boolean;
  collapsed: boolean;
  onClick?: () => void;
}

function NavItemLink({
  title,
  href,
  icon,
  isActive,
  collapsed,
  onClick,
}: NavItemProps) {
  const IconComponent = ICON_MAP[icon] ?? LayoutDashboard;

  const content = (
    <Link
      href={href}
      id={`nav-item-${title.toLowerCase().replace(/\s+/g, "-")}`}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200",
        isActive
          ? "text-white"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {/* Active indicator bar */}
      {isActive && (
        <motion.div
          layoutId="sidebar-active-indicator"
          className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-purple-400 to-blue-500"
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}

      {/* Active background glow */}
      {isActive && (
        <motion.div
          layoutId="sidebar-active-bg"
          className="absolute inset-0 rounded-xl bg-white/[0.06]"
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          style={{
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.04), 0 0 20px -8px rgba(139,92,246,0.3)",
          }}
        />
      )}

      {/* Hover background */}
      <motion.div
        className="absolute inset-0 rounded-xl bg-white/[0.03] opacity-0"
        whileHover={{ opacity: isActive ? 0 : 1 }}
        transition={{ duration: 0.15 }}
      />

      {/* Icon */}
      <motion.div
        className="relative z-10 flex shrink-0 items-center justify-center"
        whileHover={{ scale: 1.1 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
      >
        <IconComponent
          className={cn(
            "h-[18px] w-[18px] transition-colors duration-200",
            isActive
              ? "text-purple-400"
              : "text-muted-foreground group-hover:text-foreground"
          )}
        />
      </motion.div>

      {/* Label */}
      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 overflow-hidden whitespace-nowrap"
          >
            {title}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger render={<div />}>{content}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={12}>
          {title}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

// ===========================
// Navigation Group
// ===========================

interface NavGroupProps {
  group: string;
  items: { title: string; href: string; icon: string }[];
  collapsed: boolean;
  pathname: string;
  onItemClick?: () => void;
}

function NavGroup({
  group,
  items,
  collapsed,
  pathname,
  onItemClick,
}: NavGroupProps) {
  return (
    <div className="space-y-1">
      {/* Group label */}
      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              {group}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {collapsed && (
        <div className="mx-auto my-1 h-px w-6 rounded-full bg-white/[0.06]" />
      )}

      {/* Nav items */}
      <div className="space-y-0.5">
        {items.map((item) => (
          <NavItemLink
            key={item.href}
            title={item.title}
            href={item.href}
            icon={item.icon}
            isActive={pathname === item.href}
            collapsed={collapsed}
            onClick={onItemClick}
          />
        ))}
      </div>
    </div>
  );
}

// ===========================
// User Section
// ===========================

function UserSection({ collapsed }: { collapsed: boolean }) {
  const { data: currentUser, isLoading } = useCurrentUser();
  const { mutate: logout } = useLogout();

  return (
    <div className="space-y-2">
      <Separator className="bg-white/[0.06]" />
      <div className="px-2">
        <NavItemLink
          title="Settings"
          href="/settings"
          icon="Settings"
          isActive={false}
          collapsed={collapsed}
        />
        <button onClick={() => logout()} className="w-full">
          <NavItemLink
            title="Log Out"
            href="#"
            icon="LogOut"
            isActive={false}
            collapsed={collapsed}
          />
        </button>
      </div>

      <div className="px-2 pb-1">
        {isLoading ? (
          <div className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5",
            collapsed && "justify-center px-0"
          )}>
            <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
            {!collapsed && (
              <div className="flex flex-1 flex-col gap-1.5">
                <div className="h-3.5 w-24 animate-pulse rounded bg-white/10" />
                <div className="h-2.5 w-16 animate-pulse rounded bg-white/10" />
              </div>
            )}
          </div>
        ) : !currentUser ? null : (
          <Tooltip>
            <TooltipTrigger
              render={
                <Link
                  href="/profile"
                  id="sidebar-user-section"
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-200 hover:bg-white/[0.04]",
                    collapsed && "justify-center px-0"
                  )}
                />
              }
            >
              <div className="relative">
                <Avatar size="sm">
                  <AvatarImage
                    src={currentUser.avatar || ''}
                    alt={currentUser.name || currentUser.username}
                  />
                  <AvatarFallback>
                    {(currentUser.name || currentUser.username).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#070B14] bg-emerald-400" />
              </div>

              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="flex min-w-0 flex-1 flex-col overflow-hidden text-left"
                  >
                    <span className="truncate text-sm font-medium text-foreground">
                      {currentUser.name || currentUser.username}
                    </span>
                    <span className="truncate text-[11px] text-muted-foreground">
                      @{currentUser.username}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" sideOffset={12}>
                {currentUser.name || currentUser.username}
              </TooltipContent>
            )}
          </Tooltip>
        )}
      </div>
    </div>
  );
}

// ===========================
// Desktop Sidebar
// ===========================

function DesktopSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <motion.aside
      id="desktop-sidebar"
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col",
        "glass-strong",
        "border-r border-white/[0.06]"
      )}
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-3">
        <SidebarLogo collapsed={collapsed} />
      </div>

      {/* Navigation */}
      <nav className="custom-scrollbar flex-1 overflow-y-auto px-2 py-4">
        <div className="space-y-6">
          {NAV_ITEMS.map((group) => (
            <NavGroup
              key={group.group}
              group={group.group}
              items={group.items}
              collapsed={collapsed}
              pathname={pathname}
            />
          ))}
        </div>
      </nav>

      {/* User section */}
      <UserSection collapsed={collapsed} />

      {/* Collapse toggle */}
      <div className="flex items-center justify-center border-t border-white/[0.06] px-2 py-3">
        <motion.button
          id="sidebar-collapse-toggle"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            "text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
          )}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <motion.div
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <ChevronLeft className="h-4 w-4" />
          </motion.div>
        </motion.button>
      </div>
    </motion.aside>
  );
}

// ===========================
// Mobile Sidebar
// ===========================

function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <button
            id="mobile-sidebar-trigger"
            className={cn(
              "fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl",
              "glass-strong text-foreground",
              "md:hidden"
            )}
            aria-label="Open navigation menu"
          />
        }
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-72 border-r border-white/[0.06] bg-[#070B14] p-0"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation Menu</SheetTitle>
        </SheetHeader>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center px-3">
            <SidebarLogo collapsed={false} />
          </div>

          {/* Navigation */}
          <nav className="custom-scrollbar flex-1 overflow-y-auto px-2 py-4">
            <div className="space-y-6">
              {NAV_ITEMS.map((group) => (
                <NavGroup
                  key={group.group}
                  group={group.group}
                  items={group.items}
                  collapsed={false}
                  pathname={pathname}
                  onItemClick={() => setOpen(false)}
                />
              ))}
            </div>
          </nav>

          {/* User section */}
          <UserSection collapsed={false} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ===========================
// Main Sidebar Export
// ===========================

export function Sidebar() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileSidebar />;
  }

  return <DesktopSidebar />;
}
