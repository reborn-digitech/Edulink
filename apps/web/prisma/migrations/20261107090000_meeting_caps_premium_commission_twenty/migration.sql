-- Decision 0008 (the owner's decisions of 7 November 2026; docs/decisions/0008-plans-prices-and-sessions.md), the
-- schema half: the free-account length cap per meeting service as four GigSettings dials (Zoom 40, Meet 60, Teams
-- 60, Jitsi 0 = none), the provider's word that their meeting account is premium on the User row (an expert's or a
-- teacher's alike; nothing verifies it), and the company's share of a paid seat defaulting to 20 percent rather than
-- 15. Derived from `prisma migrate diff --from-schema-datasource` against the live database (7 Nov 2026); the data
-- half (the prices, the TEACHER plan's bank, the existing settings row's commission) is the next migration.

-- AlterTable
ALTER TABLE "GigSettings" ADD COLUMN     "freeLimitJitsiMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "freeLimitMeetMinutes" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "freeLimitTeamsMinutes" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "freeLimitZoomMinutes" INTEGER NOT NULL DEFAULT 40,
ALTER COLUMN "commissionPercent" SET DEFAULT 20;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "premiumMeeting" BOOLEAN NOT NULL DEFAULT false;
