-- AlterTable
ALTER TABLE "CareerRole" ADD COLUMN     "frameworkVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "reviewNotes" TEXT,
ADD COLUMN     "reviewStatus" TEXT NOT NULL DEFAULT 'UNREVIEWED',
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedBy" TEXT,
ADD COLUMN     "reviewedFrameworkVersion" INTEGER,
ADD COLUMN     "reviewerCredentials" TEXT;

