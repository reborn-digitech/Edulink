import { teachingAssignmentCreatedSchema, teachingNewAssignmentSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { createAssignment } from "@/lib/grading";
import { spendTickets, ticketedHandouts } from "@/lib/api-reads/teaching";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/**
 * POST /api/v1/teaching/assignments — set a new piece of work WITH handouts,
 * the web's newAssignment. The handouts are files the caller uploaded through
 * POST /api/v1/uploads; each must be a ticket this person holds, unspent, so
 * an id that was merely seen cannot be published to a class. Tickets are spent
 * only once the assignment exists: a refused form leaves them usable.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN");
    const parsed = teachingNewAssignmentSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const { handouts, ...input } = parsed.data;
    const attachments = await ticketedHandouts(ctx.user.id, handouts);
    const result = await createAssignment(
      { schoolId: ctx.schoolId, membershipId: ctx.membershipId, role: ctx.role, userId: ctx.user.id },
      { ...input, dueAt: input.dueAt || undefined, attachments },
    );
    await spendTickets(attachments.map((a) => a.fileId));
    return ok(teachingAssignmentCreatedSchema.parse({ ...result, handouts: attachments.length }), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/teaching/assignments");
  }
}
