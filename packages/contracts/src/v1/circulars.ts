import { z } from "zod";

/**
 * Circular reach: who a notice that asks for an acknowledgement has been
 * told, who has opened it, who has tapped "seen and understood" — family by
 * family, class by class — and the chase for the rest.
 */
const iso = z.string().datetime();
const count = z.number().int().min(0);

/** The furthest a family has got with a circular. */
export const reachStateSchema = z.enum(["ACKED", "SEEN", "TOLD", "UNREACHED"]);
export type ReachState = z.infer<typeof reachStateSchema>;

export const reachGuardianSchema = z.object({
  userId: z.string(),
  name: z.string(),
  /** The office sees the number; a teacher sees null. */
  phone: z.string().nullable(),
  /** Whether the app can reach them (a push device or a web subscription) and whether a text went. */
  hasApp: z.boolean(),
  texted: z.boolean(),
  state: reachStateSchema,
});

export const reachFamilySchema = z.object({
  studentMembershipId: z.string(),
  studentName: z.string(),
  state: reachStateSchema,
  guardians: z.array(reachGuardianSchema),
  /** No active guardian is linked, so nobody can be told on the family's behalf; the office's move is to invite one. */
  noGuardian: z.boolean().default(false),
});

export const reachGroupSchema = z.object({
  classId: z.string().nullable(),
  className: z.string(),
  total: count,
  told: count,
  seen: count,
  acked: count,
  /**
   * Families with no guardian linked. For a circular to parents they are
   * outside `total`, so the figure measures the families a reminder can reach;
   * they are still listed in `outstanding`, flagged, for the office to invite.
   */
  noGuardian: count.default(0),
  /** Families not yet acknowledged, the ones to chase, with the furthest state each got to. */
  outstanding: z.array(reachFamilySchema),
});

/** GET /api/v1/shared/bulletin/{postId}/reach */
export const circularReachSchema = z.object({
  postId: z.string(),
  title: z.string(),
  audience: z.string(),
  publishedAt: iso,
  deliveredAt: iso.nullable(),
  deliveryQueuedAt: iso.nullable(),
  remindedAt: iso.nullable(),
  remindCount: count,
  totals: z.object({ total: count, told: count, seen: count, acked: count, noGuardian: count.default(0) }),
  groups: z.array(reachGroupSchema),
  /** Whether this viewer may chase the outstanding now (office or the head; once a day; something outstanding). */
  canRemind: z.boolean(),
  /** Why not, when not: none | nothing-outstanding | too-soon | not-office. */
  remindBlocked: z.enum(["none", "nothing-outstanding", "too-soon", "not-office", "not-delivered"]),
});
export type CircularReach = z.infer<typeof circularReachSchema>;

/** POST /api/v1/shared/bulletin/{postId}/remind */
export const circularRemindResultSchema = z.object({ reminded: count, texted: count, remindedAt: iso });

/** GET /api/v1/office/circulars — every circular of the school, newest first, with its reach. */
export const officeCircularsSchema = z.object({
  rows: z.array(
    z.object({
      postId: z.string(),
      title: z.string(),
      audience: z.string(),
      className: z.string().nullable(),
      publishedAt: iso,
      deliveredAt: iso.nullable(),
      remindedAt: iso.nullable(),
      total: count,
      told: count,
      seen: count,
      acked: count,
      noGuardian: count.default(0),
    }),
  ),
});
