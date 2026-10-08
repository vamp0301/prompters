-- CreateTable
CREATE TABLE "SkillMap" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillConcept" (
    "id" TEXT NOT NULL,
    "skillKey" TEXT NOT NULL,
    "conceptKey" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillConcept_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConceptProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillKey" TEXT NOT NULL,
    "conceptKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'LEARNING',
    "explainScore" INTEGER,
    "explainAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastExplainedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConceptProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SkillMap_key_key" ON "SkillMap"("key");

-- CreateIndex
CREATE UNIQUE INDEX "SkillConcept_skillKey_conceptKey_locale_key" ON "SkillConcept"("skillKey", "conceptKey", "locale");

-- CreateIndex
CREATE INDEX "ConceptProgress_userId_skillKey_idx" ON "ConceptProgress"("userId", "skillKey");

-- CreateIndex
CREATE UNIQUE INDEX "ConceptProgress_userId_skillKey_conceptKey_key" ON "ConceptProgress"("userId", "skillKey", "conceptKey");

-- AddForeignKey
ALTER TABLE "ConceptProgress" ADD CONSTRAINT "ConceptProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

