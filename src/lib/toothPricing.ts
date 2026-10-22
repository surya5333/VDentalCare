import type { TeethNotation, FinalizedTreatment, Treatment } from "@/types/op";

/**
 * Counts all uniquely selected teeth across all four quadrants (q1, q2, q3, q4).
 * Supports both FDI 2-digit tooth numbering (e.g., 11-18, 21-28, 31-38, 41-48)
 * and 1-digit quadrant-relative tooth numbering (1-8).
 * 
 * Guarantees:
 * - Each tooth in each quadrant is counted at most once (no double counting).
 * - Deselection and clearing properly decrease and zero the count.
 * - Null or undefined notation returns 0.
 */
export function countSelectedTeeth(notation?: TeethNotation | null): number {
  if (!notation) return 0;
  const quadrants: (keyof TeethNotation)[] = ["q1", "q2", "q3", "q4"];
  const uniqueTeeth = new Set<string>();

  for (const q of quadrants) {
    const list = notation[q];
    if (Array.isArray(list)) {
      for (const tooth of list) {
        if (typeof tooth === "number" && !isNaN(tooth)) {
          // Normalize to 1-8 relative to the quadrant
          const num = tooth >= 10 ? tooth % 10 : tooth;
          if (num >= 1 && num <= 8) {
            uniqueTeeth.add(`${q}-${num}`);
          }
        }
      }
    }
  }

  return uniqueTeeth.size;
}

export interface TreatmentPricing {
  quantity: number;
  totalCost: number;
  unitPrice: number;
  isPerTooth: boolean;
  isCrown: boolean;
}

/**
 * Calculates authoritative quantity and total cost for a treatment:
 * - Crown treatment: unit crown price * number of selected teeth (or numberOfCrowns if no notation).
 * - Per-tooth treatment: configured treatment price * number of selected teeth.
 * - Per-procedure treatment: configured treatment price (quantity = 1).
 */
export function calculateTreatmentPricing(
  treatment: Treatment | { id: string; name?: string; patientPrice?: number | null; requiresTeethNotation?: boolean },
  teethNotation?: TeethNotation | null,
  crownInfo?: { crownType?: string; crownUnitPrice?: number; numberOfCrowns?: number }
): TreatmentPricing {
  const isCrown = treatment.id === "crowns" || treatment.name === "Crowns";
  const requiresTeeth = Boolean(treatment.requiresTeethNotation);
  const selectedTeethCount = countSelectedTeeth(teethNotation);

  if (isCrown) {
    const unitPrice = crownInfo?.crownUnitPrice || 0;
    // When tooth notation is required / configured, the tooth selection is authoritative
    const quantity = requiresTeeth ? selectedTeethCount : (crownInfo?.numberOfCrowns ?? 1);
    const totalCost = unitPrice * quantity;
    return {
      quantity,
      totalCost,
      unitPrice,
      isPerTooth: false,
      isCrown: true,
    };
  }

  if (requiresTeeth) {
    const unitPrice = treatment.patientPrice || 0;
    const quantity = selectedTeethCount;
    const totalCost = unitPrice * quantity;
    return {
      quantity,
      totalCost,
      unitPrice,
      isPerTooth: true,
      isCrown: false,
    };
  }

  // Procedure-based treatment
  const unitPrice = treatment.patientPrice || 0;
  return {
    quantity: 1,
    totalCost: unitPrice,
    unitPrice,
    isPerTooth: false,
    isCrown: false,
  };
}

/**
 * Helper to get the quantity of a finalized treatment.
 */
export function getFinalizedQuantity(ft: FinalizedTreatment): number {
  if (ft.quantity !== undefined && ft.quantity !== null) {
    return ft.quantity;
  }
  if (ft.treatmentId === "crowns") {
    const toothCount = countSelectedTeeth(ft.teethNotation);
    return toothCount > 0 ? toothCount : (ft.numberOfCrowns ?? 0);
  }
  if (ft.requiresTeethNotation) {
    return countSelectedTeeth(ft.teethNotation);
  }
  return 1;
}
