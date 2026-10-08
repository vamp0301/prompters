-- AlterEnum
ALTER TYPE "InterviewStatus" ADD VALUE 'PAUSED';

-- AlterTable
ALTER TABLE "InterviewSession" ADD COLUMN     "aiCalls" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "bank" JSONB,
ADD COLUMN     "blueprint" JSONB,
ADD COLUMN     "difficulty" TEXT NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "focusAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "pausedAt" TIMESTAMP(3),
ADD COLUMN     "pausedMs" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "resumeId" TEXT,
ADD COLUMN     "targetRole" TEXT,
ALTER COLUMN "matchId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "InterviewTurn" ADD COLUMN     "area" TEXT,
ADD COLUMN     "claimId" TEXT,
ADD COLUMN     "excluded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "submittedAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "CareerResume"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Backfill: interviews based on an analysis belong to that analysis's resume.
UPDATE "InterviewSession" s SET "resumeId" = m."resumeId" FROM "JobMatch" m WHERE s."matchId" = m."id" AND s."resumeId" IS NULL;

-- CreateIndex
CREATE INDEX "InterviewSession_resumeId_idx" ON "InterviewSession"("resumeId");
