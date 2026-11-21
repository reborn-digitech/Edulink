-- The school's Shalaghar subscription and the premium add-on (decision 0010 parts 1 to 3), with the two columns the
-- read-only pause will read (part 4, unread until the lock is built). The owner approved this change on 21 November
-- 2026 at 10:53 IST, in their words "Yes, approve", to the question "Approve the database change: one new table
-- and ten new columns on the school record?": one table of prices for all schools, and on the school its own price or
-- discount for both parts, the two premium switches, a note, when its terms were set, and two for the pause. Existing
-- schools are not rewritten: every new column is null or false, so no school's access, figure, notice or commission
-- changes, and none is locked.
--
-- The table and the columns are `prisma migrate diff` from the live datasource to the schema (the house way; never a
-- shadow database). The CHECKs below are written by hand: Prisma's schema cannot say them.

-- AlterTable
ALTER TABLE "School" ADD COLUMN     "premiumDiscountBps" INTEGER,
ADD COLUMN     "premiumPricePaise" INTEGER,
ADD COLUMN     "premiumStudents" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "premiumTeachers" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recordingClosedAt" TIMESTAMP(3),
ADD COLUMN     "recordingWarnedAt" TIMESTAMP(3),
ADD COLUMN     "subscriptionDiscountBps" INTEGER,
ADD COLUMN     "subscriptionPricePaise" INTEGER,
ADD COLUMN     "termsNote" TEXT,
ADD COLUMN     "termsSetAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SchoolOffer" (
    "id" TEXT NOT NULL DEFAULT 'offer',
    "subscriptionPricePaise" INTEGER NOT NULL,
    "subscriptionDiscountBps" INTEGER NOT NULL DEFAULT 0,
    "premiumPricePaise" INTEGER NOT NULL,
    "premiumDiscountBps" INTEGER NOT NULL DEFAULT 0,
    "freeMonths" INTEGER NOT NULL DEFAULT 6,
    "studentsByDefault" BOOLEAN NOT NULL DEFAULT true,
    "teachersByDefault" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByUserId" TEXT,

    CONSTRAINT "SchoolOffer_pkey" PRIMARY KEY ("id")
);

-- One row only, and the bounds the contracts hold (packages/contracts v1/school-offer.ts): a price is ₹1 to ₹10,000 a
-- student a year in whole rupees (paise in hundreds), a discount 0 to 100 % in basis points, the free months from the
-- list.
ALTER TABLE "SchoolOffer" ADD CONSTRAINT "SchoolOffer_one_row_check" CHECK ("id" = 'offer');
ALTER TABLE "SchoolOffer" ADD CONSTRAINT "SchoolOffer_prices_check"
  CHECK ("subscriptionPricePaise" BETWEEN 100 AND 1000000 AND "subscriptionPricePaise" % 100 = 0
     AND "premiumPricePaise" BETWEEN 100 AND 1000000 AND "premiumPricePaise" % 100 = 0);
ALTER TABLE "SchoolOffer" ADD CONSTRAINT "SchoolOffer_discounts_check"
  CHECK ("subscriptionDiscountBps" BETWEEN 0 AND 10000 AND "premiumDiscountBps" BETWEEN 0 AND 10000);
ALTER TABLE "SchoolOffer" ADD CONSTRAINT "SchoolOffer_free_months_check" CHECK ("freeMonths" IN (0, 1, 3, 6, 12));

-- A school's own terms for each part: an own price or an own discount, never both, each within the same bounds.
ALTER TABLE "School" ADD CONSTRAINT "School_subscription_terms_check"
  CHECK (("subscriptionPricePaise" IS NULL OR "subscriptionDiscountBps" IS NULL)
     AND ("subscriptionPricePaise" IS NULL OR ("subscriptionPricePaise" BETWEEN 100 AND 1000000 AND "subscriptionPricePaise" % 100 = 0))
     AND ("subscriptionDiscountBps" IS NULL OR "subscriptionDiscountBps" BETWEEN 0 AND 10000));
ALTER TABLE "School" ADD CONSTRAINT "School_premium_terms_check"
  CHECK (("premiumPricePaise" IS NULL OR "premiumDiscountBps" IS NULL)
     AND ("premiumPricePaise" IS NULL OR ("premiumPricePaise" BETWEEN 100 AND 1000000 AND "premiumPricePaise" % 100 = 0))
     AND ("premiumDiscountBps" IS NULL OR "premiumDiscountBps" BETWEEN 0 AND 10000));

-- Recording is closed only with the status that closes it: Pause sets SUSPENDED and End ENDED, each with the column.
-- The status is nullable, and a CHECK passes when its expression is NULL, so a closed school with no status is refused
-- by name rather than let through by "IN" answering NULL.
ALTER TABLE "School" ADD CONSTRAINT "School_recording_closed_check"
  CHECK ("recordingClosedAt" IS NULL OR ("subscriptionStatus" IS NOT NULL AND "subscriptionStatus" IN ('SUSPENDED', 'ENDED')));
