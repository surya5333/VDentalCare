"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import Image from "next/image";

export default function ImageUploaderLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore
    } finally {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[var(--color-foreground)] flex flex-col">
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-40 bg-[#0F3157] text-white shadow-md border-b border-[#1a4473]">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-white rounded-md px-2 py-1">
              <Image
                src="/assets/v-dental-care-web-logo.png"
                alt="V Dental Care"
                width={120}
                height={34}
                priority
                className="object-contain"
              />
            </div>
            <span className="text-[10px] font-normal uppercase tracking-wider bg-[#0EA5E9]/20 text-[#0EA5E9] border border-[#0EA5E9]/30 px-1.5 py-0.5 rounded">
              Uploader
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-xs text-gray-200 hover:text-white bg-white/10 hover:bg-white/20 active:scale-95 transition-all px-2.5 py-1.5 rounded-lg"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content (Mobile Optimized) */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 pb-12">
        {children}
      </main>
    </div>
  );
}
