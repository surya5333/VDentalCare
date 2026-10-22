import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { TREATMENT_CATALOGUE, CROWN_CATALOGUE } from '../src/data/treatmentCatalogue'
import { mockPatientsData } from '../src/data/mockPatients'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Master Data...')

  // 1. Seed Treatments
  for (const treatment of TREATMENT_CATALOGUE) {
    await prisma.treatment.upsert({
      where: { id: treatment.id },
      update: {
        name: treatment.name,
        patientPrice: treatment.patientPrice,
        requiresTeethNotation: treatment.requiresTeethNotation
      },
      create: {
        id: treatment.id,
        name: treatment.name,
        patientPrice: treatment.patientPrice,
        requiresTeethNotation: treatment.requiresTeethNotation
      }
    })
  }

  // 2. Seed Crown Types
  for (const crown of CROWN_CATALOGUE) {
    await prisma.crownType.upsert({
      where: { id: crown.id },
      update: {
        name: crown.name,
        patientPrice: crown.patientPrice,
        labPrice: crown.labPrice
      },
      create: {
        id: crown.id,
        name: crown.name,
        patientPrice: crown.patientPrice,
        labPrice: crown.labPrice
      }
    })
  }

  // 3. Seed References (Minimal)
  const refs = ['Google', 'Friend', 'Walk-in', 'Practo']
  for (const r of refs) {
    const existing = await prisma.reference.findFirst({ where: { name: r } })
    if (!existing) {
      await prisma.reference.create({ data: { name: r } })
    }
  }

  // 4. Seed Doctors (from mock, assuming minimal details)
  const doctors = ['Dr. Anjali', 'Dr. Rahul', 'Dr. Kiran']
  for (const d of doctors) {
    const existing = await prisma.doctor.findFirst({ where: { name: d } })
    if (!existing) {
      await prisma.doctor.create({ data: { name: d } })
    }
  }

  // 4b. Seed Labs
  const labs = ['Smile Lab', 'Dental Arts', 'Precision Dentures']
  for (const lab of labs) {
    const existing = await prisma.lab.findFirst({ where: { name: lab } })
    if (!existing) {
      await prisma.lab.create({ data: { name: lab } })
    }
  }

  if (process.env.NODE_ENV === 'production') {
    console.warn('Skipping default user creation in production.');
  } else {
    console.log('Seeding Users...')
    const defaultPasswordHash = bcrypt.hashSync(process.env.DEFAULT_SEED_PASSWORD || 'password123', 10)

    const roles = ['FRONT_OFFICE', 'CLINIC_HEAD', 'WORKING_DOCTOR', 'MANAGER'] as const
    for (const r of roles) {
      const username = r.toLowerCase().replace('_', '-')
      await prisma.user.upsert({
        where: { username },
        update: {},
        create: {
          username,
          passwordHash: defaultPasswordHash,
          role: r,
        }
      })
    }
  }

  console.log('Seeding Mock OPs...')

  // 5. Seed OP Records
  for (const mockOp of mockPatientsData) {
    const p = mockOp.patient
    // Check if exists
    let opRecord = await prisma.oPRecord.findUnique({ where: { opNumber: p.opNumber } })
    
    if (!opRecord) {
      // Create OP
      const parts = p.date.split('/') // DD/MM/YYYY
      const dateStr = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}T00:00:00Z` : new Date().toISOString()
      
      opRecord = await prisma.oPRecord.create({
        data: {
          opNumber: p.opNumber,
          patientName: p.patientName,
          age: p.age,
          sex: p.sex,
          phone: p.phone,
          date: new Date(dateStr),
          reference: p.reference,
          paidStatus: p.paidStatus,
        }
      })

      // Create Finalized Treatments
      for (const ft of mockOp.treatmentLab.finalizedTreatments || []) {
        await prisma.finalizedTreatment.create({
          data: {
            opRecordId: opRecord.id,
            treatmentId: ft.treatmentId,
            treatmentNameSnapshot: ft.treatmentName,
            patientPriceSnapshot: ft.patientPrice,
            requiresTeethNotation: ft.requiresTeethNotation,
            teethNotation: ft.teethNotation ? JSON.parse(JSON.stringify(ft.teethNotation)) : null,
            crownTypeId: ft.crownType || null,
            numberOfCrowns: ft.numberOfCrowns || null,
          }
        })
      }

      // Create Treatment Plan Images
      for (const img of mockOp.treatmentPlanImages || []) {
        await prisma.treatmentPlanImage.create({
          data: {
            opRecordId: opRecord.id,
            fileUrl: img.url || '/placeholder.png',
            originalFilename: img.filename,
          }
        })
      }

      // Create XRay Images
      for (const xray of mockOp.xrayImages || []) {
        await prisma.xRay.create({
          data: {
            opRecordId: opRecord.id,
            fileUrl: xray.url || '/placeholder.png',
            originalFilename: xray.filename,
          }
        })
      }
    }
  }

  console.log('Seed completed successfully.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
