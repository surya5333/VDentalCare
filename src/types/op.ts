
export interface OPImage {
  id: string;
  url: string;
  filename: string;
  uploadedAt: string;
}

export interface PatientOP {
  sectionNo: string;
  opNumber: string;
  patientName: string;
  age: number;
  sex: "Male" | "Female" | "Others";
  phone: string;
  date: string;
  reference: string;
  paidStatus: "Paid" | "Free";
  workflowType?: "GENERAL" | "ORTHO";
  registrationFee?: number;
  paymentMode?: string;
}

export interface Treatment {
  id: string;
  name: string;
  rate: number;
  patientPrice?: number;
  requiresTeethNotation?: boolean;
}

export interface CrownType {
  id: string;
  name: string;
  rate: number;
  patientPrice?: number;
  labPrice?: number;
}

export interface MedicalHistory {
  diabetes: boolean;
  hypertension: boolean;
  other?: string;
}

export interface TeethNotation {
  q1: number[];
  q2: number[];
  q3: number[];
  q4: number[];
}

export interface FinalizedTreatment {
  treatmentId: string;
  treatmentName: string;
  patientPrice: number;
  requiresTeethNotation: boolean;
  teethNotation: TeethNotation | null;
  crownType?: string;
  numberOfCrowns?: number;
  quantity?: number;
  egEhsGen?: "E+G" | "EHS" | "GEN" | "";
}

export interface TreatmentLabInfo {
  treatmentPlan?: string[];
  finalizedTreatments?: FinalizedTreatment[];
  egEhsGen: "E+G" | "EHS" | "GEN" | "";
  crownType: string;
  numberOfCrowns: number | null;
  lab: string;
  treatmentPlanCost: string;
  totalCrownCost: string;
  totalAmount: string;
  finalDiscount: string;
  netAmount: string;
}

export interface VisitCaseSheet {
  visitId: string;
  date: string;
  doctorId?: string;
  treatmentDone?: string;
  nextAppointmentId?: string;
  images: OPImage[];
}

export interface OrthoFinancials {
  totalAmount: number;
  discount: number;
}

export interface CompleteOPRecord {
  patient: PatientOP;
  medicalHistory?: MedicalHistory;
  chiefComplaint?: string;
  treatmentLab: TreatmentLabInfo;
  treatmentPlanImages: OPImage[];
  xrayImages: OPImage[];
  caseSheets: VisitCaseSheet[];
  orthoFinancials?: OrthoFinancials;
}

