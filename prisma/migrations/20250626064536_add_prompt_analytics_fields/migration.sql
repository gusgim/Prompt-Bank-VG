-- AlterTable
ALTER TABLE "prompts" ADD COLUMN     "copyCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastCopied" TIMESTAMP(3),
ADD COLUMN     "lastViewed" TIMESTAMP(3),
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "prompts_viewCount_idx" ON "prompts"("viewCount");

-- CreateIndex
CREATE INDEX "prompts_copyCount_idx" ON "prompts"("copyCount");

-- CreateIndex
CREATE INDEX "prompts_lastViewed_idx" ON "prompts"("lastViewed");
