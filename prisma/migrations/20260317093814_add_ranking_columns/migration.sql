-- AlterTable
ALTER TABLE "UserRankings" ADD COLUMN     "estimated_1rm" DOUBLE PRECISION,
ADD COLUMN     "lift_name" TEXT,
ADD COLUMN     "reps" INTEGER,
ADD COLUMN     "weight" DOUBLE PRECISION;
