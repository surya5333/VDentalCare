"use client";

import { useState } from "react";

interface CostDiscountProps {
  roleLabel?: string;
  treatmentPlanCost: string;
  totalCrownCost: string;
  totalAmount: string;
  finalDiscount: string;
  netAmount: string;
  isEditable?: boolean;
  onDiscountChange?: (discount: string) => void;
}

export function CostDiscount({
  roleLabel,
  treatmentPlanCost,
  totalCrownCost,
  totalAmount,
  finalDiscount,
  netAmount,
  isEditable,
  onDiscountChange,
}: CostDiscountProps) {
  const [discountError, setDiscountError] = useState<string | null>(null);

  const handleDiscountChange = (val: string) => {
    if (!onDiscountChange) return;
    const cleanDiscount = val.replace(/[^0-9]/g, "");
    onDiscountChange(cleanDiscount);
    
    const totalNum = Number(totalAmount.replace(/,/g, "")) || 0;
    const discountNum = Number(cleanDiscount) || 0;

    if (discountNum > totalNum) {
      setDiscountError(`Discount cannot exceed Total Amount (₹${totalNum.toLocaleString("en-IN")})`);
    } else {
      setDiscountError(null);
    }
  };

  return (
    <div className="bg-white border border-[var(--color-border)] rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2.5 mb-3">
        <h3 className="text-sm font-bold text-[var(--color-foreground)]">
          <span className="text-[#1e40af]">Advisory Financials</span>
          {roleLabel && (
            <span className="text-[var(--color-primary)] font-normal text-xs ml-1">
              ({roleLabel})
            </span>
          )}
        </h3>
        <span className="text-[11px] text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded">
          Automated Calculation
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
        {/* Treatment Plan Cost (Non-Crown) */}
        <div>
          <label className="block text-xs text-[var(--color-muted)] mb-1 font-medium">
            Treatment Plan Cost
          </label>
          <div className="flex items-center border border-[var(--color-border)] rounded-lg overflow-hidden bg-gray-50">
            <span className="px-2 py-1.5 text-xs text-[var(--color-muted)] bg-gray-100 border-r border-[var(--color-border)]">
              ₹
            </span>
            <span className="flex-1 px-2 py-1.5 text-sm font-semibold text-[var(--color-foreground)]">
              {treatmentPlanCost || "0"}
            </span>
          </div>
        </div>

        {/* Total Crown Cost */}
        <div>
          <label className="block text-xs text-[var(--color-muted)] mb-1 font-medium">
            Total Crown Cost
          </label>
          <div className="flex items-center border border-blue-200 rounded-lg overflow-hidden bg-blue-50/50">
            <span className="px-2 py-1.5 text-xs text-blue-700 bg-blue-100 border-r border-blue-200">
              ₹
            </span>
            <span className="flex-1 px-2 py-1.5 text-sm font-semibold text-blue-800">
              {totalCrownCost || "0"}
            </span>
          </div>
        </div>

        {/* Total Amount */}
        <div>
          <label className="block text-xs text-[var(--color-muted)] mb-1 font-medium">
            Total Amount
          </label>
          <div className="flex items-center border border-[var(--color-border)] rounded-lg overflow-hidden bg-gray-50">
            <span className="px-2 py-1.5 text-xs text-[var(--color-muted)] bg-gray-100 border-r border-[var(--color-border)]">
              ₹
            </span>
            <span className="flex-1 px-2 py-1.5 text-sm font-bold text-[var(--color-foreground)]">
              {totalAmount || "0"}
            </span>
          </div>
        </div>

        {/* Discount */}
        <div>
          <label className="block text-xs text-[var(--color-muted)] mb-1 font-medium">
            Discount
          </label>
          <div className="flex items-center border border-[var(--color-border)] rounded-lg overflow-hidden bg-white">
            <span className="px-2 py-1.5 text-xs text-[var(--color-muted)] bg-gray-50 border-r border-[var(--color-border)]">
              ₹
            </span>
            {isEditable ? (
              <input
                type="text"
                value={finalDiscount}
                onChange={(e) => handleDiscountChange(e.target.value)}
                placeholder="0"
                className="flex-1 px-2 py-1.5 text-sm text-[var(--color-foreground)] outline-none bg-white font-medium w-16"
              />
            ) : (
              <span className="flex-1 px-2 py-1.5 text-sm text-[var(--color-foreground)] bg-gray-50 font-medium">
                {finalDiscount || "0"}
              </span>
            )}
          </div>
        </div>

        {/* Net Amount */}
        <div>
          <label className="block text-xs text-[var(--color-muted)] mb-1 font-medium">
            Net Amount
          </label>
          <div className="flex items-center border border-green-200 rounded-lg overflow-hidden bg-green-50/50">
            <span className="px-2 py-1.5 text-xs text-green-700 bg-green-100 border-r border-green-200 font-bold">
              ₹
            </span>
            <span className="flex-1 px-2 py-1.5 text-sm font-bold text-green-800">
              {netAmount || "0"}
            </span>
          </div>
        </div>
      </div>

      {discountError && (
        <p className="mt-2 text-xs text-red-500 font-medium">
          {discountError}
        </p>
      )}
    </div>
  );
}
