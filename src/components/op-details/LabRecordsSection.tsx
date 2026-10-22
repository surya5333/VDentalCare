"use client";

import { useEffect, useState } from "react";
import { LabRecord } from "@/types/lab";
import { DateInput, formatToDDMMYYYY } from "@/components/ui/DateInput";

interface LabRecordsSectionProps {
  opNumber: string;
  isEditable?: boolean;
}

export function LabRecordsSection({ opNumber, isEditable }: LabRecordsSectionProps) {
  const [records, setRecords] = useState<LabRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRecords = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await fetch(`/api/op/${opNumber}/lab-records`);
      if (!res.ok) throw new Error("Failed to fetch lab records");
      const data = await res.json();
      setRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opNumber]);

  const handleUpdate = async (id: string, updates: Partial<LabRecord>) => {
    try {
      const res = await fetch(`/api/op/${opNumber}/lab-records/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update lab record");
      
      // refresh
      fetchRecords(true);
    } catch (err) {
      alert("Failed to update: " + (err instanceof Error ? err.message : "Error"));
    }
  };

  if (isLoading) return <div>Loading lab records...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (records.length === 0) return <div>No lab records found for this OP.</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-[#1e40af]">Lab Workflow & Tracking</h3>
      
      <div className="overflow-x-auto border border-[var(--color-border)] rounded-lg bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F0F4F8] border-b border-[var(--color-border)]">
              <th className="text-left px-4 py-2 font-semibold text-[var(--color-muted)] text-xs uppercase">Treatment</th>
              <th className="text-left px-4 py-2 font-semibold text-[var(--color-muted)] text-xs uppercase">Lab</th>
              <th className="text-left px-4 py-2 font-semibold text-[var(--color-muted)] text-xs uppercase">Parcel Sent</th>
              <th className="text-left px-4 py-2 font-semibold text-[var(--color-muted)] text-xs uppercase">Target Receive</th>
              <th className="text-left px-4 py-2 font-semibold text-[var(--color-muted)] text-xs uppercase">M1 Received</th>
              <th className="text-left px-4 py-2 font-semibold text-[var(--color-muted)] text-xs uppercase">Bisque Received</th>
              <th className="text-left px-4 py-2 font-semibold text-[var(--color-muted)] text-xs uppercase">Glaze 1 Received</th>
              <th className="text-left px-4 py-2 font-semibold text-[var(--color-muted)] text-xs uppercase">Glaze 2 Received</th>
              <th className="text-left px-4 py-2 font-semibold text-[var(--color-muted)] text-xs uppercase">Warranty Rcvd</th>
              <th className="text-left px-4 py-2 font-semibold text-[var(--color-muted)] text-xs uppercase">Warranty Given</th>
              <th className="text-left px-4 py-2 font-semibold text-[var(--color-muted)] text-xs uppercase">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => {
              const treatmentName = r.finalizedTreatment?.treatment?.name || 'Unknown';
              const crownName = r.finalizedTreatment?.crownType?.name ? ` - ${r.finalizedTreatment.crownType.name}` : '';
              
              return (
                <tr key={r.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-2 text-[var(--color-foreground)] min-w-[150px]">
                    {treatmentName}{crownName}
                  </td>
                  <td className="px-4 py-2 text-[var(--color-foreground)]">
                    {r.lab?.name || 'Unknown'}
                  </td>
                  <DateCell value={r.parcelSentDate} onChange={(d) => handleUpdate(r.id, { parcelSentDate: d })} isEditable={isEditable} />
                  <DateCell value={r.targetReceiveDate} onChange={(d) => handleUpdate(r.id, { targetReceiveDate: d })} isEditable={isEditable} />
                  <DateCell value={r.m1ReceivedDate} onChange={(d) => handleUpdate(r.id, { m1ReceivedDate: d })} isEditable={isEditable} />
                  <DateCell value={r.bisqueReceivedDate} onChange={(d) => handleUpdate(r.id, { bisqueReceivedDate: d })} isEditable={isEditable} />
                  <DateCell value={r.glazeReceivedFirstDate} onChange={(d) => handleUpdate(r.id, { glazeReceivedFirstDate: d })} isEditable={isEditable} />
                  <DateCell value={r.glazeReceivedSecondDate} onChange={(d) => handleUpdate(r.id, { glazeReceivedSecondDate: d })} isEditable={isEditable} />
                  <DateCell value={r.warrantyCardReceivedDate} onChange={(d) => handleUpdate(r.id, { warrantyCardReceivedDate: d })} isEditable={isEditable} />
                  <DateCell value={r.warrantyCardGivenDate} onChange={(d) => handleUpdate(r.id, { warrantyCardGivenDate: d })} isEditable={isEditable} />
                  <td className="px-4 py-2 min-w-[150px]">
                    {isEditable ? (
                      <input
                        type="text"
                        value={r.remarks || ''}
                        onChange={(e) => handleUpdate(r.id, { remarks: e.target.value })}
                        onBlur={(e) => handleUpdate(r.id, { remarks: e.target.value })}
                        className="w-full px-2 py-1 border rounded text-sm focus:border-blue-500 focus:outline-none bg-white"
                      />
                    ) : (
                      <span className="text-[var(--color-foreground)]">{r.remarks || '—'}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DateCell({ value, onChange, isEditable }: { value?: string | null, onChange: (val: string | null) => void, isEditable?: boolean }) {
  if (!isEditable) {
    return (
      <td className="px-4 py-2 text-[var(--color-foreground)] whitespace-nowrap">
        {value ? formatToDDMMYYYY(value) : '—'}
      </td>
    );
  }

  return (
    <td className="px-4 py-2 min-w-[140px]">
      <DateInput
        value={value}
        onChange={onChange}
      />
    </td>
  );
}
