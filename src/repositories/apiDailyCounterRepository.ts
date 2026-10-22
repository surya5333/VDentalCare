import { prisma } from '../lib/prisma';

export const apiDailyCounterRepository = {
  getDailyTransactions: async (date: Date) => {
    // Determine the start and end of the requested date for filtering
    const startDate = new Date(date);
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setUTCHours(23, 59, 59, 999);

    return await prisma.patientLedger.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        // Only include actual transactions
        OR: [
          { paidAmount: { gt: 0 } },
          { discount: { gt: 0 } },
          { treatmentCost: { gt: 0 } },
        ]
      },
      include: {
        opRecord: true,
      },
      orderBy: {
        createdAt: 'asc',
      }
    });
  },
  getDailyOPDiscounts: async (date: Date) => {
    const startDate = new Date(date);
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setUTCHours(23, 59, 59, 999);

    return await prisma.oPRecord.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        OR: [
          { advisoryDiscount: { gt: 0 } },
          { orthoDiscount: { gt: 0 } }
        ]
      }
    });
  }
};
