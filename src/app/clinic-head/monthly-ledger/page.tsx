"use client";

import { useState, useEffect } from "react";

interface MonthlyLedgerData {
  month: string;
  summary: {
    cash: number;
    swipe: number;
    phonePay: number;
    totalPaid: number;
  };
  discount: {
    totalDiscount: number;
  };
  patientInfo: {
    totalActiveOPs: number;
    totalTransactions: number;
  };
  outstanding: {
    closingOutstandingBalance: number;
  };
  patientBreakdown: {
    opNumber: string;
    patientName: string;
    totalCost: number;
    totalPaid: number;
    totalDiscount: number;
    treatmentCount: number;
    closingOutstandingBalance: number;
  }[];
}

export default function MonthlyLedgerPage() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [data, setData] = useState<MonthlyLedgerData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLedger = async () => {
      setIsLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/monthly-ledger?month=${selectedMonth}`);
        if (!res.ok) throw new Error("Failed to fetch monthly ledger");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (selectedMonth) {
      fetchLedger();
    }
  }, [selectedMonth]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Monthly Ledger</h1>
          <p className="text-sm text-[var(--color-muted)]">View monthly collections and patient balances</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-[var(--color-muted)]">Month:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 bg-white border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          />
        </div>
      </div>

      {isLoading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}

      {!isLoading && data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SummaryCard title="Cash" value={data.summary.cash} />
            <SummaryCard title="Swipe" value={data.summary.swipe} />
            <SummaryCard title="Phone Pay" value={data.summary.phonePay} />
            <SummaryCard title="Total Collections" value={data.summary.totalPaid} highlighted />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SummaryCard title="Total Discount" value={data.discount.totalDiscount} />
            <SummaryCard title="Total Active OPs" value={data.patientInfo.totalActiveOPs} prefix="" />
            <SummaryCard title="Total Transactions" value={data.patientInfo.totalTransactions} prefix="" />
            <SummaryCard title="Closing Balance" value={data.outstanding.closingOutstandingBalance} highlighted />
          </div>

          <div className="overflow-x-auto border border-[var(--color-border)] rounded-lg bg-white shadow-sm mt-8">
            <h2 className="text-lg font-bold px-4 py-3 bg-gray-50 border-b border-[var(--color-border)]">Patient Breakdown</h2>
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-[#F0F4F8] border-b border-[var(--color-border)] text-[var(--color-muted)] text-xs uppercase font-semibold">
                  <th className="px-4 py-3">OP Number</th>
                  <th className="px-4 py-3">Patient Name</th>
                  <th className="px-4 py-3 text-center">Treatments</th>
                  <th className="px-4 py-3 text-right">Total Cost</th>
                  <th className="px-4 py-3 text-right">Total Paid</th>
                  <th className="px-4 py-3 text-right">Total Discount</th>
                  <th className="px-4 py-3 text-right">Closing Balance</th>
                </tr>
              </thead>
              <tbody>
                {data.patientBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-[var(--color-muted)]">
                      No transactions found for {selectedMonth}
                    </td>
                  </tr>
                ) : (
                  data.patientBreakdown.map((row) => (
                    <tr key={row.opNumber} className="border-b border-[var(--color-border)] last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-[var(--color-primary)]">{row.opNumber}</td>
                      <td className="px-4 py-3">{row.patientName}</td>
                      <td className="px-4 py-3 text-center">{row.treatmentCount}</td>
                      <td className="px-4 py-3 text-right font-medium text-[var(--color-foreground)]">₹{row.totalCost?.toLocaleString("en-IN") ?? 0}</td>
                      <td className="px-4 py-3 text-right text-green-600 font-medium">₹{row.totalPaid.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-right text-purple-600">₹{row.totalDiscount.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-right font-bold text-red-600">₹{row.closingOutstandingBalance.toLocaleString("en-IN")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ title, value, highlighted, prefix = "₹" }: { title: string, value: number, highlighted?: boolean, prefix?: string }) {
  return (
    <div className={`p-4 rounded-lg shadow-sm border ${highlighted ? 'bg-[#F0F4F8] border-[var(--color-primary)]' : 'bg-white border-[var(--color-border)]'}`}>
      <h3 className={`text-xs uppercase font-semibold mb-1 ${highlighted ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted)]'}`}>
        {title}
      </h3>
      <p className={`text-xl font-bold ${highlighted ? 'text-[#1e40af]' : 'text-[var(--color-foreground)]'}`}>
        {prefix}{value.toLocaleString("en-IN")}
      </p>
    </div>
  );
}
