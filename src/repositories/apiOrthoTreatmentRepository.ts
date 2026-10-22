import { prisma } from '@/lib/prisma';

export const apiOrthoTreatmentRepository = {
  getByOpId: async (opRecordId: string) => {
    return prisma.orthoTreatment.findMany({
      where: { opRecordId },
      orderBy: { createdAt: 'asc' },
    });
  },

  create: async (data: {
    opRecordId: string;
    treatmentName: string;
    treatmentCode: string;
    amount: number;
  }) => {
    return prisma.orthoTreatment.create({
      data,
    });
  },

  delete: async (id: string) => {
    return prisma.orthoTreatment.delete({
      where: { id },
    });
  },

  update: async (id: string, data: {
    treatmentName?: string;
    treatmentCode?: string;
    amount?: number;
  }) => {
    return prisma.orthoTreatment.update({
      where: { id },
      data,
    });
  }
};
