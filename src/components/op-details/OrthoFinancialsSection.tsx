"use client";

import { useState } from "react";
import { OrthoFinancials } from "@/types/op";

interface OrthoFinancialsSectionProps {
  financials?: OrthoFinancials;
  isEditable: boolean;
  onUpdate: (financials: OrthoFinancials) => Promise<void>;
}

export function OrthoFinancialsSection({ financials, isEditable, onUpdate }: OrthoFinancialsSectionProps) {
  const [totalAmount, setTotalAmount] = useState(financials?.totalAmount?.toString() || "0");
  const [discount, setDiscount] = useState(financials?.discount?.toString() || "0");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const numTotal = Number(totalAmount) || 0;
  const numDiscount = Number(discount) || 0;
  const netAmount = Math.max(0, numTotal - numDiscount);

  const handleSave = async () => {
    if (numDiscount > numTotal) {
      setError("Discount cannot exceed Total Amount.");
      return;
    }
    if (numTotal < 0 || numDiscount < 0) {
      setError("Amounts cannot be negative.");
      return;
    }

    setError("");
    setIsSaving(true);
    try {
      await onUpdate({
        totalAmount: numTotal,
        discount: numDiscount
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving financials");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-[var(--color-border)] shadow-sm space-y-4">
      <h3 className="text-lg font-bold text-purple-800">Ortho Financials</h3>
      {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        <div>
          <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">Total Amount (₹) *</label>
          <input
            type="number"
            min="0"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            disabled={!isEditable || isSaving}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50 text-[var(--color-foreground)] font-medium"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">Discount (₹)</label>
          <input
            type="number"
            min="0"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            disabled={!isEditable || isSaving}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50 text-[var(--color-foreground)] font-medium"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">Net Amount (₹)</label>
          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md font-bold text-gray-700">
            ₹{netAmount.toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      {isEditable && (
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={isSaving || (numTotal === (financials?.totalAmount || 0) && numDiscount === (financials?.discount || 0))}
            className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {isSaving ? "Saving..." : "Save Financials"}
          </button>
        </div>
      )}
    </div>
  );
}
