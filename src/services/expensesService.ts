import { apiMonthlyFinancialRepository } from '../repositories/apiMonthlyFinancialRepository';
import { apiExpenseSettingsRepository } from '../repositories/apiExpenseSettingsRepository';
import { apiExpenseEntryRepository } from '../repositories/apiExpenseEntryRepository';
import { apiLabExpensePaymentRepository } from '../repositories/apiLabExpensePaymentRepository';
import { ExpenseCategory } from '@prisma/client';

function getDatesForMonth(monthStr: string) {
  if (!monthStr || !/^\d{4}-\d{2}$/.test(monthStr)) {
    throw new Error("Invalid or missing month. Format must be YYYY-MM.");
  }
  const monthStart = new Date(`${monthStr}-01T00:00:00.000Z`);
  if (isNaN(monthStart.getTime())) {
    throw new Error("Invalid month value.");
  }
  const year = monthStart.getUTCFullYear();
  const month = monthStart.getUTCMonth();
  const monthEnd = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
  return { monthStart, monthEnd };
}

export const expensesService = {
  getExpenseSummary: async (monthStr: string) => {
    const { monthStart, monthEnd } = getDatesForMonth(monthStr);

    // 1. Concurrently fetch all independent data sources in a single parallel batch
    const [
      actualCollections,
      settings,
      expenseEntries,
      allLabs,
      labRecords,
      monthlyPayments,
      existingSummary,
    ] = await Promise.all([
      apiMonthlyFinancialRepository.calculateCollections(monthStart, monthEnd),
      apiExpenseSettingsRepository.getSettings(),
      apiExpenseEntryRepository.getEntriesForMonth(monthStart, monthEnd),
      apiLabExpensePaymentRepository.getAllLabs(),
      apiLabExpensePaymentRepository.getLabExpensesForMonth(monthStart, monthEnd),
      apiLabExpensePaymentRepository.getLabMonthlyPaymentsForMonth(monthStart),
      apiMonthlyFinancialRepository.getSummary(monthStart),
    ]);

    const monthlyValue = actualCollections.generalCollections + actualCollections.orthoCollections;

    // Avoid unnecessary DB writes during ordinary GET requests.
    // Only upsert the summary if it does not yet exist or if the values changed.
    if (
      !existingSummary ||
      existingSummary.generalCollections !== actualCollections.generalCollections ||
      existingSummary.orthoCollections !== actualCollections.orthoCollections ||
      existingSummary.monthlyValue !== monthlyValue
    ) {
      await apiMonthlyFinancialRepository.upsertSummary(monthStart, {
        generalCollections: actualCollections.generalCollections,
        orthoCollections: actualCollections.orthoCollections,
        monthlyValue,
      });
    }

    // 2. Settings & Budgets
    const percentages = {
      marketing: settings.find(s => s.key === 'marketing')?.percentage || 0,
      lab: settings.find(s => s.key === 'lab')?.percentage || 0,
      salaries: settings.find(s => s.key === 'salaries')?.percentage || 0,
      office_expenses: settings.find(s => s.key === 'office_expenses')?.percentage || 0,
    };

    // Calculate Budgets (Monthly Value * Percentage / 10000)
    const budgets = {
      marketing: Math.round(monthlyValue * percentages.marketing / 10000),
      lab: Math.round(monthlyValue * percentages.lab / 10000),
      salaries: Math.round(monthlyValue * percentages.salaries / 10000),
      office_expenses: Math.round(monthlyValue * percentages.office_expenses / 10000),
    };

    // 3. Manual Expenses (Marketing, Salaries, Office)
    const calculateCategoryTotals = (category: ExpenseCategory) => {
      const entries = expenseEntries.filter(e => e.category === category);
      const cash = entries.reduce((sum, e) => sum + e.cashAmount, 0);
      const bank = entries.reduce((sum, e) => sum + e.bankAmount, 0);
      return { cash, bank, totalSpent: cash + bank, entries };
    };

    const marketingStats = calculateCategoryTotals(ExpenseCategory.MARKETING);
    const salariesStats = calculateCategoryTotals(ExpenseCategory.SALARIES);
    const officeStats = calculateCategoryTotals(ExpenseCategory.OFFICE_EXPENSES);

    const SUPPORTED_LABS = ["Smile Lab", "Dental Arts", "Precision Dentures"];

    // Build consolidated list ensuring supported labs appear first, plus any other active labs or labs with records
    const labMap = new Map<string, { id: string; name: string }>();
    
    // Add supported labs from allLabs
    for (const sName of SUPPORTED_LABS) {
      const found = allLabs.find(l => l.name.toLowerCase() === sName.toLowerCase());
      if (found) {
        labMap.set(found.name, { id: found.id, name: found.name });
      }
    }
    // Add other active labs in database
    for (const l of allLabs) {
      if (!labMap.has(l.name)) {
        labMap.set(l.name, { id: l.id, name: l.name });
      }
    }
    // Add any lab from records that might not be in allLabs
    for (const r of labRecords) {
      if (r.lab && !labMap.has(r.lab.name)) {
        labMap.set(r.lab.name, { id: r.lab.id, name: r.lab.name });
      }
    }

    let totalLabCost = 0;
    let totalLabCashPaid = 0;
    let totalLabBankPaid = 0;

    // Detailed per-record entries (kept for history/reporting)
    const labExpenses = labRecords.map(record => {
      const labCost = record.labCostSnapshot;
      const payment = record.labExpensePayment;
      const cashPaid = payment ? payment.cashPaid : 0;
      const bankPaid = payment ? payment.bankPaid : 0;
      const remainingCost = labCost - cashPaid - bankPaid;

      return {
        labRecordId: record.id,
        labId: record.labId,
        date: record.createdAt,
        labName: record.lab.name,
        labCost,
        cashPaid,
        bankPaid,
        remainingCost,
        opNumber: record.opRecord?.opNumber || null,
        patientName: record.opRecord?.patientName || null,
        treatmentName: record.finalizedTreatment?.treatment?.name || null,
        crownTypeName: record.finalizedTreatment?.crownType?.name || null,
        numberOfCrowns: record.finalizedTreatment?.numberOfCrowns || null,
      };
    });

    // Compute consolidated row for each lab
    const consolidatedLabs = Array.from(labMap.values()).map(lab => {
      const labRecordsForLab = labRecords.filter(r => r.labId === lab.id || r.lab.name === lab.name);
      const labCost = labRecordsForLab.reduce((sum, r) => sum + r.labCostSnapshot, 0);

      // Check if consolidated monthly payment exists
      const monthlyPayment = monthlyPayments.find(p => p.labId === lab.id);
      let cashPaid = 0;
      let bankPaid = 0;

      if (monthlyPayment) {
        cashPaid = monthlyPayment.cashPaid;
        bankPaid = monthlyPayment.bankPaid;
      } else {
        // Fallback to sum of legacy record payments if any exist
        cashPaid = labRecordsForLab.reduce((sum, r) => sum + (r.labExpensePayment?.cashPaid || 0), 0);
        bankPaid = labRecordsForLab.reduce((sum, r) => sum + (r.labExpensePayment?.bankPaid || 0), 0);
      }

      const remainingCost = labCost - cashPaid - bankPaid;

      totalLabCost += labCost;
      totalLabCashPaid += cashPaid;
      totalLabBankPaid += bankPaid;

      return {
        labId: lab.id,
        labName: lab.name,
        totalLabCost: labCost,
        cashPaid,
        bankPaid,
        remainingCost,
      };
    });

    const totalLabSpent = totalLabCashPaid + totalLabBankPaid;

    // 5. Build Final Response
    return {
      month: monthStr,
      monthlyValue,
      generalCollections: actualCollections.generalCollections,
      orthoCollections: actualCollections.orthoCollections,
      settings: percentages,
      categories: {
        marketing: {
          budget: budgets.marketing,
          spentCash: marketingStats.cash,
          spentBank: marketingStats.bank,
          totalSpent: marketingStats.totalSpent,
          remainingBudget: budgets.marketing - marketingStats.totalSpent,
          entries: marketingStats.entries
        },
        salaries: {
          budget: budgets.salaries,
          spentCash: salariesStats.cash,
          spentBank: salariesStats.bank,
          totalSpent: salariesStats.totalSpent,
          remainingBudget: budgets.salaries - salariesStats.totalSpent,
          entries: salariesStats.entries
        },
        officeExpenses: {
          budget: budgets.office_expenses,
          spentCash: officeStats.cash,
          spentBank: officeStats.bank,
          totalSpent: officeStats.totalSpent,
          remainingBudget: budgets.office_expenses - officeStats.totalSpent,
          entries: officeStats.entries
        },
        lab: {
          budget: budgets.lab,
          totalLabCost,
          spentCash: totalLabCashPaid,
          spentBank: totalLabBankPaid,
          totalSpent: totalLabSpent,
          remainingLabCost: totalLabCost - totalLabSpent,
          remainingBudget: budgets.lab - totalLabSpent,
          labs: consolidatedLabs,
          entries: labExpenses
        }
      }
    };
  }
};
