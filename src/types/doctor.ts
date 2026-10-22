export interface Doctor {
  id: string;
  name: string;
  specialty?: string;
}

export interface DoctorAvailability {
  doctorId: string;
  date: string; // DD/MM/YYYY
  bookedTimes: string[]; // e.g., ["10:00 AM", "02:30 PM"]
}

export interface VisitTeethNotation {
  q1: string;
  q2: string;
  q3: string;
  q4: string;
}

export interface Appointment {
  id: string;
  opNumber: string;
  doctorId: string;
  date: string; // DD/MM/YYYY
  time: string; // e.g., "10:00 AM"
  status: "Scheduled" | "Completed" | "Cancelled";
}

export interface CrownTypeOption {
  id: string;
  name: string;
  patientPrice: number;
  labPrice: number;
}

export interface LabOption {
  id: string;
  name: string;
}
