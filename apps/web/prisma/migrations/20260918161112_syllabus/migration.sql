-- CreateTable
CREATE TABLE "SyllabusUnit" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "gradeLevel" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "periodsPlanned" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyllabusUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyllabusProgress" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "doneOn" TEXT,
    "byMembershipId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyllabusProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonPlan" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "teacherMembershipId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "unitId" TEXT,
    "dateKey" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "homework" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SyllabusUnit_schoolId_gradeLevel_subject_position_idx" ON "SyllabusUnit"("schoolId", "gradeLevel", "subject", "position");

-- CreateIndex
CREATE INDEX "SyllabusProgress_schoolId_classId_idx" ON "SyllabusProgress"("schoolId", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "SyllabusProgress_classId_unitId_key" ON "SyllabusProgress"("classId", "unitId");

-- CreateIndex
CREATE INDEX "LessonPlan_schoolId_classId_subject_dateKey_idx" ON "LessonPlan"("schoolId", "classId", "subject", "dateKey");

-- CreateIndex
CREATE INDEX "LessonPlan_teacherMembershipId_dateKey_idx" ON "LessonPlan"("teacherMembershipId", "dateKey");

-- AddForeignKey
ALTER TABLE "SyllabusUnit" ADD CONSTRAINT "SyllabusUnit_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyllabusProgress" ADD CONSTRAINT "SyllabusProgress_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyllabusProgress" ADD CONSTRAINT "SyllabusProgress_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyllabusProgress" ADD CONSTRAINT "SyllabusProgress_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "SyllabusUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyllabusProgress" ADD CONSTRAINT "SyllabusProgress_byMembershipId_fkey" FOREIGN KEY ("byMembershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPlan" ADD CONSTRAINT "LessonPlan_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPlan" ADD CONSTRAINT "LessonPlan_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPlan" ADD CONSTRAINT "LessonPlan_teacherMembershipId_fkey" FOREIGN KEY ("teacherMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPlan" ADD CONSTRAINT "LessonPlan_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "SyllabusUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
