import "server-only";
import { studentConsentSchema, type StudentConsent } from "@edulink/contracts";
import { myStudentConsent } from "./student-consent";
import { waitingClaimsForStudent } from "./guardian-claims";
import type { ActiveContext } from "./session";

/**
 * WHAT THE STUDENT'S CONSENT DOORS ANSWER (TA-555): the reader's guardians, each with what the student has granted
 * them, and the claims waiting on the student's own yes, in the contract's shape. One builder for the read
 * (GET /api/v1/student/consent) and for the three writes that answer the whole list as it now stands: a grant, a
 * claim decided, a link ended. The student's alone (myStudentConsent refuses every other role).
 */
export async function studentConsentBody(ctx: ActiveContext): Promise<StudentConsent> {
  const [view, claims] = await Promise.all([myStudentConsent(ctx), waitingClaimsForStudent(ctx)]);
  const lines = (grants: (typeof view)["grants"]) => grants.map((g) => ({ ...g, grantedAt: g.grantedAt?.toISOString() ?? null }));
  return studentConsentSchema.parse({
    applies: view.applies,
    grants: lines(view.grants),
    guardians: view.guardians.map((g) => ({ guardianshipId: g.guardianshipId, name: g.name, relation: g.relation, since: g.since.toISOString(), grants: lines(g.grants) })),
    claims: claims.map((claim) => ({ id: claim.id, claimantName: claim.claimantName, relation: claim.relation, createdAt: claim.createdAt.toISOString() })),
  });
}
