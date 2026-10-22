export interface LedgerTransaction {
  id: string;
  date: string;
  opRecordId: string;
  treatmentCost: number;
  paidAmount: number;
  paymentMode: string;
  discount: number;
  balance: number;
  isRegistrationFee?: boolean;
  description?: string | null;
  finalizedTreatmentId?: string | null;
  finalizedTreatment?: {
    treatment: { name: string };
    crownType?: { name: string };
  };
}
