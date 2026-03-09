/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Lifts` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Lifts_name_key" ON "Lifts"("name");
