/*
  Warnings:

  - You are about to drop the column `bodyweight_max` on the `StrengthStandards` table. All the data in the column will be lost.
  - You are about to drop the column `bodyweight_min` on the `StrengthStandards` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[lift_id,gender,bodyweight,experience_level]` on the table `StrengthStandards` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `bodyweight` to the `StrengthStandards` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "StrengthStandards_lift_id_gender_bodyweight_min_key";

-- AlterTable
ALTER TABLE "StrengthStandards" DROP COLUMN "bodyweight_max",
DROP COLUMN "bodyweight_min",
ADD COLUMN     "bodyweight" DOUBLE PRECISION NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "StrengthStandards_lift_id_gender_bodyweight_experience_leve_key" ON "StrengthStandards"("lift_id", "gender", "bodyweight", "experience_level");
