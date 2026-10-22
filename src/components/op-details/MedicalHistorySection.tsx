"use client";

import { useState } from "react";
import { MedicalHistory } from "@/types/op";
import { Activity, Plus, X } from "lucide-react";

interface MedicalHistorySectionProps {
  roleLabel?: string;
  medicalHistory?: MedicalHistory;
  chiefComplaint?: string;
  isEditable?: boolean;
  onUpdateMedicalHistory?: (history: MedicalHistory) => void;
  onUpdateChiefComplaint?: (complaint: string) => void;
}

export function MedicalHistorySection({
  roleLabel,
  medicalHistory = { diabetes: false, hypertension: false, other: "" },
  chiefComplaint = "",
  isEditable = false,
  onUpdateMedicalHistory,
  onUpdateChiefComplaint,
}: MedicalHistorySectionProps) {
  const [showOtherDialog, setShowOtherDialog] = useState(false);
  const [otherText, setOtherText] = useState(medicalHistory.other || "");

  const handleToggle = (field: "diabetes" | "hypertension") => {
    if (!isEditable || !onUpdateMedicalHistory) return;
    onUpdateMedicalHistory({
      ...medicalHistory,
      [field]: !medicalHistory[field],
    });
  };

  const handleSaveOther = () => {
    if (onUpdateMedicalHistory) {
      onUpdateMedicalHistory({
        ...medicalHistory,
        other: otherText.trim(),
      });
    }
    setShowOtherDialog(false);
  };

  return (
    <div className="bg-white border border-[var(--color-border)] rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2.5 mb-3">
        <h3 className="text-sm font-bold text-[var(--color-foreground)] flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#1e40af]" />
          <span className="text-[#1e40af]">Medical History & Clinical Observations</span>
          {roleLabel && (
            <span className="text-[var(--color-primary)] font-normal text-xs ml-1">
              ({roleLabel})
            </span>
          )}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Medical History */}
        <div>
          <h4 className="text-xs font-semibold text-[var(--color-foreground)] mb-2">
            Medical History
          </h4>
          <div className="flex items-center gap-4">
            <label
              className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                medicalHistory.diabetes
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              } ${isEditable ? "cursor-pointer" : "cursor-default"}`}
              onClick={() => handleToggle("diabetes")}
            >
              <input
                type="checkbox"
                checked={medicalHistory.diabetes}
                onChange={() => {}}
                disabled={!isEditable}
                className="rounded text-red-600 focus:ring-red-500"
              />
              Diabetes
            </label>

            <label
              className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                medicalHistory.hypertension
                  ? "bg-orange-50 border-orange-200 text-orange-700"
                  : "bg-gray-50 border-gray-200 text-gray-700"
              } ${isEditable ? "cursor-pointer" : "cursor-default"}`}
              onClick={() => handleToggle("hypertension")}
            >
              <input
                type="checkbox"
                checked={medicalHistory.hypertension}
                onChange={() => {}}
                disabled={!isEditable}
                className="rounded text-orange-600 focus:ring-orange-500"
              />
              Hypertension
            </label>

            {medicalHistory.other ? (
              <div className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800">
                <span>Other: {medicalHistory.other}</span>
                {isEditable && (
                  <button
                    onClick={() => {
                      setOtherText(medicalHistory.other || "");
                      setShowOtherDialog(true);
                    }}
                    className="text-blue-600 hover:text-blue-900 ml-1 underline"
                  >
                    Edit
                  </button>
                )}
              </div>
            ) : (
              isEditable && (
                <button
                  type="button"
                  onClick={() => setShowOtherDialog(true)}
                  className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Other
                </button>
              )
            )}
          </div>
        </div>

        {/* Chief Complaint */}
        <div>
          <h4 className="text-xs font-semibold text-[var(--color-foreground)] mb-1.5">
            Chief Complaint
          </h4>
          {isEditable ? (
            <textarea
              rows={2}
              value={chiefComplaint}
              onChange={(e) => onUpdateChiefComplaint?.(e.target.value)}
              placeholder="Enter patient's chief complaint..."
              className="w-full text-xs p-2 border border-[var(--color-border)] rounded-lg outline-none focus:border-[var(--color-primary)] bg-white resize-none"
            />
          ) : (
            <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded-lg border border-gray-200 min-h-[46px]">
              {chiefComplaint || "No chief complaint recorded."}
            </p>
          )}
        </div>
      </div>

      {/* Dialog for Other Medical History */}
      {showOtherDialog && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-gray-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h4 className="text-sm font-bold text-gray-900">Add Medical History: Other</h4>
              <button
                onClick={() => setShowOtherDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Condition / Note
              </label>
              <input
                type="text"
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                placeholder="e.g. Asthma, Penicillin allergy, Cardiac history"
                className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowOtherDialog(false)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveOther}
                className="px-4 py-1.5 text-xs font-medium bg-[var(--color-primary)] text-white rounded-lg hover:bg-[#0b8ec7]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
