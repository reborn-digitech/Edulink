import { z } from "zod";

/**
 * /api/v1/join — joining a school or a class with a code, on the account that
 * is signed in: the web's /join "What's your code?" steps for somebody who
 * already has an account. First say what the code is, then join it.
 */

/**
 * The code as typed. Deliberately loose: "too short", "too long" and "not
 * found" are the server's sentences (lib/join.ts), so a child's half-typed
 * code gets words rather than a schema's.
 */
export const joinCodeBodySchema = z.object({ code: z.string().max(64) });
export type JoinCodeBody = z.infer<typeof joinCodeBodySchema>;

/** What a code is: a whole school's, or one class's in that school. */
export const joinLookupSchema = z.object({
  kind: z.enum(["school", "class"]),
  schoolName: z.string(),
  /** The class the code names; null for a whole-school code. */
  className: z.string().nullable(),
});
export type JoinLookup = z.infer<typeof joinLookupSchema>;

/* -------------------------------------------------------------------------- */
/* A join waits for a yes                                                      */
/* -------------------------------------------------------------------------- */

const iso = z.string().datetime();

/** One request of the asker's own: that it waits, or was not accepted, and where. */
export const joinRequestSchema = z.object({
  id: z.string(),
  /** EXPIRED: nobody decided it in thirty days, and the asker may ask again. */
  status: z.enum(["PENDING", "DECLINED", "EXPIRED"]),
  schoolName: z.string(),
  /** The class the code named; null for a whole-school code. */
  className: z.string().nullable(),
  /** What the decider chose to say with a decline; null when they said nothing. */
  declineReason: z.string().nullable(),
  createdAt: iso,
});
export type JoinRequest = z.infer<typeof joinRequestSchema>;

/** POST /api/v1/join — the request is filed; nothing of the school opens until somebody lets them in. */
export const joinFiledSchema = z.object({
  requestId: z.string(),
  schoolName: z.string(),
  className: z.string().nullable(),
  /** The same request was already waiting: asking twice is asking once. */
  alreadyWaiting: z.boolean(),
});
export type JoinFiled = z.infer<typeof joinFiledSchema>;

/** GET /api/v1/join/requests — what the asker waits on, and what was declined. */
export const joinRequestsSchema = z.object({ requests: z.array(joinRequestSchema) });

/** Somebody waiting on the reader to be let in. */
export const waitingJoinSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** Whole years, when they gave a date of birth. */
  age: z.number().int().nullable(),
  via: z.enum(["SCHOOL", "CLASS"]),
  className: z.string().nullable(),
  /** On this school's roll already, asking only for the class. */
  onRoll: z.boolean(),
  createdAt: iso,
});
export type WaitingJoin = z.infer<typeof waitingJoinSchema>;

/** Somebody waiting on the reader to be made a child's guardian. */
export const waitingClaimSchema = z.object({
  id: z.string(),
  claimantName: z.string(),
  claimantEmail: z.string().nullable(),
  relation: z.enum(["PARENT", "GUARDIAN", "OTHER"]),
  childName: z.string(),
  className: z.string().nullable(),
  schoolName: z.string(),
  createdAt: iso,
});
export type WaitingClaim = z.infer<typeof waitingClaimSchema>;

/**
 * GET /api/v1/shared/joins — everybody waiting on the reader: an admin's are
 * the school's joins and claims, the head's the claims, a teacher's the joins
 * by their classes' codes, a guardian's the claims on their own children.
 */
export const waitingQueueSchema = z.object({ joins: z.array(waitingJoinSchema), claims: z.array(waitingClaimSchema) });
export type WaitingQueue = z.infer<typeof waitingQueueSchema>;

/** POST …/joins/{requestId}/decide and …/claims/{claimId}/decide. */
export const joinDecisionBodySchema = z.object({
  decision: z.enum(["APPROVE", "DECLINE"]),
  /** With a decline only, and optional: a sentence the asker will read. Never kept in the audit log. */
  reason: z.string().trim().max(300).optional(),
});
export type JoinDecisionBody = z.infer<typeof joinDecisionBodySchema>;
