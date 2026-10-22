/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '@/lib/prisma';

function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  
  // DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split('/');
    return new Date(`${y}-${m}-${d}T00:00:00Z`);
  }
  
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + 'T00:00:00Z');
  }
  
  // Fallback (e.g. ISO string)
  return new Date(dateStr);
}

export class ApiLabRepository {
  async getLabs(includeInactive: boolean = false) {
    return prisma.lab.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { createdAt: 'asc' }
    });
  }

  async getLabById(id: string) {
    return prisma.lab.findUnique({ where: { id } });
  }

  async createLab(data: { name: string }) {
    return prisma.lab.create({ data });
  }

  async updateLab(id: string, data: { name?: string; isActive?: boolean }) {
    return prisma.lab.update({ where: { id }, data });
  }

  async deleteLab(id: string) {
    return prisma.lab.update({ where: { id }, data: { isActive: false } });
  }

  async getLabRecordsByOp(opNumber: string) {
    const op = await prisma.oPRecord.findUnique({
      where: { opNumber },
      include: {
        labRecords: {
          include: {
            lab: true,
            finalizedTreatment: {
              include: {
                treatment: true,
                crownType: true
              }
            },
            labSettlementItems: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!op) throw new Error('OP Record not found');
    return op.labRecords;
  }

  async getLabRecordById(id: string) {
    const record = await prisma.labRecord.findUnique({
      where: { id },
      include: {
        lab: true,
        opRecord: true,
        finalizedTreatment: {
          include: {
            treatment: true,
            crownType: true
          }
        },
        labSettlementItems: {
          include: { settlement: true }
        }
      }
    });
    if (!record) throw new Error('Lab Record not found');
    return record;
  }

  async createLabRecord(opNumber: string, payload: { finalizedTreatmentId: string; labId: string }) {
    const op = await prisma.oPRecord.findUnique({ where: { opNumber } });
    if (!op) throw new Error('OP Record not found');

    const ft = await prisma.finalizedTreatment.findUnique({
      where: { id: payload.finalizedTreatmentId },
      include: { treatment: true, crownType: true }
    });
    if (!ft) throw new Error('Finalized Treatment not found');
    if (ft.opRecordId !== op.id) throw new Error('Finalized Treatment does not belong to this OP');
    if (ft.treatment.name !== 'Crowns') throw new Error('Lab Records can only be created for Crown treatments');
    if (!ft.crownType) throw new Error('Finalized Treatment has no Crown Type');
    if (!ft.numberOfCrowns || ft.numberOfCrowns <= 0 || !Number.isInteger(ft.numberOfCrowns)) {
      throw new Error('Finalized Treatment has invalid Number of Crowns');
    }

    const lab = await prisma.lab.findUnique({ where: { id: payload.labId } });
    if (!lab) throw new Error('Lab not found');
    if (!lab.isActive) throw new Error('Lab is not active');

    // Backend derives lab price from current CrownType.labPrice
    const labPriceSnapshot = ft.crownType.labPrice;
    const labCostSnapshot = labPriceSnapshot * ft.numberOfCrowns;

    return prisma.labRecord.create({
      data: {
        opRecordId: op.id,
        finalizedTreatmentId: ft.id,
        labId: lab.id,
        labPriceSnapshot,
        labCostSnapshot
      },
      include: {
        lab: true,
        finalizedTreatment: {
          include: { treatment: true, crownType: true }
        },
        opRecord: true
      }
    });
  }

  async updateLabRecord(id: string, payload: any) {
    // Only allow workflow date fields and remarks
    const allowedFields = [
      'parcelSentDate', 'targetReceiveDate', 'm1ReceivedDate',
      'bisqueReceivedDate', 'glazeReceivedFirstDate', 'glazeReceivedSecondDate',
      'warrantyCardReceivedDate', 'warrantyCardGivenDate', 'remarks', 'labId'
    ];

    const forbiddenFields = [
      'labPriceSnapshot', 'labCostSnapshot', 'finalizedTreatmentId',
      'crownType', 'numberOfCrowns', 'patientPrice', 'patientPriceSnapshot',
      'treatmentId', 'opRecordId'
    ];

    for (const field of forbiddenFields) {
      if (payload[field] !== undefined) {
        throw new Error(`Cannot modify historical financial data (${field}) through Lab Record PATCH`);
      }
    }

    const data: any = {};
    for (const field of allowedFields) {
      if (payload[field] !== undefined) {
        if (field === 'remarks') {
          data[field] = payload[field];
        } else if (field === 'labId') {
          const lab = await prisma.lab.findUnique({ where: { id: payload[field] } });
          if (!lab) throw new Error('Lab not found');
          if (!lab.isActive) throw new Error('Lab is not active');
          data.labId = lab.id;
        } else {
          // Date fields - parse them, allow null to clear
          data[field] = payload[field] === null ? null : parseDate(payload[field]);
        }
      }
    }

    return prisma.labRecord.update({
      where: { id },
      data,
      include: {
        lab: true,
        finalizedTreatment: {
          include: { treatment: true, crownType: true }
        },
        opRecord: true
      }
    });
  }

  /**
   * Get lab records filtered by labId, and optionally by month/year.
   */
  async getLabRecordsByLab(labId: string, month?: number, year?: number) {
    const where: any = { labId };
    if (month && year) {
      const start = new Date(Date.UTC(year, month - 1, 1));
      const end = new Date(Date.UTC(year, month, 1));
      where.createdAt = { gte: start, lt: end };
    }

    return prisma.labRecord.findMany({
      where,
      include: {
        opRecord: {
          select: {
            id: true,
            opNumber: true,
            patientName: true,
            egEhsGen: true,
            phone: true,
          }
        },
        finalizedTreatment: {
          select: {
            id: true,
            numberOfCrowns: true,
            treatmentNameSnapshot: true,
            patientPriceSnapshot: true,
            treatment: {
              select: {
                id: true,
                name: true,
              }
            },
            crownType: {
              select: {
                id: true,
                name: true,
                patientPrice: true,
                labPrice: true,
              }
            }
          }
        },
        labSettlementItems: {
          select: {
            id: true,
            settlementId: true,
            amount: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getAllLabRecords(labId?: string, month?: number, year?: number) {
    const where: any = {};
    if (labId) {
      where.labId = labId;
    }
    if (month && year) {
      const start = new Date(Date.UTC(year, month - 1, 1));
      const end = new Date(Date.UTC(year, month, 1));
      where.createdAt = { gte: start, lt: end };
    }

    return prisma.labRecord.findMany({
      where,
      include: {
        lab: {
          select: {
            id: true,
            name: true,
            isActive: true,
          }
        },
        opRecord: {
          select: {
            id: true,
            opNumber: true,
            patientName: true,
            egEhsGen: true,
            phone: true,
          }
        },
        finalizedTreatment: {
          select: {
            id: true,
            numberOfCrowns: true,
            treatmentNameSnapshot: true,
            patientPriceSnapshot: true,
            treatment: {
              select: {
                id: true,
                name: true,
              }
            },
            crownType: {
              select: {
                id: true,
                name: true,
                patientPrice: true,
                labPrice: true,
              }
            }
          }
        },
        labSettlementItems: {
          select: {
            id: true,
            settlementId: true,
            amount: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get lab dashboard summary (Total Cost, Paid, Due) for a specific lab.
   */
  async getLabSummary(labId: string) {
    const records = await prisma.labRecord.findMany({
      where: { labId },
      include: { labSettlementItems: true }
    });

    let totalCost = 0;
    let totalPaid = 0;

    for (const r of records) {
      totalCost += r.labCostSnapshot;
      for (const item of r.labSettlementItems) {
        totalPaid += item.amount;
      }
    }

    return {
      totalCost,
      totalPaid,
      totalDue: totalCost - totalPaid
    };
  }
}

export const apiLabRepository = new ApiLabRepository();
