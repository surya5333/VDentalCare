"use client";

import { useState } from "react";
import { Edit2, Trash2, X, Plus } from "lucide-react";

export function ExpenseLedger({ category, data, onRefresh, month }: { category: string, data: any, onRefresh: () => void, month: string }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [expenseDate, setExpenseDate] = useState("");
  const [nameOrDescription, setNameOrDescription] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [bankAmount, setBankAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openForm = (entry?: any) => {
    if (entry) {
      setEditingId(entry.id);
      setExpenseDate(entry.expenseDate.split('T')[0]);
      setNameOrDescription(entry.nameOrDescription);
      setCashAmount(entry.cashAmount.toString());
      setBankAmount(entry.bankAmount.toString());
      setNotes(entry.notes || "");
    } else {
      setEditingId(null);
      setExpenseDate(`${month}-01`);
      setNameOrDescription("");
      setCashAmount("");
      setBankAmount("");
      setNotes("");
    }
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const payload = {
        category,
        expenseDate,
        nameOrDescription,
        cashAmount: Number(cashAmount) || 0,
        bankAmount: Number(bankAmount) || 0,
        notes
      };

      const url = editingId 
        ? `/api/manager-reports/expenses/entries/${editingId}`
        : `/api/manager-reports/expenses/entries`;
        
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(await res.text());
      
      closeForm();
      onRefresh();
    } catch (error) {
      console.error(error);
      alert("Failed to save expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    
    try {
      const res = await fetch(`/api/manager-reports/expenses/entries/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error("Failed to delete");
      onRefresh();
    } catch (error) {
      console.error(error);
      alert("Failed to delete expense");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-gray-900">
          {category.replace('_', ' ')} Ledger
        </h3>
        {!isFormOpen && (
          <button
            onClick={() => openForm()}
            className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white text-sm font-medium rounded-lg hover:bg-sky-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        )}
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-xl border border-[var(--color-border)] mb-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-gray-800">{editingId ? 'Edit Expense' : 'New Expense'}</h4>
            <button type="button" onClick={closeForm} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date *</label>
              <input required type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Description *</label>
              <input required type="text" value={nameOrDescription} onChange={e => setNameOrDescription(e.target.value)} placeholder="e.g. Meta Ads, Salary" className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Cash Paid (₹)</label>
              <input type="number" min="0" value={cashAmount} onChange={e => setCashAmount(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Bank Paid (₹)</label>
              <input type="number" min="0" value={bankAmount} onChange={e => setBankAmount(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <button type="button" onClick={closeForm} className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-gray-100">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium bg-[#0EA5E9] text-white rounded-md hover:bg-sky-600">
              {isSubmitting ? 'Saving...' : 'Save Expense'}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto border border-[var(--color-border)] rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-[var(--color-border)] text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3 text-right">Cash</th>
              <th className="px-4 py-3 text-right">Bank</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-center w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {data.entries.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No expenses recorded for this month.</td></tr>
            ) : (
              data.entries.map((entry: any) => (
                <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">{new Date(entry.expenseDate).toLocaleDateString('en-GB')}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {entry.nameOrDescription}
                    {entry.notes && <p className="text-xs text-gray-500 font-normal mt-0.5">{entry.notes}</p>}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">₹{entry.cashAmount.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right text-gray-600">₹{entry.bankAmount.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">₹{(entry.cashAmount + entry.bankAmount).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openForm(entry)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(entry.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
