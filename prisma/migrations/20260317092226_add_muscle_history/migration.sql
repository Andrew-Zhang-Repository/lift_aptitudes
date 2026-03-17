-- CreateTable
CREATE TABLE "UserMuscleHistory" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "muscle_group" TEXT NOT NULL,
    "lift_name" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "reps" INTEGER NOT NULL,
    "estimated_1rm" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserMuscleHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserMuscleHistory_user_id_muscle_group_idx" ON "UserMuscleHistory"("user_id", "muscle_group");
