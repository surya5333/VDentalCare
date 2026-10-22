"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";

type ReportType = 'collection' | 'patient' | 'outstanding' | 'treatment';

export default function ManagerReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [activeTab, setActiveTab] = useState<ReportType>('collection');
  
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReport = async () => {
      setIsLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/manager-reports/${activeTab}-summary?month=${selectedMonth}`);
        if (!res.ok) throw new Error(`Failed to fetch ${activeTab} summary`);
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
      fetchReport();
    }
  }, [selectedMonth, activeTab]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Manager Reports</h1>
          <p className="text-sm text-[var(--color-muted)]">Comprehensive financial and operational reporting</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-[var(--color-muted)]">Month:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => { setSelectedMonth(e.target.value); setData(null); }}
            className="px-3 py-2 bg-white border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          />
        </div>
      </div>

      <div className="flex border-b border-[var(--color-border)] overflow-x-auto">
        <TabButton active={activeTab === 'collection'} onClick={() => { setActiveTab('collection'); setData(null); }}>Collection Summary</TabButton>
        <TabButton active={activeTab === 'patient'} onClick={() => { setActiveTab('patient'); setData(null); }}>Patient Summary</TabButton>
        <TabButton active={activeTab === 'outstanding'} onClick={() => { setActiveTab('outstanding'); setData(null); }}>Outstanding Summary</TabButton>
        <TabButton active={activeTab === 'treatment'} onClick={() => { setActiveTab('treatment'); setData(null); }}>Treatment Summary</TabButton>
      </div>

      {isLoading && <div className="py-8 text-center text-[var(--color-muted)]">Loading report data...</div>}
      {error && <div className="py-4 text-red-500 bg-red-50 px-4 rounded-md border border-red-100">{error}</div>}

      {!isLoading && data && (
        <div className="bg-white rounded-xl shadow-sm border border-[var(--color-border)] p-6">
          {activeTab === 'collection' && <CollectionReport data={data} />}
          {activeTab === 'patient' && <PatientReport data={data} />}
          {activeTab === 'outstanding' && <OutstandingReport data={data} />}
          {activeTab === 'treatment' && <TreatmentReport data={data} />}
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
        active 
          ? 'border-[var(--color-primary)] text-[var(--color-primary)]' 
          : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:border-gray-300'
      }`}
    >
      {children}
    </button>
  );
}

function CollectionReport({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold mb-4">Collection Summary - {data.month}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard title="Cash Collection" value={data.cash} />
        <SummaryCard title="Swipe Collection" value={data.swipe} />
        <SummaryCard title="Phone Pay Collection" value={data.phonePay} />
        <SummaryCard title="Total Collection" value={data.totalCollection} highlighted />
      </div>
    </div>
  );
}

function PatientReport({ data }: { data: any }) {
  const patients = data.patients || [];
  const totalPaid = patients.reduce((sum: number, p: any) => sum + p.totalPaid, 0);
  const totalDiscount = patients.reduce((sum: number, p: any) => sum + p.totalDiscount, 0);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold mb-4">Patient Summary - {data.month}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <SummaryCard title="Total Patients" value={patients.length} prefix="" />
        <SummaryCard title="Total Amount Paid" value={totalPaid} />
        <SummaryCard title="Total Discount Given" value={totalDiscount} />
      </div>

      <div className="overflow-x-auto border border-[var(--color-border)] rounded-lg">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#F0F4F8] text-[var(--color-muted)] text-xs uppercase">
            <tr>
              <th className="px-4 py-3">OP Number</th>
              <th className="px-4 py-3">Patient Name</th>
              <th className="px-4 py-3 text-right">Total Paid</th>
              <th className="px-4 py-3 text-right">Total Discount</th>
              <th className="px-4 py-3 text-right">Closing Balance</th>
            </tr>
          </thead>
          <tbody>
            {patients.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-4 text-center">No patient transactions found.</td></tr>
            ) : (
              patients.map((p: any) => (
                <tr key={p.opNumber} className="border-t border-[var(--color-border)]">
                  <td className="px-4 py-3 font-medium text-[var(--color-primary)]">{p.opNumber}</td>
                  <td className="px-4 py-3">{p.patientName}</td>
                  <td className="px-4 py-3 text-right text-green-600 font-medium">₹{p.totalPaid.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-right text-purple-600">₹{p.totalDiscount.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-right font-bold text-red-600">₹{p.closingBalance.toLocaleString("en-IN")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OutstandingReport({ data }: { data: any }) {
  const outstanding = data.outstanding || [];
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold mb-4">Outstanding Summary - {data.month}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <SummaryCard title="Patients with Outstanding" value={data.totalOutstandingPatients} prefix="" />
        <SummaryCard title="Total Outstanding Amount" value={data.totalOutstandingAmount} highlighted />
      </div>

      <div className="overflow-x-auto border border-[var(--color-border)] rounded-lg">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#F0F4F8] text-[var(--color-muted)] text-xs uppercase">
            <tr>
              <th className="px-4 py-3">OP Number</th>
              <th className="px-4 py-3">Patient Name</th>
              <th className="px-4 py-3">Last Transaction</th>
              <th className="px-4 py-3 text-right">Outstanding Balance</th>
            </tr>
          </thead>
          <tbody>
            {outstanding.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-4 text-center">No outstanding balances found.</td></tr>
            ) : (
              outstanding.map((o: any) => (
                <tr key={o.opNumber} className="border-t border-[var(--color-border)]">
                  <td className="px-4 py-3 font-medium text-[var(--color-primary)]">{o.opNumber}</td>
                  <td className="px-4 py-3">{o.patientName}</td>
                  <td className="px-4 py-3">{new Intl.DateTimeFormat('en-GB').format(new Date(o.lastTransactionDate))}</td>
                  <td className="px-4 py-3 text-right font-bold text-red-600">₹{o.outstandingAmount.toLocaleString("en-IN")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TreatmentReport({ data }: { data: any }) {
  const treatments = data.treatments || [];
  const totalValue = treatments.reduce((sum: number, t: any) => sum + t.totalValue, 0);
  const totalCount = treatments.reduce((sum: number, t: any) => sum + t.count, 0);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold mb-4">Treatment Summary - {data.month}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <SummaryCard title="Total Treatments Rendered" value={totalCount} prefix="" />
        <SummaryCard title="Total Treatment Value" value={totalValue} highlighted />
      </div>

      <div className="overflow-x-auto border border-[var(--color-border)] rounded-lg">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#F0F4F8] text-[var(--color-muted)] text-xs uppercase">
            <tr>
              <th className="px-4 py-3">Treatment Name</th>
              <th className="px-4 py-3 text-center">Quantity Rendered</th>
              <th className="px-4 py-3 text-right">Total Value</th>
            </tr>
          </thead>
          <tbody>
            {treatments.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-4 text-center">No treatments rendered this month.</td></tr>
            ) : (
              treatments.map((t: any) => (
                <tr key={t.treatmentName} className="border-t border-[var(--color-border)]">
                  <td className="px-4 py-3 font-medium">{t.treatmentName}</td>
                  <td className="px-4 py-3 text-center">{t.count}</td>
                  <td className="px-4 py-3 text-right font-medium">₹{t.totalValue.toLocaleString("en-IN")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, highlighted, prefix = "₹" }: { title: string, value: number, highlighted?: boolean, prefix?: string }) {
  const displayValue = value ?? 0;
  return (
    <div className={`p-4 rounded-lg shadow-sm border ${highlighted ? 'bg-[#F0F4F8] border-[var(--color-primary)]' : 'border-[var(--color-border)]'}`}>
      <h3 className={`text-xs uppercase font-semibold mb-1 ${highlighted ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted)]'}`}>
        {title}
      </h3>
      <p className={`text-xl font-bold ${highlighted ? 'text-[#1e40af]' : 'text-[var(--color-foreground)]'}`}>
        {prefix}{displayValue.toLocaleString("en-IN")}
      </p>
    </div>
  );
}
