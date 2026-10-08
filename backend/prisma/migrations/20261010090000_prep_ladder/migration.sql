-- Difficulty ladder: questions are published stage by stage (Basics → Core → Advanced).
ALTER TABLE "PrepPlan" ADD COLUMN "band" TEXT;
ALTER TABLE "PrepQuestion" ADD COLUMN "stage" INTEGER NOT NULL DEFAULT 0;
