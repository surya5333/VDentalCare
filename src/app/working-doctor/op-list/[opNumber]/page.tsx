"use client";

import { useEffect, useState } from "react";
import { OPDetails } from "@/components/op-details/OPDetails";
import { opService } from "@/services/opService";
import { CompleteOPRecord } from "@/types/op";
import { use } from "react";

export default function WorkingDoctorOPDetailsPage({ params }: { params: Promise<{ opNumber: string }> }) {
  const { opNumber } = use(params);
  const [data, setData] = useState<CompleteOPRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const record = await opService.getOPByNumber(opNumber);
        setData(record);
      } catch (error) {
        console.error("Failed to load OP details", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [opNumber]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-[var(--color-border)] p-12 text-center">
        <h2 className="text-xl font-bold text-[var(--color-foreground)] mb-2">Patient Not Found</h2>
        <p className="text-[var(--color-muted)]">Could not find records for {opNumber}</p>
      </div>
    );
  }

  // If the user navigates directly to the general OP details page for an Ortho OP, redirect them
  if (data.patient.workflowType === "ORTHO") {
    if (typeof window !== "undefined") {
      window.location.replace(`/working-doctor/ortho/op-list/${opNumber}`);
    }
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <OPDetails 
        role="Working Doctor" 
        backHref="/working-doctor/op-list" 
        data={data} 
      />
    </div>
  );
}
