-- R-21 (risks batch, 5 Oct 2026): the no-history fields a council return read, frozen at generation.
ALTER TABLE "CollegeFiling" ADD COLUMN "snapshotJson" TEXT NOT NULL DEFAULT '{}';
