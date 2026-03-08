-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "WeightUnit" AS ENUM ('POUNDS', 'KILOGRAMS');

-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('BEGINNER', 'NOVICE', 'INTERMEDIATE', 'ADVANCED', 'ELITE');

-- CreateTable
CREATE TABLE "UserProfiles" (
    "user_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "bodyweight" DOUBLE PRECISION NOT NULL,
    "bodyweight_unit" "WeightUnit" NOT NULL,
    "experience_level" "ExperienceLevel" NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserProfiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Lifts" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "muscle_group" TEXT NOT NULL,
    "secondary_muscles" TEXT[],
    "description" TEXT NOT NULL,
    "is_compound" BOOLEAN NOT NULL,

    CONSTRAINT "Lifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrengthStandards" (
    "id" SERIAL NOT NULL,
    "lift_id" INTEGER NOT NULL,
    "gender" "Gender" NOT NULL,
    "bodyweight_min" DOUBLE PRECISION NOT NULL,
    "bodyweight_max" DOUBLE PRECISION NOT NULL,
    "experience_level" "ExperienceLevel" NOT NULL,
    "standard" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "StrengthStandards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLiftEntries" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "lift_id" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "reps" INTEGER NOT NULL,
    "estimated_1rm" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserLiftEntries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfiles_display_name_key" ON "UserProfiles"("display_name");

-- CreateIndex
CREATE UNIQUE INDEX "StrengthStandards_lift_id_gender_bodyweight_min_key" ON "StrengthStandards"("lift_id", "gender", "bodyweight_min");

-- AddForeignKey
ALTER TABLE "StrengthStandards" ADD CONSTRAINT "StrengthStandards_lift_id_fkey" FOREIGN KEY ("lift_id") REFERENCES "Lifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLiftEntries" ADD CONSTRAINT "UserLiftEntries_lift_id_fkey" FOREIGN KEY ("lift_id") REFERENCES "Lifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
