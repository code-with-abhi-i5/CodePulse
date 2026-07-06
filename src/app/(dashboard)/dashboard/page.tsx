import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your personal developer analytics dashboard — track commits, PRs, reviews, and more.",
};

export default function DashboardPage() {
  return <DashboardContent />;
}

import { DashboardContent } from "./dashboard-content";
