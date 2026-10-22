"use client";

import { useState, useEffect } from "react";

interface OrthoTreatment {
  id: string;
  treatmentName: string;
  treatmentCode?: string;
  amount: number;
  createdAt: string;
}

interface OrthoTreatmentsProps {
  opNumber: string;
  isEditable: boolean;
  onUpdate: () => void;
}

export function OrthoTreatments({ opNumber, isEditable, onUpdate }: OrthoTreatmentsProps) {
  const [treatments, setTreatments] = useState<OrthoTreatment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [treatmentName, setTreatmentName] = useState("");
  const [treatmentCode, setTreatmentCode] = useState("");
  const [amount, setAmount] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");

  const fetchTreatments = async () => {
    try {
      const res = await fetch(`/api/op/${opNumber}/ortho-treatments`);
      if (res.ok) {
        const data = await res.json();
        setTreatments(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTreatments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opNumber]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!treatmentName || !amount) {
      setError("Name and Amount are required.");
      return;
    }
    
    setIsAdding(true);
    try {
      const res = await fetch(`/api/op/${opNumber}/ortho-treatments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          treatmentName,
          treatmentCode,
          amount: Number(amount)
        })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add treatment");
      }
      
      setTreatmentName("");
      setTreatmentCode("");
      setAmount("");
      
      await fetchTreatments();
      onUpdate(); // Trigger ledger refresh
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error adding treatment");
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading) {
    return <div className="text-sm text-[var(--color-muted)]">Loading treatments...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-purple-800">Ortho Treatments</h3>
      </div>
      
      {isEditable && (
        <form onSubmit={handleAdd} className="bg-white p-4 rounded-lg border border-[var(--color-border)] shadow-sm space-y-4">
          <h4 className="text-sm font-semibold text-[var(--color-foreground)]">Add Treatment</h4>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">Treatment Name *</label>
              <input 
                type="text" 
                value={treatmentName}
                onChange={e => setTreatmentName(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g. Monthly Adjustment"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">Treatment Code</label>
              <input 
                type="text" 
                value={treatmentCode}
                onChange={e => setTreatmentCode(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g. ORT-001"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">Amount (₹) *</label>
              <input 
                type="number" 
                min="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="0"
                required
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button 
              type="submit" 
              disabled={isAdding}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {isAdding ? "Adding..." : "Add Treatment"}
            </button>
          </div>
        </form>
      )}

      <div className="border border-[var(--color-border)] rounded-lg overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-purple-50 border-b border-[var(--color-border)]">
              <th className="text-left px-4 py-2.5 font-semibold text-[var(--color-muted)] text-xs uppercase">Date</th>
              <th className="text-left px-4 py-2.5 font-semibold text-[var(--color-muted)] text-xs uppercase">Treatment</th>
              <th className="text-left px-4 py-2.5 font-semibold text-[var(--color-muted)] text-xs uppercase">Code</th>
              <th className="text-right px-4 py-2.5 font-semibold text-[var(--color-muted)] text-xs uppercase">Amount</th>
            </tr>
          </thead>
          <tbody>
            {treatments.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-center text-[var(--color-muted)]">No treatments recorded.</td>
              </tr>
            ) : (
              treatments.map((t) => (
                <tr key={t.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-[var(--color-foreground)]">
                    {new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(t.createdAt))}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-foreground)] font-medium">
                    {t.treatmentName}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">
                    {t.treatmentCode || "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-[var(--color-foreground)]">
                    ₹{t.amount.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
