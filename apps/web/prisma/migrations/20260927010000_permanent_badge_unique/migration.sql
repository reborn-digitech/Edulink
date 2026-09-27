-- A permanent badge has no academic year, and Postgres treats two NULLs in a
-- unique index as distinct, so the compound unique on (student, badge, year)
-- never stopped a second permanent copy of the same badge landing under a
-- race. A partial unique index over the year-less rows does.
CREATE UNIQUE INDEX IF NOT EXISTS "EarnedBadge_permanent_unique"
  ON "EarnedBadge" ("studentMembershipId", "badgeId")
  WHERE "academicYearId" IS NULL;
