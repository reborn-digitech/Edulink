-- seats (17 Oct 2026): the thirty-minute join reminder, claimed once per seat (src/lib/gig-sessions.ts remindJoins).
ALTER TABLE "GigBooking" ADD COLUMN "joinRemindedAt" TIMESTAMP(3);
