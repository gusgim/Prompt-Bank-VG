/*
  Warnings:

  - A unique constraint covering the columns `[shareId]` on the table `prompts` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "prompts" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shareId" TEXT,
ADD COLUMN     "sharedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "prompts_shareId_key" ON "prompts"("shareId");

-- CreateIndex
CREATE INDEX "prompts_shareId_idx" ON "prompts"("shareId");

-- CreateIndex
CREATE INDEX "prompts_isPublic_idx" ON "prompts"("isPublic");
