"use client";

import { useState, useEffect } from "react";
import { Check, AlertCircle } from "lucide-react";

export function RegistrationFeeSettings() {
  const [inputVal, setInputVal] = useState<string>("200");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    fetch("/api/settings/registration-fee")
      .then((res) => res.json())
      .then((data) => {
        const val = typeof data.fee === "number" ? data.fee : 200;
        setInputVal(val.toString());
      })
      .catch((err) => {
        console.error("Failed to load registration fee setting", err);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(inputVal, 10);
    if (isNaN(parsed) || parsed < 0) {
      setStatus({ type: "error", message: "Please enter a valid non-negative fee amount." });
      return;
    }

    setIsSaving(true);
    setStatus(null);

    try {
      const res = await fetch("/api/settings/registration-fee", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fee: parsed }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to update registration fee.");
      }

      const data = await res.json();
      setInputVal(data.fee.toString());
      setStatus({ type: "success", message: "OP Registration Fee updated successfully." });
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      setStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to update fee.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-4 text-sm text-[var(--color-muted)]">Loading settings...</div>;
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h3 className="text-lg font-bold text-[var(--color-foreground)]">OP Registration Fee</h3>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          Configure the default registration fee collected for new Paid OP registrations.
        </p>
      </div>

      {status && (
        <div
          className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
            status.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {status.type === "success" ? (
            <Check className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{status.message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
            Fee Amount (₹)
          </label>
          <div className="relative max-w-xs">
            <span className="absolute left-3 top-2.5 text-gray-400 font-medium">₹</span>
            <input
              type="number"
              min="0"
              step="1"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="w-full pl-8 pr-4 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              placeholder="200"
            />
          </div>
          <p className="text-xs text-[var(--color-muted)] mt-1">
            Default: ₹200. Used automatically during new Paid OP registration.
          </p>
        </div>

        <div>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 bg-[var(--color-primary)] text-white text-sm font-medium rounded-lg hover:bg-[#0b8ec7] transition-colors disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Setting"}
          </button>
        </div>
      </form>
    </div>
  );
}
