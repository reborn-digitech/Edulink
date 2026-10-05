-- G4-28 (risks batch, 5 Oct 2026): the operator may disable an expert as it disables a recruiter.
ALTER TABLE "ExpertProfile" ADD COLUMN "disabledAt" TIMESTAMP(3);
