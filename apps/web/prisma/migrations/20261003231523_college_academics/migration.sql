-- The college's academics (module ACADEMICS, roles FACULTY and HOD; 4 October 2026): 28 tenant-scoped tables. Generated with prisma migrate diff against the schema as it stood before this module, so no other builder's tables are in it.
-- CreateTable
CREATE TABLE "AcademicsSettings" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "loadMinHours" INTEGER NOT NULL DEFAULT 14,
    "loadMaxHours" INTEGER NOT NULL DEFAULT 18,
    "studentsPerFaculty" INTEGER NOT NULL DEFAULT 20,
    "menteesPerMentor" INTEGER NOT NULL DEFAULT 20,
    "updatedByUserId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicsSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hodMembershipId" TEXT,
    "condoneFloorPercent" INTEGER NOT NULL DEFAULT 65,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepartmentFaculty" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,

    CONSTRAINT "DepartmentFaculty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Programme" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "durationYears" INTEGER NOT NULL,
    "intake" INTEGER NOT NULL DEFAULT 0,
    "regulator" TEXT NOT NULL,
    "attendanceThreshold" INTEGER NOT NULL DEFAULT 75,
    "exitPoints" TEXT NOT NULL DEFAULT '[]',
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Programme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgrammeOutcome" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "ProgrammeOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scheme" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "effectiveYear" INTEGER NOT NULL,
    "gradingTable" TEXT NOT NULL DEFAULT '[]',
    "passingRules" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Scheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "semester" INTEGER NOT NULL,
    "creditsL" INTEGER NOT NULL DEFAULT 0,
    "creditsT" INTEGER NOT NULL DEFAULT 0,
    "creditsP" INTEGER NOT NULL DEFAULT 0,
    "kind" TEXT NOT NULL DEFAULT 'CORE',
    "outcomes" TEXT NOT NULL DEFAULT '[]',

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseOutcomeMap" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "coCode" TEXT NOT NULL,
    "poCode" TEXT NOT NULL,
    "level" INTEGER NOT NULL,

    CONSTRAINT "CourseOutcomeMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicTerm" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "startsOn" TEXT NOT NULL,
    "endsOn" TEXT NOT NULL,
    "registrationOpensOn" TEXT NOT NULL,
    "registrationClosesOn" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademicTerm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'CLASSROOM',

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Division" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "yearOfStudy" INTEGER NOT NULL,
    "academicYear" TEXT NOT NULL,

    CONSTRAINT "Division_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProgramme" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "entryYear" INTEGER NOT NULL,
    "yearOfStudy" INTEGER NOT NULL DEFAULT 1,
    "semester" INTEGER NOT NULL DEFAULT 1,
    "divisionId" TEXT,
    "prn" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentProgramme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseOffering" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "divisionId" TEXT,
    "facultyMembershipId" TEXT,
    "lectureHours" INTEGER NOT NULL DEFAULT 0,
    "tutorialHours" INTEGER NOT NULL DEFAULT 0,
    "practicalHours" INTEGER NOT NULL DEFAULT 0,
    "roomId" TEXT,
    "capacity" INTEGER,

    CONSTRAINT "CourseOffering_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferingSlot" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "offeringId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "periodId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'LECTURE',
    "roomId" TEXT,

    CONSTRAINT "OfferingSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseRegistration" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "offeringId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REGISTERED',
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "byUserId" TEXT,
    "late" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CourseRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LateRegistration" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "openUntil" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ASKED',
    "askedByUserId" TEXT NOT NULL,
    "askedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedByUserId" TEXT,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "LateRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lecture" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "offeringId" TEXT NOT NULL,
    "slotId" TEXT,
    "dateKey" TEXT NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'LECTURE',
    "roomId" TEXT,
    "substituteMembershipId" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lecture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LectureAttendance" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "lectureId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "markedByMembershipId" TEXT NOT NULL,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT,

    CONSTRAINT "LectureAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceCondonation" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "offeringId" TEXT,
    "ground" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "documentFileId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ASKED',
    "hodDecidedByUserId" TEXT,
    "hodDecidedAt" TIMESTAMP(3),
    "decidedByUserId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decisionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceCondonation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DefaulterNotice" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "offeringId" TEXT NOT NULL,
    "percentTenths" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DefaulterNotice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalComponent" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "offeringId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "maxMarks" INTEGER NOT NULL,
    "weight" INTEGER NOT NULL,
    "coCodes" TEXT NOT NULL DEFAULT '[]',
    "position" INTEGER NOT NULL DEFAULT 0,
    "moderatedByUserId" TEXT,
    "moderatedAt" TIMESTAMP(3),
    "releasedByUserId" TEXT,
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternalComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalMark" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "marksTenths" INTEGER,
    "enteredByUserId" TEXT NOT NULL,
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "moderatedByUserId" TEXT,
    "moderatedAt" TIMESTAMP(3),

    CONSTRAINT "InternalMark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalLock" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "offeringId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "outOf" INTEGER NOT NULL,
    "totalsJson" TEXT NOT NULL DEFAULT '[]',
    "lockedByUserId" TEXT NOT NULL,
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternalLock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseFile" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "offeringId" TEXT NOT NULL,
    "planJson" TEXT NOT NULL DEFAULT '[]',
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseFileItem" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "courseFileId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileId" TEXT,
    "url" TEXT,
    "coCodes" TEXT NOT NULL DEFAULT '[]',
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseFileItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentoringGroup" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "facultyMembershipId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MentoringGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentoringMember" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,

    CONSTRAINT "MentoringMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentoringNote" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "flag" TEXT NOT NULL DEFAULT 'NONE',
    "authorUserId" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MentoringNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AcademicsSettings_schoolId_key" ON "AcademicsSettings"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_schoolId_code_key" ON "Department"("schoolId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "DepartmentFaculty_membershipId_key" ON "DepartmentFaculty"("membershipId");

-- CreateIndex
CREATE INDEX "DepartmentFaculty_schoolId_departmentId_idx" ON "DepartmentFaculty"("schoolId", "departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Programme_schoolId_code_key" ON "Programme"("schoolId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "ProgrammeOutcome_programmeId_code_key" ON "ProgrammeOutcome"("programmeId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Scheme_programmeId_name_key" ON "Scheme"("programmeId", "name");

-- CreateIndex
CREATE INDEX "Course_schoolId_semester_idx" ON "Course"("schoolId", "semester");

-- CreateIndex
CREATE UNIQUE INDEX "Course_schemeId_code_key" ON "Course"("schemeId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "CourseOutcomeMap_courseId_coCode_poCode_key" ON "CourseOutcomeMap"("courseId", "coCode", "poCode");

-- CreateIndex
CREATE INDEX "AcademicTerm_schoolId_startsOn_idx" ON "AcademicTerm"("schoolId", "startsOn");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicTerm_schoolId_name_key" ON "AcademicTerm"("schoolId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Room_schoolId_name_key" ON "Room"("schoolId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Division_classId_key" ON "Division"("classId");

-- CreateIndex
CREATE INDEX "Division_schoolId_programmeId_idx" ON "Division"("schoolId", "programmeId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProgramme_studentMembershipId_key" ON "StudentProgramme"("studentMembershipId");

-- CreateIndex
CREATE INDEX "StudentProgramme_schoolId_programmeId_idx" ON "StudentProgramme"("schoolId", "programmeId");

-- CreateIndex
CREATE INDEX "CourseOffering_schoolId_termId_idx" ON "CourseOffering"("schoolId", "termId");

-- CreateIndex
CREATE INDEX "CourseOffering_facultyMembershipId_idx" ON "CourseOffering"("facultyMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseOffering_termId_courseId_divisionId_key" ON "CourseOffering"("termId", "courseId", "divisionId");

-- CreateIndex
CREATE INDEX "OfferingSlot_schoolId_weekday_periodId_idx" ON "OfferingSlot"("schoolId", "weekday", "periodId");

-- CreateIndex
CREATE UNIQUE INDEX "OfferingSlot_offeringId_weekday_periodId_key" ON "OfferingSlot"("offeringId", "weekday", "periodId");

-- CreateIndex
CREATE INDEX "CourseRegistration_schoolId_termId_studentMembershipId_idx" ON "CourseRegistration"("schoolId", "termId", "studentMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseRegistration_offeringId_studentMembershipId_key" ON "CourseRegistration"("offeringId", "studentMembershipId");

-- CreateIndex
CREATE INDEX "LateRegistration_schoolId_termId_studentMembershipId_idx" ON "LateRegistration"("schoolId", "termId", "studentMembershipId");

-- CreateIndex
CREATE INDEX "Lecture_schoolId_dateKey_idx" ON "Lecture"("schoolId", "dateKey");

-- CreateIndex
CREATE UNIQUE INDEX "Lecture_offeringId_dateKey_slotId_key" ON "Lecture"("offeringId", "dateKey", "slotId");

-- CreateIndex
CREATE INDEX "LectureAttendance_schoolId_studentMembershipId_idx" ON "LectureAttendance"("schoolId", "studentMembershipId");

-- CreateIndex
CREATE INDEX "LectureAttendance_lectureId_clientId_idx" ON "LectureAttendance"("lectureId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "LectureAttendance_lectureId_studentMembershipId_key" ON "LectureAttendance"("lectureId", "studentMembershipId");

-- CreateIndex
CREATE INDEX "AttendanceCondonation_schoolId_status_idx" ON "AttendanceCondonation"("schoolId", "status");

-- CreateIndex
CREATE INDEX "AttendanceCondonation_studentMembershipId_idx" ON "AttendanceCondonation"("studentMembershipId");

-- CreateIndex
CREATE INDEX "DefaulterNotice_offeringId_studentMembershipId_sentAt_idx" ON "DefaulterNotice"("offeringId", "studentMembershipId", "sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "InternalComponent_offeringId_name_key" ON "InternalComponent"("offeringId", "name");

-- CreateIndex
CREATE INDEX "InternalMark_schoolId_studentMembershipId_idx" ON "InternalMark"("schoolId", "studentMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "InternalMark_componentId_studentMembershipId_key" ON "InternalMark"("componentId", "studentMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "InternalLock_offeringId_key" ON "InternalLock"("offeringId");

-- CreateIndex
CREATE INDEX "InternalLock_schoolId_termId_idx" ON "InternalLock"("schoolId", "termId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseFile_offeringId_key" ON "CourseFile"("offeringId");

-- CreateIndex
CREATE INDEX "CourseFile_schoolId_idx" ON "CourseFile"("schoolId");

-- CreateIndex
CREATE INDEX "CourseFileItem_schoolId_fileId_idx" ON "CourseFileItem"("schoolId", "fileId");

-- CreateIndex
CREATE INDEX "MentoringGroup_schoolId_termId_idx" ON "MentoringGroup"("schoolId", "termId");

-- CreateIndex
CREATE INDEX "MentoringGroup_facultyMembershipId_idx" ON "MentoringGroup"("facultyMembershipId");

-- CreateIndex
CREATE INDEX "MentoringMember_studentMembershipId_idx" ON "MentoringMember"("studentMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "MentoringMember_groupId_studentMembershipId_key" ON "MentoringMember"("groupId", "studentMembershipId");

-- CreateIndex
CREATE INDEX "MentoringNote_schoolId_studentMembershipId_idx" ON "MentoringNote"("schoolId", "studentMembershipId");

-- AddForeignKey
ALTER TABLE "AcademicsSettings" ADD CONSTRAINT "AcademicsSettings_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartmentFaculty" ADD CONSTRAINT "DepartmentFaculty_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartmentFaculty" ADD CONSTRAINT "DepartmentFaculty_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartmentFaculty" ADD CONSTRAINT "DepartmentFaculty_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Programme" ADD CONSTRAINT "Programme_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Programme" ADD CONSTRAINT "Programme_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgrammeOutcome" ADD CONSTRAINT "ProgrammeOutcome_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgrammeOutcome" ADD CONSTRAINT "ProgrammeOutcome_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scheme" ADD CONSTRAINT "Scheme_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scheme" ADD CONSTRAINT "Scheme_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "Scheme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseOutcomeMap" ADD CONSTRAINT "CourseOutcomeMap_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseOutcomeMap" ADD CONSTRAINT "CourseOutcomeMap_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicTerm" ADD CONSTRAINT "AcademicTerm_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Division" ADD CONSTRAINT "Division_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Division" ADD CONSTRAINT "Division_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Division" ADD CONSTRAINT "Division_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProgramme" ADD CONSTRAINT "StudentProgramme_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProgramme" ADD CONSTRAINT "StudentProgramme_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProgramme" ADD CONSTRAINT "StudentProgramme_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProgramme" ADD CONSTRAINT "StudentProgramme_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "Scheme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseOffering" ADD CONSTRAINT "CourseOffering_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseOffering" ADD CONSTRAINT "CourseOffering_termId_fkey" FOREIGN KEY ("termId") REFERENCES "AcademicTerm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseOffering" ADD CONSTRAINT "CourseOffering_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferingSlot" ADD CONSTRAINT "OfferingSlot_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferingSlot" ADD CONSTRAINT "OfferingSlot_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "CourseOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseRegistration" ADD CONSTRAINT "CourseRegistration_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseRegistration" ADD CONSTRAINT "CourseRegistration_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseRegistration" ADD CONSTRAINT "CourseRegistration_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "CourseOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseRegistration" ADD CONSTRAINT "CourseRegistration_termId_fkey" FOREIGN KEY ("termId") REFERENCES "AcademicTerm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LateRegistration" ADD CONSTRAINT "LateRegistration_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LateRegistration" ADD CONSTRAINT "LateRegistration_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LateRegistration" ADD CONSTRAINT "LateRegistration_termId_fkey" FOREIGN KEY ("termId") REFERENCES "AcademicTerm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lecture" ADD CONSTRAINT "Lecture_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lecture" ADD CONSTRAINT "Lecture_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "CourseOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureAttendance" ADD CONSTRAINT "LectureAttendance_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureAttendance" ADD CONSTRAINT "LectureAttendance_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "Lecture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LectureAttendance" ADD CONSTRAINT "LectureAttendance_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceCondonation" ADD CONSTRAINT "AttendanceCondonation_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceCondonation" ADD CONSTRAINT "AttendanceCondonation_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceCondonation" ADD CONSTRAINT "AttendanceCondonation_termId_fkey" FOREIGN KEY ("termId") REFERENCES "AcademicTerm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DefaulterNotice" ADD CONSTRAINT "DefaulterNotice_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DefaulterNotice" ADD CONSTRAINT "DefaulterNotice_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalComponent" ADD CONSTRAINT "InternalComponent_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalComponent" ADD CONSTRAINT "InternalComponent_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "CourseOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalMark" ADD CONSTRAINT "InternalMark_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalMark" ADD CONSTRAINT "InternalMark_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "InternalComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalMark" ADD CONSTRAINT "InternalMark_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalLock" ADD CONSTRAINT "InternalLock_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalLock" ADD CONSTRAINT "InternalLock_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "CourseOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseFile" ADD CONSTRAINT "CourseFile_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseFile" ADD CONSTRAINT "CourseFile_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "CourseOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseFileItem" ADD CONSTRAINT "CourseFileItem_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseFileItem" ADD CONSTRAINT "CourseFileItem_courseFileId_fkey" FOREIGN KEY ("courseFileId") REFERENCES "CourseFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentoringGroup" ADD CONSTRAINT "MentoringGroup_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentoringGroup" ADD CONSTRAINT "MentoringGroup_termId_fkey" FOREIGN KEY ("termId") REFERENCES "AcademicTerm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentoringMember" ADD CONSTRAINT "MentoringMember_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentoringMember" ADD CONSTRAINT "MentoringMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "MentoringGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentoringMember" ADD CONSTRAINT "MentoringMember_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentoringNote" ADD CONSTRAINT "MentoringNote_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentoringNote" ADD CONSTRAINT "MentoringNote_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "MentoringGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentoringNote" ADD CONSTRAINT "MentoringNote_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

