-- CreateTable
CREATE TABLE "ProjectPipeline" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "error" TEXT,
    "stages" JSONB NOT NULL DEFAULT '[]',
    "progress" JSONB NOT NULL DEFAULT '{}',
    "sourceHash" TEXT NOT NULL DEFAULT '',
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectPipeline_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectPipeline_userId_projectId_key" ON "ProjectPipeline"("userId", "projectId");

-- AddForeignKey
ALTER TABLE "ProjectPipeline" ADD CONSTRAINT "ProjectPipeline_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectPipeline" ADD CONSTRAINT "ProjectPipeline_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
