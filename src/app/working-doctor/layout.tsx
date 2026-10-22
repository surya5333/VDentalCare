"use client";

import { AppShell } from "@/components/layout/AppShell";
import { NavItem } from "@/components/layout/Sidebar";
import { List, Calendar } from "lucide-react";

const workingDoctorNav: NavItem[] = [
  { name: "OP List", href: "/working-doctor/op-list", icon: List },
  { name: "Appointments", href: "/working-doctor/appointments", icon: Calendar },
  { name: "Ortho OP List", href: "/working-doctor/ortho/op-list", icon: List },
];

export default function WorkingDoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="Working Doctor" userName="Working Doctor" navItems={workingDoctorNav}>
      {children}
    </AppShell>
  );
}
