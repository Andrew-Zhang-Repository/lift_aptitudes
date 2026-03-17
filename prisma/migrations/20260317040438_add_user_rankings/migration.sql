-- CreateTable
CREATE TABLE "UserRankings" (
    "user_id" TEXT NOT NULL,
    "muscle_group" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "percentile" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserRankings_pkey" PRIMARY KEY ("user_id","muscle_group")
);
