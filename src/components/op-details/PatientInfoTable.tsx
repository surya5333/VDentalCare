interface PatientInfoTableProps {
  data: {
    sectionNo: string;
    opNumber: string;
    patientName: string;
    age: number;
    sex: string;
    phone: string;
    date: string;
    reference: string;
    paidStatus: "Paid" | "Free";
    workflowType?: "GENERAL" | "ORTHO";
    registrationFee?: number;
    paymentMode?: string;
  };
}

export function PatientInfoTable({ data }: PatientInfoTableProps) {
  return (
    <div>
      <h2 className="text-base font-bold text-[var(--color-foreground)] mb-3">
        Patient Information
      </h2>
      <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F0F4F8] border-b border-[var(--color-border)]">
              <th className="text-left px-4 py-2.5 font-semibold text-[var(--color-muted)] text-xs uppercase tracking-wide">Section No.</th>
              <th className="text-left px-4 py-2.5 font-semibold text-[var(--color-muted)] text-xs uppercase tracking-wide">OP Number</th>
              <th className="text-left px-4 py-2.5 font-semibold text-[var(--color-muted)] text-xs uppercase tracking-wide">Patient Name</th>
              <th className="text-left px-4 py-2.5 font-semibold text-[var(--color-muted)] text-xs uppercase tracking-wide">Age</th>
              <th className="text-left px-4 py-2.5 font-semibold text-[var(--color-muted)] text-xs uppercase tracking-wide">Sex</th>
              <th className="text-left px-4 py-2.5 font-semibold text-[var(--color-muted)] text-xs uppercase tracking-wide">Phone / WhatsApp</th>
              <th className="text-left px-4 py-2.5 font-semibold text-[var(--color-muted)] text-xs uppercase tracking-wide">Date</th>
              <th className="text-left px-4 py-2.5 font-semibold text-[var(--color-muted)] text-xs uppercase tracking-wide">Reference</th>
              <th className="text-left px-4 py-2.5 font-semibold text-[var(--color-muted)] text-xs uppercase tracking-wide">Patient Type</th>
              <th className="text-left px-4 py-2.5 font-semibold text-[var(--color-muted)] text-xs uppercase tracking-wide">Paid / Free</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-white">
              <td className="px-4 py-3 text-[var(--color-foreground)]">{data.sectionNo}</td>
              <td className="px-4 py-3 text-[var(--color-foreground)]">{data.opNumber}</td>
              <td className="px-4 py-3 text-[var(--color-foreground)] font-medium">{data.patientName}</td>
              <td className="px-4 py-3 text-[var(--color-foreground)]">{data.age}</td>
              <td className="px-4 py-3 text-[var(--color-foreground)]">{data.sex}</td>
              <td className="px-4 py-3 text-[var(--color-foreground)]">
                <div className="flex items-center gap-2">
                  {data.phone}
                  {/* WhatsApp icon */}
                  <svg className="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
              </td>
              <td className="px-4 py-3 text-[var(--color-foreground)]">{data.date}</td>
              <td className="px-4 py-3 text-[var(--color-foreground)]">{data.reference}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                  data.workflowType === "ORTHO" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                }`}>
                  {data.workflowType || "GENERAL"}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                  data.paidStatus === "Paid"
                    ? "bg-green-100 text-green-700 border border-green-300"
                    : "bg-gray-100 text-gray-600 border border-gray-300"
                }`}>
                  {data.paidStatus === "Paid"
                    ? `Paid (₹${data.registrationFee ?? 200}${data.paymentMode ? ` - ${data.paymentMode}` : ""})`
                    : "Free (₹0)"}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
