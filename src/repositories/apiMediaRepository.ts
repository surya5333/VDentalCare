import { prisma } from '@/lib/prisma';

class ApiMediaRepository {
  async getTreatmentPlanImages(opNumber: string) {
    const op = await prisma.oPRecord.findUnique({
      where: { opNumber },
      include: { treatmentPlanImages: true }
    });
    return op?.treatmentPlanImages || [];
  }

  async addTreatmentPlanImage(opNumber: string, payload: { fileUrl: string, originalFilename?: string, fileData?: Buffer, mimeType?: string, uploadedBy?: string }) {
    const op = await prisma.oPRecord.findUnique({ where: { opNumber } });
    if (!op) throw new Error("OP Record not found");

    return prisma.treatmentPlanImage.create({
      data: {
        opRecordId: op.id,
        fileUrl: payload.fileUrl,
        originalFilename: payload.originalFilename,
        fileData: payload.fileData,
        mimeType: payload.mimeType,
        uploadedBy: payload.uploadedBy,
      }
    });
  }

  async setTreatmentPlanImage(opNumber: string, payload: { fileUrl?: string, originalFilename?: string, fileData?: Buffer, mimeType?: string, uploadedBy?: string }) {
    const op = await prisma.oPRecord.findUnique({ where: { opNumber } });
    if (!op) throw new Error("OP Record not found");

    // Remove any previous treatment plan images for this OP to enforce single slot
    await prisma.treatmentPlanImage.deleteMany({
      where: { opRecordId: op.id }
    });

    const newRecord = await prisma.treatmentPlanImage.create({
      data: {
        opRecordId: op.id,
        fileUrl: payload.fileUrl || '',
        originalFilename: payload.originalFilename,
        fileData: payload.fileData,
        mimeType: payload.mimeType,
        uploadedBy: payload.uploadedBy,
      }
    });

    // If fileUrl was empty, generate authoritative media endpoint URL using its id
    if (!payload.fileUrl) {
      const generatedUrl = `/api/media/treatment-plans/${newRecord.id}`;
      return prisma.treatmentPlanImage.update({
        where: { id: newRecord.id },
        data: { fileUrl: generatedUrl }
      });
    }

    return newRecord;
  }

  async getTreatmentPlanImageById(id: string) {
    return prisma.treatmentPlanImage.findUnique({
      where: { id }
    });
  }

  async getXRays(opNumber: string) {
    const op = await prisma.oPRecord.findUnique({
      where: { opNumber },
      include: { xRays: true }
    });
    return op?.xRays || [];
  }

  async addXRay(opNumber: string, payload: { fileUrl: string, originalFilename?: string, fileData?: Buffer, mimeType?: string, uploadedBy?: string }) {
    const op = await prisma.oPRecord.findUnique({ where: { opNumber } });
    if (!op) throw new Error("OP Record not found");

    return prisma.xRay.create({
      data: {
        opRecordId: op.id,
        fileUrl: payload.fileUrl,
        originalFilename: payload.originalFilename,
        fileData: payload.fileData,
        mimeType: payload.mimeType,
        uploadedBy: payload.uploadedBy,
      }
    });
  }

  async setXRay(opNumber: string, payload: { fileUrl?: string, originalFilename?: string, fileData?: Buffer, mimeType?: string, uploadedBy?: string }) {
    const op = await prisma.oPRecord.findUnique({ where: { opNumber } });
    if (!op) throw new Error("OP Record not found");

    // Remove any previous X-rays for this OP to enforce single slot
    await prisma.xRay.deleteMany({
      where: { opRecordId: op.id }
    });

    const newRecord = await prisma.xRay.create({
      data: {
        opRecordId: op.id,
        fileUrl: payload.fileUrl || '',
        originalFilename: payload.originalFilename,
        fileData: payload.fileData,
        mimeType: payload.mimeType,
        uploadedBy: payload.uploadedBy,
      }
    });

    // If fileUrl was empty, generate authoritative media endpoint URL using its id
    if (!payload.fileUrl) {
      const generatedUrl = `/api/media/x-rays/${newRecord.id}`;
      return prisma.xRay.update({
        where: { id: newRecord.id },
        data: { fileUrl: generatedUrl }
      });
    }

    return newRecord;
  }

  async getXRayById(id: string) {
    return prisma.xRay.findUnique({
      where: { id }
    });
  }
}

export const apiMediaRepository = new ApiMediaRepository();
