"use client";

import { useEffect, useState } from "react";
import { OrthoOPDetails } from "@/components/op-details/OrthoOPDetails";
import { opService } from "@/services/opService";
import { CompleteOPRecord } from "@/types/op";
import { use } from "react";

export default function OrthoOPDetailsPage({ params }: { params: Promise<{ opNumber: string }> }) {
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

  // If the user navigates directly to the ortho OP details page for a General OP, redirect them
  if (data.patient.workflowType === "GENERAL") {
    if (typeof window !== "undefined") {
      window.location.replace(`/clinic-head/op-list/${opNumber}`);
    }
    return null;
  }

  return <OrthoOPDetails role="Clinic Head" backHref="/clinic-head/ortho/op-list" data={data} />;
}
