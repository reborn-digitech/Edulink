import "server-only";
import { forSchool } from "./tenant-context";
import type { ActiveContext } from "./session";

/**
 * An expert's notice to a school, and the line in that school's log.
 *
 * An expert's session is bound to NO school: what they may read and write is
 * named row by row in the database (EXPERT_READABLE and EXPERT_WRITES in
 * scripts/gen-rls.ts). A notification for a member of staff and an audit
 * line are the school's rows, which no policy hands to an outside adult, so
 * the server writes them under the school's own binding — and only ever
 * from a function that has already found the booking or the mentorship to
 * be this expert's. The binding is for the two writes and nothing else:
 * nothing is read inside it and handed back.
 *
 * The school's own staff need none of this; their session is the school's.
 */
export function asTheSchool<T>(session: ActiveContext, schoolId: string, work: () => Promise<T>): Promise<T> {
  return session.role === "EXPERT" ? forSchool(schoolId, work) : work();
}
