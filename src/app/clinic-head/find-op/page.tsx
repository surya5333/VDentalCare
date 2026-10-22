"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function FindOPPage() {
  const [opNumber, setOpNumber] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (opNumber.trim()) {
      router.push(`/clinic-head/op-list/${opNumber.trim()}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-12">
      <div className="bg-white rounded-xl shadow-sm border border-[var(--color-border)] p-8">
        <h1 className="text-2xl font-bold text-[var(--color-foreground)] mb-2">Find OP</h1>
        <p className="text-[var(--color-muted)] mb-8">
          Enter an OP Number directly to view and manage clinical details.
        </p>

        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="e.g. OP1025"
              value={opNumber}
              onChange={(e) => setOpNumber(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent text-lg"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={!opNumber.trim()}
            className="px-8 py-3 bg-[var(--color-primary)] text-white font-medium rounded-lg hover:bg-[#0b8ec7] transition-colors disabled:opacity-50 text-lg"
          >
            Search
          </button>
        </form>
      </div>
    </div>
  );
}
