import { prisma } from '@/lib/prisma';
import { countSelectedTeeth } from '../lib/toothPricing';
import { TeethNotation } from '../types/op';
import { Prisma } from '@prisma/client';

export interface AddFinalizedTreatmentPayload {
  treatmentId: string;
  crownTypeId?: string | null;
  numberOfCrowns?: number | null;
  teethNotation?: TeethNotation | null;
}

export interface UpdateFinalizedTreatmentPayload {
  teethNotation?: TeethNotation;
  numberOfCrowns?: number;
  patientPriceSnapshot?: number;
}

class ApiTreatmentRepository {
  async getFinalizedTreatments(opNumber: string) {
    const op = await prisma.oPRecord.findUnique({
      where: { opNumber },
      include: {
        finalizedTreatments: {
          include: {
            treatment: true,
            crownType: true
          }
        }
      }
    });

    return op?.finalizedTreatments || [];
  }

  async addFinalizedTreatment(opNumber: string, payload: AddFinalizedTreatmentPayload) {
    const op = await prisma.oPRecord.findUnique({ where: { opNumber } });
    if (!op) throw new Error("OP Record not found");

    const treatment = await prisma.treatment.findUnique({ where: { id: payload.treatmentId } });
    if (!treatment) throw new Error("Treatment not found");

    let patientPriceSnapshot = treatment.patientPrice;
    let crownTypeId = null;
    let numberOfCrowns = null;

    if (treatment.name === 'Crowns') {
      if (!payload.crownTypeId) throw new Error("Crown Type is required for Crowns");
      if (typeof payload.numberOfCrowns !== 'number' || payload.numberOfCrowns <= 0 || !Number.isInteger(payload.numberOfCrowns)) {
        throw new Error("numberOfCrowns must be a positive integer");
      }
      const crown = await prisma.crownType.findUnique({ where: { id: payload.crownTypeId } });
      if (!crown) throw new Error("Crown Type not found");
      patientPriceSnapshot = crown.patientPrice * payload.numberOfCrowns;
      crownTypeId = crown.id;
      numberOfCrowns = payload.numberOfCrowns;
    } else {
      if (payload.crownTypeId || payload.numberOfCrowns) {
        throw new Error("Crown Type and Number of Crowns are not allowed for this treatment");
      }
    }

    let validatedTeethNotation: TeethNotation | null = null;
    if (treatment.requiresTeethNotation) {
      if (payload.teethNotation) {
        const tn = payload.teethNotation as unknown as Record<string, unknown>;
        const result: Record<'q1' | 'q2' | 'q3' | 'q4', number[]> = { q1: [], q2: [], q3: [], q4: [] };
        for (const q of ['q1', 'q2', 'q3', 'q4'] as const) {
          if (Array.isArray(tn[q])) {
            const unique = Array.from(new Set(tn[q]));
            for (const tooth of unique) {
              const isSingleDigit = typeof tooth === 'number' && tooth >= 1 && tooth <= 8;
              const isFDI = typeof tooth === 'number' && tooth >= 11 && tooth <= 48;
              if (typeof tooth !== 'number' || (!isSingleDigit && !isFDI) || !Number.isInteger(tooth)) {
                throw new Error(`Invalid tooth value ${tooth} in ${q}`);
              }
              result[q].push(tooth);
            }
          }
        }
        validatedTeethNotation = result;
      }

      if (treatment.name !== 'Crowns') {
        const count = countSelectedTeeth(validatedTeethNotation);
        patientPriceSnapshot = (treatment.patientPrice || 0) * count;
      }
    } else {
      if (payload.teethNotation) {
        const tn = payload.teethNotation as unknown as Record<string, unknown>;
        const hasTeeth = ['q1', 'q2', 'q3', 'q4'].some(q => Array.isArray(tn[q]) && (tn[q] as unknown[]).length > 0);
        if (hasTeeth) {
          throw new Error("Teeth notation is not allowed for this treatment");
        }
      }
    }

    return prisma.finalizedTreatment.create({
      data: {
        opRecordId: op.id,
        treatmentId: treatment.id,
        treatmentNameSnapshot: treatment.name,
        patientPriceSnapshot,
        requiresTeethNotation: treatment.requiresTeethNotation,
        teethNotation: validatedTeethNotation ? (validatedTeethNotation as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        crownTypeId,
        numberOfCrowns,
      },
      include: {
        treatment: true,
        crownType: true
      }
    });
  }

  async updateFinalizedTreatment(id: string, payload: UpdateFinalizedTreatmentPayload) {
    const existing = await prisma.finalizedTreatment.findUnique({
      where: { id },
      include: { treatment: true, crownType: true }
    });
    if (!existing) throw new Error("Finalized treatment not found");

    const dataToUpdate: Prisma.FinalizedTreatmentUpdateInput = {};
    if (payload.teethNotation !== undefined) {
      dataToUpdate.teethNotation = payload.teethNotation as unknown as Prisma.InputJsonValue;
      if (existing.treatment.requiresTeethNotation && existing.treatment.name !== 'Crowns') {
        const count = countSelectedTeeth(payload.teethNotation);
        dataToUpdate.patientPriceSnapshot = (existing.treatment.patientPrice || 0) * count;
      }
    }
    if (payload.numberOfCrowns !== undefined) {
      dataToUpdate.numberOfCrowns = payload.numberOfCrowns;
      if (existing.crownType) {
        dataToUpdate.patientPriceSnapshot = existing.crownType.patientPrice * payload.numberOfCrowns;
      }
    }
    if (payload.patientPriceSnapshot !== undefined) {
      dataToUpdate.patientPriceSnapshot = payload.patientPriceSnapshot;
    }

    return prisma.finalizedTreatment.update({
      where: { id },
      data: dataToUpdate,
      include: {
        treatment: true,
        crownType: true
      }
    });
  }

  async deleteFinalizedTreatment(id: string) {
    return prisma.finalizedTreatment.delete({
      where: { id }
    });
  }
}

export const apiTreatmentRepository = new ApiTreatmentRepository();
