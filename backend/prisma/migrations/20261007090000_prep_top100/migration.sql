-- CreateEnum
CREATE TYPE "ResumeChunkType" AS ENUM ('SUMMARY', 'EXPERIENCE', 'PROJECT', 'SKILL', 'ACHIEVEMENT', 'EDUCATION', 'CERTIFICATION', 'OTHER');

-- CreateEnum
CREATE TYPE "PrepPlanStatus" AS ENUM ('QUEUED', 'RUNNING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "PrepCategory" AS ENUM ('GENERAL', 'SKILL', 'PROJECT', 'CLAIM', 'ACHIEVEMENT', 'CONCEPTUAL', 'SCENARIO');

-- CreateEnum
CREATE TYPE "PrepPriority" AS ENUM ('INTENSE', 'IMPORTANT', 'GOOD', 'MAY_BE_ASKED');

-- AlterTable
ALTER TABLE "CareerResume" ADD COLUMN     "analyzedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ResumeChunk" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "ResumeChunkType" NOT NULL,
    "section" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "technologies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "meta" JSONB,
    "risk" TEXT NOT NULL DEFAULT 'MEDIUM',

    CONSTRAINT "ResumeChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeClaim" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "chunkId" TEXT,
    "claim" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "confidence" TEXT NOT NULL,
    "risk" TEXT NOT NULL,
    "depth" INTEGER NOT NULL DEFAULT 3,

    CONSTRAINT "ResumeClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrepPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "jobId" TEXT,
    "targetRole" TEXT,
    "title" TEXT NOT NULL,
    "status" "PrepPlanStatus" NOT NULL DEFAULT 'QUEUED',
    "progress" JSONB NOT NULL,
    "allocation" JSONB NOT NULL,
    "validation" JSONB,
    "error" TEXT,
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "PrepPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrepQuestion" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "category" "PrepCategory" NOT NULL,
    "priority" "PrepPriority" NOT NULL,
    "question" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "probability" DOUBLE PRECISION NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "followUpDepth" INTEGER NOT NULL,
    "why" TEXT NOT NULL,
    "evidence" TEXT NOT NULL DEFAULT '',
    "sourceType" TEXT NOT NULL,
    "sourceLabel" TEXT NOT NULL,
    "chunkId" TEXT,
    "claimId" TEXT,
    "hint" TEXT NOT NULL,
    "keyPoints" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "followUps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "translations" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrepQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrepAttempt" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "evaluation" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrepAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrepPack" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "status" "PrepPlanStatus" NOT NULL DEFAULT 'QUEUED',
    "storageKey" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "PrepPack_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResumeChunk_resumeId_order_idx" ON "ResumeChunk"("resumeId", "order");

-- CreateIndex
CREATE INDEX "ResumeClaim_resumeId_idx" ON "ResumeClaim"("resumeId");

-- CreateIndex
CREATE INDEX "PrepPlan_userId_createdAt_idx" ON "PrepPlan"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PrepQuestion_planId_rank_idx" ON "PrepQuestion"("planId", "rank");

-- CreateIndex
CREATE INDEX "PrepQuestion_planId_category_idx" ON "PrepQuestion"("planId", "category");

-- CreateIndex
CREATE INDEX "PrepAttempt_questionId_createdAt_idx" ON "PrepAttempt"("questionId", "createdAt");

-- CreateIndex
CREATE INDEX "PrepPack_planId_createdAt_idx" ON "PrepPack"("planId", "createdAt");

-- AddForeignKey
ALTER TABLE "ResumeChunk" ADD CONSTRAINT "ResumeChunk_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "CareerResume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeClaim" ADD CONSTRAINT "ResumeClaim_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "CareerResume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeClaim" ADD CONSTRAINT "ResumeClaim_chunkId_fkey" FOREIGN KEY ("chunkId") REFERENCES "ResumeChunk"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrepPlan" ADD CONSTRAINT "PrepPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrepPlan" ADD CONSTRAINT "PrepPlan_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "CareerResume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrepPlan" ADD CONSTRAINT "PrepPlan_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobTarget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrepQuestion" ADD CONSTRAINT "PrepQuestion_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PrepPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrepAttempt" ADD CONSTRAINT "PrepAttempt_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "PrepQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrepAttempt" ADD CONSTRAINT "PrepAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrepPack" ADD CONSTRAINT "PrepPack_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PrepPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrepPack" ADD CONSTRAINT "PrepPack_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

