"use client";

import { useEffect, useState } from "react";

import { ExpenseCategorySummary } from "@/components/expenses/ExpenseCategorySummary";
import { ExpenseLedger } from "@/components/expenses/ExpenseLedger";
import { LabExpenseLedger } from "@/components/expenses/LabExpenseLedger";
import { ExpenseHistory } from "@/components/expenses/ExpenseHistory";

interface ExpenseSummary {
  month: string;
  monthlyValue: number;
  generalCollections: number;
  orthoCollections: number;
  settings: {
    marketing: number;
    lab: number;
    salaries: number;
    office_expenses: number;
  };
  categories: {
    marketing: CategoryData;
    salaries: CategoryData;
    officeExpenses: CategoryData;
    lab: LabCategoryData;
  };
}

interface CategoryData {
  budget: number;
  spentCash: number;
  spentBank: number;
  totalSpent: number;
  remainingBudget: number;
  entries: any[];
}

interface LabCategoryData extends CategoryData {
  totalLabCost: number;
  remainingLabCost: number;
}

export default function ExpensesPage() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  
  const [data, setData] = useState<ExpenseSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("Marketing");

  const fetchSummary = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/manager-reports/expenses/summary?month=${month}`);
      if (!res.ok) {
        throw new Error(await res.text());
      }
      setData(await res.json());
    } catch (err: any) {
      setError(err.message || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [month]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-[var(--color-border)]">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-foreground)]">Expenses & Budget</h2>
          <p className="text-sm text-[var(--color-muted)]">Track monthly allocations and spending</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-[var(--color-muted)]">Select Month</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0EA5E9]"></div>
        </div>
      ) : data ? (
        <>
          {/* Top Level Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 rounded-xl border border-blue-200">
              <p className="text-sm font-semibold text-blue-700 uppercase tracking-wider mb-2">General Collections</p>
              <p className="text-3xl font-bold text-blue-900">₹{data.generalCollections.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-6 rounded-xl border border-purple-200">
              <p className="text-sm font-semibold text-purple-700 uppercase tracking-wider mb-2">Ortho Collections</p>
              <p className="text-3xl font-bold text-purple-900">₹{data.orthoCollections.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-100/50 p-6 rounded-xl border border-green-200 shadow-sm">
              <p className="text-sm font-semibold text-green-700 uppercase tracking-wider mb-2">Monthly Value</p>
              <p className="text-3xl font-bold text-green-900">₹{data.monthlyValue.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Budgets Summary Cards */}
          <ExpenseCategorySummary data={data} />

          {/* Detailed Ledgers via Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-[var(--color-border)] overflow-hidden">
            <div className="flex border-b border-[var(--color-border)] bg-gray-50/50 overflow-x-auto">
              {['Marketing', 'Salaries', 'Office Expenses', 'Lab Expenses', 'History'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 text-sm font-semibold whitespace-nowrap transition-colors ${
                    activeTab === tab
                      ? "text-[#0EA5E9] border-b-2 border-[#0EA5E9] bg-white"
                      : "text-[var(--color-muted)] hover:text-[#0EA5E9] hover:bg-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="p-6">
              {activeTab === 'Marketing' && (
                <ExpenseLedger 
                  category="MARKETING" 
                  data={data.categories.marketing} 
                  onRefresh={fetchSummary} 
                  month={month} 
                />
              )}
              {activeTab === 'Salaries' && (
                <ExpenseLedger 
                  category="SALARIES" 
                  data={data.categories.salaries} 
                  onRefresh={fetchSummary} 
                  month={month} 
                />
              )}
              {activeTab === 'Office Expenses' && (
                <ExpenseLedger 
                  category="OFFICE_EXPENSES" 
                  data={data.categories.officeExpenses} 
                  onRefresh={fetchSummary} 
                  month={month} 
                />
              )}
              {activeTab === 'Lab Expenses' && (
                <LabExpenseLedger 
                  data={data.categories.lab} 
                  onRefresh={fetchSummary} 
                  month={month}
                />
              )}
              {activeTab === 'History' && <ExpenseHistory />}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
