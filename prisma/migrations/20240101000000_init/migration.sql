-- CreateEnum
CREATE TYPE "CollegeType" AS ENUM ('GOVT', 'PRIVATE', 'DEEMED');

-- CreateEnum
CREATE TYPE "CutoffCategory" AS ENUM ('GENERAL', 'OBC', 'SC', 'ST');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "College" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "type" "CollegeType" NOT NULL,
    "streams" TEXT[],
    "nirf_rank" INTEGER,
    "established" INTEGER NOT NULL,
    "accreditation" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "College_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseFee" (
    "id" SERIAL NOT NULL,
    "college_id" INTEGER NOT NULL,
    "course" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "annual_fee" INTEGER NOT NULL,

    CONSTRAINT "CourseFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacementStat" (
    "id" SERIAL NOT NULL,
    "college_id" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "avg_pkg" DOUBLE PRECISION NOT NULL,
    "max_pkg" DOUBLE PRECISION NOT NULL,
    "placement_pct" DOUBLE PRECISION NOT NULL,
    "top_recruiters" TEXT[],

    CONSTRAINT "PlacementStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionCutoff" (
    "id" SERIAL NOT NULL,
    "college_id" INTEGER NOT NULL,
    "exam" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "category" "CutoffCategory" NOT NULL,
    "cutoff_value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "AdmissionCutoff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "college_id" INTEGER NOT NULL,
    "author_name" TEXT NOT NULL,
    "batch_year" INTEGER NOT NULL,
    "stream" TEXT NOT NULL,
    "rating_overall" DOUBLE PRECISION NOT NULL,
    "rating_placement" DOUBLE PRECISION NOT NULL,
    "rating_faculty" DOUBLE PRECISION NOT NULL,
    "rating_infra" DOUBLE PRECISION NOT NULL,
    "body" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "College_name_city_idx" ON "College"("name", "city");

-- CreateIndex
CREATE INDEX "CourseFee_college_id_idx" ON "CourseFee"("college_id");

-- CreateIndex
CREATE INDEX "PlacementStat_college_id_idx" ON "PlacementStat"("college_id");

-- CreateIndex
CREATE INDEX "AdmissionCutoff_college_id_idx" ON "AdmissionCutoff"("college_id");

-- CreateIndex
CREATE INDEX "Review_college_id_idx" ON "Review"("college_id");

-- AddForeignKey
ALTER TABLE "CourseFee" ADD CONSTRAINT "CourseFee_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementStat" ADD CONSTRAINT "PlacementStat_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionCutoff" ADD CONSTRAINT "AdmissionCutoff_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

