"use client";

import { useState, useEffect } from "react";
import { DateInput } from "@/components/ui/DateInput";

export default function LabReportsPage() {
  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [labs, setLabs] = useState<any[]>([]);
  const [selectedLab, setSelectedLab] = useState("");
  const [showPaidFilter, setShowPaidFilter] = useState("ALL"); // ALL, PAID, UNPAID

  useEffect(() => {
    fetch("/api/labs")
      .then((res) => res.json())
      .then(setLabs)
      .catch(console.error);
  }, []);

  const fetchRecords = async () => {
    try {
      const [y, m] = period.split("-");
      const url = new URL("/api/lab/records", window.location.origin);
      if (selectedLab) url.searchParams.append("labId", selectedLab);
      url.searchParams.append("month", m);
      url.searchParams.append("year", y);
      
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch lab records");
      const data = await res.json();
      setRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching records");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLab, period]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUpdate = async (opNumber: string, id: string, updates: any) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/op/${opNumber}/lab-records/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update lab record");
      
      // Refresh the specific row logic or refetch all
      await fetchRecords();
    } catch (err) {
      alert("Failed to update: " + (err instanceof Error ? err.message : "Error"));
    } finally {
      setIsUpdating(false);
    }
  };

  const DateCell = ({ value, onChange }: { value?: string | null, onChange: (val: string | null) => void }) => {
    return (
      <td className="px-2 py-2 min-w-[130px]">
        <DateInput
          value={value}
          disabled={isUpdating}
          onChange={onChange}
        />
      </td>
    );
  };

  const filteredRecords = records.filter(r => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const alreadySettled = r.labSettlementItems?.reduce((sum: number, si: any) => sum + si.amount, 0) || 0;
    const isFullyPaid = alreadySettled >= r.labCostSnapshot;

    if (showPaidFilter === "PAID" && !isFullyPaid) return false;
    if (showPaidFilter === "UNPAID" && isFullyPaid) return false;
    return true;
  });

  const totalCost = filteredRecords.reduce((sum, r) => sum + r.labCostSnapshot, 0);

  const handlePrevMonth = () => {
    const [y, m] = period.split("-").map(Number);
    const d = new Date(y, m - 2, 1);
    setPeriod(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const handleNextMonth = () => {
    const [y, m] = period.split("-").map(Number);
    const d = new Date(y, m, 1);
    setPeriod(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  return (
    <div className="max-w-[95%] mx-auto py-8">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Lab Reports</h1>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 border border-[var(--color-border)] rounded px-1 py-1 bg-white">
            <button onClick={handlePrevMonth} className="px-2 py-1 text-sm text-[var(--color-muted)] hover:bg-gray-100 rounded">{"<"}</button>
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-2 py-1 text-sm outline-none bg-transparent"
            />
            <button onClick={handleNextMonth} className="px-2 py-1 text-sm text-[var(--color-muted)] hover:bg-gray-100 rounded">{">"}</button>
          </div>

          <select
            value={selectedLab}
            onChange={(e) => setSelectedLab(e.target.value)}
            className="border border-[var(--color-border)] rounded px-3 py-1.5 text-sm outline-none focus:border-[var(--color-primary)] bg-white"
          >
            <option value="">All Labs</option>
            {labs.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>

          <select
            value={showPaidFilter}
            onChange={(e) => setShowPaidFilter(e.target.value)}
            className="border border-[var(--color-border)] rounded px-3 py-1.5 text-sm outline-none focus:border-[var(--color-primary)] bg-white"
          >
            <option value="ALL">All Status</option>
            <option value="PAID">Paid</option>
            <option value="UNPAID">Unpaid</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-[var(--color-muted)]">Loading lab records...</div>
      ) : records.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-[var(--color-border)] text-[var(--color-muted)]">
          No lab records found for {period}.
        </div>
      ) : (
        <div className="bg-white border border-[var(--color-border)] rounded-lg overflow-x-auto shadow-sm">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-[#F8FAFC] border-b border-[var(--color-border)] text-[var(--color-muted)] text-xs">
              <tr>
                <th className="px-3 py-3 font-semibold">OP No</th>
                <th className="px-3 py-3 font-semibold">Patient</th>
                <th className="px-3 py-3 font-semibold">Treatment</th>
                <th className="px-3 py-3 font-semibold">E+G / EHS / GEN</th>
                <th className="px-3 py-3 font-semibold">Crown Type</th>
                <th className="px-3 py-3 font-semibold">Crowns</th>
                <th className="px-3 py-3 font-semibold">Lab</th>
                <th className="px-3 py-3 font-semibold">Lab Cost</th>
                <th className="px-3 py-3 font-semibold">Parcel Sent</th>
                <th className="px-3 py-3 font-semibold">Target Receive</th>
                <th className="px-3 py-3 font-semibold">M1 Rcvd</th>
                <th className="px-3 py-3 font-semibold">Bisque Rcvd</th>
                <th className="px-3 py-3 font-semibold">Glaze 1</th>
                <th className="px-3 py-3 font-semibold">Glaze 2</th>
                <th className="px-3 py-3 font-semibold">Warranty Rcvd</th>
                <th className="px-3 py-3 font-semibold">Warranty Given</th>
                <th className="px-3 py-3 font-semibold min-w-[150px]">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredRecords.map((r) => {
                return (
                  <tr key={r.id} className="hover:bg-gray-50/50">
                    <td className="px-3 py-2 text-blue-600 font-medium">
                      {r.opRecord?.opNumber}
                    </td>
                    <td className="px-3 py-2 font-medium">
                      {r.opRecord?.patientName}
                    </td>
                    <td className="px-3 py-2">
                      {r.finalizedTreatment?.treatment?.name || 'Unknown'}
                    </td>
                    <td className="px-3 py-2 font-medium">
                      {r.opRecord?.egEhsGen || r.finalizedTreatment?.egEhsGen || "—"}
                    </td>
                    <td className="px-3 py-2">
                      {r.finalizedTreatment?.crownType?.name || '—'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {r.finalizedTreatment?.numberOfCrowns || '—'}
                    </td>
                    <td className="px-3 py-2 font-medium">
                      {r.lab?.name || 'Unknown'}
                    </td>
                    <td className="px-3 py-2 text-orange-600 font-medium">
                      ₹{r.labCostSnapshot.toLocaleString("en-IN")}
                    </td>
                    <DateCell value={r.parcelSentDate} onChange={(d) => handleUpdate(r.opRecord.opNumber, r.id, { parcelSentDate: d })} />
                    <DateCell value={r.targetReceiveDate} onChange={(d) => handleUpdate(r.opRecord.opNumber, r.id, { targetReceiveDate: d })} />
                    <DateCell value={r.m1ReceivedDate} onChange={(d) => handleUpdate(r.opRecord.opNumber, r.id, { m1ReceivedDate: d })} />
                    <DateCell value={r.bisqueReceivedDate} onChange={(d) => handleUpdate(r.opRecord.opNumber, r.id, { bisqueReceivedDate: d })} />
                    <DateCell value={r.glazeReceivedFirstDate} onChange={(d) => handleUpdate(r.opRecord.opNumber, r.id, { glazeReceivedFirstDate: d })} />
                    <DateCell value={r.glazeReceivedSecondDate} onChange={(d) => handleUpdate(r.opRecord.opNumber, r.id, { glazeReceivedSecondDate: d })} />
                    <DateCell value={r.warrantyCardReceivedDate} onChange={(d) => handleUpdate(r.opRecord.opNumber, r.id, { warrantyCardReceivedDate: d })} />
                    <DateCell value={r.warrantyCardGivenDate} onChange={(d) => handleUpdate(r.opRecord.opNumber, r.id, { warrantyCardGivenDate: d })} />
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={r.remarks || ''}
                        disabled={isUpdating}
                        onChange={(e) => {
                          const newRecords = [...records];
                          const idx = newRecords.findIndex(x => x.id === r.id);
                          if (idx > -1) newRecords[idx].remarks = e.target.value;
                          setRecords(newRecords);
                        }}
                        onBlur={(e) => handleUpdate(r.opRecord.opNumber, r.id, { remarks: e.target.value })}
                        className="w-full px-2 py-1 border rounded text-xs focus:border-blue-500 focus:outline-none bg-white"
                        placeholder="Add remarks..."
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Financial Footer */}
      {!isLoading && records.length > 0 && (
        <div className="mt-6 flex flex-wrap justify-between items-center bg-white p-4 border border-[var(--color-border)] rounded-lg shadow-sm">
          <div>
            <p className="text-sm text-[var(--color-muted)]">Total Lab Cost</p>
            <p className="text-xl font-bold text-orange-600">₹{totalCost.toLocaleString("en-IN")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
