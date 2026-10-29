-- CreateTable
CREATE TABLE "CircleMember" (
    "id" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'applied',
    "island" TEXT NOT NULL DEFAULT 'Grand Bahama',
    "serviceAreas" TEXT[],
    "trades" TEXT[],
    "businessAddress" TEXT,
    "yearsInBusiness" INTEGER,
    "statusReason" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CircleMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractorDocument" (
    "id" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "blobPathname" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractorDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CircleJob" (
    "id" TEXT NOT NULL,
    "postedByUserId" TEXT NOT NULL,
    "posterType" TEXT NOT NULL DEFAULT 'admin',
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "trades" TEXT[],
    "island" TEXT NOT NULL DEFAULT 'Grand Bahama',
    "settlement" TEXT,
    "budgetRange" TEXT,
    "siteVisit" BOOLEAN NOT NULL DEFAULT false,
    "bidDeadline" TIMESTAMP(3),
    "targetStart" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "awardedEstimateId" TEXT,
    "attachments" JSONB,
    "clientContact" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CircleJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CircleEstimate" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "vatIncluded" BOOLEAN NOT NULL DEFAULT false,
    "timelineDays" INTEGER,
    "availableFrom" TIMESTAMP(3),
    "scopeNotes" TEXT,
    "attachmentPathname" TEXT,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CircleEstimate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CircleAuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CircleAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CircleMember_contractorId_key" ON "CircleMember"("contractorId");

-- CreateIndex
CREATE UNIQUE INDEX "CircleMember_userId_key" ON "CircleMember"("userId");

-- CreateIndex
CREATE INDEX "CircleMember_status_idx" ON "CircleMember"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ContractorDocument_blobPathname_key" ON "ContractorDocument"("blobPathname");

-- CreateIndex
CREATE INDEX "ContractorDocument_contractorId_status_idx" ON "ContractorDocument"("contractorId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CircleJob_awardedEstimateId_key" ON "CircleJob"("awardedEstimateId");

-- CreateIndex
CREATE INDEX "CircleJob_status_island_idx" ON "CircleJob"("status", "island");

-- CreateIndex
CREATE INDEX "CircleEstimate_contractorId_idx" ON "CircleEstimate"("contractorId");

-- CreateIndex
CREATE UNIQUE INDEX "CircleEstimate_jobId_contractorId_key" ON "CircleEstimate"("jobId", "contractorId");

-- CreateIndex
CREATE INDEX "CircleAuditLog_entityType_entityId_idx" ON "CircleAuditLog"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "CircleMember" ADD CONSTRAINT "CircleMember_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractorDocument" ADD CONSTRAINT "ContractorDocument_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircleEstimate" ADD CONSTRAINT "CircleEstimate_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "CircleJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircleEstimate" ADD CONSTRAINT "CircleEstimate_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

