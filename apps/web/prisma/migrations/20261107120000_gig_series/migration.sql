-- Sessions in series (decision 0008, the owner's decision of 7 November 2026): a provider offers a fixed set of dated
-- sessions or a weekly pattern in one go (GigSeries: the shape of every session and the rule), each session a GigSlot as
-- before joined by GigSlot.seriesId — its own seats, price, cancellation and refund; no pass. No school's row, like
-- GigSlot. Derived from `prisma migrate diff --from-schema-datasource` against the live database (7 Nov 2026).

-- AlterTable
ALTER TABLE "GigSlot" ADD COLUMN     "seriesId" TEXT;

-- CreateTable
CREATE TABLE "GigSeries" (
    "id" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "providerKind" TEXT NOT NULL,
    "teacherSchoolId" TEXT,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "meetingUrl" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL,
    "seats" INTEGER NOT NULL DEFAULT 1,
    "pricePaise" INTEGER NOT NULL DEFAULT 0,
    "rule" TEXT NOT NULL,
    "ruleJson" TEXT NOT NULL DEFAULT '{}',
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GigSeries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GigSeries_providerUserId_createdAt_idx" ON "GigSeries"("providerUserId", "createdAt");

-- CreateIndex
CREATE INDEX "GigSlot_seriesId_idx" ON "GigSlot"("seriesId");

-- AddForeignKey
ALTER TABLE "GigSlot" ADD CONSTRAINT "GigSlot_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "GigSeries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GigSeries" ADD CONSTRAINT "GigSeries_providerUserId_fkey" FOREIGN KEY ("providerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

