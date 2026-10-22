"use client";

import { useState, useEffect } from "react";
import { Check, X } from "lucide-react";

interface BudgetSetting {
  id?: string;
  key: string;
  label: string;
  percentage: number;
}

export function ExpenseBudgetSettings() {
  const [settings, setSettings] = useState<BudgetSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    let ignore = false;
    fetch('/api/manager-reports/expenses/settings')
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        if (!ignore) {
          setSettings(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handlePercentageChange = (key: string, value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    
    // Store in state as basis points
    const basisPoints = Math.round(num * 100);
    
    setSettings(prev => 
      prev.map(s => s.key === key ? { ...s, percentage: basisPoints } : s)
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const totalBasisPoints = settings.reduce((sum, s) => sum + s.percentage, 0);
      if (totalBasisPoints > 10000) {
        throw new Error("Total allocated percentage cannot exceed 100%");
      }

      const payload = {
        updates: settings.map(s => ({
          key: s.key,
          percentage: s.percentage
        }))
      };

      const res = await fetch('/api/manager-reports/expenses/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error((await res.json()).error || "Failed to save settings");
      }

      setMessage({ type: 'success', text: 'Expense budget settings updated successfully.' });
    } catch (err: unknown) {
      const error = err as Error;
      setMessage({ type: 'error', text: error.message || 'Failed to save settings' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (loading) {
    return <div className="text-[var(--color-muted)] p-4 text-center">Loading settings...</div>;
  }

  const totalAllocated = settings.reduce((sum, s) => sum + s.percentage, 0);
  const unallocated = 10000 - totalAllocated;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-[var(--color-foreground)]">Expense Budget Allocations</h3>
          <p className="text-sm text-[var(--color-muted)]">Configure the percentage of monthly value allocated to each category.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-[#0EA5E9] text-white font-medium rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {settings.map(s => (
          <div key={s.key} className="bg-gray-50 p-4 rounded-xl border border-[var(--color-border)]">
            <label className="block text-sm font-bold text-gray-700 mb-2">{s.label}</label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={(s.percentage / 100).toString()}
                onChange={(e) => handlePercentageChange(s.key, e.target.value)}
                className="w-full pl-3 pr-8 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
              />
              <span className="absolute right-3 top-2.5 text-gray-400">%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 mt-6">
        <h4 className="font-bold text-blue-900 mb-2">Allocation Summary</h4>
        <div className="flex justify-between items-center text-sm mb-2">
          <span className="text-blue-700">Total Allocated:</span>
          <span className="font-bold text-blue-900">{(totalAllocated / 100).toFixed(1)}%</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-blue-700">Remaining Unallocated:</span>
          <span className={`font-bold ${unallocated < 0 ? 'text-red-600' : 'text-blue-900'}`}>{(unallocated / 100).toFixed(1)}%</span>
        </div>
        
        {/* Visual Bar */}
        <div className="w-full h-3 bg-white rounded-full mt-4 overflow-hidden border border-blue-200 flex">
          <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (totalAllocated / 100))}%` }}></div>
          {unallocated > 0 && <div className="h-full bg-gray-200" style={{ width: `${(unallocated / 100)}%` }}></div>}
        </div>
      </div>
    </div>
  );
}
