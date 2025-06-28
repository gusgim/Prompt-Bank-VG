/*
  Warnings:

  - The primary key for the `prompts` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "_PromptTags" DROP CONSTRAINT "_PromptTags_A_fkey";

-- AlterTable
ALTER TABLE "_PromptTags" ALTER COLUMN "A" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "prompts" DROP CONSTRAINT "prompts_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "prompts_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "prompts_id_seq";

-- AddForeignKey
ALTER TABLE "_PromptTags" ADD CONSTRAINT "_PromptTags_A_fkey" FOREIGN KEY ("A") REFERENCES "prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
