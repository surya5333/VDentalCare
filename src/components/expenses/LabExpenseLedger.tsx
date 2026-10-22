"use client";

import { useState } from "react";
import { Edit2, Check, X, AlertCircle } from "lucide-react";

export interface ConsolidatedLabItem {
  labId: string;
  labName: string;
  totalLabCost: number;
  cashPaid: number;
  bankPaid: number;
  remainingCost: number;
}

export interface LabCategoryData {
  budget: number;
  totalLabCost: number;
  spentCash: number;
  spentBank: number;
  totalSpent: number;
  remainingLabCost: number;
  remainingBudget: number;
  labs?: ConsolidatedLabItem[];
  entries?: any[];
}

const SUPPORTED_LABS = ["Smile Lab", "Dental Arts", "Precision Dentures"];

export function LabExpenseLedger({
  data,
  onRefresh,
  month,
}: {
  data: LabCategoryData;
  onRefresh: () => void;
  month?: string;
}) {
  const [editingLabId, setEditingLabId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ cashPaid: string; bankPaid: string }>({
    cashPaid: "0",
    bankPaid: "0",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Use consolidated labs from API, or build fallback from supported labs
  const labsToDisplay: ConsolidatedLabItem[] =
    data.labs && data.labs.length > 0
      ? data.labs
      : SUPPORTED_LABS.map((name) => {
          const records = (data.entries || []).filter((e) => e.labName === name);
          const totalLabCost = records.reduce((sum, r) => sum + (r.labCost || 0), 0);
          const cashPaid = records.reduce((sum, r) => sum + (r.cashPaid || 0), 0);
          const bankPaid = records.reduce((sum, r) => sum + (r.bankPaid || 0), 0);
          return {
            labId: records[0]?.labId || name,
            labName: name,
            totalLabCost,
            cashPaid,
            bankPaid,
            remainingCost: totalLabCost - cashPaid - bankPaid,
          };
        });

  const startEdit = (lab: ConsolidatedLabItem) => {
    setEditingLabId(lab.labId);
    setEditForm({
      cashPaid: String(lab.cashPaid ?? 0),
      bankPaid: String(lab.bankPaid ?? 0),
    });
    setErrorMessage(null);
  };

  const cancelEdit = () => {
    setEditingLabId(null);
    setErrorMessage(null);
  };

  const handleSave = async (lab: ConsolidatedLabItem) => {
    const cash = Number(editForm.cashPaid);
    const bank = Number(editForm.bankPaid);

    if (isNaN(cash) || cash < 0) {
      setErrorMessage("Cash paid must be a valid non-negative number.");
      return;
    }
    if (isNaN(bank) || bank < 0) {
      setErrorMessage("Bank paid must be a valid non-negative number.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const selectedMonth =
        month ||
        (() => {
          const now = new Date();
          return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        })();

      const res = await fetch("/api/manager-reports/expenses/lab-monthly-payments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          labId: lab.labId,
          month: selectedMonth,
          cashPaid: cash,
          bankPaid: bank,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save lab payment");
      }

      setEditingLabId(null);
      onRefresh();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Failed to save lab payment";
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-indigo-50/60 p-3 rounded-lg border border-indigo-100">
          <p className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider">
            Lab Budget
          </p>
          <p className="text-lg font-bold text-indigo-900 mt-1">
            ₹{data.budget.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="bg-orange-50/60 p-3 rounded-lg border border-orange-100">
          <p className="text-[11px] font-semibold text-orange-700 uppercase tracking-wider">
            Total Lab Cost
          </p>
          <p className="text-lg font-bold text-orange-900 mt-1">
            ₹{data.totalLabCost.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
          <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
            Total Cash Paid
          </p>
          <p className="text-lg font-bold text-gray-900 mt-1">
            ₹{data.spentCash.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
          <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
            Total Bank Paid
          </p>
          <p className="text-lg font-bold text-gray-900 mt-1">
            ₹{data.spentBank.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="bg-purple-50/60 p-3 rounded-lg border border-purple-100">
          <p className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">
            Remaining Lab Cost
          </p>
          <p className="text-lg font-bold text-purple-900 mt-1">
            ₹{data.remainingLabCost.toLocaleString("en-IN")}
          </p>
        </div>
        <div
          className={`p-3 rounded-lg border ${
            data.remainingBudget < 0
              ? "bg-red-50 border-red-200"
              : "bg-emerald-50/60 border-emerald-100"
          }`}
        >
          <p
            className={`text-[11px] font-semibold uppercase tracking-wider ${
              data.remainingBudget < 0 ? "text-red-700" : "text-emerald-700"
            }`}
          >
            Remaining Budget
          </p>
          <p
            className={`text-lg font-bold mt-1 ${
              data.remainingBudget < 0 ? "text-red-900" : "text-emerald-900"
            }`}
          >
            ₹{data.remainingBudget.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Section Header */}
      <div>
        <h3 className="font-bold text-gray-900">Lab Expenses Summary</h3>
        <p className="text-xs text-[var(--color-muted)]">
          Consolidated monthly totals per lab. Click Edit to enter cumulative Cash and Bank payments.
        </p>
      </div>

      {/* Consolidated Table: Exactly One Row Per Lab */}
      <div className="overflow-x-auto border border-[var(--color-border)] rounded-xl shadow-sm bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-[var(--color-border)] text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="px-5 py-3.5">Lab Name</th>
              <th className="px-5 py-3.5 text-right">Total Lab Cost</th>
              <th className="px-5 py-3.5 text-right">Cash Paid</th>
              <th className="px-5 py-3.5 text-right">Bank Paid</th>
              <th className="px-5 py-3.5 text-right">Remaining Cost</th>
              <th className="px-5 py-3.5 text-center w-40">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {labsToDisplay.map((lab) => {
              const isEditing = editingLabId === lab.labId;
              const draftCash = Number(editForm.cashPaid) || 0;
              const draftBank = Number(editForm.bankPaid) || 0;
              const liveRemaining = lab.totalLabCost - draftCash - draftBank;

              return (
                <tr
                  key={lab.labId}
                  className={`transition-colors ${
                    isEditing ? "bg-indigo-50/40" : "hover:bg-gray-50/80"
                  }`}
                >
                  {/* Lab Name */}
                  <td className="px-5 py-4 font-semibold text-gray-900">
                    {lab.labName}
                  </td>

                  {/* Total Lab Cost */}
                  <td className="px-5 py-4 text-right font-semibold text-gray-900">
                    ₹{lab.totalLabCost.toLocaleString("en-IN")}
                  </td>

                  {/* Cash Paid */}
                  <td className="px-5 py-4 text-right">
                    {isEditing ? (
                      <div className="relative inline-block">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={editForm.cashPaid}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              cashPaid: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSave(lab);
                            if (e.key === "Escape") cancelEdit();
                          }}
                          className="w-28 pl-6 pr-2 py-1.5 text-right font-medium border border-indigo-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <span className="text-gray-700 font-medium">
                        ₹{lab.cashPaid.toLocaleString("en-IN")}
                      </span>
                    )}
                  </td>

                  {/* Bank Paid */}
                  <td className="px-5 py-4 text-right">
                    {isEditing ? (
                      <div className="relative inline-block">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={editForm.bankPaid}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              bankPaid: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSave(lab);
                            if (e.key === "Escape") cancelEdit();
                          }}
                          className="w-28 pl-6 pr-2 py-1.5 text-right font-medium border border-indigo-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                        />
                      </div>
                    ) : (
                      <span className="text-gray-700 font-medium">
                        ₹{lab.bankPaid.toLocaleString("en-IN")}
                      </span>
                    )}
                  </td>

                  {/* Remaining Cost */}
                  <td
                    className={`px-5 py-4 text-right font-bold ${
                      (isEditing ? liveRemaining : lab.remainingCost) < 0
                        ? "text-red-600"
                        : "text-indigo-600"
                    }`}
                  >
                    ₹
                    {(isEditing ? liveRemaining : lab.remainingCost).toLocaleString(
                      "en-IN"
                    )}
                  </td>

                  {/* Actions Column */}
                  <td className="px-5 py-4 text-center">
                    {isEditing ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleSave(lab)}
                          disabled={isSaving}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isSaving ? "Saving..." : "Save"}</span>
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={isSaving}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 transition-colors disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(lab)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
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
