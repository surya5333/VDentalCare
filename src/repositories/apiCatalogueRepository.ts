import { prisma } from '../lib/prisma';

class ApiCatalogueRepository {
  async getTreatments(includeInactive: boolean = false) {
    return prisma.treatment.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { createdAt: 'asc' }
    });
  }

  async getCrownTypes(includeInactive: boolean = false) {
    return prisma.crownType.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { createdAt: 'asc' }
    });
  }

  async getReferences(includeInactive: boolean = false) {
    return prisma.reference.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { createdAt: 'asc' }
    });
  }

  async getDoctors(includeInactive: boolean = false) {
    return prisma.doctor.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { createdAt: 'asc' }
    });
  }

  // Treatments
  async createTreatment(data: { name: string; patientPrice: number | null; requiresTeethNotation: boolean }) {
    return prisma.treatment.create({ data });
  }
  async updateTreatment(id: string, data: { name?: string; patientPrice?: number | null; requiresTeethNotation?: boolean; isActive?: boolean }) {
    return prisma.treatment.update({ where: { id }, data });
  }
  async deleteTreatment(id: string) {
    return prisma.treatment.update({ where: { id }, data: { isActive: false } });
  }

  // Crown Types
  async createCrownType(data: { name: string; patientPrice: number; labPrice: number }) {
    return prisma.crownType.create({ data });
  }
  async updateCrownType(id: string, data: { name?: string; patientPrice?: number; labPrice?: number; isActive?: boolean }) {
    return prisma.crownType.update({ where: { id }, data });
  }
  async deleteCrownType(id: string) {
    return prisma.crownType.update({ where: { id }, data: { isActive: false } });
  }

  // References
  async createReference(data: { name: string }) {
    return prisma.reference.create({ data });
  }
  async updateReference(id: string, data: { name?: string; isActive?: boolean }) {
    return prisma.reference.update({ where: { id }, data });
  }
  async deleteReference(id: string) {
    return prisma.reference.update({ where: { id }, data: { isActive: false } });
  }

  // Doctors
  async createDoctor(data: { name: string }) {
    return prisma.doctor.create({ data });
  }
  async updateDoctor(id: string, data: { name?: string; isActive?: boolean }) {
    return prisma.doctor.update({ where: { id }, data });
  }
  async deleteDoctor(id: string) {
    return prisma.doctor.update({ where: { id }, data: { isActive: false } });
  }
}

export const apiCatalogueRepository = new ApiCatalogueRepository();
