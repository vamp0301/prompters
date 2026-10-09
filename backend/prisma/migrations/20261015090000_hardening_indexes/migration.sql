-- CreateIndex
CREATE INDEX "InterviewTurn_answeredAt_idx" ON "InterviewTurn"("answeredAt");

-- CreateIndex
CREATE INDEX "PrepPlan_status_createdAt_idx" ON "PrepPlan"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PrepAttempt_userId_createdAt_idx" ON "PrepAttempt"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PrepPack_status_createdAt_idx" ON "PrepPack"("status", "createdAt");

-- CreateIndex
CREATE INDEX "MLPrediction_userId_target_createdAt_idx" ON "MLPrediction"("userId", "target", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectAnswer_testId_createdAt_idx" ON "ProjectAnswer"("testId", "createdAt");

