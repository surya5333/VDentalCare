"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, Printer } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PatientInfoTable } from "./PatientInfoTable";
import { TreatmentLabInfoTable } from "./TreatmentLabInfoTable";
import { ImageGallerySection } from "./ImageGallerySection";
import { FinalTreatmentPlan } from "./FinalTreatmentPlan";
import { CostDiscount } from "./CostDiscount";
import { MedicalHistorySection } from "./MedicalHistorySection";
import { CompleteOPRecord, TreatmentLabInfo, MedicalHistory, FinalizedTreatment, CrownType } from "@/types/op";
import { catalogueService } from "@/services/catalogueService";
import { opService } from "@/services/opService";
import { DoctorCaseSheet } from "../working-doctor/DoctorCaseSheet";
import { LabRecordsSection } from "./LabRecordsSection";
import { PatientLedger } from "./PatientLedger";

interface OPDetailsProps {
  role: "Front Office" | "Clinic Head" | "Working Doctor";
  backHref: string;
  data: CompleteOPRecord;
}

interface RolePermissions {
  canEditMedicalHistory: boolean;
  canEditTreatmentLab: boolean;
  canEditFinalTreatmentPlan: boolean;
  canEditCostDiscount: boolean;
  canUploadTreatmentPlan: boolean;
  canUploadXRay: boolean;
  canEditDoctorCaseSheet: boolean;
  canSaveOPDetails: boolean;
  canAddPayment: boolean;
}

const ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  "Front Office": {
    canEditMedicalHistory: false,
    canEditTreatmentLab: false,
    canEditFinalTreatmentPlan: false,
    canEditCostDiscount: false,
    canUploadTreatmentPlan: false,
    canUploadXRay: false,
    canEditDoctorCaseSheet: false,
    canSaveOPDetails: false,
    canAddPayment: true,
  },
  "Clinic Head": {
    canEditMedicalHistory: true,
    canEditTreatmentLab: true,
    canEditFinalTreatmentPlan: true,
    canEditCostDiscount: true,
    canUploadTreatmentPlan: true,
    canUploadXRay: true,
    canEditDoctorCaseSheet: false,
    canSaveOPDetails: true,
    canAddPayment: true,
  },
  "Working Doctor": {
    canEditMedicalHistory: false,
    canEditTreatmentLab: false,
    canEditFinalTreatmentPlan: false,
    canEditCostDiscount: false,
    canUploadTreatmentPlan: false,
    canUploadXRay: false,
    canEditDoctorCaseSheet: true,
    canSaveOPDetails: false,
    canAddPayment: false,
  }
};

// ─── Financial Calculation Helpers ───────────────────────────────────────────

function computeFinancials(finalized: FinalizedTreatment[], currentDiscount: string) {
  // Treatment Plan Cost = sum of non-crown finalized treatment prices
  const nonCrownCost = finalized
    .filter(ft => ft.treatmentId !== "crowns")
    .reduce((sum, ft) => sum + ft.patientPrice, 0);

  // Total Crown Cost = crown patientPrice × numberOfCrowns (stored in finalized treatment's patientPrice)
  const crownTreatment = finalized.find(ft => ft.treatmentId === "crowns");
  const crownCost = crownTreatment ? crownTreatment.patientPrice : 0;

  // Total Amount = non-crown + crown
  const totalAmount = nonCrownCost + crownCost;

  // Discount cannot exceed total
  const discountNum = Number(currentDiscount.replace(/,/g, "")) || 0;
  const validDiscount = Math.min(discountNum, totalAmount);

  // Net = total - discount
  const netAmount = Math.max(0, totalAmount - validDiscount);

  return {
    treatmentPlanCost: nonCrownCost.toLocaleString("en-IN"),
    totalCrownCost: crownCost.toLocaleString("en-IN"),
    totalAmount: totalAmount.toLocaleString("en-IN"),
    finalDiscount: validDiscount ? validDiscount.toLocaleString("en-IN") : "",
    netAmount: netAmount.toLocaleString("en-IN"),
  };
}

// ─── Component ──────────────────────────────────────────────────────────────

export function OPDetails({ role, backHref, data: initialData }: OPDetailsProps) {
  const router = useRouter();
  const [data, setData] = useState<CompleteOPRecord>(() => {
    const finalized = (initialData.treatmentLab.finalizedTreatments || []).map((ft) => {
      if (ft.treatmentId === "crowns" && !ft.egEhsGen && initialData.treatmentLab.egEhsGen) {
        return { ...ft, egEhsGen: initialData.treatmentLab.egEhsGen };
      }
      return ft;
    });
    const financials = computeFinancials(finalized, initialData.treatmentLab.finalDiscount || "0");
    return {
      ...initialData,
      treatmentLab: {
        ...initialData.treatmentLab,
        treatmentPlan: initialData.treatmentLab.treatmentPlan || [],
        finalizedTreatments: finalized,
        ...financials,
      },
    };
  });
  const [isSaving, setIsSaving] = useState(false);
  const [ledgerKey, setLedgerKey] = useState(0);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error', message: string } | null>(() => {
    if (typeof window !== "undefined") {
      const savedToast = sessionStorage.getItem("op_save_success_toast");
      if (savedToast) {
        sessionStorage.removeItem("op_save_success_toast");
        return { type: 'success', message: savedToast };
      }
    }
    return null;
  });
  const [crownCatalogue, setCrownCatalogue] = useState<CrownType[]>([]);

  useEffect(() => {
    if (saveStatus?.type === 'success') {
      const timer = setTimeout(() => setSaveStatus(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  useEffect(() => {
    catalogueService.getCrownTypes().then(setCrownCatalogue).catch(console.error);
  }, []);

  const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS["Front Office"];

  const handleUpdateTreatmentLab = (updates: Partial<TreatmentLabInfo>) => {
    setData((prev) => {
      const newTreatmentLab = { ...prev.treatmentLab, ...updates };

      // If crown type or number of crowns changed in TreatmentLabInfo,
      // synchronize with the finalized Crowns treatment
      if ("crownType" in updates || "numberOfCrowns" in updates) {
        const crownType = updates.crownType ?? newTreatmentLab.crownType;
        const numberOfCrowns = updates.numberOfCrowns ?? newTreatmentLab.numberOfCrowns ?? 0;
        const crown = crownCatalogue.find(c => c.id === crownType);
        const crownPrice = crown ? (crown.patientPrice || 0) * (numberOfCrowns || 0) : 0;

        newTreatmentLab.finalizedTreatments = (newTreatmentLab.finalizedTreatments || []).map(ft =>
          ft.treatmentId === "crowns"
            ? { ...ft, crownType, numberOfCrowns: numberOfCrowns, patientPrice: crownPrice, quantity: numberOfCrowns }
            : ft
        );
      }

      if ("egEhsGen" in updates) {
        const egEhsGen = updates.egEhsGen ?? "";
        newTreatmentLab.finalizedTreatments = (newTreatmentLab.finalizedTreatments || []).map(ft =>
          ft.treatmentId === "crowns" ? { ...ft, egEhsGen } : ft
        );
      }

      // Recalculate financials
      const financials = computeFinancials(
        newTreatmentLab.finalizedTreatments || [],
        newTreatmentLab.finalDiscount
      );
      return {
        ...prev,
        treatmentLab: { ...newTreatmentLab, ...financials },
      };
    });
  };

  const handleUpdateProposedTreatmentPlan = (selected: string[]) => {
    setData((prev) => {
      // Keep only finalized treatments whose IDs are still in the proposed list
      const updatedFinal = (prev.treatmentLab.finalizedTreatments || []).filter((ft) =>
        selected.includes(ft.treatmentId)
      );

      // If crowns was removed from proposed, clear crown info in TreatmentLabInfo
      const crownsRemoved = !selected.includes("crowns") && (prev.treatmentLab.treatmentPlan || []).includes("crowns");

      const financials = computeFinancials(updatedFinal, prev.treatmentLab.finalDiscount);

      return {
        ...prev,
        treatmentLab: {
          ...prev.treatmentLab,
          treatmentPlan: selected,
          finalizedTreatments: updatedFinal,
          ...(crownsRemoved ? { crownType: "", numberOfCrowns: null, egEhsGen: "" as const } : {}),
          ...financials,
        },
      };
    });
  };

  const handleUpdateFinalTreatmentPlan = (finalized: FinalizedTreatment[]) => {
    setData((prev) => {
      // Synchronize crown data from finalized Crowns treatment to TreatmentLabInfo
      const crownTreatment = finalized.find(ft => ft.treatmentId === "crowns");
      const crownSync = crownTreatment
        ? {
            crownType: crownTreatment.crownType || "",
            numberOfCrowns: crownTreatment.numberOfCrowns ?? 0,
            egEhsGen: (crownTreatment.egEhsGen || "") as "E+G" | "EHS" | "GEN" | "",
          }
        : {};

      // If crowns was removed from finalized, clear crown info
      const hadCrowns = (prev.treatmentLab.finalizedTreatments || []).some(ft => ft.treatmentId === "crowns");
      const hasCrowns = finalized.some(ft => ft.treatmentId === "crowns");
      const crownCleared = hadCrowns && !hasCrowns ? { crownType: "", numberOfCrowns: null, egEhsGen: "" as const } : {};

      const financials = computeFinancials(finalized, prev.treatmentLab.finalDiscount);

      return {
        ...prev,
        treatmentLab: {
          ...prev.treatmentLab,
          finalizedTreatments: finalized,
          ...crownSync,
          ...crownCleared,
          ...financials,
        },
      };
    });
  };

  const handleDiscountChange = (discountStr: string) => {
    setData((prev) => {
      const finalized = prev.treatmentLab.finalizedTreatments || [];
      const financials = computeFinancials(finalized, discountStr);
      return {
        ...prev,
        treatmentLab: {
          ...prev.treatmentLab,
          ...financials,
        },
      };
    });
  };

  const handleUpdateMedicalHistory = (history: MedicalHistory) => {
    setData((prev) => ({
      ...prev,
      medicalHistory: history,
    }));
  };

  const handleSave = async () => {
    if (isSaving) return;

    if (!data.patient?.opNumber) {
      setSaveStatus({ type: 'error', message: 'Missing OP Number.' });
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);
    try {
      const updated = await opService.updateOP(data.patient.opNumber, data);
      if (!updated) {
        throw new Error('Failed to update OP record.');
      }

      // Re-fetch authoritative OP data after save to refresh UI with latest server state
      const refreshed = await opService.getOPByNumber(data.patient.opNumber);
      if (refreshed) {
        const finalized = (refreshed.treatmentLab.finalizedTreatments || []).map((ft) => {
          if (ft.treatmentId === "crowns" && !ft.egEhsGen && refreshed.treatmentLab.egEhsGen) {
            return { ...ft, egEhsGen: refreshed.treatmentLab.egEhsGen };
          }
          return ft;
        });
        const financials = computeFinancials(finalized, refreshed.treatmentLab.finalDiscount || "0");
        setData({
          ...refreshed,
          treatmentLab: {
            ...refreshed.treatmentLab,
            treatmentPlan: refreshed.treatmentLab.treatmentPlan || [],
            finalizedTreatments: finalized,
            ...financials,
          },
        });
      }

      setLedgerKey((prev) => prev + 1);

      if (typeof window !== "undefined") {
        sessionStorage.setItem("op_save_success_toast", "Changes saved successfully.");
        window.location.reload();
        return;
      }

      router.refresh();
      setSaveStatus({ type: 'success', message: 'Changes saved successfully.' });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error("Failed to save changes", error);
      const errMsg = error instanceof Error ? error.message : 'Failed to save changes. Please try again.';
      setSaveStatus({ type: 'error', message: errMsg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClassifyOrtho = async () => {
    try {
      const response = await fetch(`/api/op/${data.patient.opNumber}/classify-ortho`, {
        method: "PATCH",
      });
      if (!response.ok) {
        const err = await response.json();
        setSaveStatus({ type: 'error', message: err.error || 'Failed to classify as ORTHO' });
        return;
      }
      setSaveStatus({ type: 'success', message: 'Patient classified as ORTHO successfully.' });
      setTimeout(() => {
        window.location.href = backHref.replace("/op-list", "/ortho/op-list") + "/" + data.patient.opNumber;
      }, 1500);
    } catch {
      setSaveStatus({ type: 'error', message: 'Failed to classify as ORTHO' });
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {saveStatus && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg text-white z-50 transition-opacity ${saveStatus.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {saveStatus.message}
        </div>
      )}

      {/* Breadcrumb + Title + Actions */}
      <div className="flex items-start justify-between">
        <div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-[var(--color-muted)] mb-1">
            <Link
              href={backHref}
              className="flex items-center gap-1 hover:text-[var(--color-primary)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              OP List
            </Link>
            <span className="text-[var(--color-border)]">›</span>
            <span className="text-[var(--color-foreground)] font-medium">OP Details</span>
          </div>
          {/* Title */}
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
            OP Details
          </h1>
        </div>
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {role === "Clinic Head" && data.patient.workflowType !== "ORTHO" && (
            <button
              onClick={handleClassifyOrtho}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              Classify as ORTHO
            </button>
          )}
          {permissions.canSaveOPDetails && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          )}
          <a
            href={`/api/op/${data.patient.opNumber}/final-bill`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:bg-[#0b8ec7] transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print Bill
          </a>
        </div>
      </div>

      {/* Patient Information */}
      <PatientInfoTable data={data.patient} />

      {/* Medical History & Clinical Observations (Clinic Head Section) */}
      <MedicalHistorySection
        roleLabel={role === "Clinic Head" ? "Clinic Head" : undefined}
        medicalHistory={data.medicalHistory}
        chiefComplaint={data.chiefComplaint}
        isEditable={permissions.canEditMedicalHistory}
        onUpdateMedicalHistory={handleUpdateMedicalHistory}
        onUpdateChiefComplaint={(complaint) => setData(prev => ({ ...prev, chiefComplaint: complaint }))}
      />

      {/* Treatment & Lab Information */}
      <TreatmentLabInfoTable
        data={data.treatmentLab}
        isEditable={permissions.canEditTreatmentLab}
        onChange={handleUpdateTreatmentLab}
      />

      <LabRecordsSection
        opNumber={data.patient.opNumber}
        isEditable={permissions.canEditTreatmentLab}
      />

      {/* Image Galleries: Treatment Plan, X-Ray, Doctor Case Sheet */}
      <div className="grid grid-cols-3 gap-6">
        <ImageGallerySection
          title="Treatment Plan"
          roleLabel="Clinic Head"
          images={data.treatmentPlanImages.map((img) => ({
            name: img.filename,
            date: img.uploadedAt,
            thumbnailUrl: img.url,
          }))}
          isEditable={permissions.canUploadTreatmentPlan}
        />
        <ImageGallerySection
          title="X-Ray"
          images={data.xrayImages.map((img) => ({
            name: img.filename,
            date: img.uploadedAt,
            thumbnailUrl: img.url,
          }))}
          isEditable={permissions.canUploadXRay}
        />
        {role !== "Working Doctor" && (
          <ImageGallerySection
            title="Doctor Case Sheet"
            roleLabel="Working Doctor"
            images={data.caseSheets
              .flatMap((visit) => visit.images)
              .map((img) => ({ name: img.filename, date: img.uploadedAt, thumbnailUrl: img.url }))}
            isEditable={permissions.canEditDoctorCaseSheet}
          />
        )}
      </div>

      {/* Doctor Case Sheet workflow for Working Doctor */}
      {role === "Working Doctor" && (
        <DoctorCaseSheet
          opRecord={data}
          isEditable={permissions.canEditDoctorCaseSheet}
          onVisitSaved={() => {
            opService.getOPByNumber(data.patient.opNumber).then((updated) => {
              if (updated) setData(updated);
            });
          }}
        />
      )}

      {/* Advisory Section: Treatment Plan (Proposed & Finalized) + Financials */}
      <div className="space-y-6">
        <FinalTreatmentPlan
          roleLabel={role === "Clinic Head" ? "Clinic Head" : undefined}
          proposedSelected={data.treatmentLab.treatmentPlan || []}
          finalizedTreatments={data.treatmentLab.finalizedTreatments || []}
          isEditable={permissions.canEditFinalTreatmentPlan}
          onProposedChange={handleUpdateProposedTreatmentPlan}
          onFinalChange={handleUpdateFinalTreatmentPlan}
        />
        <CostDiscount
          roleLabel={role === "Clinic Head" ? "Clinic Head" : undefined}
          treatmentPlanCost={data.treatmentLab.treatmentPlanCost}
          totalCrownCost={data.treatmentLab.totalCrownCost}
          totalAmount={data.treatmentLab.totalAmount}
          finalDiscount={data.treatmentLab.finalDiscount}
          netAmount={data.treatmentLab.netAmount}
          isEditable={permissions.canEditCostDiscount}
          onDiscountChange={handleDiscountChange}
        />

        {/* Bottom Save Button - immediately after Advisory Payment */}
        {permissions.canSaveOPDetails && (
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 shadow-sm"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      {/* Patient Ledger Section */}
      <div className="pt-6 border-t border-[var(--color-border)]">
        <PatientLedger
          key={ledgerKey}
          opNumber={data.patient.opNumber}
          isEditable={permissions.canAddPayment}
        />
      </div>
    </div>
  );
}
