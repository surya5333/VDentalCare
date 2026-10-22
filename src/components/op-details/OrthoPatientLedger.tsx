"use client";

import { useEffect, useState } from "react";
import { Edit2, Trash2, X, AlertTriangle } from "lucide-react";

interface OrthoLedgerTransaction {
  id: string;
  opNumber: string;
  date: string;
  orthoTreatmentId?: string;
  treatmentCost: number;
  paidAmount: number;
  discount: number;
  paymentMode: string;
  balance: number;
  orthoTreatment?: {
    treatmentName: string;
    treatmentCode: string;
  };
}

interface PatientLedgerProps {
  opNumber: string;
  isEditable?: boolean;
}

interface LedgerData {
  opNumber: string;
  totalTreatmentCost: number;
  totalPaid: number;
  totalDiscount: number;
  balance: number;
  transactions: OrthoLedgerTransaction[];
}

export function OrthoPatientLedger({ opNumber, isEditable }: PatientLedgerProps) {
  const [data, setData] = useState<LedgerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Payment Form State
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [discount, setDiscount] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  // Edit Transaction State
  const [editingTransaction, setEditingTransaction] = useState<OrthoLedgerTransaction | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editPaidAmount, setEditPaidAmount] = useState("");
  const [editDiscount, setEditDiscount] = useState("");
  const [editPaymentMode, setEditPaymentMode] = useState("Cash");
  const [editError, setEditError] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete Transaction State
  const [deletingTransaction, setDeletingTransaction] = useState<OrthoLedgerTransaction | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchLedger = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await fetch(`/api/op/${opNumber}/ortho-ledger`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("Ledger not found or OP is not Ortho.");
          setIsLoading(false);
          return;
        }
        throw new Error("Failed to fetch Ortho ledger");
      }
      const json = await res.json();
      
      const rows = json.rows || [];
      const summary = json.summary || {};
      
      setData({
        opNumber,
        totalTreatmentCost: summary.totalTreatmentCost ?? 0,
        totalPaid: summary.totalPaid ?? 0,
        totalDiscount: summary.totalDiscount ?? 0,
        balance: summary.currentBalance ?? 0,
        transactions: rows,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opNumber]);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setFormError("");
    
    try {
      const res = await fetch(`/api/op/${opNumber}/ortho-ledger`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey
        },
        body: JSON.stringify({
          paidAmount: Number(paidAmount) || 0,
          paymentMode,
          discount: Number(discount) || 0,
          idempotencyKey,
        }),
      });
      
      const resData = await res.json();
      
      if (!res.ok) {
        throw new Error(resData.error || "Failed to add transaction");
      }
      
      setPaidAmount("");
      setDiscount("");
      setIsAddingPayment(false);
      setIdempotencyKey(crypto.randomUUID());
      await fetchLedger(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (t: OrthoLedgerTransaction) => {
    setEditingTransaction(t);
    const isoDate = t.date ? (t.date.includes("T") ? t.date.split("T")[0] : t.date) : "";
    setEditDate(isoDate);
    setEditPaidAmount(t.paidAmount.toString());
    setEditDiscount(t.discount.toString());
    setEditPaymentMode(["Cash", "Swipe", "Phone Pay"].includes(t.paymentMode) ? t.paymentMode : "Cash");
    setEditError("");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction || !editingTransaction.id) return;

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
      const res = await fetch(`/api/op/${opNumber}/ortho-ledger/${editingTransaction.id}`, {
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

      setEditingTransaction(null);
      await fetchLedger(true);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Error saving edit");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTransaction || !deletingTransaction.id) return;

    setIsDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch(`/api/op/${opNumber}/ortho-ledger/${deletingTransaction.id}`, {
        method: "DELETE",
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || "Failed to delete transaction");
      }

      setDeletingTransaction(null);
      await fetchLedger(true);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Error deleting transaction");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) return <div>Loading Ortho patient ledger...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-purple-800">Ortho Patient Ledger</h3>
        {isEditable && !isAddingPayment && (
          <button 
            onClick={() => {
              setIsAddingPayment(true);
              setIdempotencyKey(crypto.randomUUID());
            }}
            className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
          >
            Add Payment / Discount
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-muted)] uppercase font-semibold">Total Ortho Cost</p>
          <p className="text-lg font-bold text-[var(--color-foreground)]">₹{(data.totalTreatmentCost ?? 0).toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-green-100">
          <p className="text-xs text-green-600 uppercase font-semibold">Total Paid</p>
          <p className="text-lg font-bold text-green-700">₹{(data.totalPaid ?? 0).toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-purple-100">
          <p className="text-xs text-purple-600 uppercase font-semibold">Total Discount</p>
          <p className="text-lg font-bold text-purple-700">₹{(data.totalDiscount ?? 0).toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-red-100">
          <p className="text-xs text-red-600 uppercase font-semibold">Outstanding Balance</p>
          <p className="text-lg font-bold text-red-700">₹{(data.balance ?? 0).toLocaleString("en-IN")}</p>
        </div>
      </div>

      {isAddingPayment && (
        <form onSubmit={handleAddPayment} className="bg-purple-50 p-4 rounded-lg border border-purple-200 space-y-4">
          <h4 className="text-sm font-bold text-[var(--color-foreground)]">New Ortho Transaction</h4>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">Payment Amount (₹)</label>
              <input 
                type="number" 
                min="0"
                value={paidAmount} 
                onChange={e => setPaidAmount(e.target.value)} 
                disabled={isSubmitting}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">Payment Mode</label>
              <select 
                value={paymentMode} 
                onChange={e => setPaymentMode(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
              >
                <option value="Cash">Cash</option>
                <option value="Swipe">Swipe</option>
                <option value="Phone Pay">Phone Pay</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">Discount Amount (₹)</label>
              <input 
                type="number" 
                min="0"
                value={discount} 
                onChange={e => setDiscount(e.target.value)} 
                disabled={isSubmitting}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button 
              type="button" 
              onClick={() => setIsAddingPayment(false)}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-[var(--color-muted)] bg-white border border-[var(--color-border)] rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Adding Payment...
                </>
              ) : (
                "Submit Transaction"
              )}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto border border-[var(--color-border)] rounded-lg bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-purple-50 border-b border-[var(--color-border)]">
              <th className="text-left px-4 py-2.5 font-semibold text-[var(--color-muted)] text-xs uppercase">Date</th>
              <th className="text-left px-4 py-2.5 font-semibold text-[var(--color-muted)] text-xs uppercase">Description</th>
              <th className="text-right px-4 py-2.5 font-semibold text-[var(--color-muted)] text-xs uppercase">Treatment Cost</th>
              <th className="text-right px-4 py-2.5 font-semibold text-[var(--color-muted)] text-xs uppercase">Paid</th>
              <th className="text-center px-4 py-2.5 font-semibold text-[var(--color-muted)] text-xs uppercase">Mode</th>
              <th className="text-right px-4 py-2.5 font-semibold text-[var(--color-muted)] text-xs uppercase">Discount</th>
              <th className="text-right px-4 py-2.5 font-semibold text-[var(--color-muted)] text-xs uppercase">Balance</th>
              {isEditable && (
                <th className="text-center px-4 py-2.5 font-semibold text-[var(--color-muted)] text-xs uppercase">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {(data.transactions ?? []).length === 0 ? (
              <tr>
                <td colSpan={isEditable ? 8 : 7} className="px-4 py-4 text-center text-[var(--color-muted)]">No transactions found</td>
              </tr>
            ) : (
              (data.transactions ?? []).map((t) => {
                const treatmentName = t.orthoTreatment?.treatmentName;
                const treatmentCode = t.orthoTreatment?.treatmentCode;
                const desc = t.orthoTreatmentId 
                  ? `Treatment: ${treatmentName}${treatmentCode ? ` (${treatmentCode})` : ''}`
                  : (t.paidAmount > 0 ? "Payment" : (t.discount > 0 ? "Discount Applied" : "Transaction"));
                
                return (
                  <tr key={t.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-2 text-[var(--color-foreground)] whitespace-nowrap">
                      {new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(t.date))}
                    </td>
                    <td className="px-4 py-2 text-[var(--color-foreground)] font-medium">
                      {desc}
                    </td>
                    <td className="px-4 py-2 text-right text-[var(--color-foreground)]">
                      {t.treatmentCost > 0 ? `₹${t.treatmentCost.toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-green-600">
                      {t.paidAmount > 0 ? `₹${t.paidAmount.toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td className="px-4 py-2 text-center text-[var(--color-muted)]">
                      {t.paymentMode !== "N/A" ? t.paymentMode : "—"}
                    </td>
                    <td className="px-4 py-2 text-right text-purple-600">
                      {t.discount > 0 ? `₹${t.discount.toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td className="px-4 py-2 text-right font-bold text-red-600">
                      ₹{t.balance.toLocaleString("en-IN")}
                    </td>
                    {isEditable && (
                      <td className="px-4 py-2 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(t)}
                            className="px-2 py-1 text-xs font-medium text-purple-600 hover:text-purple-800 hover:bg-purple-50 border border-purple-200 rounded flex items-center gap-1 transition-colors"
                            title="Edit Transaction"
                          >
                            <Edit2 className="w-3 h-3" />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setDeletingTransaction(t);
                              setDeleteError("");
                            }}
                            className="px-2 py-1 text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 border border-red-200 rounded flex items-center gap-1 transition-colors"
                            title="Delete Transaction"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-[var(--color-border)] max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-purple-900">Edit Ortho Transaction</h3>
              <button
                onClick={() => setEditingTransaction(null)}
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
                  Transaction Date
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-purple-500"
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
                  className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-purple-500"
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
                  className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">
                  Payment Mode
                </label>
                <select
                  value={editPaymentMode}
                  onChange={(e) => setEditPaymentMode(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-purple-500 bg-white"
                >
                  <option value="Cash">Cash</option>
                  <option value="Swipe">Swipe</option>
                  <option value="Phone Pay">Phone Pay</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingTransaction(null)}
                  disabled={isSavingEdit}
                  className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-md font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {isSavingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTransaction && (
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
              Are you sure you want to permanently delete this Ortho transaction for OP{" "}
              <strong className="text-gray-900">{opNumber}</strong>?
            </p>

            <div className="bg-gray-50 p-3 rounded-lg text-xs space-y-1 text-gray-700 border">
              <div><span className="font-medium">Paid Amount:</span> ₹{deletingTransaction.paidAmount.toLocaleString("en-IN")}</div>
              <div><span className="font-medium">Discount:</span> ₹{deletingTransaction.discount.toLocaleString("en-IN")}</div>
              <div><span className="font-medium">Payment Mode:</span> {deletingTransaction.paymentMode}</div>
            </div>

            <p className="text-xs text-red-600 font-medium">
              This action will recalculate the patient outstanding balance and immediately refresh the ledger.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setDeletingTransaction(null)}
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
