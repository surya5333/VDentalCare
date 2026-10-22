"use client";

import { useState, useEffect } from "react";
import { TreatmentLabInfo } from "@/types/op";
import { CrownTypeOption, LabOption } from "@/types/doctor";
import { doctorService } from "@/services/doctorService";

interface TreatmentLabInfoTableProps {
  data: TreatmentLabInfo;
  isEditable?: boolean;
  onChange?: (updates: Partial<TreatmentLabInfo>) => void;
}

export function TreatmentLabInfoTable({ data, isEditable, onChange }: TreatmentLabInfoTableProps) {
  const [crownTypes, setCrownTypes] = useState<CrownTypeOption[]>([]);
  const [labs, setLabs] = useState<LabOption[]>([]);

  useEffect(() => {
    doctorService.getCrownTypes().then(setCrownTypes);
    doctorService.getLabs().then(setLabs);
  }, []);

  const handleChange = (field: keyof TreatmentLabInfo, value: string | number | null | string[]) => {
    if (onChange) {
      onChange({ [field]: value });
    }
  };

  // Calculate Total Crown Cost from fetched crownTypes
  const selectedCrown = crownTypes.find(c => c.id === data.crownType);
  const crownPatientPrice = selectedCrown?.patientPrice ?? 0;
  const numCrowns = data.numberOfCrowns ?? 0;
  const totalCrownCost = crownPatientPrice * numCrowns;

  return (
    <div>
      <h2 className="text-base font-bold text-[var(--color-foreground)] mb-3">
        Treatment & Lab Information
      </h2>
      <div className="border border-[var(--color-border)] rounded-lg overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F0F4F8] border-b border-[var(--color-border)]">
                <th className="text-left px-4 py-2.5 font-semibold text-[var(--color-muted)] text-xs uppercase tracking-wide whitespace-nowrap">E+G / EHS / GEN</th>
                <th className="text-left px-4 py-2.5 font-semibold text-[var(--color-muted)] text-xs uppercase tracking-wide whitespace-nowrap">Crown Type</th>
                <th className="text-left px-4 py-2.5 font-semibold text-[var(--color-muted)] text-xs uppercase tracking-wide whitespace-nowrap">Number of Crowns</th>
                <th className="text-left px-4 py-2.5 font-semibold text-[var(--color-muted)] text-xs uppercase tracking-wide whitespace-nowrap">Lab</th>
                <th className="text-left px-4 py-2.5 font-semibold text-[var(--color-muted)] text-xs uppercase tracking-wide whitespace-nowrap">Total Crown Cost</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white">
                <td className="px-4 py-3 text-[var(--color-foreground)] min-w-[140px] font-medium">
                  {data.egEhsGen || "—"}
                </td>
                <td className="px-4 py-3 text-[var(--color-foreground)] min-w-[140px]">
                  {crownTypes.find(ct => ct.id === data.crownType)?.name || data.crownType || "—"}
                </td>
                <td className="px-4 py-3 text-[var(--color-foreground)] min-w-[120px]">
                  {data.numberOfCrowns ?? "—"}
                </td>
                <td className="px-4 py-3 text-[var(--color-foreground)] min-w-[140px]">
                  {isEditable ? (
                    <select
                      value={data.lab}
                      onChange={(e) => handleChange("lab", e.target.value)}
                      className="w-full px-2 py-1.5 border border-[var(--color-border)] rounded outline-none focus:border-[var(--color-primary)]"
                    >
                      <option value="">Select...</option>
                      {labs.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    labs.find(l => l.id === data.lab)?.name || data.lab || "—"
                  )}
                </td>
                <td className="px-4 py-3 text-[var(--color-foreground)] whitespace-nowrap">
                  {totalCrownCost > 0 ? (
                    <div>
                      <span className="font-semibold text-[var(--color-foreground)]">
                        ₹{totalCrownCost.toLocaleString("en-IN")}
                      </span>
                      <div className="text-[11px] text-[var(--color-muted)]">
                        ₹{crownPatientPrice.toLocaleString("en-IN")} × {numCrowns}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[var(--color-muted)]">—</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
