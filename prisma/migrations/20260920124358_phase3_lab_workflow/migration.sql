-- CreateTable
CREATE TABLE "Lab" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabRecord" (
    "id" TEXT NOT NULL,
    "opRecordId" TEXT NOT NULL,
    "finalizedTreatmentId" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "labPriceSnapshot" INTEGER NOT NULL,
    "labCostSnapshot" INTEGER NOT NULL,
    "parcelSentDate" TIMESTAMP(3),
    "targetReceiveDate" TIMESTAMP(3),
    "m1ReceivedDate" TIMESTAMP(3),
    "bisqueReceivedDate" TIMESTAMP(3),
    "glazeReceivedFirstDate" TIMESTAMP(3),
    "glazeReceivedSecondDate" TIMESTAMP(3),
    "warrantyCardReceivedDate" TIMESTAMP(3),
    "warrantyCardGivenDate" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabSettlement" (
    "id" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "settlementDate" TIMESTAMP(3) NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabSettlementItem" (
    "id" TEXT NOT NULL,
    "settlementId" TEXT NOT NULL,
    "labRecordId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabSettlementItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LabRecord_opRecordId_idx" ON "LabRecord"("opRecordId");

-- CreateIndex
CREATE INDEX "LabRecord_finalizedTreatmentId_idx" ON "LabRecord"("finalizedTreatmentId");

-- CreateIndex
CREATE INDEX "LabRecord_labId_idx" ON "LabRecord"("labId");

-- CreateIndex
CREATE INDEX "LabRecord_createdAt_idx" ON "LabRecord"("createdAt");

-- CreateIndex
CREATE INDEX "LabSettlement_labId_idx" ON "LabSettlement"("labId");

-- CreateIndex
CREATE INDEX "LabSettlement_settlementDate_idx" ON "LabSettlement"("settlementDate");

-- CreateIndex
CREATE INDEX "LabSettlement_periodMonth_periodYear_idx" ON "LabSettlement"("periodMonth", "periodYear");

-- CreateIndex
CREATE INDEX "LabSettlementItem_settlementId_idx" ON "LabSettlementItem"("settlementId");

-- CreateIndex
CREATE INDEX "LabSettlementItem_labRecordId_idx" ON "LabSettlementItem"("labRecordId");

-- AddForeignKey
ALTER TABLE "LabRecord" ADD CONSTRAINT "LabRecord_opRecordId_fkey" FOREIGN KEY ("opRecordId") REFERENCES "OPRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabRecord" ADD CONSTRAINT "LabRecord_finalizedTreatmentId_fkey" FOREIGN KEY ("finalizedTreatmentId") REFERENCES "FinalizedTreatment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabRecord" ADD CONSTRAINT "LabRecord_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabSettlement" ADD CONSTRAINT "LabSettlement_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabSettlementItem" ADD CONSTRAINT "LabSettlementItem_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "LabSettlement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabSettlementItem" ADD CONSTRAINT "LabSettlementItem_labRecordId_fkey" FOREIGN KEY ("labRecordId") REFERENCES "LabRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
