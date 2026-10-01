-- QuestionStat is a stored copy of the answers (see the model). Answers
-- recorded before the copy existed carry no grade and no seconds, so they
-- land in the grade-0 bucket untimed — exactly what data:audit recomputes
-- from the rows, which is what keeps the audit exact from the first run.
INSERT INTO "QuestionStat" ("id", "questionId", "grade", "asked", "correct", "seconds", "timed", "updatedAt")
SELECT 'qs' || md5(r."questionId" || ':0'), r."questionId", 0, count(*), count(*) FILTER (WHERE r."correct"), 0, 0, now()
  FROM "QuizResponse" r
 WHERE r."chosenIndex" IS NOT NULL
 GROUP BY r."questionId"
ON CONFLICT ("questionId", "grade") DO NOTHING;
