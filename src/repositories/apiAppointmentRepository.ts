/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '../lib/prisma';

export interface AppointmentPayload {
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  status?: string;
  notes?: string;
}

export class ApiAppointmentRepository {
  async getAppointments(opNumber: string) {
    const op = await prisma.oPRecord.findUnique({
      where: { opNumber },
      include: {
        appointments: {
          include: {
            doctor: true
          },
          orderBy: { appointmentDate: 'asc' }
        }
      }
    });
    if (!op) throw new Error("OP Record not found");
    return op.appointments;
  }

  async getAllAppointments(date?: string) {
    const where: any = { workflowType: 'GENERAL' };
    if (date) {
      let dateStr = date;
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const [d, m, y] = dateStr.split('/');
        dateStr = `${y}-${m}-${d}`;
      }
      where.appointmentDate = new Date(dateStr + 'T00:00:00Z');
    }
    
    return prisma.appointment.findMany({
      where,
      include: {
        doctor: true,
        opRecord: true
      },
      orderBy: [
        { appointmentDate: 'asc' },
        { appointmentTime: 'asc' }
      ]
    });
  }

  async getAppointmentById(id: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: true,
        opRecord: true
      }
    });
    if (!appointment) throw new Error("Appointment not found");
    return appointment;
  }

  async createAppointment(opNumber: string, payload: AppointmentPayload) {
    const op = await prisma.oPRecord.findUnique({ where: { opNumber } });
    if (!op) throw new Error("OP Record not found");

    const doctor = await prisma.doctor.findUnique({ where: { id: payload.doctorId } });
    if (!doctor) throw new Error("Doctor not found");

    if (!payload.appointmentDate || !payload.appointmentTime) {
      throw new Error("Date and time are required for appointment");
    }

    let dateStr = payload.appointmentDate;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [d, m, y] = dateStr.split('/');
      dateStr = `${y}-${m}-${d}`;
    }

    const validStatuses = ['Scheduled', 'Completed', 'Cancelled'];
    const status = payload.status && validStatuses.includes(payload.status) ? payload.status : 'Scheduled';

    return prisma.appointment.create({
      data: {
        opRecordId: op.id,
        doctorId: doctor.id,
        appointmentDate: new Date(dateStr + 'T00:00:00Z'),
        appointmentTime: payload.appointmentTime,
        workflowType: 'GENERAL',
        status,
        notes: payload.notes
      }
    });
  }

  async updateAppointment(id: string, payload: Partial<AppointmentPayload>) {
    const data: any = {};
    if (payload.doctorId) {
      const doctor = await prisma.doctor.findUnique({ where: { id: payload.doctorId } });
      if (!doctor) throw new Error("Doctor not found");
      data.doctorId = payload.doctorId;
    }
    if (payload.appointmentDate) {
      let dateStr = payload.appointmentDate;
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const [d, m, y] = dateStr.split('/');
        dateStr = `${y}-${m}-${d}`;
      }
      data.appointmentDate = new Date(dateStr + 'T00:00:00Z');
    }
    if (payload.appointmentTime) data.appointmentTime = payload.appointmentTime;
    
    if (payload.status) {
      const validStatuses = ['Scheduled', 'Completed', 'Cancelled'];
      if (!validStatuses.includes(payload.status)) {
        throw new Error("Invalid status");
      }
      data.status = payload.status;
    }

    if (payload.notes !== undefined) data.notes = payload.notes;

    return prisma.appointment.update({
      where: { id },
      data
    });
  }
}

export const apiAppointmentRepository = new ApiAppointmentRepository();
