"use client";

import { AppShell } from "@/components/layout/AppShell";
import { NavItem } from "@/components/layout/Sidebar";
import { BookOpen, Calendar, BarChart3, Wallet, Settings } from "lucide-react";

const ManagerNav: NavItem[] = [
  { name: "Daily Counter", href: "/manager/daily-counter", icon: BookOpen },
  { name: "Monthly Ledger", href: "/manager/monthly-ledger", icon: Calendar },
  { name: "Manager Reports", href: "/manager/reports", icon: BarChart3 },
  { name: "Ortho OP List", href: "/manager/ortho/op-list", icon: BookOpen },
  { name: "Ortho Report", href: "/manager/ortho/financial-report", icon: BarChart3 },
  { name: "Expenses", href: "/manager/expenses", icon: Wallet, divider: true },
  { name: "Settings", href: "/manager/settings", icon: Settings },
];

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="Manager" userName="Manager" navItems={ManagerNav}>
      {children}
    </AppShell>
  );
}
