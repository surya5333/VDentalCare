import { apiManagerReportRepository } from '../repositories/apiManagerReportRepository';

function getDatesForMonth(monthStr: string) {
  if (!monthStr || !/^\d{4}-\d{2}$/.test(monthStr)) {
    throw new Error("Invalid or missing month. Format must be YYYY-MM.");
  }
  const startDate = new Date(`${monthStr}-01T00:00:00.000Z`);
  if (isNaN(startDate.getTime())) {
    throw new Error("Invalid month value.");
  }
  const year = startDate.getUTCFullYear();
  const month = startDate.getUTCMonth();
  const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
  return { startDate, endDate };
}

export const managerReportService = {
  getCollectionSummary: async (monthStr: string) => {
    const { startDate, endDate } = getDatesForMonth(monthStr);
    const groups = await apiManagerReportRepository.getCollectionSummary(startDate, endDate);
    
    let cash = 0, swipe = 0, phonePay = 0;
    
    for (const group of groups) {
      if (group.paymentMode === 'Cash') cash += (group._sum.paidAmount || 0);
      else if (group.paymentMode === 'Swipe' || group.paymentMode === 'Card') swipe += (group._sum.paidAmount || 0);
      else if (group.paymentMode === 'Phone Pay' || group.paymentMode === 'UPI' || group.paymentMode === 'Bank Transfer') phonePay += (group._sum.paidAmount || 0);
    }
    
    return {
      month: monthStr,
      cash,
      swipe,
      phonePay,
      totalCollection: cash + swipe + phonePay
    };
  },

  getPatientSummary: async (monthStr: string) => {
    const { startDate, endDate } = getDatesForMonth(monthStr);
    const ledgerRows = await apiManagerReportRepository.getPatientSummary(startDate, endDate);
    
    const opMap = new Map<string, {
      opNumber: string;
      patientName: string;
      totalPaid: number;
      totalDiscount: number;
      closingBalance: number;
    }>();

    for (const row of ledgerRows) {
      const opNum = row.opRecord.opNumber;
      if (!opMap.has(opNum)) {
        opMap.set(opNum, {
          opNumber: opNum,
          patientName: row.opRecord.patientName,
          totalPaid: 0,
          totalDiscount: 0,
          closingBalance: 0,
        });
      }
      const opStats = opMap.get(opNum)!;
      opStats.totalPaid += row.paidAmount;
      opStats.totalDiscount += row.discount;
      opStats.closingBalance = row.balance;
    }
    
    return {
      month: monthStr,
      patients: Array.from(opMap.values())
    };
  },

  getOutstandingSummary: async (monthStr: string) => {
    const { endDate } = getDatesForMonth(monthStr);
    // Gets the single latest transaction per OP up to endDate
    const latestRows = await apiManagerReportRepository.getOutstandingSummary(endDate);
    
    // Filter strictly those with outstanding balance > 0
    const outstanding = latestRows
      .filter(row => row.balance > 0)
      .map(row => ({
        opNumber: row.opRecord.opNumber,
        patientName: row.opRecord.patientName,
        outstandingAmount: row.balance,
        lastTransactionDate: row.date
      }));

    return {
      month: monthStr,
      totalOutstandingPatients: outstanding.length,
      totalOutstandingAmount: outstanding.reduce((sum, item) => sum + item.outstandingAmount, 0),
      outstanding
    };
  },

  getTreatmentSummary: async (monthStr: string) => {
    const { startDate, endDate } = getDatesForMonth(monthStr);
    const treatments = await apiManagerReportRepository.getTreatmentSummary(startDate, endDate);
    
    const summaryMap = new Map<string, {
      treatmentName: string;
      count: number;
      totalValue: number;
    }>();

    for (const ft of treatments) {
      // Use crown type name if available to distinguish specific crowns, otherwise general treatment name
      const name = ft.crownType ? `${ft.treatment.name} - ${ft.crownType.name}` : ft.treatment.name;
      
      if (!summaryMap.has(name)) {
        summaryMap.set(name, { treatmentName: name, count: 0, totalValue: 0 });
      }
      const stat = summaryMap.get(name)!;
      const crowns = ft.numberOfCrowns ?? 1;
      stat.count += crowns; // Count each crown specifically
      // patientPriceSnapshot already stores total crown cost (unit price × numberOfCrowns)
      stat.totalValue += ft.patientPriceSnapshot ?? 0;
    }

    return {
      month: monthStr,
      treatments: Array.from(summaryMap.values())
    };
  }
};
