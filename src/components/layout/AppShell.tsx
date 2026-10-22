import { Sidebar, NavItem } from "./Sidebar";
import { TopHeader } from "./TopHeader";

interface AppShellProps {
  children: React.ReactNode;
  role: string;
  userName: string;
  navItems: NavItem[];
}

export function AppShell({ children, role, userName, navItems }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--color-background)] flex">
      {/* Fixed Sidebar */}
      <Sidebar role={role} userName={userName} navItems={navItems} />

      {/* Main Content Wrapper - offset by Sidebar width */}
      <div className="flex-1 ml-[240px] flex flex-col min-h-screen overflow-x-hidden">
        <TopHeader role={role} />
        
        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
