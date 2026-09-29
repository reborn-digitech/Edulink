-- A certificate and a published report card keep the name they were printed
-- with. Every paper already out is given the name it printed, which until
-- today was the name on the account: nobody could change one.
ALTER TABLE "IssuedCertificate" ADD COLUMN IF NOT EXISTS "studentName" TEXT;
ALTER TABLE "ReportCard" ADD COLUMN IF NOT EXISTS "studentName" TEXT;

UPDATE "IssuedCertificate" c SET "studentName" = u."name"
  FROM "Membership" m JOIN "User" u ON u."id" = m."userId"
 WHERE m."id" = c."studentMembershipId" AND c."studentName" IS NULL;

UPDATE "ReportCard" r SET "studentName" = u."name"
  FROM "Membership" m JOIN "User" u ON u."id" = m."userId"
 WHERE m."id" = r."studentMembershipId" AND r."status" = 'PUBLISHED' AND r."studentName" IS NULL;
