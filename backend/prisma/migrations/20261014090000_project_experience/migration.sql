-- Project experience intelligence: one interview-prep module per resume project, knowledge tests and answers.
-- CreateTable
CREATE TABLE "ProjectExperience" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "company" TEXT,
    "role" TEXT,
    "evidence" JSONB NOT NULL,
    "facts" JSONB NOT NULL,
    "content" JSONB,
    "contentHash" TEXT,
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectExperience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectTest" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "state" JSONB NOT NULL,
    "result" JSONB,
    "isRetest" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ProjectTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectAnswer" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionKey" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "dimension" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "isFollowUp" BOOLEAN NOT NULL DEFAULT false,
    "answer" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "evaluation" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectExperience_userId_idx" ON "ProjectExperience"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectExperience_resumeId_key_key" ON "ProjectExperience"("resumeId", "key");

-- CreateIndex
CREATE INDEX "ProjectTest_projectId_startedAt_idx" ON "ProjectTest"("projectId", "startedAt");

-- CreateIndex
CREATE INDEX "ProjectTest_userId_startedAt_idx" ON "ProjectTest"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "ProjectAnswer_projectId_createdAt_idx" ON "ProjectAnswer"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectAnswer_userId_skill_idx" ON "ProjectAnswer"("userId", "skill");

-- AddForeignKey
ALTER TABLE "ProjectExperience" ADD CONSTRAINT "ProjectExperience_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectExperience" ADD CONSTRAINT "ProjectExperience_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "CareerResume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTest" ADD CONSTRAINT "ProjectTest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ProjectExperience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTest" ADD CONSTRAINT "ProjectTest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAnswer" ADD CONSTRAINT "ProjectAnswer_testId_fkey" FOREIGN KEY ("testId") REFERENCES "ProjectTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAnswer" ADD CONSTRAINT "ProjectAnswer_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ProjectExperience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAnswer" ADD CONSTRAINT "ProjectAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

