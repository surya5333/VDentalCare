import { apiMonthlyLedgerRepository } from '../repositories/apiMonthlyLedgerRepository';

export const monthlyLedgerService = {
  getMonthlyLedger: async (monthStr: string) => {
    // 1. Validate YYYY-MM
    if (!monthStr || !/^\d{4}-\d{2}$/.test(monthStr)) {
      throw new Error("Invalid or missing month. Format must be YYYY-MM.");
    }
    
    // Check valid date
    const targetDate = new Date(`${monthStr}-01T00:00:00.000Z`);
    if (isNaN(targetDate.getTime())) {
      throw new Error("Invalid month value.");
    }

    // 2. Fetch rows for the given month
    const ledgerRows = await apiMonthlyLedgerRepository.getMonthlyTransactions(monthStr);

    // 3. Process transactions
    let cash = 0;
    let swipe = 0;
    let phonePay = 0;
    let totalDiscount = 0;
    
    // For grouping by OP
    const opMap = new Map<string, {
      opNumber: string;
      patientName: string;
      totalCost: number;
      totalPaid: number;
      totalDiscount: number;
      closingBalance: number;
      treatmentCount: number;
    }>();

    // The query orders by date ASC, so the last processed row per OP gives the accurate closing balance for that month.
    for (const row of ledgerRows) {
      // Tally Collections based on paymentMode
      if (row.paymentMode === "Cash") cash += row.paidAmount;
      else if (row.paymentMode === "Swipe" || row.paymentMode === "Card") swipe += row.paidAmount;
      else if (row.paymentMode === "Phone Pay" || row.paymentMode === "UPI" || row.paymentMode === "Bank Transfer") phonePay += row.paidAmount;
      
      totalDiscount += row.discount;

      const opNum = row.opRecord.opNumber;
      if (!opMap.has(opNum)) {
        // Calculate gross cost dynamically
        // patientPriceSnapshot already stores total crown cost (unit price × numberOfCrowns)
        let grossCost = 0;
        const fts = row.opRecord.finalizedTreatments || [];
        for (const ft of fts) {
          grossCost += ft.patientPriceSnapshot || 0;
        }

        opMap.set(opNum, {
          opNumber: opNum,
          patientName: row.opRecord.patientName,
          totalCost: grossCost,
          totalPaid: 0,
          totalDiscount: 0,
          closingBalance: 0,
          treatmentCount: fts.length
        });
      }

      const opStats = opMap.get(opNum)!;
      opStats.totalPaid += row.paidAmount;
      opStats.totalDiscount += row.discount;
      // Because we iterate chronologically, this continuously updates and eventually leaves the *latest* balance
      opStats.closingBalance = row.balance;
    }

    const totalPaid = cash + swipe + phonePay;
    
    // Aggregating all closing balances for OPs that had activity this month
    let overallClosingOutstandingBalance = 0;
    const patientBreakdown = Array.from(opMap.values()).map(op => {
      overallClosingOutstandingBalance += op.closingBalance;
      return {
        opNumber: op.opNumber,
        patientName: op.patientName,
        totalCost: op.totalCost,
        totalPaid: op.totalPaid,
        totalDiscount: op.totalDiscount,
        treatmentCount: op.treatmentCount,
        closingOutstandingBalance: op.closingBalance
      };
    });

    return {
      month: monthStr,
      summary: {
        cash,
        swipe,
        phonePay,
        totalPaid
      },
      discount: {
        totalDiscount
      },
      patientInfo: {
        totalActiveOPs: opMap.size,
        totalTransactions: ledgerRows.length,
      },
      outstanding: {
        closingOutstandingBalance: overallClosingOutstandingBalance
      },
      patientBreakdown
    };
  }
};
