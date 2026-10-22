"use client";

import { useState, useEffect } from "react";
import { Edit2, Trash2, X, AlertTriangle } from "lucide-react";

interface DailyCounterRow {
  sNo: number;
  id?: string | null;
  date: string;
  day: string;
  opNumber: string;
  patientName: string;
  paidFree: string;
  treatmentAmount: number;
  discount: number;
  paidAmount: number;
  paymentMode: string;
  balance: number;
  workflowType?: string;
  isEligible?: boolean;
  sourceType?: "LEDGER" | "OP_DISCOUNT";
}

interface DailyCounterData {
  date: string;
  day: string;
  rows: DailyCounterRow[];
  summary: {
    cash: number;
    swipe: number;
    phonePay: number;
    totalAmount: number;
    totalDiscount: number;
    grandTotal: number;
    generalCollection: number;
    orthoCollection: number;
  };
}

interface DailyCounterPageProps {
  isManager?: boolean;
}

export default function DailyCounterPage({ isManager: propIsManager }: DailyCounterPageProps = {}) {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [data, setData] = useState<DailyCounterData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const isManager = Boolean(
    propIsManager !== undefined
      ? propIsManager
      : typeof window !== "undefined" && window.location.pathname.startsWith("/manager")
  );

  // Edit State
  const [editingRow, setEditingRow] = useState<DailyCounterRow | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editPaidAmount, setEditPaidAmount] = useState("");
  const [editDiscount, setEditDiscount] = useState("");
  const [editPaymentMode, setEditPaymentMode] = useState("Cash");
  const [editError, setEditError] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete State
  const [deletingRow, setDeletingRow] = useState<DailyCounterRow | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCounter = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/daily-counter?date=${selectedDate}`);
      if (!res.ok) throw new Error("Failed to fetch daily counter");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchCounter();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const openEditModal = (row: DailyCounterRow) => {
    setEditingRow(row);
    // Format date for date input: YYYY-MM-DD
    const isoDate = row.date.includes("T") ? row.date.split("T")[0] : row.date;
    setEditDate(isoDate);
    setEditPaidAmount(row.paidAmount.toString());
    setEditDiscount(row.discount.toString());
    setEditPaymentMode(["Cash", "Swipe", "Phone Pay", "UPI", "Card", "Bank Transfer"].includes(row.paymentMode) ? row.paymentMode : "Cash");
    setEditError("");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRow || !editingRow.id) return;

    const paidNum = Number(editPaidAmount);
    const discNum = Number(editDiscount);

    if (isNaN(paidNum) || paidNum < 0) {
      setEditError("Paid amount cannot be negative");
      return;
    }
    if (isNaN(discNum) || discNum < 0) {
      setEditError("Discount cannot be negative");
      return;
    }
    if (paidNum === 0 && discNum === 0) {
      setEditError("Transaction must have either payment or discount");
      return;
    }

    setIsSavingEdit(true);
    setEditError("");

    try {
      const endpoint = editingRow.workflowType === "ORTHO"
        ? `/api/op/${editingRow.opNumber}/ortho-ledger/${editingRow.id}`
        : `/api/op/${editingRow.opNumber}/ledger/${editingRow.id}`;

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: editDate,
          paidAmount: paidNum,
          discount: discNum,
          paymentMode: editPaymentMode,
        }),
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || "Failed to update transaction");
      }

      setEditingRow(null);
      await fetchCounter();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Error saving edit");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingRow || !deletingRow.id) return;

    setIsDeleting(true);
    setDeleteError("");

    try {
      const endpoint = deletingRow.workflowType === "ORTHO"
        ? `/api/op/${deletingRow.opNumber}/ortho-ledger/${deletingRow.id}`
        : `/api/op/${deletingRow.opNumber}/ledger/${deletingRow.id}`;

      const res = await fetch(endpoint, {
        method: "DELETE",
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || "Failed to delete transaction");
      }

      setDeletingRow(null);
      await fetchCounter();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Error deleting transaction");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Daily Counter</h1>
          <p className="text-sm text-[var(--color-muted)]">
            {isManager
              ? "Manager View: Review, edit, and manage daily counter transactions"
              : "View daily financial summary and transactions"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-[var(--color-muted)]">Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 bg-white border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          />
        </div>
      </div>

      {isLoading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}

      {!isLoading && data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard title="Cash" value={data.summary.cash} />
            <SummaryCard title="Swipe" value={data.summary.swipe} />
            <SummaryCard title="Phone Pay" value={data.summary.phonePay} />
            <SummaryCard title="Total Discount" value={data.summary.totalDiscount} />
            <SummaryCard title="General Collection" value={data.summary.generalCollection} highlighted />
            <SummaryCard title="Ortho Collection" value={data.summary.orthoCollection} highlighted />
            <SummaryCard title="Total Collection (Grand Total)" value={data.summary.grandTotal} highlighted />
          </div>

          <div className="overflow-x-auto border border-[var(--color-border)] rounded-lg bg-white shadow-sm">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-[#F0F4F8] border-b border-[var(--color-border)] text-[var(--color-muted)] text-xs uppercase font-semibold">
                  <th className="px-4 py-3">S.No</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Day</th>
                  <th className="px-4 py-3">OP Number</th>
                  <th className="px-4 py-3">Patient Name</th>
                  <th className="px-4 py-3 text-center">Paid/Free</th>
                  <th className="px-4 py-3 text-right">Treatment Amt</th>
                  <th className="px-4 py-3 text-right">Discount</th>
                  <th className="px-4 py-3 text-right">Paid Amt</th>
                  <th className="px-4 py-3 text-center">Mode</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                  {isManager && <th className="px-4 py-3 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {data.rows.length === 0 ? (
                  <tr>
                    <td colSpan={isManager ? 12 : 11} className="px-4 py-6 text-center text-[var(--color-muted)]">
                      No transactions found for {selectedDate}
                    </td>
                  </tr>
                ) : (
                  data.rows.map((row) => (
                    <tr key={`${row.sNo}-${row.opNumber}-${row.id || "op"}`} className="border-b border-[var(--color-border)] last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 text-[var(--color-muted)]">{row.sNo}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(row.date))}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-muted)]">{row.day}</td>
                      <td className="px-4 py-3 font-medium text-[var(--color-primary)]">{row.opNumber}</td>
                      <td className="px-4 py-3">{row.patientName}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${row.paidFree === "Paid" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                          {row.paidFree}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">₹{row.treatmentAmount.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-right text-purple-600">
                        {row.discount > 0 ? `₹${row.discount.toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-green-600">
                        {row.paidAmount > 0 ? `₹${row.paidAmount.toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-center text-[var(--color-muted)]">{row.paymentMode}</td>
                      <td className="px-4 py-3 text-right font-bold text-red-600">₹{row.balance.toLocaleString("en-IN")}</td>
                      {isManager && (
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {row.isEligible && row.id ? (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openEditModal(row)}
                                className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200 rounded flex items-center gap-1 transition-colors"
                                title="Edit Transaction"
                              >
                                <Edit2 className="w-3 h-3" />
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  setDeletingRow(row);
                                  setDeleteError("");
                                }}
                                className="px-2 py-1 text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 border border-red-200 rounded flex items-center gap-1 transition-colors"
                                title="Delete Transaction"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs italic" title="Registration discount on OP Record">
                              Fixed
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editingRow && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-[var(--color-border)] max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-[var(--color-foreground)]">Edit Transaction</h3>
              <button
                onClick={() => setEditingRow(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">
                  Patient
                </label>
                <p className="text-sm font-semibold text-[var(--color-foreground)]">
                  {editingRow.opNumber} — {editingRow.patientName}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">
                  Transaction Date
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editPaidAmount}
                  onChange={(e) => setEditPaidAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">
                  Discount Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editDiscount}
                  onChange={(e) => setEditDiscount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">
                  Payment Mode
                </label>
                <select
                  value={editPaymentMode}
                  onChange={(e) => setEditPaymentMode(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-blue-500 bg-white"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Swipe">Swipe</option>
                  <option value="Phone Pay">Phone Pay</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingRow(null)}
                  disabled={isSavingEdit}
                  className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {isSavingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingRow && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-[var(--color-border)] max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Confirm Deletion</h3>
            </div>

            {deleteError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                {deleteError}
              </div>
            )}

            <p className="text-sm text-gray-600">
              Are you sure you want to permanently delete this transaction for{" "}
              <strong className="text-gray-900">{deletingRow.opNumber} ({deletingRow.patientName})</strong>?
            </p>

            <div className="bg-gray-50 p-3 rounded-lg text-xs space-y-1 text-gray-700 border">
              <div><span className="font-medium">Paid Amount:</span> ₹{deletingRow.paidAmount.toLocaleString("en-IN")}</div>
              <div><span className="font-medium">Discount:</span> ₹{deletingRow.discount.toLocaleString("en-IN")}</div>
              <div><span className="font-medium">Payment Mode:</span> {deletingRow.paymentMode}</div>
            </div>

            <p className="text-xs text-red-600 font-medium">
              This action will recalculate the patient outstanding balance and immediately refresh daily counter totals.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setDeletingRow(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? "Deleting..." : "Delete Transaction"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ title, value, highlighted }: { title: string; value: number; highlighted?: boolean }) {
  return (
    <div className={`p-4 rounded-lg shadow-sm border ${highlighted ? "bg-[#F0F4F8] border-[var(--color-primary)]" : "bg-white border-[var(--color-border)]"}`}>
      <h3 className={`text-xs uppercase font-semibold mb-1 ${highlighted ? "text-[var(--color-primary)]" : "text-[var(--color-muted)]"}`}>
        {title}
      </h3>
      <p className={`text-xl font-bold ${highlighted ? "text-[#1e40af]" : "text-[var(--color-foreground)]"}`}>
        ₹{value.toLocaleString("en-IN")}
      </p>
    </div>
  );
}
