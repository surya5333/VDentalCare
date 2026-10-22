"use client";

import { useState, useEffect } from "react";

export default function AppointmentsPage() {
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchAppointments = async () => {
    try {
      const res = await fetch(`/api/appointments?date=${date}`);
      if (!res.ok) throw new Error("Failed to fetch appointments");
      const data = await res.json();
      setAppointments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching appointments");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const updateStatus = async (opNumber: string, id: string, status: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/op/${opNumber}/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error("Failed to update status");
      
      // refresh
      await fetchAppointments();
    } catch (err) {
      alert("Error: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Appointments</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-[var(--color-muted)]">Date:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-[var(--color-border)] rounded px-3 py-1.5 text-sm outline-none focus:border-[var(--color-primary)]"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-[var(--color-muted)]">Loading appointments...</div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-[var(--color-border)] text-[var(--color-muted)]">
          No appointments found for this date.
        </div>
      ) : (
        <div className="bg-white border border-[var(--color-border)] rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F8FAFC] border-b border-[var(--color-border)] text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-3 font-semibold w-24">Time</th>
                <th className="px-4 py-3 font-semibold">OP No</th>
                <th className="px-4 py-3 font-semibold">Patient</th>
                <th className="px-4 py-3 font-semibold">Doctor</th>
                <th className="px-4 py-3 font-semibold">Notes</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold w-40">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {appointments.map((appt) => (
                <tr key={appt.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium">{appt.appointmentTime}</td>
                  <td className="px-4 py-3 text-blue-600 font-medium">
                    {appt.opRecord?.opNumber}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {appt.opRecord?.patientName}
                  </td>
                  <td className="px-4 py-3">Dr. {appt.doctor?.name}</td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">
                    {appt.notes || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      appt.status === "Scheduled" ? "bg-blue-100 text-blue-800" :
                      appt.status === "Completed" ? "bg-green-100 text-green-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {appt.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={appt.status}
                      disabled={isUpdating}
                      onChange={(e) => updateStatus(appt.opRecord.opNumber, appt.id, e.target.value)}
                      className="border border-[var(--color-border)] rounded px-2 py-1 text-xs outline-none focus:border-[var(--color-primary)] w-full bg-white"
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
