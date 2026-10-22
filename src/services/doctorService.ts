import { Appointment, CrownTypeOption } from "../types/doctor";
import { VisitCaseSheet } from "../types/op";
import { catalogueService } from "./catalogueService";

export const doctorService = {
  getDoctors: async () => {
    const res = await fetch('/api/doctors');
    if (!res.ok) throw new Error("Failed to fetch doctors");
    return res.json();
  },
  
  getCrownTypes: async (): Promise<CrownTypeOption[]> => {
    return catalogueService.getCrownTypes() as unknown as Promise<CrownTypeOption[]>;
  },
  
  getLabs: async () => {
    const res = await fetch('/api/labs');
    if (!res.ok) throw new Error("Failed to fetch labs");
    return res.json();
  },
  
  getAppointmentsByOP: async (opNumber: string) => {
    const res = await fetch(`/api/op/${opNumber}/appointments`);
    if (!res.ok) throw new Error("Failed to fetch appointments");
    return res.json();
  },
  
  createAppointment: async (app: Partial<Appointment>) => {
    const res = await fetch(`/api/op/${app.opNumber}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctorId: app.doctorId,
        appointmentDate: app.date,
        appointmentTime: app.time,
        status: app.status
      })
    });
    if (!res.ok) throw new Error("Failed to create appointment");
    return res.json();
  },
  
  updateAppointment: async (opNumber: string, id: string, updates: Partial<Appointment>) => {
    const res = await fetch(`/api/op/${opNumber}/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctorId: updates.doctorId,
        appointmentDate: updates.date,
        appointmentTime: updates.time,
        status: updates.status
      })
    });
    if (!res.ok) throw new Error("Failed to update appointment");
    return res.json();
  },
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  checkAvailability: async (_doctorId?: string, _date?: string, _time?: string) => {
    // Mock availability for UI satisfaction since no endpoint for this was requested in Phase 2
    return true; 
  },
  
  saveVisitToOP: async (opNumber: string, visitId: string, visitData: Partial<VisitCaseSheet>) => {
    const isNew = visitId.startsWith('visit-'); // Front-end generated temporary ID
    
    const payload = {
      doctorId: visitData.doctorId,
      visitDate: visitData.date,
      treatmentDone: visitData.treatmentDone
    };

    let savedVisit;
    if (isNew) {
      const res = await fetch(`/api/op/${opNumber}/doctor-visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to create visit");
      savedVisit = await res.json();
    } else {
      const res = await fetch(`/api/op/${opNumber}/doctor-visits/${visitId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to update visit");
      savedVisit = await res.json();
    }

    // Save images metadata if there are any new ones (that don't have real IDs yet)
    if (visitData.images && visitData.images.length > 0) {
      for (const img of visitData.images) {
        if (img.id.startsWith('img-') || !img.id) {
          await fetch(`/api/op/${opNumber}/doctor-visits/${savedVisit.id}/images`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileUrl: img.url,
              originalFilename: img.filename
            })
          });
        }
      }
    }
  }
};
