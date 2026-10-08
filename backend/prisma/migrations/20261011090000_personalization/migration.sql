-- Personalization engine: normalized event fields, skill state, recommendations, feedback, predictions, training runs.

ALTER TABLE "LearningEvent" ADD COLUMN "eventType" TEXT, ADD COLUMN "entityType" TEXT, ADD COLUMN "entityId" TEXT;
CREATE INDEX "LearningEvent_userId_eventType_createdAt_idx" ON "LearningEvent"("userId", "eventType", "createdAt");
CREATE INDEX "LearningEvent_entityId_idx" ON "LearningEvent"("entityId");

-- Backfill normalized names for events recorded before this migration (same mapping as the code).
UPDATE "LearningEvent" SET "eventType" = CASE "type"
  WHEN 'topic_started' THEN 'TOPIC_STARTED'
  WHEN 'topic_read' THEN 'TOPIC_COMPLETED'
  WHEN 'mastery_achieved' THEN 'TOPIC_MASTERED'
  WHEN 'quiz_started' THEN 'QUIZ_STARTED'
  WHEN 'quiz_submitted' THEN 'QUIZ_COMPLETED'
  WHEN 'mock_test_started' THEN 'QUIZ_STARTED'
  WHEN 'mock_test_completed' THEN 'QUIZ_COMPLETED'
  WHEN 'review_completed' THEN 'REVISION_COMPLETED'
  WHEN 'review_failed' THEN 'REVISION_COMPLETED'
  WHEN 'build_started' THEN 'BUILD_STARTED'
  WHEN 'build_completed' THEN 'BUILD_COMPLETED'
  WHEN 'build_submitted' THEN 'BUILD_SUBMITTED'
  WHEN 'prompt_used' THEN 'PROMPT_USED'
  WHEN 'interview_practiced' THEN 'QUESTION_ANSWERED'
  WHEN 'prep_practice' THEN 'QUESTION_ANSWERED'
  WHEN 'interview_started' THEN 'INTERVIEW_STARTED'
  WHEN 'interview_completed' THEN 'INTERVIEW_COMPLETED'
  WHEN 'application_added' THEN 'JOB_APPLIED'
  ELSE NULL END,
  "entityType" = CASE WHEN "topicId" IS NOT NULL THEN 'TOPIC' ELSE NULL END,
  "entityId" = "topicId"
WHERE "eventType" IS NULL;

CREATE TABLE "StudentSkillState" (
  "userId" TEXT NOT NULL,
  "conceptId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "mastery" DOUBLE PRECISION NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL,
  "forgettingRisk" DOUBLE PRECISION NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "correctAttempts" INTEGER NOT NULL DEFAULT 0,
  "averageTimeSec" DOUBLE PRECISION,
  "lastSeen" TIMESTAMP(3),
  "nextReview" TIMESTAMP(3),
  "signals" JSONB NOT NULL,
  "modelVersion" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentSkillState_pkey" PRIMARY KEY ("userId", "conceptId")
);
CREATE INDEX "StudentSkillState_userId_mastery_idx" ON "StudentSkillState"("userId", "mastery");
CREATE INDEX "StudentSkillState_conceptId_idx" ON "StudentSkillState"("conceptId");
ALTER TABLE "StudentSkillState" ADD CONSTRAINT "StudentSkillState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Recommendation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "itemType" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "href" TEXT NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  "rank" INTEGER NOT NULL,
  "difficulty" TEXT,
  "priority" TEXT NOT NULL,
  "reasons" TEXT[],
  "features" JSONB NOT NULL,
  "modelName" TEXT NOT NULL,
  "modelVersion" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "outcome" TEXT,
  "shownAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Recommendation_userId_status_rank_idx" ON "Recommendation"("userId", "status", "rank");
CREATE INDEX "Recommendation_itemType_itemId_idx" ON "Recommendation"("itemType", "itemId");
CREATE INDEX "Recommendation_status_expiresAt_idx" ON "Recommendation"("status", "expiresAt");
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "RecommendationFeedback" (
  "id" TEXT NOT NULL,
  "recommendationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'USER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecommendationFeedback_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "RecommendationFeedback_recommendationId_action_idx" ON "RecommendationFeedback"("recommendationId", "action");
CREATE INDEX "RecommendationFeedback_userId_createdAt_idx" ON "RecommendationFeedback"("userId", "createdAt");
ALTER TABLE "RecommendationFeedback" ADD CONSTRAINT "RecommendationFeedback_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "Recommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecommendationFeedback" ADD CONSTRAINT "RecommendationFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "MLPrediction" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "recommendationId" TEXT,
  "modelName" TEXT NOT NULL,
  "modelVersion" TEXT NOT NULL,
  "target" TEXT NOT NULL,
  "prediction" DOUBLE PRECISION NOT NULL,
  "confidence" DOUBLE PRECISION,
  "meta" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MLPrediction_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MLPrediction_userId_createdAt_idx" ON "MLPrediction"("userId", "createdAt");
CREATE INDEX "MLPrediction_modelName_modelVersion_idx" ON "MLPrediction"("modelName", "modelVersion");
ALTER TABLE "MLPrediction" ADD CONSTRAINT "MLPrediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MLPrediction" ADD CONSTRAINT "MLPrediction_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "Recommendation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "MLTrainingRun" (
  "id" TEXT NOT NULL,
  "modelName" TEXT NOT NULL,
  "modelVersion" TEXT,
  "status" TEXT NOT NULL,
  "datasetSize" INTEGER NOT NULL,
  "positives" INTEGER NOT NULL DEFAULT 0,
  "negatives" INTEGER NOT NULL DEFAULT 0,
  "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "metrics" JSONB,
  "library" TEXT,
  "notes" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  CONSTRAINT "MLTrainingRun_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MLTrainingRun_modelName_startedAt_idx" ON "MLTrainingRun"("modelName", "startedAt");
