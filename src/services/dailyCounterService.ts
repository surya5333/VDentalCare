import { apiDailyCounterRepository } from '../repositories/apiDailyCounterRepository';

export const dailyCounterService = {
  getDailyCounter: async (dateString: string) => {
    // 1. Validate date
    if (!dateString || isNaN(Date.parse(dateString))) {
      throw new Error("Invalid or missing date. Format must be YYYY-MM-DD.");
    }

    const targetDate = new Date(dateString);
    
    const ledgerRows = await apiDailyCounterRepository.getDailyTransactions(targetDate);
    const opDiscounts = await apiDailyCounterRepository.getDailyOPDiscounts(targetDate);
    
    // 3. Transform and calculate
    let cash = 0;
    let swipe = 0;
    let phonePay = 0;
    let totalDiscount = 0;

    // Add OP advisory discounts to total discount
    for (const op of opDiscounts) {
      totalDiscount += (op.advisoryDiscount || 0) + (op.orthoDiscount || 0);
    }
    
    const formattedRows = ledgerRows.map((row) => {
      // Summaries - calculate totals strictly based on paidAmount and specific valid modes
      if (row.paymentMode === "Cash") {
        cash += row.paidAmount;
      } else if (row.paymentMode === "Swipe" || row.paymentMode === "Card") {
        swipe += row.paidAmount;
      } else if (row.paymentMode === "Phone Pay" || row.paymentMode === "UPI" || row.paymentMode === "Bank Transfer") {
        phonePay += row.paidAmount;
      }

      totalDiscount += row.discount;

      return {
        id: row.id,
        date: row.date.toISOString(),
        day: row.date.toLocaleDateString('en-US', { weekday: 'long' }),
        opNumber: row.opRecord.opNumber,
        patientName: row.opRecord.patientName,
        paidFree: row.opRecord.paidStatus,
        treatmentAmount: row.treatmentCost,
        discount: row.discount,
        paidAmount: row.paidAmount,
        paymentMode: row.paymentMode,
        balance: row.balance,
        workflowType: row.workflowType,
        isEligible: true,
        sourceType: 'LEDGER' as const,
      };
    });

    const opDiscountRows = opDiscounts.map(op => ({
      id: null,
      date: op.date.toISOString(),
      day: op.date.toLocaleDateString('en-US', { weekday: 'long' }),
      opNumber: op.opNumber,
      patientName: op.patientName,
      paidFree: op.paidStatus,
      treatmentAmount: 0,
      discount: (op.advisoryDiscount || 0) + (op.orthoDiscount || 0),
      paidAmount: 0,
      paymentMode: "-",
      balance: 0,
      workflowType: op.workflowType,
      isEligible: false,
      sourceType: 'OP_DISCOUNT' as const,
    }));

    const allRows = [...opDiscountRows, ...formattedRows].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const finalRows = allRows.map((row, index) => ({
      sNo: index + 1,
      ...row
    }));

    const totalAmount = cash + swipe + phonePay;
    
    // Separate by workflowType
    let generalCollection = 0;
    let orthoCollection = 0;
    
    for (const row of formattedRows) {
      if (row.workflowType === 'ORTHO') orthoCollection += row.paidAmount;
      else generalCollection += row.paidAmount;
    }

    return {
      date: dateString,
      day: targetDate.toLocaleDateString('en-US', { weekday: 'long' }),
      rows: finalRows,
      summary: {
        cash,
        swipe,
        phonePay,
        totalAmount,
        totalDiscount,
        grandTotal: totalAmount,
        generalCollection,
        orthoCollection,
      }
    };
  }
};
