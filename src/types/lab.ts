export interface Lab {
  id: string;
  name: string;
  isActive: boolean;
}

export interface FinalizedTreatmentInfo {
  id: string;
  treatment: {
    id: string;
    name: string;
  };
  crownType?: {
    id: string;
    name: string;
  };
  numberOfCrowns?: number;
  patientPriceSnapshot: number;
  egEhsGen?: string | null;
}

export interface LabRecord {
  id: string;
  opRecordId: string;
  finalizedTreatmentId: string;
  labId: string;
  labPriceSnapshot: number;
  labCostSnapshot: number;
  parcelSentDate?: string | null;
  targetReceiveDate?: string | null;
  m1ReceivedDate?: string | null;
  bisqueReceivedDate?: string | null;
  glazeReceivedFirstDate?: string | null;
  glazeReceivedSecondDate?: string | null;
  warrantyCardReceivedDate?: string | null;
  warrantyCardGivenDate?: string | null;
  remarks?: string | null;
  
  lab?: Lab;
  opRecord?: {
    id: string;
    opNumber: string;
    patientName: string;
    egEhsGen?: string | null;
  };
  finalizedTreatment?: FinalizedTreatmentInfo;
}
