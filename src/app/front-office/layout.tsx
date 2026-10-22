"use client";

import { AppShell } from "@/components/layout/AppShell";
import { NavItem } from "@/components/layout/Sidebar";
import { PlusCircle, List, Calendar, FileText, BookOpen, Settings } from "lucide-react";

const frontOfficeNav: NavItem[] = [
  { name: "New OP", href: "/front-office/new-op", icon: PlusCircle },
  { name: "OP List", href: "/front-office/op-list", icon: List },
  { name: "Appointments", href: "/front-office/appointments", icon: Calendar },
  { name: "Daily Counter", href: "/front-office/daily-counter", icon: BookOpen },
  { name: "Lab Reports", href: "/front-office/lab-reports", icon: FileText },
  { name: "Settings", href: "/front-office/settings", icon: Settings },
  { name: "Ortho OP List", href: "/front-office/ortho/op-list", icon: List },
];

export default function FrontOfficeLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="Front Office" userName="Front Office" navItems={frontOfficeNav}>
      {children}
    </AppShell>
  );
}
