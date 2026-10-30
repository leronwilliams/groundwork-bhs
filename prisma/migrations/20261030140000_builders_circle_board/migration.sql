-- CreateTable
CREATE TABLE "BoardPost" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "source" TEXT,
    "location" TEXT NOT NULL DEFAULT 'Grand Bahama',
    "closeDate" TIMESTAMP(3),
    "link" TEXT,
    "sourceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "digestSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardDigestOptOut" (
    "memberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoardDigestOptOut_pkey" PRIMARY KEY ("memberId")
);

-- CreateIndex
CREATE UNIQUE INDEX "BoardPost_sourceId_key" ON "BoardPost"("sourceId");

-- CreateIndex
CREATE INDEX "BoardPost_status_publishedAt_idx" ON "BoardPost"("status", "publishedAt");
