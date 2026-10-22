"use client";

import { useState, useEffect } from "react";
import { Download, TrendingUp, Users, DollarSign, Wallet } from "lucide-react";

interface OrthoPatientReport {
  opNumber: string;
  patientName: string;
  treatmentCount: number;
  totalOrthoCost?: number;
  grossTreatmentCost?: number;
  totalPaid: number;
  totalDiscount: number;
  currentOutstanding: number;
  outstanding?: number;
}

interface OrthoReportData {
  summary: {
    totalPatients?: number;
    totalOrthoPatients?: number;
    totalOrthoCost?: number;
    totalGrossTreatmentCost?: number;
    totalTreatmentCharges?: number;
    totalPaid: number;
    totalOutstanding: number;
    collection: {
      cash: number;
      swipe: number;
      phonePay: number;
      total: number;
    };
  };
  patients: OrthoPatientReport[];
}

export default function OrthoFinancialReportPage() {
  const [data, setData] = useState<OrthoReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch("/api/manager-reports/ortho-report");
        if (!res.ok) throw new Error("Failed to fetch Ortho report");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, []);

  const downloadCSV = () => {
    if (!data?.patients) return;
    const headers = [
      "OP Number", "Patient Name", "Treatments", "Total Ortho Cost", "Paid", "Discount", "Outstanding"
    ];
    const csvContent = [
      headers.join(","),
      ...data.patients.map((p: OrthoPatientReport) => [
        p.opNumber,
        `"${p.patientName}"`,
        p.treatmentCount,
        p.totalOrthoCost ?? p.grossTreatmentCost ?? 0,
        p.totalPaid,
        p.totalDiscount,
        p.currentOutstanding
      ].join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ortho_cumulative_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-lg text-center font-medium max-w-2xl mx-auto mt-12">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const { summary, patients } = data;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-purple-900">Cumulative Ortho Financial Report</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">Live overview of all Ortho patient financials.</p>
        </div>
        <button
          onClick={downloadCSV}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-[var(--color-border)] rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[var(--color-border)] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Users className="w-5 h-5" /></div>
            <h3 className="text-sm font-medium text-[var(--color-muted)]">Total Ortho Patients</h3>
          </div>
          <p className="text-2xl font-bold text-[var(--color-foreground)]">{summary.totalOrthoPatients}</p>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-[var(--color-border)] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><DollarSign className="w-5 h-5" /></div>
            <h3 className="text-sm font-medium text-[var(--color-muted)]">Total Ortho Cost</h3>
          </div>
          <p className="text-2xl font-bold text-[var(--color-foreground)]">₹{(summary.totalOrthoCost ?? summary.totalTreatmentCharges ?? 0).toLocaleString("en-IN")}</p>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-[var(--color-border)] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg"><Wallet className="w-5 h-5" /></div>
            <h3 className="text-sm font-medium text-[var(--color-muted)]">Total Paid</h3>
          </div>
          <p className="text-2xl font-bold text-green-700">₹{summary.totalPaid.toLocaleString("en-IN")}</p>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-[var(--color-border)] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg"><TrendingUp className="w-5 h-5" /></div>
            <h3 className="text-sm font-medium text-[var(--color-muted)]">Total Outstanding</h3>
          </div>
          <p className="text-2xl font-bold text-red-600">₹{summary.totalOutstanding.toLocaleString("en-IN")}</p>
        </div>
      </div>

      <div className="bg-white border border-[var(--color-border)] rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[var(--color-border)]">
          <h3 className="text-lg font-bold text-[var(--color-foreground)]">Patient Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-purple-50 text-[var(--color-muted)] border-b border-[var(--color-border)]">
              <tr>
                <th className="px-5 py-3 font-semibold">OP No</th>
                <th className="px-5 py-3 font-semibold">Patient Name</th>
                <th className="px-5 py-3 font-semibold text-center">Treatments</th>
                <th className="px-5 py-3 font-semibold text-right">Total Ortho Cost</th>
                <th className="px-5 py-3 font-semibold text-right">Paid</th>
                <th className="px-5 py-3 font-semibold text-right">Discount</th>
                <th className="px-5 py-3 font-semibold text-right">Outstanding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-[var(--color-muted)]">
                    No Ortho patients found.
                  </td>
                </tr>
              ) : (
                patients.map((p: OrthoPatientReport) => (
                  <tr key={p.opNumber} className="hover:bg-purple-50/50">
                    <td className="px-5 py-3 text-purple-700 font-medium">
                      {p.opNumber}
                    </td>
                    <td className="px-5 py-3 font-medium text-[var(--color-foreground)]">
                      {p.patientName}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {p.treatmentCount}
                    </td>
                    <td className="px-5 py-3 text-right">
                      ₹{(p.totalOrthoCost ?? p.grossTreatmentCost ?? 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-3 text-right text-green-600 font-medium">
                      ₹{p.totalPaid.toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-3 text-right text-purple-600">
                      {p.totalDiscount > 0 ? `₹${p.totalDiscount.toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td className="px-5 py-3 text-right text-red-600 font-bold">
                      ₹{p.currentOutstanding.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
