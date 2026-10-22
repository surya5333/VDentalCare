import { Search, Bell, Calendar } from "lucide-react";

interface TopHeaderProps {
  role: string;
}

export function TopHeader({ role }: TopHeaderProps) {
  // Format current date: e.g., "Mon, 08 Sep 2026"
  const currentDate = new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <header className="h-16 bg-white border-b border-[var(--color-border)] flex items-center justify-between px-6 sticky top-0 z-10">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
          <input
            type="text"
            placeholder="Search by OP Number, Patient Name or Phone..."
            className="w-full pl-9 pr-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-shadow"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-6">
        {/* Date */}
        <div className="hidden md:flex items-center gap-2 text-sm text-[var(--color-muted)] font-medium">
          <Calendar className="w-4 h-4" />
          {currentDate}
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-background)] rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--color-danger)] rounded-full border border-white"></span>
        </button>

        {/* Profile Info */}
        <div className="flex items-center gap-3 pl-6 border-l border-[var(--color-border)]">
          <div className="w-9 h-9 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-semibold text-sm">
            {role.charAt(0)}
          </div>
          <div className="hidden sm:flex items-center gap-1 cursor-pointer">
            <span className="text-sm font-semibold text-[var(--color-foreground)]">
              {role}
            </span>
            <svg className="w-4 h-4 text-[var(--color-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    </header>
  );
}
