/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '@/lib/prisma';

export interface SettlementItemInput {
  labRecordId: string;
  amount: number;
}

export class ApiLabSettlementRepository {
  async getSettlements(labId: string) {
    return prisma.labSettlement.findMany({
      where: { labId },
      include: {
        items: {
          include: {
            labRecord: {
              include: {
                opRecord: true,
                finalizedTreatment: {
                  include: { crownType: true }
                }
              }
            }
          }
        }
      },
      orderBy: { settlementDate: 'desc' }
    });
  }

  async getSettlementById(id: string) {
    const settlement = await prisma.labSettlement.findUnique({
      where: { id },
      include: {
        lab: true,
        items: {
          include: {
            labRecord: {
              include: {
                opRecord: true,
                finalizedTreatment: {
                  include: { crownType: true }
                }
              }
            }
          }
        }
      }
    });
    if (!settlement) throw new Error('Settlement not found');
    return settlement;
  }

  async createSettlement(labId: string, payload: {
    settlementDate: string;
    periodMonth: number;
    periodYear: number;
    notes?: string;
    items: SettlementItemInput[];
  }) {
    const lab = await prisma.lab.findUnique({ where: { id: labId } });
    if (!lab) throw new Error('Lab not found');

    if (!payload.items || payload.items.length === 0) {
      throw new Error('Settlement must include at least one item');
    }

    if (!payload.periodMonth || payload.periodMonth < 1 || payload.periodMonth > 12) {
      throw new Error('Invalid period month');
    }
    if (!payload.periodYear || payload.periodYear < 2000) {
      throw new Error('Invalid period year');
    }

    // Validate each item
    let calculatedTotal = 0;
    for (const item of payload.items) {
      if (!item.labRecordId) throw new Error('Each settlement item must have a labRecordId');
      if (!item.amount || item.amount <= 0) throw new Error('Settlement amount must be positive');

      const labRecord = await prisma.labRecord.findUnique({
        where: { id: item.labRecordId },
        include: { labSettlementItems: true }
      });
      if (!labRecord) throw new Error(`Lab Record ${item.labRecordId} not found`);
      if (labRecord.labId !== labId) throw new Error(`Lab Record ${item.labRecordId} does not belong to this lab`);

      // Calculate outstanding for this record
      const alreadySettled = labRecord.labSettlementItems.reduce(
        (sum: number, si: any) => sum + si.amount, 0
      );
      const outstanding = labRecord.labCostSnapshot - alreadySettled;

      if (item.amount > outstanding) {
        throw new Error(
          `Settlement amount ₹${item.amount} exceeds outstanding ₹${outstanding} for Lab Record ${item.labRecordId}`
        );
      }

      calculatedTotal += item.amount;
    }

    // Parse date
    let dateStr = payload.settlementDate;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [d, m, y] = dateStr.split('/');
      dateStr = `${y}-${m}-${d}`;
    }

    // Create settlement with items in a transaction
    const settlement = await prisma.$transaction(async (tx) => {
      const created = await tx.labSettlement.create({
        data: {
          labId,
          settlementDate: new Date(dateStr + 'T00:00:00Z'),
          periodMonth: payload.periodMonth,
          periodYear: payload.periodYear,
          totalAmount: calculatedTotal,
          notes: payload.notes
        }
      });

      for (const item of payload.items) {
        await tx.labSettlementItem.create({
          data: {
            settlementId: created.id,
            labRecordId: item.labRecordId,
            amount: item.amount
          }
        });
      }

      return created;
    }, { timeout: 15000 });

    // Fetch the complete settlement with relations outside the transaction
    return prisma.labSettlement.findUnique({
      where: { id: settlement.id },
      include: {
        items: {
          include: {
            labRecord: {
              include: {
                opRecord: true,
                finalizedTreatment: { include: { crownType: true } }
              }
            }
          }
        }
      }
    });
  }
  async createMonthlySettlement(labId: string, payload: {
    settlementDate: string;
    periodMonth: number;
    periodYear: number;
    notes?: string;
  }) {
    const lab = await prisma.lab.findUnique({ where: { id: labId } });
    if (!lab) throw new Error('Lab not found');

    if (!payload.periodMonth || payload.periodMonth < 1 || payload.periodMonth > 12) {
      throw new Error('Invalid period month');
    }
    if (!payload.periodYear || payload.periodYear < 2000) {
      throw new Error('Invalid period year');
    }

    // Parse date
    let dateStr = payload.settlementDate;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [d, m, y] = dateStr.split('/');
      dateStr = `${y}-${m}-${d}`;
    }

    const settlementId = await prisma.$transaction(async (tx) => {
      // Find eligible LabRecords for this lab and month based on createdAt
      const start = new Date(Date.UTC(payload.periodYear, payload.periodMonth - 1, 1));
      const end = new Date(Date.UTC(payload.periodYear, payload.periodMonth, 1));

      const labRecords = await tx.labRecord.findMany({
        where: {
          labId,
          createdAt: { gte: start, lt: end }
        },
        include: { labSettlementItems: true }
      });

      const itemsToSettle: SettlementItemInput[] = [];
      let calculatedTotal = 0;

      for (const labRecord of labRecords) {
        const alreadySettled = labRecord.labSettlementItems.reduce(
          (sum: number, si: any) => sum + si.amount, 0
        );
        const outstanding = labRecord.labCostSnapshot - alreadySettled;

        if (outstanding > 0) {
          itemsToSettle.push({
            labRecordId: labRecord.id,
            amount: outstanding
          });
          calculatedTotal += outstanding;
        }
      }

      if (itemsToSettle.length === 0) {
        throw new Error('No unpaid lab balance remains for this lab and month.');
      }

      const created = await tx.labSettlement.create({
        data: {
          labId,
          settlementDate: new Date(dateStr + 'T00:00:00Z'),
          periodMonth: payload.periodMonth,
          periodYear: payload.periodYear,
          totalAmount: calculatedTotal,
          notes: payload.notes
        }
      });

      for (const item of itemsToSettle) {
        await tx.labSettlementItem.create({
          data: {
            settlementId: created.id,
            labRecordId: item.labRecordId,
            amount: item.amount
          }
        });
      }

      return created.id;
    }, { timeout: 15000 });

    return prisma.labSettlement.findUnique({
      where: { id: settlementId },
      include: {
        items: {
          include: {
            labRecord: {
              include: {
                opRecord: true,
                finalizedTreatment: { include: { crownType: true } }
              }
            }
          }
        }
      }
    });
  }

  async updateSettlement(id: string, payload: any) {
    // Only allow notes update for now
    const data: any = {};
    if (payload.notes !== undefined) data.notes = payload.notes;

    return prisma.labSettlement.update({
      where: { id },
      data,
      include: {
        items: {
          include: {
            labRecord: {
              include: {
                opRecord: true,
                finalizedTreatment: { include: { crownType: true } }
              }
            }
          }
        }
      }
    });
  }
}

export const apiLabSettlementRepository = new ApiLabSettlementRepository();
