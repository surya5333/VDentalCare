"use client";

import { Search, UserCheck } from "lucide-react";
import { Doctor } from "@/types/doctor";

interface OPFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  showDoctorFilter?: boolean;
  doctors?: Doctor[];
  selectedDoctor?: string;
  onDoctorChange?: (doctorId: string) => void;
}

export function OPFilters({
  searchTerm,
  onSearchChange,
  showDoctorFilter = false,
  doctors = [],
  selectedDoctor = "",
  onDoctorChange,
}: OPFiltersProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by OP Number, Name, or Phone..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all bg-white text-sm"
          />
        </div>

        {showDoctorFilter && (
          <div className="relative min-w-[200px]">
            <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={selectedDoctor}
              onChange={(e) => onDoctorChange?.(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all bg-white text-sm"
            >
              <option value="">All Doctors</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
