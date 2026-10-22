import { CompleteOPRecord } from "@/types/op";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface OPTableProps {
  records: CompleteOPRecord[];
  baseRoute: string;
}

export function OPTable({ records, baseRoute }: OPTableProps) {
  if (records.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-[var(--color-border)] p-12 text-center text-[var(--color-muted)]">
        No patients found.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[var(--color-border)] overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[900px]">
        <thead>
          <tr className="bg-gray-50 border-b border-[var(--color-border)]">
            <th className="py-3 px-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
              Section No.
            </th>
            <th className="py-3 px-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
              OP Number
            </th>
            <th className="py-3 px-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
              Patient Name
            </th>
            <th className="py-3 px-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
              Age/Sex
            </th>
            <th className="py-3 px-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
              Phone
            </th>
            <th className="py-3 px-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
              Date
            </th>
            <th className="py-3 px-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
              Reference
            </th>
            <th className="py-3 px-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
              Status
            </th>
            <th className="py-3 px-4 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {records.map((record) => {
            const p = record.patient;
            return (
              <tr key={p.opNumber} className="hover:bg-gray-50 transition-colors group">
                <td className="py-3 px-4 text-sm font-medium text-gray-500">
                  {p.sectionNo}
                </td>
                <td className="py-3 px-4 text-sm font-semibold text-[var(--color-primary)]">
                  {p.opNumber}
                </td>
                <td className="py-3 px-4 text-sm font-medium text-[var(--color-foreground)]">
                  {p.patientName}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {p.age} / {p.sex}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {p.phone}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {p.date}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {p.reference}
                </td>
                <td className="py-3 px-4 text-sm">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      p.paidStatus === "Paid"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {p.paidStatus}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm">
                  <Link
                    href={`${baseRoute}/${p.opNumber}`}
                    className="inline-flex items-center gap-1 text-[var(--color-primary)] hover:text-[#0b8ec7] font-medium transition-colors"
                  >
                    View
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
