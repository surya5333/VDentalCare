import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, User } from "lucide-react";
import Image from "next/image";

export interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  divider?: boolean;
}

interface SidebarProps {
  role: string;
  navItems: NavItem[];
  userName?: string;
}

export function Sidebar({ role, navItems }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="w-[240px] h-screen bg-[#0F3157] text-white flex flex-col flex-shrink-0 fixed left-0 top-0">
      {/* Brand & Role */}
      <div className="p-5 border-b border-[#1a4473]">
        <div className="flex justify-center mb-2">
          <div className="bg-white rounded-lg px-3 py-1.5">
            <Image
              src="/assets/v-dental-care-web-logo.png"
              alt="V Dental Care"
              width={170}
              height={48}
              priority
              className="object-contain"
            />
          </div>
        </div>
        <div className="text-sm text-[#8db3e2] font-medium tracking-wider uppercase text-center">
          {role}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 flex flex-col gap-1 overflow-y-auto">
        {navItems.map((item, i) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <div key={item.href}>
              {item.divider && i > 0 && <hr className="my-3 border-[#1a4473]" />}
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-[#0EA5E9] text-white"
                    : "text-[#b0cde8] hover:bg-[#1a4473] hover:text-white"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            </div>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className="p-4 border-t border-[#1a4473]">
        <div className="flex items-center gap-3 px-1">
          <div className="w-9 h-9 rounded-full bg-[#1a4473] flex items-center justify-center text-[#0EA5E9] shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">{role}</span>
            <button 
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' });
                // We use standard HTML refresh to clear all client state
                // eslint-disable-next-line @next/next/no-location-assign-relative-destination
                window.location.href = '/login';
              }}
              className="text-xs text-[#8db3e2] hover:text-white transition-colors text-left flex items-center gap-1"
            >
              <LogOut className="w-3 h-3" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
