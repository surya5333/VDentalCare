-- CreateTable
CREATE TABLE "OPRecord" (
    "id" TEXT NOT NULL,
    "opNumber" TEXT NOT NULL,
    "patientName" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "sex" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "reference" TEXT,
    "paidStatus" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OPRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Treatment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "patientPrice" INTEGER,
    "requiresTeethNotation" BOOLEAN NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Treatment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrownType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "patientPrice" INTEGER NOT NULL,
    "labPrice" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrownType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reference" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Doctor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Doctor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinalizedTreatment" (
    "id" TEXT NOT NULL,
    "opRecordId" TEXT NOT NULL,
    "treatmentId" TEXT NOT NULL,
    "treatmentNameSnapshot" TEXT NOT NULL,
    "patientPriceSnapshot" INTEGER,
    "requiresTeethNotation" BOOLEAN NOT NULL,
    "teethNotation" JSONB,
    "crownTypeId" TEXT,
    "numberOfCrowns" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinalizedTreatment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreatmentPlanImage" (
    "id" TEXT NOT NULL,
    "opRecordId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "originalFilename" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" TEXT,

    CONSTRAINT "TreatmentPlanImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XRay" (
    "id" TEXT NOT NULL,
    "opRecordId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "originalFilename" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" TEXT,

    CONSTRAINT "XRay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OPRecord_opNumber_key" ON "OPRecord"("opNumber");

-- CreateIndex
CREATE INDEX "OPRecord_opNumber_idx" ON "OPRecord"("opNumber");

-- CreateIndex
CREATE INDEX "OPRecord_phone_idx" ON "OPRecord"("phone");

-- CreateIndex
CREATE INDEX "FinalizedTreatment_opRecordId_idx" ON "FinalizedTreatment"("opRecordId");

-- CreateIndex
CREATE INDEX "FinalizedTreatment_treatmentId_idx" ON "FinalizedTreatment"("treatmentId");

-- CreateIndex
CREATE INDEX "FinalizedTreatment_crownTypeId_idx" ON "FinalizedTreatment"("crownTypeId");

-- CreateIndex
CREATE INDEX "TreatmentPlanImage_opRecordId_idx" ON "TreatmentPlanImage"("opRecordId");

-- CreateIndex
CREATE INDEX "XRay_opRecordId_idx" ON "XRay"("opRecordId");

-- AddForeignKey
ALTER TABLE "FinalizedTreatment" ADD CONSTRAINT "FinalizedTreatment_opRecordId_fkey" FOREIGN KEY ("opRecordId") REFERENCES "OPRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinalizedTreatment" ADD CONSTRAINT "FinalizedTreatment_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "Treatment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinalizedTreatment" ADD CONSTRAINT "FinalizedTreatment_crownTypeId_fkey" FOREIGN KEY ("crownTypeId") REFERENCES "CrownType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentPlanImage" ADD CONSTRAINT "TreatmentPlanImage_opRecordId_fkey" FOREIGN KEY ("opRecordId") REFERENCES "OPRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XRay" ADD CONSTRAINT "XRay_opRecordId_fkey" FOREIGN KEY ("opRecordId") REFERENCES "OPRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
