"use client";

import { useState, useEffect } from "react";
import { FinalizedTreatment, TeethNotation, Treatment, CrownType } from "@/types/op";
import { catalogueService } from "@/services/catalogueService";
import { TeethNotationComponent } from "./TeethNotation";
import { countSelectedTeeth } from "@/lib/toothPricing";

interface FinalTreatmentPlanProps {
  roleLabel?: string;
  proposedSelected: string[];
  finalizedTreatments: FinalizedTreatment[];
  isEditable?: boolean;
  onProposedChange?: (selected: string[]) => void;
  onFinalChange?: (finalized: FinalizedTreatment[]) => void;
}

const emptyTeethNotation: TeethNotation = { q1: [], q2: [], q3: [], q4: [] };

export function FinalTreatmentPlan({
  roleLabel,
  proposedSelected = [],
  finalizedTreatments = [],
  isEditable = false,
  onProposedChange,
  onFinalChange,
}: FinalTreatmentPlanProps) {
  const [treatmentCatalogue, setTreatmentCatalogue] = useState<Treatment[]>([]);
  const [crownCatalogue, setCrownCatalogue] = useState<CrownType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCatalogues = async () => {
      try {
        const [treatments, crowns] = await Promise.all([
          catalogueService.getTreatments(),
          catalogueService.getCrownTypes()
        ]);
        setTreatmentCatalogue(treatments);
        setCrownCatalogue(crowns);
      } catch (error) {
        console.error("Failed to fetch catalogues", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCatalogues();
  }, []);

  const toggleProposed = (treatmentId: string) => {
    if (!isEditable || !onProposedChange) return;
    const isCurrentlyProposed = proposedSelected.includes(treatmentId);

    if (isCurrentlyProposed) {
      const newProposed = proposedSelected.filter((id) => id !== treatmentId);
      // Auto-prune from finalized if removed from proposed
      if (onFinalChange) {
        onFinalChange(finalizedTreatments.filter((ft) => ft.treatmentId !== treatmentId));
      }
      onProposedChange(newProposed);
    } else {
      onProposedChange([...proposedSelected, treatmentId]);
    }
  };

  const toggleFinal = (treatmentId: string) => {
    if (!isEditable || !onFinalChange) return;
    // CRITICAL BUSINESS RULE: Finalized MUST be a subset of Proposed
    if (!proposedSelected.includes(treatmentId)) return;

    const existingIndex = finalizedTreatments.findIndex(ft => ft.treatmentId === treatmentId);
    
    if (existingIndex >= 0) {
      // Remove it
      onFinalChange(finalizedTreatments.filter(ft => ft.treatmentId !== treatmentId));
    } else {
      // Add it
      const treatment = treatmentCatalogue.find(t => t.id === treatmentId);
      if (!treatment) return;

      const isCrown = treatment.id === "crowns";
      const requiresTeeth = Boolean(treatment.requiresTeethNotation);

      onFinalChange([
        ...finalizedTreatments,
        {
          treatmentId: treatment.id,
          treatmentName: treatment.name,
          patientPrice: requiresTeeth ? 0 : (treatment.patientPrice || 0),
          requiresTeethNotation: requiresTeeth,
          teethNotation: requiresTeeth ? { ...emptyTeethNotation } : null,
          quantity: requiresTeeth ? 0 : 1,
          ...(isCrown ? { crownType: "", numberOfCrowns: 0, egEhsGen: "" as const } : {})
        }
      ]);
    }
  };

  const updateFinalizedTreatment = (treatmentId: string, updates: Partial<FinalizedTreatment>) => {
    if (!isEditable || !onFinalChange) return;
    onFinalChange(
      finalizedTreatments.map(ft => 
        ft.treatmentId === treatmentId ? { ...ft, ...updates } : ft
      )
    );
  };

  const handleCrownChange = (treatmentId: string, crownTypeId: string) => {
    const crown = crownCatalogue.find(c => c.id === crownTypeId);
    const existingFt = finalizedTreatments.find(ft => ft.treatmentId === treatmentId);
    const toothCount = countSelectedTeeth(existingFt?.teethNotation);
    // Tooth notation selection is authoritative when tooth notation is configured
    const numCrowns = existingFt?.requiresTeethNotation ? toothCount : (existingFt?.numberOfCrowns ?? 1);
    const totalCrownCost = crown ? (crown.patientPrice || 0) * numCrowns : 0;

    updateFinalizedTreatment(treatmentId, { 
      crownType: crownTypeId,
      numberOfCrowns: numCrowns,
      patientPrice: totalCrownCost,
      quantity: numCrowns,
    });
  };

  const handleNumberOfCrownsChange = (treatmentId: string, count: number) => {
    const existingFt = finalizedTreatments.find(ft => ft.treatmentId === treatmentId);
    const crownTypeId = existingFt?.crownType || "";
    const crown = crownCatalogue.find(c => c.id === crownTypeId);
    const validCount = Math.max(0, count);
    updateFinalizedTreatment(treatmentId, {
      numberOfCrowns: validCount,
      patientPrice: crown ? (crown.patientPrice || 0) * validCount : 0,
      quantity: validCount,
    });
  };

  const handleTeethNotationChange = (treatmentId: string, newNotation: TeethNotation) => {
    const selectedCount = countSelectedTeeth(newNotation);
    const existingFt = finalizedTreatments.find(ft => ft.treatmentId === treatmentId);
    if (!existingFt) return;

    if (treatmentId === "crowns") {
      const crown = crownCatalogue.find(c => c.id === (existingFt.crownType || ""));
      const unitPrice = crown?.patientPrice || 0;
      const totalCrownCost = unitPrice * selectedCount;
      updateFinalizedTreatment(treatmentId, {
        teethNotation: newNotation,
        numberOfCrowns: selectedCount,
        patientPrice: totalCrownCost,
        quantity: selectedCount,
      });
    } else {
      const treatment = treatmentCatalogue.find(t => t.id === treatmentId);
      const unitPrice = treatment?.patientPrice || 0;
      const totalCost = unitPrice * selectedCount;
      updateFinalizedTreatment(treatmentId, {
        teethNotation: newNotation,
        patientPrice: totalCost,
        quantity: selectedCount,
      });
    }
  };

  const handleEgEhsGenChange = (treatmentId: string, val: "E+G" | "EHS" | "GEN" | "") => {
    updateFinalizedTreatment(treatmentId, {
      egEhsGen: val,
    });
  };

  // Helper to get display price for finalized treatments
  const getDisplayPrice = (ft: FinalizedTreatment): string => {
    if (ft.patientPrice > 0) {
      return `₹${ft.patientPrice.toLocaleString("en-IN")}`;
    }
    if (ft.treatmentId === "crowns") {
      return "—";
    }
    return "₹0";
  };

  if (isLoading) {
    return (
      <div className="flex-1 min-w-[320px] bg-white border border-[var(--color-border)] rounded-xl p-4 shadow-sm flex items-center justify-center min-h-[300px]">
        <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-[320px] bg-white border border-[var(--color-border)] rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2.5 mb-3">
        <h3 className="text-sm font-bold text-[var(--color-foreground)]">
          <span className="text-[#1e40af]">Treatment Plan Advisory</span>
          {roleLabel && (
            <span className="text-[var(--color-primary)] font-normal text-xs ml-1">
              ({roleLabel})
            </span>
          )}
        </h3>
        <span className="text-[11px] text-[var(--color-muted)] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
          Finalized ⊆ Proposed
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-4">
        {/* Column 1: Proposed Treatment Plan */}
        <div>
          <h4 className="text-xs font-semibold text-[var(--color-foreground)] mb-2 flex items-center justify-between">
            <span>1. Treatment Plan</span>
            <span className="text-[11px] text-[var(--color-muted)]">Proposed</span>
          </h4>
          <div className="flex flex-col gap-2">
            {treatmentCatalogue.map((t) => {
              const isChecked = proposedSelected.includes(t.id);
              return (
                <label
                  key={`prop-${t.id}`}
                  className={`flex items-center justify-between gap-2 p-1.5 rounded transition-colors ${
                    isEditable ? "cursor-pointer hover:bg-gray-50" : "cursor-default opacity-90"
                  }`}
                  onClick={(e) => {
                    if (!isEditable) e.preventDefault();
                    else toggleProposed(t.id);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        isChecked
                          ? "bg-[var(--color-primary)] border-[var(--color-primary)]"
                          : "bg-white border-gray-300"
                      }`}
                    >
                      {isChecked && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-xs text-[var(--color-foreground)]">{t.name}</span>
                  </div>
                  <span className="text-[11px] text-[var(--color-muted)]">
                    {t.patientPrice != null ? `₹${t.patientPrice.toLocaleString("en-IN")}` : "Variable"}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Column 2: Finalized Treatment Plan (Subset) */}
        <div className="md:border-l md:border-[var(--color-border)] md:pl-4 pt-4 md:pt-0 border-t md:border-t-0">
          <h4 className="text-xs font-semibold text-[var(--color-foreground)] mb-2 flex items-center justify-between">
            <span>2. Finalized Plan</span>
            <span className="text-[11px] text-green-700 font-medium">Selected</span>
          </h4>
          {proposedSelected.length === 0 ? (
            <div className="p-3 bg-gray-50 rounded border border-dashed border-gray-200 text-center">
              <p className="text-xs text-[var(--color-muted)]">Select proposed treatments first</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {treatmentCatalogue
                .filter((t) => proposedSelected.includes(t.id))
                .map((t) => {
                  const finalizedTreatment = finalizedTreatments.find(ft => ft.treatmentId === t.id);
                  const isFinal = !!finalizedTreatment;
                  const toothCount = finalizedTreatment?.teethNotation ? countSelectedTeeth(finalizedTreatment.teethNotation) : 0;

                  return (
                    <div key={`final-container-${t.id}`} className={`flex flex-col gap-2 p-2 rounded transition-colors ${isFinal ? 'bg-green-50/50 border border-green-100' : ''}`}>
                      <label
                        className={`flex items-center justify-between gap-2 rounded ${
                          isEditable ? "cursor-pointer" : "cursor-default opacity-90"
                        }`}
                        onClick={(e) => {
                          if (!isEditable) e.preventDefault();
                          else toggleFinal(t.id);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                              isFinal
                                ? "bg-green-600 border-green-600"
                                : "bg-white border-gray-300"
                            }`}
                          >
                            {isFinal && (
                              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className="text-xs font-medium text-[var(--color-foreground)]">{t.name}</span>
                        </div>
                        {isFinal && (
                          <div className="flex items-center gap-1.5">
                            {t.requiresTeethNotation && (
                              <span className="text-[10px] text-[var(--color-muted)] bg-gray-100 px-1.5 py-0.5 rounded">
                                {toothCount} {t.id === "crowns" ? (toothCount === 1 ? "crown" : "crowns") : (toothCount === 1 ? "tooth" : "teeth")}
                              </span>
                            )}
                            <span className="text-[11px] font-semibold text-green-700">
                              {getDisplayPrice(finalizedTreatment)}
                            </span>
                          </div>
                        )}
                      </label>

                      {/* Expanded View for Finalized Items */}
                      {isFinal && (
                        <div className="pl-6 flex flex-col gap-3 mt-1">
                          {/* Crown Type, Number of Crowns, and Crown Cost */}
                          {t.id === "crowns" && (
                            <div className="flex flex-col gap-2">
                              {/* Crown Type Selection */}
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-medium text-[var(--color-muted)] uppercase">Crown Type</label>
                                <select
                                  value={finalizedTreatment.crownType || ""}
                                  onChange={(e) => handleCrownChange(t.id, e.target.value)}
                                  disabled={!isEditable}
                                  className="w-full text-xs p-1.5 border border-[var(--color-border)] rounded outline-none focus:border-[var(--color-primary)] bg-white"
                                >
                                  <option value="">-- Choose Crown --</option>
                                  {crownCatalogue.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} (₹{(c.patientPrice || 0).toLocaleString("en-IN")})</option>
                                  ))}
                                </select>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                {/* Number of Crowns */}
                                <div className="flex flex-col gap-1">
                                  <label className="text-[10px] font-medium text-[var(--color-muted)] uppercase">Number of Crowns</label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={finalizedTreatment.numberOfCrowns ?? 0}
                                    readOnly={t.requiresTeethNotation}
                                    onChange={(e) => {
                                      if (!t.requiresTeethNotation) {
                                        const parsed = parseInt(e.target.value);
                                        if (!isNaN(parsed) && parsed >= 0) {
                                          handleNumberOfCrownsChange(t.id, parsed);
                                        }
                                      }
                                    }}
                                    disabled={!isEditable}
                                    className={`w-full text-xs p-1.5 border border-[var(--color-border)] rounded outline-none ${
                                      t.requiresTeethNotation ? "bg-gray-100 text-gray-700 cursor-not-allowed" : "bg-white focus:border-[var(--color-primary)]"
                                    }`}
                                    title={t.requiresTeethNotation ? "Synchronized with selected teeth below" : undefined}
                                  />
                                  {t.requiresTeethNotation && (
                                    <span className="text-[9px] text-[var(--color-muted)]">Auto-synchronized with tooth notation</span>
                                  )}
                                </div>

                                {/* E+G / EHS / GEN Category Selection */}
                                <div className="flex flex-col gap-1">
                                  <label className="text-[10px] font-medium text-[var(--color-muted)] uppercase">E+G / EHS / GEN</label>
                                  <select
                                    value={finalizedTreatment.egEhsGen || ""}
                                    onChange={(e) => handleEgEhsGenChange(t.id, e.target.value as "E+G" | "EHS" | "GEN" | "")}
                                    disabled={!isEditable}
                                    className="w-full text-xs p-1.5 border border-[var(--color-border)] rounded outline-none focus:border-[var(--color-primary)] bg-white"
                                  >
                                    <option value="">-- Choose Category --</option>
                                    <option value="E+G">E+G</option>
                                    <option value="EHS">EHS</option>
                                    <option value="GEN">GEN</option>
                                  </select>
                                </div>
                              </div>

                              {/* Total Crown Cost (Read-Only) */}
                              {finalizedTreatment.crownType && finalizedTreatment.patientPrice > 0 && (
                                <div className="bg-blue-50/50 border border-blue-100 rounded p-2">
                                  <div className="text-[10px] font-medium text-[var(--color-muted)] uppercase mb-1">Total Crown Cost</div>
                                  <div className="text-sm font-bold text-[var(--color-foreground)]">
                                    ₹{finalizedTreatment.patientPrice.toLocaleString("en-IN")}
                                  </div>
                                  <div className="text-[11px] text-[var(--color-muted)]">
                                    ₹{((crownCatalogue.find(c => c.id === finalizedTreatment.crownType)?.patientPrice) ?? 0).toLocaleString("en-IN")} × {finalizedTreatment.numberOfCrowns ?? 0}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Teeth Notation */}
                          {t.requiresTeethNotation && finalizedTreatment.teethNotation && (
                            <div className="bg-white p-2.5 rounded border border-gray-200">
                              <div className="flex items-center justify-between text-xs pb-1.5 mb-1 border-b border-gray-100">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-medium text-[var(--color-muted)] uppercase">Tooth Notation:</span>
                                  <span className="text-xs font-semibold text-[var(--color-foreground)]">
                                    {toothCount} {t.id === "crowns" ? (toothCount === 1 ? "crown" : "crowns") : (toothCount === 1 ? "tooth" : "teeth")} selected
                                  </span>
                                </div>
                                {t.id !== "crowns" && (
                                  <span className="text-xs font-semibold text-green-700">
                                    ₹{(t.patientPrice || 0).toLocaleString("en-IN")} × {toothCount} = ₹{finalizedTreatment.patientPrice.toLocaleString("en-IN")}
                                  </span>
                                )}
                              </div>
                              <TeethNotationComponent 
                                value={finalizedTreatment.teethNotation}
                                onChange={(newNotation) => handleTeethNotationChange(t.id, newNotation)}
                                isEditable={isEditable}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
