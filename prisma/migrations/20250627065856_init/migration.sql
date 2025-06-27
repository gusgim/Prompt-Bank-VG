/*
  Warnings:

  - The primary key for the `prompts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `prompts` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `A` on the `_PromptTags` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "_PromptTags" DROP CONSTRAINT "_PromptTags_A_fkey";

-- AlterTable
ALTER TABLE "_PromptTags" DROP COLUMN "A",
ADD COLUMN     "A" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "prompts" DROP CONSTRAINT "prompts_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "prompts_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "notices" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "isImportant" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "notices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notices_isActive_idx" ON "notices"("isActive");

-- CreateIndex
CREATE INDEX "notices_category_idx" ON "notices"("category");

-- CreateIndex
CREATE INDEX "notices_isImportant_idx" ON "notices"("isImportant");

-- CreateIndex
CREATE INDEX "notices_order_idx" ON "notices"("order");

-- CreateIndex
CREATE INDEX "notices_createdAt_idx" ON "notices"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "_PromptTags_AB_unique" ON "_PromptTags"("A", "B");

-- AddForeignKey
ALTER TABLE "notices" ADD CONSTRAINT "notices_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PromptTags" ADD CONSTRAINT "_PromptTags_A_fkey" FOREIGN KEY ("A") REFERENCES "prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
