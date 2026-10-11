-- CreateTable
CREATE TABLE "ContentEmbedding" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "section" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "dimensions" INTEGER NOT NULL,
    "vector" DOUBLE PRECISION[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentEmbedding_model_idx" ON "ContentEmbedding"("model");

-- CreateIndex
CREATE UNIQUE INDEX "ContentEmbedding_topicId_section_model_key" ON "ContentEmbedding"("topicId", "section", "model");

-- AddForeignKey
ALTER TABLE "ContentEmbedding" ADD CONSTRAINT "ContentEmbedding_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
