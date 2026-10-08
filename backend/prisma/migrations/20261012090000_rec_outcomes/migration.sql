-- Richer recommendation outcomes (started / abandoned / no improvement / not acted on), measured improvement, rollout arm.
ALTER TABLE "Recommendation" ADD COLUMN "outcomeDetail" TEXT, ADD COLUMN "improvement" DOUBLE PRECISION, ADD COLUMN "startedAt" TIMESTAMP(3), ADD COLUMN "arm" TEXT;
CREATE INDEX "Recommendation_arm_outcomeDetail_idx" ON "Recommendation"("arm", "outcomeDetail");
