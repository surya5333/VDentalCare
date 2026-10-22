import { Treatment, CrownType } from "../types/op";

let treatmentsPromise: Promise<Treatment[]> | null = null;
let crownTypesPromise: Promise<CrownType[]> | null = null;

export const catalogueService = {
  async getTreatments(): Promise<Treatment[]> {
    if (!treatmentsPromise) {
      treatmentsPromise = fetch('/api/treatments')
        .then(async (res) => {
          if (!res.ok) throw new Error("Failed to fetch treatments");
          return res.json();
        })
        .finally(() => {
          setTimeout(() => { treatmentsPromise = null; }, 5000);
        });
    }
    return treatmentsPromise;
  },

  async getCrownTypes(): Promise<CrownType[]> {
    if (!crownTypesPromise) {
      crownTypesPromise = fetch('/api/crown-types')
        .then(async (res) => {
          if (!res.ok) throw new Error("Failed to fetch crown types");
          return res.json();
        })
        .finally(() => {
          setTimeout(() => { crownTypesPromise = null; }, 5000);
        });
    }
    return crownTypesPromise;
  }
};
