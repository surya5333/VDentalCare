import { CompleteOPRecord, PatientOP } from "../types/op";


export const opService = {
  async getOPList(): Promise<CompleteOPRecord[]> {
    const res = await fetch('/api/op');
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  },

  async searchOP(query: string, doctorId?: string, workflowType: 'GENERAL' | 'ORTHO' = 'GENERAL'): Promise<CompleteOPRecord[]> {
    const baseUrl = workflowType === 'ORTHO' ? '/api/ortho/op' : '/api/op';
    const params = new URLSearchParams();
    if (query && query.trim()) params.append('q', query.trim());
    if (doctorId) params.append('doctorId', doctorId);

    const qs = params.toString();
    const url = qs ? `${baseUrl}?${qs}` : baseUrl;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to search");
    return res.json();
  },

  async getOPByNumber(opNumber: string): Promise<CompleteOPRecord | null> {
    const res = await fetch(`/api/op/${opNumber}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Failed to fetch OP");
    return res.json();
  },

  async createOP(payload: Omit<PatientOP, "sectionNo" | "opNumber">): Promise<CompleteOPRecord> {
    const res = await fetch('/api/op', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      throw new Error(errData?.error || "Failed to create OP");
    }
    return res.json();
  },

  async updateOP(opNumber: string, payload: Partial<CompleteOPRecord>): Promise<CompleteOPRecord | null> {
    const res = await fetch(`/api/op/${opNumber}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Failed to update OP");
    return res.json();
  }
};
