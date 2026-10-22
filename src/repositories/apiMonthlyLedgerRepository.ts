import { prisma } from '@/lib/prisma';

export const apiMonthlyLedgerRepository = {
  getMonthlyTransactions: async (monthStr: string) => {
    // monthStr format: YYYY-MM
    const startDate = new Date(`${monthStr}-01T00:00:00.000Z`);
    
    // Calculate the end date (last day of the month)
    const year = startDate.getUTCFullYear();
    const month = startDate.getUTCMonth();
    // Next month, day 0 gives the last day of the current month
    const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

    return await prisma.patientLedger.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        workflowType: 'GENERAL',
        OR: [
          { paidAmount: { gt: 0 } },
          { discount: { gt: 0 } },
          { treatmentCost: { gt: 0 } },
        ]
      },
      include: {
        opRecord: {
          include: {
            finalizedTreatments: true
          }
        },
        finalizedTreatment: true,
      },
      orderBy: {
        date: 'asc', // We want chronological order to find the *latest* balance accurately
      }
    });
  }
};
