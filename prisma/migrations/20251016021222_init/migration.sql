-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('TO_BE_STARTED', 'IN_PROGRESS', 'DONE');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'TO_BE_STARTED',
    "tags" TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);
