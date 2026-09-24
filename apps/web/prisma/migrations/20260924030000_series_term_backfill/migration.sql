-- An exam series' term is derived from its earliest paper (src/lib/exams.ts) and is
-- recomputed on every paper change. Series made before that sat with no term and were off
-- every term and annual card; give each the term that covers its first paper.
UPDATE "ExamSeries" s
SET "termId" = t."id"
FROM (
  SELECT "seriesId", MIN("dateKey") AS first_key FROM "ExamSlot" GROUP BY "seriesId"
) f
JOIN "ExamSeries" s2 ON s2."id" = f."seriesId"
JOIN "Term" t ON t."schoolId" = s2."schoolId"
  AND f.first_key >= to_char(t."startDate", 'YYYY-MM-DD')
  AND f.first_key <= to_char(t."endDate", 'YYYY-MM-DD')
WHERE s."id" = f."seriesId" AND s."termId" IS NULL;
