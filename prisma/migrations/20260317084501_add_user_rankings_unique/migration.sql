/*
  Warnings:

  - The primary key for the `UserRankings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[user_id,muscle_group]` on the table `UserRankings` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "UserRankings" DROP CONSTRAINT "UserRankings_pkey";

-- CreateIndex
CREATE UNIQUE INDEX "UserRankings_user_id_muscle_group_key" ON "UserRankings"("user_id", "muscle_group");
