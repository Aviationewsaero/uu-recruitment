-- CreateEnum
CREATE TYPE "InternStatus" AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'INACTIVE', 'COMPLETED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "InternshipDepartment" AS ENUM ('DIGITAL_MARKETING', 'MBA_HR', 'OTHER');

-- CreateEnum
CREATE TYPE "InternAttendanceMethod" AS ENUM ('CHECK_IN', 'AUTO', 'ADMIN');

-- CreateTable
CREATE TABLE "Intern" (
    "id" UUID NOT NULL,
    "internId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dateOfBirth" DATE,
    "gender" "Gender" NOT NULL,
    "bloodGroup" TEXT,
    "profilePhotoUrl" TEXT,
    "personalEmail" TEXT NOT NULL,
    "collegeEmail" TEXT,
    "phone" TEXT NOT NULL,
    "alternatePhone" TEXT,
    "parentContact" TEXT,
    "currentAddress" TEXT,
    "permanentAddress" TEXT,
    "universityName" TEXT NOT NULL DEFAULT 'Uttaranchal University',
    "department" "InternshipDepartment" NOT NULL,
    "enrollmentNumber" TEXT,
    "batchYear" INTEGER,
    "currentSemester" TEXT,
    "expectedGraduation" TEXT,
    "universityMentor" TEXT,
    "class10Board" TEXT,
    "class10Year" INTEGER,
    "class10Percent" DECIMAL(5,2),
    "class12Board" TEXT,
    "class12Stream" TEXT,
    "class12Year" INTEGER,
    "class12Percent" DECIMAL(5,2),
    "ugCourse" TEXT,
    "ugUniversity" TEXT,
    "currentCgpa" DECIMAL(4,2),
    "resumeUrl" TEXT,
    "aadhaarLast4" TEXT,
    "panNumber" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactRelation" TEXT,
    "emergencyContactPhone" TEXT,
    "skillsAssessment" JSONB,
    "passwordHash" TEXT NOT NULL,
    "emailVerifiedAt" TIMESTAMP(3),
    "status" "InternStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "assignedMentor" TEXT,
    "assignedProject" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Intern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternshipPeriod" (
    "id" UUID NOT NULL,
    "internId" UUID NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "durationWeeks" INTEGER NOT NULL DEFAULT 8,
    "stipendPerMonth" DECIMAL(10,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternshipPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternOtp" (
    "id" UUID NOT NULL,
    "internId" UUID NOT NULL,
    "codeHash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternOtp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyMaterial" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "audienceDepartments" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "uploadedBy" UUID,
    "totalSlides" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyMaterialSlide" (
    "id" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "slideNumber" INTEGER NOT NULL,
    "imagePath" TEXT NOT NULL,
    "imageWidth" INTEGER,
    "imageHeight" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyMaterialSlide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternProgress" (
    "id" UUID NOT NULL,
    "internId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "lastSlide" INTEGER NOT NULL DEFAULT 1,
    "slidesViewed" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternNotepad" (
    "id" UUID NOT NULL,
    "internId" UUID NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "versions" JSONB,
    "charCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternNotepad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternViewLog" (
    "id" UUID NOT NULL,
    "internId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "slideNumber" INTEGER NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternViewLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternAttendance" (
    "id" UUID NOT NULL,
    "internId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" "InternAttendanceMethod" NOT NULL DEFAULT 'CHECK_IN',
    "ipAddress" TEXT,
    "notes" TEXT,

    CONSTRAINT "InternAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Intern_internId_key" ON "Intern"("internId");

-- CreateIndex
CREATE UNIQUE INDEX "Intern_personalEmail_key" ON "Intern"("personalEmail");

-- CreateIndex
CREATE UNIQUE INDEX "Intern_enrollmentNumber_key" ON "Intern"("enrollmentNumber");

-- CreateIndex
CREATE INDEX "Intern_status_idx" ON "Intern"("status");

-- CreateIndex
CREATE INDEX "Intern_department_idx" ON "Intern"("department");

-- CreateIndex
CREATE INDEX "Intern_createdAt_idx" ON "Intern"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "InternshipPeriod_internId_key" ON "InternshipPeriod"("internId");

-- CreateIndex
CREATE INDEX "InternshipPeriod_endDate_idx" ON "InternshipPeriod"("endDate");

-- CreateIndex
CREATE INDEX "InternOtp_internId_purpose_idx" ON "InternOtp"("internId", "purpose");

-- CreateIndex
CREATE INDEX "InternOtp_expiresAt_idx" ON "InternOtp"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "StudyMaterial_slug_key" ON "StudyMaterial"("slug");

-- CreateIndex
CREATE INDEX "StudyMaterial_isActive_idx" ON "StudyMaterial"("isActive");

-- CreateIndex
CREATE INDEX "StudyMaterial_displayOrder_idx" ON "StudyMaterial"("displayOrder");

-- CreateIndex
CREATE INDEX "StudyMaterialSlide_materialId_idx" ON "StudyMaterialSlide"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "StudyMaterialSlide_materialId_slideNumber_key" ON "StudyMaterialSlide"("materialId", "slideNumber");

-- CreateIndex
CREATE INDEX "InternProgress_internId_idx" ON "InternProgress"("internId");

-- CreateIndex
CREATE UNIQUE INDEX "InternProgress_internId_materialId_key" ON "InternProgress"("internId", "materialId");

-- CreateIndex
CREATE UNIQUE INDEX "InternNotepad_internId_key" ON "InternNotepad"("internId");

-- CreateIndex
CREATE INDEX "InternViewLog_internId_materialId_idx" ON "InternViewLog"("internId", "materialId");

-- CreateIndex
CREATE INDEX "InternViewLog_viewedAt_idx" ON "InternViewLog"("viewedAt");

-- CreateIndex
CREATE INDEX "InternAttendance_internId_idx" ON "InternAttendance"("internId");

-- CreateIndex
CREATE INDEX "InternAttendance_date_idx" ON "InternAttendance"("date");

-- CreateIndex
CREATE UNIQUE INDEX "InternAttendance_internId_date_key" ON "InternAttendance"("internId", "date");

-- AddForeignKey
ALTER TABLE "InternshipPeriod" ADD CONSTRAINT "InternshipPeriod_internId_fkey" FOREIGN KEY ("internId") REFERENCES "Intern"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternOtp" ADD CONSTRAINT "InternOtp_internId_fkey" FOREIGN KEY ("internId") REFERENCES "Intern"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyMaterialSlide" ADD CONSTRAINT "StudyMaterialSlide_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "StudyMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternProgress" ADD CONSTRAINT "InternProgress_internId_fkey" FOREIGN KEY ("internId") REFERENCES "Intern"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternProgress" ADD CONSTRAINT "InternProgress_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "StudyMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternNotepad" ADD CONSTRAINT "InternNotepad_internId_fkey" FOREIGN KEY ("internId") REFERENCES "Intern"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternViewLog" ADD CONSTRAINT "InternViewLog_internId_fkey" FOREIGN KEY ("internId") REFERENCES "Intern"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternViewLog" ADD CONSTRAINT "InternViewLog_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "StudyMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternAttendance" ADD CONSTRAINT "InternAttendance_internId_fkey" FOREIGN KEY ("internId") REFERENCES "Intern"("id") ON DELETE CASCADE ON UPDATE CASCADE;
