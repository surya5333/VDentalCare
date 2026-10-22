import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type TransactionClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];
type DbClient = PrismaClient | TransactionClient;

export const apiPatientLedgerRepository = {
  getLedgerByOpId: async (opRecordId: string, workflowType: 'GENERAL' | 'ORTHO' = 'GENERAL') => {
    return prisma.patientLedger.findMany({
      where: { opRecordId, workflowType },
      orderBy: { createdAt: 'asc' }, // Chronological order
      include: {
        finalizedTreatment: {
          include: {
            treatment: true,
            crownType: true
          }
        },
        orthoTreatment: true
      }
    });
  },

  getLedgerRowById: async (id: string, tx?: DbClient) => {
    const db = tx || prisma;
    return db.patientLedger.findUnique({
      where: { id },
      include: {
        finalizedTreatment: {
          include: {
            treatment: true,
            crownType: true
          }
        },
        orthoTreatment: true
      }
    });
  },

  createLedgerRow: async (
    data: {
      opRecordId: string;
      date: Date;
      treatmentCost: number;
      paidAmount: number;
      paymentMode: string;
      discount: number;
      balance: number;
      finalizedTreatmentId?: string;
      orthoTreatmentId?: string;
      workflowType?: 'GENERAL' | 'ORTHO';
      idempotencyKey?: string;
      isRegistrationFee?: boolean;
      description?: string;
    },
    tx?: Omit<
      PrismaClient,
      | "$connect"
      | "$disconnect"
      | "$on"
      | "$transaction"
      | "$use"
      | "$extends"
    >
  ) => {
    const db = tx || prisma;
    return db.patientLedger.create({
      data: {
        opRecordId: data.opRecordId,
        date: data.date,
        treatmentCost: data.treatmentCost,
        paidAmount: data.paidAmount,
        paymentMode: data.paymentMode,
        discount: data.discount,
        balance: data.balance,
        finalizedTreatmentId: data.finalizedTreatmentId || null,
        orthoTreatmentId: data.orthoTreatmentId || null,
        workflowType: data.workflowType || 'GENERAL',
        idempotencyKey: data.idempotencyKey || null,
        isRegistrationFee: data.isRegistrationFee || false,
        description: data.description || null,
      }
    });
  },

  updateLedgerRow: async (
    id: string,
    data: {
      date?: Date;
      paidAmount?: number;
      paymentMode?: string;
      discount?: number;
      treatmentCost?: number;
      balance?: number;
    },
    tx?: DbClient
  ) => {
    const db = tx || prisma;
    return db.patientLedger.update({
      where: { id },
      data,
      include: {
        opRecord: true,
        finalizedTreatment: {
          include: {
            treatment: true,
            crownType: true,
          }
        },
        orthoTreatment: true,
      }
    });
  },

  deleteLedgerRow: async (id: string, tx?: DbClient) => {
    const db = tx || prisma;
    return db.patientLedger.delete({
      where: { id },
    });
  },

  recalculateLedgerBalances: async (
    opRecordId: string,
    workflowType: 'GENERAL' | 'ORTHO' = 'GENERAL',
    tx?: DbClient
  ) => {
    const db = tx || prisma;
    const op = await db.oPRecord.findUnique({
      where: { id: opRecordId },
      include: {
        finalizedTreatments: true,
      }
    });
    if (!op) throw new Error("OP Record not found");

    let grossTreatmentCost = 0;
    let initialDiscount = 0;

    if (workflowType === 'GENERAL') {
      // patientPriceSnapshot already stores total crown cost (unit price × numberOfCrowns)
      for (const ft of op.finalizedTreatments) {
        grossTreatmentCost += ft.patientPriceSnapshot || 0;
      }
      initialDiscount = op.advisoryDiscount || 0;
    } else {
      grossTreatmentCost = op.orthoTotalAmount || 0;
      initialDiscount = op.orthoDiscount || 0;
    }

    const rows = await db.patientLedger.findMany({
      where: { opRecordId, workflowType },
      orderBy: { createdAt: 'asc' }
    });

    let runningBalance = grossTreatmentCost - initialDiscount;

    for (const row of rows) {
      if (row.isRegistrationFee) {
        if (row.treatmentCost !== 0 || row.balance !== 0) {
          await db.patientLedger.update({
            where: { id: row.id },
            data: {
              treatmentCost: 0,
              balance: 0,
            }
          });
        }
        continue;
      }

      const prevOutstanding = runningBalance;
      const newBalance = prevOutstanding - (row.paidAmount || 0) - (row.discount || 0);

      if (row.treatmentCost !== prevOutstanding || row.balance !== newBalance) {
        await db.patientLedger.update({
          where: { id: row.id },
          data: {
            treatmentCost: prevOutstanding,
            balance: newBalance,
          }
        });
      }

      runningBalance = newBalance;
    }

    return runningBalance;
  },
  
  // To allow atomic creation logic (e.g. read balance then insert)
  executeTransaction: async <T>(
    fn: (
      tx: Omit<
        PrismaClient,
        | "$connect"
        | "$disconnect"
        | "$on"
        | "$transaction"
        | "$use"
        | "$extends"
      >
    ) => Promise<T>
  ) => {
    return prisma.$transaction(fn, {
      maxWait: 15000,
      timeout: 15000,
    });
  }
};
