/**
 * The standing a ZZ fixture expert is built with (TA-583). ONE TRUTH: verifiedAt and kycStatus say the same thing
 * (schema.prisma's ExpertProfile, src/lib/expert-kyc.ts). The product keeps them in step (setExpertStanding in
 * superuser.ts, decideKyc in expert-kyc.ts), but the fixture wrote verifiedAt alone, so zz.expert1 was verified in
 * the pairing form and the mentor queue (which read verifiedAt) and unverified in the marketplace and the paid gate
 * (which read kycStatus). Apart from zz-fixtures.ts so the suites can call it without loading the fixture builder.
 */
export type FixtureExpertStanding = { verifiedAt: Date | null; verifiedBy: string | null; kycStatus: "VERIFIED" | "NONE"; kycDecidedAt: Date | null };

/** `by` names the script that verified it: zz-fixtures, or demo-seed and demo-schools for the demo experts. */
export function fixtureExpertStanding(verified: boolean, at: Date, by = "zz-fixtures"): FixtureExpertStanding {
  return verified ? { verifiedAt: at, verifiedBy: by, kycStatus: "VERIFIED", kycDecidedAt: at } : { verifiedAt: null, verifiedBy: null, kycStatus: "NONE", kycDecidedAt: null };
}

/** Whether a profile keeps the one truth: verified on both columns or on neither. */
export function keepsOneTruth(profile: { verifiedAt: Date | null; kycStatus: string }): boolean {
  return (profile.verifiedAt !== null) === (profile.kycStatus === "VERIFIED");
}

/**
 * What an existing fixture profile needs written to keep the one truth, or null when it already does: a profile a
 * fixture made before this change (verifiedAt set, kycStatus NONE) is put in step with its spec, keeping the time
 * it was verified at. A profile that agrees with itself is left alone, as the fixture leaves existing profiles.
 */
export function standingRepair(profile: { verifiedAt: Date | null; kycStatus: string }, verified: boolean, now: Date, by = "zz-fixtures"): FixtureExpertStanding | null {
  if (keepsOneTruth(profile)) return null;
  return fixtureExpertStanding(verified, profile.verifiedAt ?? now, by);
}
