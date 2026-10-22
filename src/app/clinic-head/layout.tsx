"use client";

import { AppShell } from "@/components/layout/AppShell";
import { NavItem } from "@/components/layout/Sidebar";
import { List, Search, FileText, Settings } from "lucide-react";

const ClinicHeadNav: NavItem[] = [
  { name: "OP List", href: "/clinic-head/op-list", icon: List },
  { name: "Find OP", href: "/clinic-head/find-op", icon: Search },
  { name: "Lab Reports", href: "/clinic-head/lab-reports", icon: FileText },
  { name: "Settings", href: "/clinic-head/settings", icon: Settings },
  { name: "Ortho OP List", href: "/clinic-head/ortho/op-list", icon: List },
];

export default function ClinicHeadLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="Clinic Head" userName="Clinic Head" navItems={ClinicHeadNav}>
      {children}
    </AppShell>
  );
}
