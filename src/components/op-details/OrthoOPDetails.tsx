"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PatientInfoTable } from "./PatientInfoTable";
import { MedicalHistorySection } from "./MedicalHistorySection";
import { CompleteOPRecord, MedicalHistory } from "@/types/op";
import { opService } from "@/services/opService";
import { OrthoTreatments } from "./OrthoTreatments";
import { OrthoPatientLedger } from "./OrthoPatientLedger";
import { ImageGallerySection } from "./ImageGallerySection";
import { OrthoFinancialsSection } from "./OrthoFinancialsSection";
import { OrthoFinancials } from "@/types/op";

interface OrthoOPDetailsProps {
  role: "Front Office" | "Clinic Head" | "Working Doctor" | "Manager";
  backHref: string;
  data: CompleteOPRecord;
}

interface RolePermissions {
  canEditMedicalHistory: boolean;
  canEditTreatmentLab: boolean;
  canUploadTreatmentPlan: boolean;
  canUploadXRay: boolean;
  canAddPayment: boolean;
  canAddTreatment: boolean;
}

const ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  "Front Office": {
    canEditMedicalHistory: false,
    canEditTreatmentLab: false,
    canUploadTreatmentPlan: false,
    canUploadXRay: false,
    canAddPayment: true,
    canAddTreatment: true,
  },
  "Clinic Head": {
    canEditMedicalHistory: true,
    canEditTreatmentLab: true,
    canUploadTreatmentPlan: true,
    canUploadXRay: true,
    canAddPayment: true,
    canAddTreatment: true,
  },
  "Working Doctor": {
    canEditMedicalHistory: false,
    canEditTreatmentLab: true,
    canUploadTreatmentPlan: true,
    canUploadXRay: true,
    canAddPayment: false,
    canAddTreatment: true,
  },
  "Manager": {
    canEditMedicalHistory: false,
    canEditTreatmentLab: false,
    canUploadTreatmentPlan: false,
    canUploadXRay: false,
    canAddPayment: false,
    canAddTreatment: false,
  }
};

export function OrthoOPDetails({ role, backHref, data: initialData }: OrthoOPDetailsProps) {
  const [data, setData] = useState<CompleteOPRecord>(initialData);
  const [ledgerKey, setLedgerKey] = useState(0);
  const [isReverting, setIsReverting] = useState(false);
  const [showRevertConfirm, setShowRevertConfirm] = useState(false);

  const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS["Front Office"];

  const handleUpdateMedicalHistory = async (history: MedicalHistory) => {
    const updatedData = { ...data, medicalHistory: history };
    setData(updatedData);
    await opService.updateOP(data.patient.opNumber, updatedData);
  };


  const handleUpdateChiefComplaint = async (complaint: string) => {
    const updatedData = { ...data, chiefComplaint: complaint };
    setData(updatedData);
    await opService.updateOP(data.patient.opNumber, updatedData);
  };

  const handleUpdateFinancials = async (financials: OrthoFinancials) => {
    const updatedData = { ...data, orthoFinancials: financials };
    setData(updatedData);
    await opService.updateOP(data.patient.opNumber, updatedData);
    setLedgerKey(prev => prev + 1); // Refresh ledger to reflect new total
  };

  const handleBackToGeneral = async () => {
    setIsReverting(true);
    try {
      // Revert the classification
      const response = await fetch(`/api/op/${data.patient.opNumber}/classify-ortho`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revertToGeneral: true }) // We will implement this flag in the API
      });
      if (!response.ok) throw new Error("Failed to revert");
      
      // Redirect to general OP Details page
      window.location.href = backHref.replace("/ortho/op-list", "/op-list") + "/" + data.patient.opNumber;
    } catch (err) {
      console.error(err);
      setIsReverting(false);
      setShowRevertConfirm(false);
    }
  };

  return (
    <div className="space-y-6">
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
              Ortho OP List
            </Link>
            <span className="text-[var(--color-border)]">›</span>
            <span className="text-[var(--color-foreground)] font-medium">OP Details</span>
          </div>
          <h1 className="text-2xl font-bold text-purple-900">
            Ortho OP Details
          </h1>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {role === "Clinic Head" && (
            <>
              {showRevertConfirm ? (
                <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                  <span className="text-sm font-medium text-red-800 mr-2">Convert back to General?</span>
                  <button 
                    onClick={() => setShowRevertConfirm(false)}
                    className="px-3 py-1.5 text-xs font-medium bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleBackToGeneral}
                    disabled={isReverting}
                    className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    {isReverting ? "Converting..." : "Confirm"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowRevertConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                >
                  Back to General
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Patient Information */}
      <PatientInfoTable data={data.patient} />

      {/* Medical History */}
      <MedicalHistorySection
        roleLabel={role === "Clinic Head" ? "Clinic Head" : undefined}
        medicalHistory={data.medicalHistory}
        chiefComplaint={data.chiefComplaint}
        isEditable={permissions.canEditMedicalHistory}
        onUpdateMedicalHistory={handleUpdateMedicalHistory}
        onUpdateChiefComplaint={handleUpdateChiefComplaint}
      />

      {/* Image Galleries - Ortho specifically removes Treatment Plan Image */}
      <div className="grid grid-cols-2 gap-6">
        <ImageGallerySection
          title="X-Ray"
          images={data.xrayImages.map((img) => ({
            name: img.filename,
            date: img.uploadedAt,
          }))}
          isEditable={permissions.canUploadXRay}
        />
        {role !== "Working Doctor" && (
          <ImageGallerySection
            title="Doctor Case Sheet"
            roleLabel="Working Doctor"
            images={data.caseSheets
              .flatMap((visit) => visit.images)
              .map((img) => ({ name: img.filename, date: img.uploadedAt }))}
            isEditable={false} // Only Working Doctor edits case sheets
          />
        )}
      </div>

      {/* Ortho Treatments */}
      <div className="pt-6 border-t border-[var(--color-border)]">
        <OrthoTreatments 
          opNumber={data.patient.opNumber} 
          isEditable={permissions.canAddTreatment} 
          onUpdate={() => setLedgerKey(prev => prev + 1)} // Refresh ledger when treatments are added
        />
      </div>

      {/* Ortho Financials */}
      <OrthoFinancialsSection
        financials={data.orthoFinancials}
        isEditable={permissions.canEditMedicalHistory} // Clinic Head can edit
        onUpdate={handleUpdateFinancials}
      />

      {/* Patient Ledger */}
      <div className="pt-6 border-t border-[var(--color-border)]">
        <OrthoPatientLedger
          key={ledgerKey}
          opNumber={data.patient.opNumber}
          isEditable={permissions.canAddPayment}
        />
      </div>
    </div>
  );
}
