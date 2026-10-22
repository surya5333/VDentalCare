import { prisma } from '@/lib/prisma';

const DEFAULT_SETTINGS = [
  { key: 'marketing', label: 'Marketing', percentage: 1000 },
  { key: 'lab', label: 'Lab', percentage: 1250 },
  { key: 'salaries', label: 'Salaries', percentage: 2000 },
  { key: 'office_expenses', label: 'Office Expenses', percentage: 1750 }
];

export const apiExpenseSettingsRepository = {
  /**
   * Get all expense budget settings. Initializes defaults if missing.
   */
  getSettings: async () => {
    let settings = await prisma.expenseBudgetSetting.findMany();
    
    if (settings.length === 0) {
      // Initialize defaults
      for (const def of DEFAULT_SETTINGS) {
        await prisma.expenseBudgetSetting.create({
          data: def
        });
      }
      settings = await prisma.expenseBudgetSetting.findMany();
    }
    
    return settings;
  },

  /**
   * Update expense budget percentages.
   */
  updateSettings: async (updates: { key: string, percentage: number }[]) => {
    return prisma.$transaction(async (tx) => {
      const results = [];
      for (const update of updates) {
        if (update.percentage < 0 || update.percentage > 10000) {
          throw new Error("Percentage must be between 0 and 10000 basis points.");
        }
        const updated = await tx.expenseBudgetSetting.update({
          where: { key: update.key },
          data: { percentage: update.percentage }
        });
        results.push(updated);
      }
      return results;
    });
  }
};
