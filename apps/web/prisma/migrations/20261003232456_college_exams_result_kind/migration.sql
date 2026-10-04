-- The exam cell (4 October 2026): a course result says whether it was a regular or a backlog course (the term's SGPA is over the regular ones), and a backlog remembers the last session that counted an attempt.
-- AlterTable
ALTER TABLE "CourseResult" ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'REGULAR';

-- AlterTable
ALTER TABLE "Backlog" ADD COLUMN     "lastSessionId" TEXT;

