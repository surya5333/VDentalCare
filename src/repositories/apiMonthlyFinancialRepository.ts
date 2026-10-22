import { prisma } from '@/lib/prisma';

/**
 * Repository for MonthlyFinancialSummary and collection calculations.
 * Monthly Value = General Collections + Ortho Collections from PatientLedger.
 */
export const apiMonthlyFinancialRepository = {
  /**
   * Calculate actual collections for a calendar month from PatientLedger.
   * Returns { generalCollections, orthoCollections }.
   */
  calculateCollections: async (monthStart: Date, monthEnd: Date) => {
    const grouped = await prisma.patientLedger.groupBy({
      by: ['workflowType'],
      where: {
        date: { gte: monthStart, lte: monthEnd },
        paidAmount: { gt: 0 }
      },
      _sum: { paidAmount: true }
    });

    let generalCollections = 0;
    let orthoCollections = 0;

    for (const g of grouped) {
      if (g.workflowType === 'GENERAL') {
        generalCollections = g._sum.paidAmount || 0;
      } else if (g.workflowType === 'ORTHO') {
        orthoCollections = g._sum.paidAmount || 0;
      }
    }

    return { generalCollections, orthoCollections };
  },

  /**
   * Upsert the cached MonthlyFinancialSummary for a given month.
   */
  upsertSummary: async (monthKey: Date, data: {
    generalCollections: number;
    orthoCollections: number;
    monthlyValue: number;
  }) => {
    return prisma.monthlyFinancialSummary.upsert({
      where: { month: monthKey },
      create: {
        month: monthKey,
        generalCollections: data.generalCollections,
        orthoCollections: data.orthoCollections,
        monthlyValue: data.monthlyValue,
        lastCalculatedAt: new Date(),
      },
      update: {
        generalCollections: data.generalCollections,
        orthoCollections: data.orthoCollections,
        monthlyValue: data.monthlyValue,
        lastCalculatedAt: new Date(),
      }
    });
  },

  /**
   * Get a stored summary by month key.
   */
  getSummary: async (monthKey: Date) => {
    return prisma.monthlyFinancialSummary.findUnique({
      where: { month: monthKey }
    });
  },

  /**
   * Get all stored summaries, ordered by month DESC.
   */
  getAllSummaries: async () => {
    return prisma.monthlyFinancialSummary.findMany({
      orderBy: { month: 'desc' }
    });
  }
};
