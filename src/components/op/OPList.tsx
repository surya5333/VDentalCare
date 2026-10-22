"use client";

import { useEffect, useState } from "react";
import { CompleteOPRecord } from "@/types/op";
import { Doctor } from "@/types/doctor";
import { opService } from "@/services/opService";
import { doctorService } from "@/services/doctorService";
import { OPFilters } from "./OPFilters";
import { OPTable } from "./OPTable";

interface OPListProps {
  baseRoute: string;
  workflowType?: "GENERAL" | "ORTHO";
}

export function OPList({ baseRoute, workflowType = "GENERAL" }: OPListProps) {
  const [records, setRecords] = useState<CompleteOPRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isWorkingDoctor = baseRoute.startsWith("/working-doctor");

  useEffect(() => {
    if (isWorkingDoctor) {
      doctorService.getDoctors().then(setDoctors);
    }
  }, [isWorkingDoctor]);

  useEffect(() => {
    const fetchRecords = async () => {
      setIsLoading(true);
      try {
        const data = await opService.searchOP(
          searchTerm,
          isWorkingDoctor ? selectedDoctor : undefined,
          workflowType
        );
        setRecords(data);
      } catch (error) {
        console.error("Failed to fetch OP list", error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchRecords();
    }, 300); // 300ms debounce

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, selectedDoctor, isWorkingDoctor]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
          {workflowType === "ORTHO" ? "Ortho OP List" : "OP List"}
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          {workflowType === "ORTHO" 
            ? "Manage and view Ortho patient records." 
            : "Manage and view General patient OP records."}
        </p>
      </div>

      <OPFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showDoctorFilter={isWorkingDoctor}
        doctors={doctors}
        selectedDoctor={selectedDoctor}
        onDoctorChange={setSelectedDoctor}
      />

      {isLoading ? (
        <div className="flex justify-center items-center h-48 bg-white rounded-xl shadow-sm border border-[var(--color-border)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
        </div>
      ) : (
        <OPTable records={records} baseRoute={baseRoute} />
      )}
    </div>
  );
}
