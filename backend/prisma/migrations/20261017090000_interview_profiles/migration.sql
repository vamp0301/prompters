-- AlterTable
ALTER TABLE "InterviewSession" ADD COLUMN     "targetRoleProfileId" TEXT;

-- CreateIndex
CREATE INDEX "InterviewSession_userId_targetRoleProfileId_startedAt_idx" ON "InterviewSession"("userId", "targetRoleProfileId", "startedAt");

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_targetRoleProfileId_fkey" FOREIGN KEY ("targetRoleProfileId") REFERENCES "TargetRoleProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Backfill (idempotent): link a historical session to a career ONLY when that is unambiguous —
-- the session stored a target role and the SAME user has the profile for exactly that role
-- ((userId, roleKey) is unique). Sessions without a stored role (older job-match interviews) or
-- whose user has no profile for that role stay NULL rather than being guessed.
UPDATE "InterviewSession" s
SET "targetRoleProfileId" = p."id"
FROM "TargetRoleProfile" p
WHERE s."targetRoleProfileId" IS NULL
  AND s."targetRole" IS NOT NULL
  AND p."userId" = s."userId"
  AND p."roleKey" = s."targetRole";
