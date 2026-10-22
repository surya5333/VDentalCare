import { prisma } from '@/lib/prisma';

export const apiLabExpensePaymentRepository = {
  /**
   * Fetch lab costs and payments for a given month.
   * Based on LabRecord.createdAt being within the month.
   */
  getLabExpensesForMonth: async (monthStart: Date, monthEnd: Date) => {
    return prisma.labRecord.findMany({
      where: {
        createdAt: { gte: monthStart, lte: monthEnd }
      },
      select: {
        id: true,
        labId: true,
        labCostSnapshot: true,
        createdAt: true,
        lab: {
          select: {
            id: true,
            name: true,
          }
        },
        opRecord: {
          select: {
            opNumber: true,
            patientName: true,
          }
        },
        finalizedTreatment: {
          select: {
            numberOfCrowns: true,
            treatment: {
              select: {
                name: true,
              }
            },
            crownType: {
              select: {
                name: true,
              }
            }
          }
        },
        labExpensePayment: {
          select: {
            cashPaid: true,
            bankPaid: true,
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
  },

  upsertPayment: async (labRecordId: string, data: { cashPaid: number, bankPaid: number, updatedBy?: string }) => {
    return prisma.labExpensePayment.upsert({
      where: { labRecordId },
      create: {
        labRecordId,
        cashPaid: data.cashPaid,
        bankPaid: data.bankPaid,
        updatedBy: data.updatedBy
      },
      update: {
        cashPaid: data.cashPaid,
        bankPaid: data.bankPaid,
        updatedBy: data.updatedBy
      }
    });
  },

  /**
   * Fetch all laboratories
   */
  getAllLabs: async () => {
    return prisma.lab.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
  },

  /**
   * Fetch consolidated monthly payments for all labs for a given month
   */
  getLabMonthlyPaymentsForMonth: async (monthStart: Date) => {
    return prisma.labMonthlyPayment.findMany({
      where: {
        month: monthStart
      },
      include: {
        lab: true
      }
    });
  },

  /**
   * Upsert consolidated monthly payment for a lab in a month
   */
  upsertLabMonthlyPayment: async (
    labId: string,
    monthStart: Date,
    data: { cashPaid: number; bankPaid: number; updatedBy?: string }
  ) => {
    return prisma.labMonthlyPayment.upsert({
      where: {
        labId_month: {
          labId,
          month: monthStart
        }
      },
      create: {
        labId,
        month: monthStart,
        cashPaid: data.cashPaid,
        bankPaid: data.bankPaid,
        updatedBy: data.updatedBy
      },
      update: {
        cashPaid: data.cashPaid,
        bankPaid: data.bankPaid,
        updatedBy: data.updatedBy
      },
      include: {
        lab: true
      }
    });
  }
};
