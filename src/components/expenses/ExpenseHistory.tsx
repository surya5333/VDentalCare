"use client";

import { useEffect, useState } from "react";

export function ExpenseHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/manager-reports/expenses/summary');
        if (!res.ok) throw new Error("Failed to load history");
        const data = await res.json();
        setHistory(data.history || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <div className="p-8 text-center text-[var(--color-muted)]">Loading history...</div>;

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-gray-900">Monthly Value History</h3>
      <div className="overflow-x-auto border border-[var(--color-border)] rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-[var(--color-border)] text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-3">Month</th>
              <th className="px-4 py-3 text-right">General Collections</th>
              <th className="px-4 py-3 text-right">Ortho Collections</th>
              <th className="px-4 py-3 text-right">Monthly Value</th>
              <th className="px-4 py-3 text-right">Last Calculated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {history.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No history recorded yet.</td></tr>
            ) : (
              history.map((row: any) => {
                const monthDate = new Date(row.month);
                const monthDisplay = monthDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
                return (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{monthDisplay}</td>
                    <td className="px-4 py-3 text-right text-gray-600">₹{row.generalCollections.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right text-gray-600">₹{row.orthoCollections.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right font-bold text-green-700">₹{row.monthlyValue.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right text-xs text-gray-500">{new Date(row.lastCalculatedAt).toLocaleString('en-GB')}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
