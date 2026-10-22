/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '../lib/prisma';

export interface DoctorVisitPayload {
  doctorId: string;
  visitDate: string;
  treatmentDone?: string;
  visitTeethNotation?: any;
}

export class ApiDoctorVisitRepository {
  async getVisits(opNumber: string) {
    const op = await prisma.oPRecord.findUnique({
      where: { opNumber },
      include: {
        doctorVisits: {
          include: {
            doctor: true,
            images: true
          },
          orderBy: { visitDate: 'desc' }
        }
      }
    });
    if (!op) throw new Error("OP Record not found");
    return op.doctorVisits;
  }

  async getVisitById(id: string) {
    const visit = await prisma.doctorVisit.findUnique({
      where: { id },
      include: {
        doctor: true,
        images: true,
        opRecord: {
          include: {
            finalizedTreatments: {
              include: {
                treatment: true,
                crownType: true
              }
            }
          }
        }
      }
    });
    if (!visit) throw new Error("Doctor Visit not found");
    return visit;
  }

  private validateTeethNotation(notation: any) {
    if (!notation) return null;
    if (typeof notation !== 'object') throw new Error("Teeth notation must be an object");
    
    const qs = ['q1', 'q2', 'q3', 'q4'];
    const valid: any = {};
    for (const q of qs) {
      if (notation[q]) {
        if (!Array.isArray(notation[q])) throw new Error(`Teeth notation ${q} must be an array`);
        const teeth = [...new Set(notation[q].map(Number))];
        for (const t of teeth) {
          if (!Number.isInteger(t) || t < 1 || t > 8) {
            throw new Error(`Invalid tooth number ${t} in ${q}. Must be integer between 1 and 8.`);
          }
        }
        valid[q] = teeth;
      } else {
        valid[q] = [];
      }
    }
    return valid;
  }

  async createVisit(opNumber: string, payload: DoctorVisitPayload) {
    const op = await prisma.oPRecord.findUnique({ where: { opNumber } });
    if (!op) throw new Error("OP Record not found");

    const doctor = await prisma.doctor.findUnique({ where: { id: payload.doctorId } });
    if (!doctor) throw new Error("Doctor not found");

    const validatedTeeth = this.validateTeethNotation(payload.visitTeethNotation);

    let dateStr = payload.visitDate;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [d, m, y] = dateStr.split('/');
      dateStr = `${y}-${m}-${d}`;
    }

    return prisma.doctorVisit.create({
      data: {
        opRecordId: op.id,
        doctorId: doctor.id,
        visitDate: new Date(dateStr + 'T00:00:00Z'),
        treatmentDone: payload.treatmentDone,
        visitTeethNotation: validatedTeeth || undefined
      }
    });
  }

  async updateVisit(id: string, payload: Partial<DoctorVisitPayload>) {
    const data: any = {};
    if (payload.doctorId) {
      const doctor = await prisma.doctor.findUnique({ where: { id: payload.doctorId } });
      if (!doctor) throw new Error("Doctor not found");
      data.doctorId = payload.doctorId;
    }
    if (payload.visitDate) {
      let dateStr = payload.visitDate;
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const [d, m, y] = dateStr.split('/');
        dateStr = `${y}-${m}-${d}`;
      }
      data.visitDate = new Date(dateStr + 'T00:00:00Z');
    }
    if (payload.treatmentDone !== undefined) data.treatmentDone = payload.treatmentDone;
    if (payload.visitTeethNotation !== undefined) {
      data.visitTeethNotation = this.validateTeethNotation(payload.visitTeethNotation) || undefined;
    }

    return prisma.doctorVisit.update({
      where: { id },
      data
    });
  }

  async getImages(visitId: string) {
    return prisma.doctorVisitImage.findMany({
      where: { doctorVisitId: visitId },
      orderBy: { uploadedAt: 'desc' }
    });
  }

  async addImage(opNumber: string, visitId: string, payload: { fileUrl?: string, originalFilename?: string, fileData?: Buffer, mimeType?: string, uploadedBy?: string }) {
    // Validate OP belongs to this Visit
    const op = await prisma.oPRecord.findUnique({ where: { opNumber } });
    if (!op) throw new Error("OP Record not found");

    const visit = await prisma.doctorVisit.findUnique({ where: { id: visitId } });
    if (!visit) throw new Error("Doctor Visit not found");

    if (visit.opRecordId !== op.id) {
      throw new Error("Doctor Visit does not belong to this OP Record");
    }

    const newRecord = await prisma.doctorVisitImage.create({
      data: {
        doctorVisitId: visit.id,
        fileUrl: payload.fileUrl || '',
        originalFilename: payload.originalFilename,
        fileData: payload.fileData,
        mimeType: payload.mimeType,
        uploadedBy: payload.uploadedBy,
      }
    });

    if (!payload.fileUrl) {
      const generatedUrl = `/api/media/doctor-visits/${newRecord.id}`;
      return prisma.doctorVisitImage.update({
        where: { id: newRecord.id },
        data: { fileUrl: generatedUrl }
      });
    }

    return newRecord;
  }

  async getImageById(id: string) {
    return prisma.doctorVisitImage.findUnique({
      where: { id }
    });
  }
}

export const apiDoctorVisitRepository = new ApiDoctorVisitRepository();
