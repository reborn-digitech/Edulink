-- One-time practice (decision 0008, the owner's decision of 7 November 2026): a pupil without the Student plan opens a set a
-- teacher assigned once — the drawn question ids, the answers with their verdicts, the counts, one row per pupil and
-- assignment (src/lib/practice-once.ts is the one writer). A school's row, under RLS like every practice row. Derived from
-- `prisma migrate diff --from-schema-datasource` against the live database (7 Nov 2026).

-- CreateTable
CREATE TABLE "PracticeOnce" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "questionIds" JSONB NOT NULL,
    "answers" JSONB NOT NULL DEFAULT '[]',
    "total" INTEGER NOT NULL,
    "correct" INTEGER NOT NULL DEFAULT 0,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PracticeOnce_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PracticeOnce_schoolId_assignmentId_idx" ON "PracticeOnce"("schoolId", "assignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "PracticeOnce_studentMembershipId_assignmentId_key" ON "PracticeOnce"("studentMembershipId", "assignmentId");

-- AddForeignKey
ALTER TABLE "PracticeOnce" ADD CONSTRAINT "PracticeOnce_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeOnce" ADD CONSTRAINT "PracticeOnce_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeOnce" ADD CONSTRAINT "PracticeOnce_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "PracticeAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeOnce" ADD CONSTRAINT "PracticeOnce_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "QuizTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

