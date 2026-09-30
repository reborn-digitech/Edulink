-- AlterTable
ALTER TABLE "School" ADD COLUMN     "isTestFixture" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isTestFixture" BOOLEAN NOT NULL DEFAULT false;

-- The fixtures that exist already: the ZZ schools and the ZZ people, which
-- the tests, the sweeps and zz:fixtures make and destroy. From here on the
-- scripts set the flag on what they create.
UPDATE "School" SET "isTestFixture" = true WHERE "name" LIKE 'ZZ %';
UPDATE "User" SET "isTestFixture" = true WHERE "email" LIKE '%@zz.test' OR "email" LIKE 'zz.%@edulink.test' OR "name" LIKE 'ZZ %';
