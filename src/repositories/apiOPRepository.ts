/* eslint-disable @typescript-eslint/no-explicit-any */
import { CompleteOPRecord, PatientOP } from "../types/op";
import { prisma } from '../lib/prisma';
import { apiPatientLedgerRepository } from './apiPatientLedgerRepository';
import { countSelectedTeeth } from '../lib/toothPricing';

export const opRecordCommonInclude = {
  finalizedTreatments: {
    include: {
      treatment: true,
      crownType: true
    }
  },
  treatmentPlanImages: {
    select: {
      id: true,
      fileUrl: true,
      originalFilename: true,
      uploadedAt: true,
    }
  },
  xRays: {
    select: {
      id: true,
      fileUrl: true,
      originalFilename: true,
      uploadedAt: true,
    }
  },
  doctorVisits: {
    include: {
      images: {
        select: {
          id: true,
          fileUrl: true,
          originalFilename: true,
          uploadedAt: true,
        }
      }
    }
  },
  labRecords: {
    select: {
      id: true,
      finalizedTreatmentId: true,
      labId: true,
    }
  }
};

class ApiOPRepository {
  async findAll(
    workflowType: 'GENERAL' | 'ORTHO' = 'GENERAL',
    filter?: { query?: string; doctorId?: string }
  ): Promise<CompleteOPRecord[]> {
    const where: any = { workflowType };

    if (filter?.doctorId) {
      where.doctorVisits = {
        some: { doctorId: filter.doctorId }
      };
    }

    if (filter?.query && filter.query.trim().length > 0) {
      const q = filter.query.trim();
      where.OR = [
        { opNumber: { contains: q, mode: 'insensitive' } },
        { patientName: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } }
      ];
    }

    const records = await prisma.oPRecord.findMany({
      where,
      select: {
        id: true,
        opNumber: true,
        patientName: true,
        age: true,
        sex: true,
        phone: true,
        date: true,
        reference: true,
        paidStatus: true,
        workflowType: true,
        registrationFee: true,
        registrationPaymentMode: true,
        diabetes: true,
        hypertension: true,
        otherMedicalHistory: true,
        chiefComplaint: true,
        egEhsGen: true,
        advisoryDiscount: true,
        orthoTotalAmount: true,
        orthoDiscount: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return records.map(r => {
      const d = new Date(r.date);
      const dateStr = `${d.getUTCDate().toString().padStart(2, '0')}/${(d.getUTCMonth() + 1).toString().padStart(2, '0')}/${d.getUTCFullYear()}`;
      return {
        patient: {
          sectionNo: "",
          opNumber: r.opNumber,
          patientName: r.patientName,
          age: r.age,
          sex: r.sex as any,
          phone: r.phone,
          date: dateStr,
          reference: r.reference || "",
          paidStatus: r.paidStatus as any,
          workflowType: r.workflowType,
          registrationFee: r.registrationFee || 0,
          paymentMode: r.registrationPaymentMode || undefined,
        },
        medicalHistory: {
          diabetes: r.diabetes || false,
          hypertension: r.hypertension || false,
          other: r.otherMedicalHistory || "",
        },
        chiefComplaint: r.chiefComplaint || "",
        treatmentLab: {
          treatmentPlan: [],
          finalizedTreatments: [],
          egEhsGen: (r.egEhsGen || "") as any,
          crownType: "",
          numberOfCrowns: null,
          lab: "",
          treatmentPlanCost: "0",
          totalCrownCost: "0",
          totalAmount: "0",
          finalDiscount: (r.advisoryDiscount || 0).toString(),
          netAmount: (-(r.advisoryDiscount || 0)).toString(),
        },
        treatmentPlanImages: [],
        xrayImages: [],
        orthoFinancials: {
          totalAmount: r.orthoTotalAmount || 0,
          discount: r.orthoDiscount || 0,
        },
        caseSheets: [],
      };
    });
  }

  async findByOpNumber(opNumber: string): Promise<CompleteOPRecord | null> {
    const record = await prisma.oPRecord.findUnique({
      where: { opNumber },
      include: opRecordCommonInclude
    });

    if (!record) return null;
    return this.mapToCompleteOPRecord(record);
  }

  private async getNextOpNumber(): Promise<string> {
    try {
      const counter = await prisma.counter.update({
        where: { id: 'op_number' },
        data: { value: { increment: 1 } }
      });
      return `OP${counter.value}`;
    } catch (e: any) {
      if (e.code === 'P2025') {
        // Initialize
        const lastOp = await prisma.oPRecord.findFirst({
          orderBy: { createdAt: 'desc' },
          select: { opNumber: true }
        });
        let startNum = 1000;
        if (lastOp && lastOp.opNumber.startsWith('OP')) {
          const parsed = parseInt(lastOp.opNumber.replace('OP', ''), 10);
          if (!isNaN(parsed)) startNum = parsed;
        }
        
        try {
          const newCounter = await prisma.counter.create({
            data: { id: 'op_number', value: startNum + 1 }
          });
          return `OP${newCounter.value}`;
        } catch (createErr: any) {
          if (createErr.code === 'P2002') {
            return this.getNextOpNumber(); // Retry
          }
          throw createErr;
        }
      }
      throw e;
    }
  }

  async create(patientData: Omit<PatientOP, "sectionNo">): Promise<CompleteOPRecord> {
    const isPaid = patientData.paidStatus.toLowerCase() === 'paid';
    const regFee = isPaid ? (patientData.registrationFee ?? 200) : 0;
    const paymentMode = isPaid ? (patientData.paymentMode || 'Cash') : null;
    const opDate = new Date(patientData.date.split('/').reverse().join('-') + 'T00:00:00Z');

    // Create the OP record first
    const op = await prisma.oPRecord.create({
      data: {
        opNumber: patientData.opNumber,
        patientName: patientData.patientName,
        age: patientData.age,
        sex: patientData.sex,
        phone: patientData.phone,
        date: opDate,
        reference: patientData.reference,
        paidStatus: patientData.paidStatus,
        registrationFee: regFee,
        registrationPaymentMode: paymentMode,
      },
      include: opRecordCommonInclude
    });

    // Create the registration fee ledger entry for Paid OPs.
    // The idempotencyKey unique constraint prevents duplicates on retries.
    if (isPaid && regFee > 0 && paymentMode) {
      try {
        await prisma.patientLedger.create({
          data: {
            opRecordId: op.id,
            date: opDate,
            treatmentCost: 0,
            paidAmount: regFee,
            paymentMode: paymentMode,
            discount: 0,
            balance: 0,
            workflowType: 'GENERAL',
            isRegistrationFee: true,
            description: 'OP Registration Fee',
            idempotencyKey: `reg_fee_${patientData.opNumber}`,
          }
        });
      } catch (ledgerErr: any) {
        // If idempotency key already exists, the ledger entry was already created (retry scenario)
        if (ledgerErr.code !== 'P2002') {
          console.error('Failed to create registration fee ledger entry:', ledgerErr);
        }
      }
    }

    return this.mapToCompleteOPRecord(op);
  }


  async update(opNumber: string, updates: Partial<CompleteOPRecord>): Promise<CompleteOPRecord | null> {
    const existing = await prisma.oPRecord.findUnique({ 
      where: { opNumber },
      include: { finalizedTreatments: true }
    });
    if (!existing) return null;

    const dataToUpdate: any = {};
    if (updates.patient) {
      if (updates.patient.patientName !== undefined) dataToUpdate.patientName = updates.patient.patientName;
      if (updates.patient.age !== undefined) dataToUpdate.age = updates.patient.age;
      if (updates.patient.sex !== undefined) dataToUpdate.sex = updates.patient.sex;
      if (updates.patient.phone !== undefined) dataToUpdate.phone = updates.patient.phone;
      if (updates.patient.reference !== undefined) dataToUpdate.reference = updates.patient.reference;
      if (updates.patient.paidStatus !== undefined) dataToUpdate.paidStatus = updates.patient.paidStatus;
    }

    if (updates.medicalHistory) {
      if (updates.medicalHistory.diabetes !== undefined) dataToUpdate.diabetes = updates.medicalHistory.diabetes;
      if (updates.medicalHistory.hypertension !== undefined) dataToUpdate.hypertension = updates.medicalHistory.hypertension;
      if (updates.medicalHistory.other !== undefined) dataToUpdate.otherMedicalHistory = updates.medicalHistory.other;
    }

    if (updates.chiefComplaint !== undefined) {
      dataToUpdate.chiefComplaint = updates.chiefComplaint;
    }

    // Handle finalized treatments manually to avoid unique constraint issues with upsert
    if (updates.treatmentLab?.finalizedTreatments) {
      const incomingTreatments = updates.treatmentLab.finalizedTreatments;
      const existingTreatments = existing.finalizedTreatments;
      
      const incomingIds = new Set(incomingTreatments.map(t => t.treatmentId));

      // 1. Delete treatments that are no longer in the incoming list
      const toDelete = existingTreatments.filter(t => !incomingIds.has(t.treatmentId));
      for (const t of toDelete) {
        await prisma.labRecord.deleteMany({ where: { finalizedTreatmentId: t.id } });
        await prisma.finalizedTreatment.delete({ where: { id: t.id } });
      }

      // 2. Update existing or Create new
      for (const inc of incomingTreatments) {
        const existingTx = existingTreatments.find(t => t.treatmentId === inc.treatmentId);
        let numberOfCrowns = inc.numberOfCrowns || null;
        let patientPriceSnapshot = inc.patientPrice;

        if (inc.requiresTeethNotation && inc.teethNotation) {
          const toothCount = countSelectedTeeth(inc.teethNotation);
          if (inc.treatmentId === 'crowns') {
            numberOfCrowns = toothCount > 0 ? toothCount : (inc.numberOfCrowns || null);
            if (patientPriceSnapshot === undefined || patientPriceSnapshot === null) {
              const crown = inc.crownType ? await prisma.crownType.findUnique({ where: { id: inc.crownType } }) : null;
              patientPriceSnapshot = crown ? (crown.patientPrice || 0) * (numberOfCrowns || 0) : 0;
            }
          } else {
            if (patientPriceSnapshot === undefined || patientPriceSnapshot === null) {
              const t = await prisma.treatment.findUnique({ where: { id: inc.treatmentId } });
              patientPriceSnapshot = t ? (t.patientPrice || 0) * toothCount : 0;
            }
          }
        }

        const data = {
          treatmentNameSnapshot: inc.treatmentName,
          patientPriceSnapshot: patientPriceSnapshot !== undefined ? patientPriceSnapshot : (inc.patientPrice ?? 0),
          requiresTeethNotation: inc.requiresTeethNotation,
          teethNotation: inc.teethNotation ? (inc.teethNotation as any) : null,
          crownTypeId: inc.crownType || null,
          numberOfCrowns: numberOfCrowns
        };

        if (existingTx) {
          await prisma.finalizedTreatment.update({
            where: { id: existingTx.id },
            data
          });
        } else {
          await prisma.finalizedTreatment.create({
            data: {
              ...data,
              opRecordId: existing.id,
              treatmentId: inc.treatmentId
            }
          });
        }
      }
    }

    if (updates.treatmentLab) {
      const crownFt = updates.treatmentLab.finalizedTreatments?.find((ft: any) => ft.treatmentId === 'crowns');
      if (crownFt && crownFt.egEhsGen !== undefined) {
        dataToUpdate.egEhsGen = crownFt.egEhsGen;
      } else if (updates.treatmentLab.egEhsGen !== undefined) {
        dataToUpdate.egEhsGen = updates.treatmentLab.egEhsGen;
      }
      if (updates.treatmentLab.finalDiscount !== undefined) {
        const cleanDiscount = updates.treatmentLab.finalDiscount.replace(/,/g, '');
        dataToUpdate.advisoryDiscount = parseInt(cleanDiscount, 10) || 0;
      }
    }

    if (updates.orthoFinancials) {
      if (updates.orthoFinancials.totalAmount !== undefined) {
        dataToUpdate.orthoTotalAmount = updates.orthoFinancials.totalAmount;
      }
      if (updates.orthoFinancials.discount !== undefined) {
        dataToUpdate.orthoDiscount = updates.orthoFinancials.discount;
      }
    }

    // Process Lab Record for Crowns
    if (updates.treatmentLab?.lab !== undefined) {
      // Find the Crown finalized treatment if it exists
      const crownTreatment = await prisma.finalizedTreatment.findFirst({
        where: { opRecordId: existing.id, treatmentId: "crowns" },
        include: { crownType: true }
      });
      
      const labId = updates.treatmentLab.lab;

      if (crownTreatment && crownTreatment.crownType && crownTreatment.numberOfCrowns) {
        const existingLr = await prisma.labRecord.findFirst({
          where: { finalizedTreatmentId: crownTreatment.id }
        });

        if (labId) {
          if (existingLr) {
            await prisma.labRecord.update({
              where: { id: existingLr.id },
              data: {
                labId,
                labCostSnapshot: crownTreatment.crownType.labPrice * crownTreatment.numberOfCrowns,
              }
            });
          } else {
            // LabRecord requires labCostSnapshot and labPriceSnapshot
            await prisma.labRecord.create({
              data: {
                opRecordId: existing.id,
                finalizedTreatmentId: crownTreatment.id,
                labId: labId,
                labPriceSnapshot: crownTreatment.crownType.labPrice,
                labCostSnapshot: crownTreatment.crownType.labPrice * crownTreatment.numberOfCrowns,
              }
            });
          }
        } else if (existingLr && !existingLr.parcelSentDate) {
          // If lab is cleared and no parcel sent yet, we can safely delete
          await prisma.labRecord.delete({ where: { id: existingLr.id } });
        }
      }
    }

    const record = await prisma.oPRecord.update({
      where: { opNumber },
      data: dataToUpdate,
      include: opRecordCommonInclude
    });

    if (updates.treatmentLab || updates.orthoFinancials) {
      try {
        await apiPatientLedgerRepository.recalculateLedgerBalances(existing.id, record.workflowType);
      } catch (err) {
        console.error("Failed to recalculate ledger balances on OP update", err);
      }
    }

    return this.mapToCompleteOPRecord(record);
  }

  async classifyAsOrtho(opNumber: string): Promise<CompleteOPRecord | null> {
    const existing = await prisma.oPRecord.findUnique({
      where: { opNumber },
      include: {
        finalizedTreatments: true,
        labRecords: true,
        patientLedgers: true,
        appointments: true,
        doctorVisits: true,
        treatmentPlanImages: { select: { id: true } },
        xRays: { select: { id: true } }
      }
    });
    
    if (!existing) throw new Error("OP not found");
    if (existing.workflowType === 'ORTHO') return this.mapToCompleteOPRecord(existing);
    
    const hasGeneralTreatments = existing.finalizedTreatments.length > 0 || existing.labRecords.length > 0;
    const hasGeneralTreatmentPayments = existing.patientLedgers.some(pl => !pl.isRegistrationFee);
    if (hasGeneralTreatments || hasGeneralTreatmentPayments) {
      throw new Error("Cannot convert to ORTHO: Existing General clinical or financial data found.");
    }
    
    const record = await prisma.oPRecord.update({
      where: { opNumber },
      data: { workflowType: 'ORTHO' },
      include: opRecordCommonInclude
    });
    
    return this.mapToCompleteOPRecord(record);
  }

  async revertToGeneral(opNumber: string): Promise<CompleteOPRecord | null> {
    const existing = await prisma.oPRecord.findUnique({
      where: { opNumber },
      include: {
        finalizedTreatments: { include: { treatment: true, crownType: true } },
        treatmentPlanImages: { select: { id: true } },
        xRays: { select: { id: true } },
        doctorVisits: { include: { images: { select: { id: true } } } },
        appointments: true,
        labRecords: true
      }
    });
    
    if (!existing) throw new Error("OP not found");
    if (existing.workflowType === 'GENERAL') return this.mapToCompleteOPRecord(existing);
    
    // We intentionally do NOT delete Ortho historical data. We just reclassify the OP.
    const record = await prisma.oPRecord.update({
      where: { opNumber },
      data: { workflowType: 'GENERAL' },
      include: opRecordCommonInclude
    });
    
    return this.mapToCompleteOPRecord(record);
  }

  private mapToCompleteOPRecord(record: any): CompleteOPRecord {
    // Format date back to DD/MM/YYYY
    const d = new Date(record.date);
    const dateStr = `${d.getUTCDate().toString().padStart(2, '0')}/${(d.getUTCMonth() + 1).toString().padStart(2, '0')}/${d.getUTCFullYear()}`;

    // Compute basic treatment lab info
    let treatmentPlanCost = 0;
    let totalCrownCost = 0;
    let totalAmount = 0;

    const finalizedTreatments = record.finalizedTreatments.map((ft: any) => {
      const patientPrice = ft.patientPriceSnapshot || 0;
      if (ft.treatmentId === "crowns" || (ft.crownType && ft.numberOfCrowns)) {
        // patientPriceSnapshot already stores total crown cost (unit price × numberOfCrowns)
        totalCrownCost += ft.patientPriceSnapshot || 0;
      } else {
        treatmentPlanCost += patientPrice;
      }

      return {
        id: ft.id,
        treatmentId: ft.treatmentId,
        treatmentName: ft.treatmentNameSnapshot,
        patientPrice: ft.patientPriceSnapshot,
        requiresTeethNotation: ft.requiresTeethNotation,
        teethNotation: ft.teethNotation,
        crownType: ft.crownTypeId,
        numberOfCrowns: ft.numberOfCrowns,
        quantity: ft.requiresTeethNotation ? countSelectedTeeth(ft.teethNotation) : 1,
        egEhsGen: ft.treatmentId === "crowns" ? (record.egEhsGen || "") : undefined,
        createdAt: ft.createdAt
      };
    });

    totalAmount = treatmentPlanCost + totalCrownCost;

    return {
      patient: {
        sectionNo: "", // Not used in new DB
        opNumber: record.opNumber,
        patientName: record.patientName,
        age: record.age,
        sex: record.sex,
        phone: record.phone,
        date: dateStr,
        reference: record.reference || "",
        paidStatus: record.paidStatus,
        workflowType: record.workflowType,
        registrationFee: record.registrationFee || 0,
        paymentMode: record.registrationPaymentMode || undefined,
      },
      medicalHistory: {
        diabetes: record.diabetes || false,
        hypertension: record.hypertension || false,
        other: record.otherMedicalHistory || "",
      },
      chiefComplaint: record.chiefComplaint || "",
      treatmentLab: {
        treatmentPlan: finalizedTreatments.map((f: any) => f.treatmentId),
        finalizedTreatments,
        egEhsGen: record.egEhsGen || "",
        crownType: finalizedTreatments.find((f: any) => f.treatmentId === "crowns")?.crownType || "",
        numberOfCrowns: finalizedTreatments.find((f: any) => f.treatmentId === "crowns")?.numberOfCrowns || null,
        lab: record.labRecords?.find((lr: any) => 
          finalizedTreatments.some((ft: any) => ft.treatmentId === "crowns" && ft.id === lr.finalizedTreatmentId)
        )?.labId || "",
        treatmentPlanCost: treatmentPlanCost.toString(),
        totalCrownCost: totalCrownCost.toString(),
        totalAmount: totalAmount.toString(),
        finalDiscount: (record.advisoryDiscount || 0).toString(),
        netAmount: (totalAmount - (record.advisoryDiscount || 0)).toString(),
      },
      treatmentPlanImages: record.treatmentPlanImages.map((img: any) => ({
        id: img.id,
        url: img.fileUrl,
        filename: img.originalFilename || "",
        uploadedAt: img.uploadedAt.toISOString(),
      })),
      xrayImages: record.xRays.map((img: any) => ({
        id: img.id,
        url: img.fileUrl,
        filename: img.originalFilename || "",
        uploadedAt: img.uploadedAt.toISOString(),
      })),
      orthoFinancials: {
        totalAmount: record.orthoTotalAmount || 0,
        discount: record.orthoDiscount || 0,
      },
      caseSheets: (record.doctorVisits || []).map((visit: any) => {
        const d = new Date(visit.visitDate);
        const visitDateStr = `${d.getUTCDate().toString().padStart(2, '0')}/${(d.getUTCMonth() + 1).toString().padStart(2, '0')}/${d.getUTCFullYear()}`;
        return {
          visitId: visit.id,
          date: visitDateStr,
          doctorId: visit.doctorId,
          treatmentDone: visit.treatmentDone || "",
          teethNotation: visit.visitTeethNotation,
          images: (visit.images || []).map((img: any) => ({
            id: img.id,
            url: img.fileUrl,
            filename: img.originalFilename || "",
            uploadedAt: img.uploadedAt.toISOString(),
          }))
        };
      }),
    };
  }
}

export const apiOPRepository = new ApiOPRepository();
