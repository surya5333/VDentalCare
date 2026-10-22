-- CreateTable
CREATE TABLE "DoctorVisit" (
    "id" TEXT NOT NULL,
    "opRecordId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "visitDate" TIMESTAMP(3) NOT NULL,
    "treatmentDone" TEXT,
    "visitTeethNotation" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorVisitImage" (
    "id" TEXT NOT NULL,
    "doctorVisitId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "originalFilename" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" TEXT,

    CONSTRAINT "DoctorVisitImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "opRecordId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "appointmentDate" TIMESTAMP(3) NOT NULL,
    "appointmentTime" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Scheduled',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DoctorVisit_opRecordId_idx" ON "DoctorVisit"("opRecordId");

-- CreateIndex
CREATE INDEX "DoctorVisit_doctorId_idx" ON "DoctorVisit"("doctorId");

-- CreateIndex
CREATE INDEX "DoctorVisit_visitDate_idx" ON "DoctorVisit"("visitDate");

-- CreateIndex
CREATE INDEX "DoctorVisitImage_doctorVisitId_idx" ON "DoctorVisitImage"("doctorVisitId");

-- CreateIndex
CREATE INDEX "Appointment_opRecordId_idx" ON "Appointment"("opRecordId");

-- CreateIndex
CREATE INDEX "Appointment_doctorId_idx" ON "Appointment"("doctorId");

-- CreateIndex
CREATE INDEX "Appointment_appointmentDate_idx" ON "Appointment"("appointmentDate");

-- CreateIndex
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");

-- AddForeignKey
ALTER TABLE "DoctorVisit" ADD CONSTRAINT "DoctorVisit_opRecordId_fkey" FOREIGN KEY ("opRecordId") REFERENCES "OPRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorVisit" ADD CONSTRAINT "DoctorVisit_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorVisitImage" ADD CONSTRAINT "DoctorVisitImage_doctorVisitId_fkey" FOREIGN KEY ("doctorVisitId") REFERENCES "DoctorVisit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_opRecordId_fkey" FOREIGN KEY ("opRecordId") REFERENCES "OPRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
