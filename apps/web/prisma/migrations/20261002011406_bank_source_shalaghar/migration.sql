-- The product is Shalaghar since 2 October 2026 (it was Relay from 18 September).
-- QuizQuestion.source is a provenance tag nobody reads on a screen; it marks a
-- question written in the app rather than loaded from content/quiz/*.json, and
-- scripts/import-quiz.ts DELETES every question the files no longer hold whose
-- source is not one of the in-app tags (src/lib/bank-source.ts). Renaming the
-- tag in the code without renaming it on the rows would therefore make every
-- question the content team ever typed or imported through its sheet an orphan
-- on the next import. Data only: no column changes, no Prisma client change.
-- The file sources ("EduLink original, written against NCERT …") belong to the
-- content files, which rewrite them on every import, and are not touched here.
UPDATE "QuizQuestion"
   SET "source" = 'Shalaghar content team'
 WHERE "source" = 'Relay content team';
