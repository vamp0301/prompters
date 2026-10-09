-- AlterTable
ALTER TABLE "Recommendation" ADD COLUMN     "targetProfileId" TEXT;

-- CreateTable
CREATE TABLE "CareerRole" (
    "key" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "specializations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "code" BOOLEAN NOT NULL DEFAULT false,
    "areas" JSONB NOT NULL,
    "rubric" JSONB NOT NULL,
    "assessments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "domain" TEXT,
    "version" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerRole_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "Competency" (
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "assessments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "code" BOOLEAN NOT NULL DEFAULT false,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "version" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Competency_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "RoleCompetency" (
    "roleKey" TEXT NOT NULL,
    "competencyKey" TEXT NOT NULL,
    "importance" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "RoleCompetency_pkey" PRIMARY KEY ("roleKey","competencyKey")
);

-- CreateTable
CREATE TABLE "CompetencyPrerequisite" (
    "competencyKey" TEXT NOT NULL,
    "prerequisiteKey" TEXT NOT NULL,

    CONSTRAINT "CompetencyPrerequisite_pkey" PRIMARY KEY ("competencyKey","prerequisiteKey")
);

-- CreateTable
CREATE TABLE "TargetRoleProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleKey" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "jobId" TEXT,
    "timeline" TIMESTAMP(3),
    "primary" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "taxonomyVersion" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TargetRoleProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CareerRole_family_active_idx" ON "CareerRole"("family", "active");

-- CreateIndex
CREATE INDEX "RoleCompetency_competencyKey_idx" ON "RoleCompetency"("competencyKey");

-- CreateIndex
CREATE INDEX "TargetRoleProfile_userId_status_idx" ON "TargetRoleProfile"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TargetRoleProfile_userId_roleKey_key" ON "TargetRoleProfile"("userId", "roleKey");

-- CreateIndex
CREATE INDEX "Recommendation_userId_targetProfileId_status_idx" ON "Recommendation"("userId", "targetProfileId", "status");

-- AddForeignKey
ALTER TABLE "RoleCompetency" ADD CONSTRAINT "RoleCompetency_roleKey_fkey" FOREIGN KEY ("roleKey") REFERENCES "CareerRole"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleCompetency" ADD CONSTRAINT "RoleCompetency_competencyKey_fkey" FOREIGN KEY ("competencyKey") REFERENCES "Competency"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetencyPrerequisite" ADD CONSTRAINT "CompetencyPrerequisite_competencyKey_fkey" FOREIGN KEY ("competencyKey") REFERENCES "Competency"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetencyPrerequisite" ADD CONSTRAINT "CompetencyPrerequisite_prerequisiteKey_fkey" FOREIGN KEY ("prerequisiteKey") REFERENCES "Competency"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TargetRoleProfile" ADD CONSTRAINT "TargetRoleProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TargetRoleProfile" ADD CONSTRAINT "TargetRoleProfile_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobTarget"("id") ON DELETE SET NULL ON UPDATE CASCADE;

