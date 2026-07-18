-- CreateEnum
CREATE TYPE "NumberStatus" AS ENUM ('ACTIVE', 'DISPUTED', 'DELISTED');

-- CreateEnum
CREATE TYPE "CommentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FLAGGED');

-- CreateEnum
CREATE TYPE "VoteType" AS ENUM ('SCAM', 'SAFE');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "PhoneNumber" (
    "id" TEXT NOT NULL,
    "e164" TEXT NOT NULL,
    "nationalFormat" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "telco" TEXT,
    "scamVotes" INTEGER NOT NULL DEFAULT 0,
    "safeVotes" INTEGER NOT NULL DEFAULT 0,
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "status" "NumberStatus" NOT NULL DEFAULT 'ACTIVE',
    "seedSource" TEXT,
    "firstReportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhoneNumber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameFil" TEXT,
    "blurb" TEXT,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "phoneNumberId" TEXT NOT NULL,
    "categoryId" TEXT,
    "body" TEXT NOT NULL,
    "displayName" TEXT NOT NULL DEFAULT 'Anonymous',
    "ipHash" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "status" "CommentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "phoneNumberId" TEXT NOT NULL,
    "type" "VoteType" NOT NULL,
    "ipHash" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisputeRequest" (
    "id" TEXT NOT NULL,
    "phoneNumberId" TEXT NOT NULL,
    "claimantName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "DisputeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelcoPrefix" (
    "prefix" TEXT NOT NULL,
    "telco" TEXT NOT NULL,

    CONSTRAINT "TelcoPrefix_pkey" PRIMARY KEY ("prefix")
);

-- CreateIndex
CREATE UNIQUE INDEX "PhoneNumber_e164_key" ON "PhoneNumber"("e164");

-- CreateIndex
CREATE INDEX "PhoneNumber_prefix_idx" ON "PhoneNumber"("prefix");

-- CreateIndex
CREATE INDEX "PhoneNumber_telco_idx" ON "PhoneNumber"("telco");

-- CreateIndex
CREATE INDEX "PhoneNumber_lastActivityAt_idx" ON "PhoneNumber"("lastActivityAt");

-- CreateIndex
CREATE INDEX "PhoneNumber_scamVotes_idx" ON "PhoneNumber"("scamVotes");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Comment_phoneNumberId_status_idx" ON "Comment"("phoneNumberId", "status");

-- CreateIndex
CREATE INDEX "Comment_status_createdAt_idx" ON "Comment"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_fingerprint_idx" ON "Comment"("fingerprint");

-- CreateIndex
CREATE INDEX "Vote_ipHash_createdAt_idx" ON "Vote"("ipHash", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_phoneNumberId_fingerprint_key" ON "Vote"("phoneNumberId", "fingerprint");

-- CreateIndex
CREATE INDEX "DisputeRequest_status_idx" ON "DisputeRequest"("status");

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_phoneNumberId_fkey" FOREIGN KEY ("phoneNumberId") REFERENCES "PhoneNumber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_phoneNumberId_fkey" FOREIGN KEY ("phoneNumberId") REFERENCES "PhoneNumber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeRequest" ADD CONSTRAINT "DisputeRequest_phoneNumberId_fkey" FOREIGN KEY ("phoneNumberId") REFERENCES "PhoneNumber"("id") ON DELETE CASCADE ON UPDATE CASCADE;
