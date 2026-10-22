import { apiPatientLedgerRepository } from '../repositories/apiPatientLedgerRepository';
import { patientLedgerService } from './patientLedgerService';
import { prisma } from '@/lib/prisma';

export const VALID_PAYMENT_MODES = ["Cash", "Swipe", "Phone Pay", "UPI", "Card", "Bank Transfer"];

export const orthoLedgerService = {
  getLedger: async (opNumber: string) => {
    const op = await prisma.oPRecord.findUnique({
      where: { opNumber },
      include: {
        orthoTreatments: true
      }
    });
    if (!op) throw new Error("OP Record not found");
    if (op.workflowType !== 'ORTHO') throw new Error("OP is not an Ortho case");

    const rows = await apiPatientLedgerRepository.getLedgerByOpId(op.id, 'ORTHO');

    // Calculate gross treatment cost from manual orthoTotalAmount input
    const grossTreatmentCost = op.orthoTotalAmount;

    // Calculate summary
    let totalPaid = 0;
    let ledgerDiscount = 0;

    for (const row of rows) {
      totalPaid += row.paidAmount;
      ledgerDiscount += row.discount;
    }

    const totalDiscount = op.orthoDiscount + ledgerDiscount;
    const currentBalance = grossTreatmentCost - totalDiscount - totalPaid;

    return {
      rows,
      summary: {
        totalTreatmentCost: grossTreatmentCost,
        totalPaid,
        totalDiscount,
        currentBalance
      }
    };
  },

  addTransaction: async (
    opNumber: string,
    data: {
      date: string;
      orthoTreatmentId?: string;
      paidAmount: number;
      discount: number;
      paymentMode: string;
      idempotencyKey?: string;
    }
  ) => {
    // 0. Idempotency Check: if idempotencyKey is provided and record already exists, return it
    if (data.idempotencyKey) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- idempotencyKey not in generated types until prisma generate reruns
      const existing = await (prisma as any).patientLedger.findUnique({
        where: { idempotencyKey: data.idempotencyKey },
        include: {
          orthoTreatment: true,
        }
      });
      if (existing) {
        return existing;
      }
    }

    // Basic validations
    if (data.paidAmount < 0) throw new Error("Paid amount cannot be negative");
    if (data.discount < 0) throw new Error("Discount cannot be negative");
    if (data.paidAmount === 0 && data.discount === 0) throw new Error("Transaction must have either payment or discount");
    if (!VALID_PAYMENT_MODES.includes(data.paymentMode)) throw new Error("Invalid payment mode");

    const op = await prisma.oPRecord.findUnique({ where: { opNumber } });
    if (!op) throw new Error("OP Record not found");
    if (op.workflowType !== 'ORTHO') throw new Error("OP is not an Ortho case");

    // Verify orthoTreatmentId belongs to this OP if provided
    if (data.orthoTreatmentId) {
      const ot = await prisma.orthoTreatment.findFirst({
        where: { id: data.orthoTreatmentId, opRecordId: op.id }
      });
      if (!ot) throw new Error("Ortho treatment does not belong to this OP");
    }

    try {
      return await apiPatientLedgerRepository.executeTransaction(async (tx) => {
        if (data.idempotencyKey) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const existingInTx = await (tx as any).patientLedger.findUnique({
            where: { idempotencyKey: data.idempotencyKey }
          });
          if (existingInTx) return existingInTx;
        }

        // 1. Calculate Gross Treatment Cost from Ortho Total Amount
        const grossTreatmentCost = op.orthoTotalAmount;

        // 2. Calculate current paid and discount from ORTHO ledger only
        const existingRows = await tx.patientLedger.findMany({
          where: { opRecordId: op.id, workflowType: 'ORTHO' },
          orderBy: { createdAt: 'asc' }
        });

        let totalPaid = 0;
        let ledgerDiscount = 0;
        for (const row of existingRows) {
          totalPaid += row.paidAmount;
          ledgerDiscount += row.discount;
        }

        const totalDiscount = op.orthoDiscount + ledgerDiscount;

        // 3. Determine current outstanding
        const currentOutstanding = grossTreatmentCost - totalDiscount - totalPaid;

        // 4. Validate against current outstanding
        if (data.discount > currentOutstanding) {
          throw new Error("Discount cannot be greater than remaining balance");
        }
        if (data.paidAmount > (currentOutstanding - data.discount)) {
          throw new Error("Payment exceeds remaining balance after discount");
        }

        const newBalance = currentOutstanding - data.paidAmount - data.discount;

        // 5. Store the new row with ORTHO workflowType
        return await apiPatientLedgerRepository.createLedgerRow({
          opRecordId: op.id,
          date: new Date(data.date),
          treatmentCost: currentOutstanding,
          paidAmount: data.paidAmount,
          discount: data.discount,
          paymentMode: data.paymentMode,
          balance: newBalance,
          orthoTreatmentId: data.orthoTreatmentId,
          workflowType: 'ORTHO',
          idempotencyKey: data.idempotencyKey,
        }, tx);
      });
    } catch (err: unknown) {
      const prismaErr = err as { code?: string; message?: string };
      if (data.idempotencyKey && (prismaErr.code === 'P2002' || prismaErr.message?.includes('Unique constraint'))) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existing = await (prisma as any).patientLedger.findUnique({
          where: { idempotencyKey: data.idempotencyKey },
          include: {
            orthoTreatment: true,
          }
        });
        if (existing) return existing;
      }
      throw prismaErr;
    }
  },

  editTransaction: async (
    opNumber: string,
    transactionId: string,
    data: {
      date?: string;
      paidAmount?: number;
      discount?: number;
      paymentMode?: string;
    }
  ) => {
    return patientLedgerService.editTransaction(opNumber, transactionId, data);
  },

  deleteTransaction: async (opNumber: string, transactionId: string) => {
    return patientLedgerService.deleteTransaction(opNumber, transactionId);
  }
};
