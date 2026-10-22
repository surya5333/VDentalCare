import { prisma } from '@/lib/prisma';

export const apiManagerReportRepository = {
  // Collection Summary (uses Monthly Ledger logic mostly)
  getCollectionSummary: async (startDate: Date, endDate: Date) => {
    return await prisma.patientLedger.groupBy({
      by: ['paymentMode'],
      where: {
        date: { gte: startDate, lte: endDate },
        workflowType: 'GENERAL'
      },
      _sum: {
        paidAmount: true
      }
    });
  },

  // Patient Summary (similar to monthly ledger breakdown)
  getPatientSummary: async (startDate: Date, endDate: Date) => {
    // It's easier to fetch all transactions ordered by date ASC and group in code to guarantee the latest balance
    return await prisma.patientLedger.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        workflowType: 'GENERAL'
      },
      include: { opRecord: true },
      orderBy: { date: 'asc' }
    });
  },

  // Outstanding Summary (as of end of month)
  // Finds the absolute latest ledger row for EVERY OP on or before endDate
  getOutstandingSummary: async (endDate: Date) => {
    // Prisma distinct retrieves the first record matching the distinct fields.
    // By ordering by date DESC and createdAt DESC (as fallback), we get the latest row per OP.
    return await prisma.patientLedger.findMany({
      where: {
        date: { lte: endDate },
        workflowType: 'GENERAL'
      },
      distinct: ['opRecordId'],
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        opRecord: true
      }
    });
  },

  // Treatment Summary
  // Tallies FinalizedTreatments created in that month
  getTreatmentSummary: async (startDate: Date, endDate: Date) => {
    return await prisma.finalizedTreatment.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate }
      },
      include: {
        treatment: true,
        crownType: true
      }
    });
  }
};
