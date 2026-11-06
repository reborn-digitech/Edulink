import { z } from "zod";

/**
 * THE PLATFORM'S FEATURE SWITCHES (the owner's ask of 15 October 2026). Seven parts of the platform are
 * dark everywhere until the operator switches each on from /root/features; a school's own module
 * switch (the ASSISTANT module) still decides inside a school, but only while the platform feature is
 * on. A coded list, so the web, the phone and the database agree on the words; what each one says to a
 * person is a dictionary key (`platformFeatures.<CODE>.name` / `.what`), never this string.
 *
 *   ASSISTANT        the Vidura assistant (the web's /assistant and panel, the phone's assistant screen)
 *   QUESTION_BANK    practice for students, teachers and families (the bank desk and the generator stay)
 *   QUESTION_GIG     teachers writing questions for the bank for money
 *   EXPERT_SESSIONS  experts' one-to-ones and workshops, the expert directory, mentoring
 *   TEACHER_SESSIONS a teacher's guidance one-to-ones for their own school's pupils
 *   JOB_BOARD        vacancies: posting, the board, enquiring about a post
 *   TEXT_MESSAGING   SMS and WhatsApp through the provider (in-app notices and push are untouched)
 *   COMPETITIONS     the competition marketplace (decision 0007, 6 Nov 2026): the platform competitions the
 *                    content team posts and the crawler suggests, their desk and doors, and the crawler itself;
 *                    a school's own competitions, which are calendar events, are never behind this switch
 *
 * (The brief that asked for them said "six" and named these seven; all seven are here, and the eighth followed on 6 November 2026.) Every one is OFF until switched on. Later (not yet built) the operator sells subscriptions that open a
 * feature per person; that check is ANDed in at one seam (`mayUse` in apps/web/src/lib/platform-features.ts).
 */
export const PLATFORM_FEATURES = ["ASSISTANT", "QUESTION_BANK", "QUESTION_GIG", "EXPERT_SESSIONS", "TEACHER_SESSIONS", "JOB_BOARD", "TEXT_MESSAGING", "COMPETITIONS"] as const;
export const platformFeatureSchema = z.enum(PLATFORM_FEATURES);
export type FeatureCode = z.infer<typeof platformFeatureSchema>;

const iso = z.string().datetime();
const count = z.number().int().nonnegative();

/**
 * GET /api/v1/operator/features: each feature with its state, when and by whom it was last changed (null
 * while nobody has touched it), and one count that explains it (schools with the assistant module on,
 * open postings, experts published, texts skipped this month for "feature-off", …).
 */
export const operatorFeatureSchema = z.object({
  code: platformFeatureSchema,
  enabled: z.boolean(),
  changedAt: iso.nullable(),
  changedByName: z.string().nullable(),
  count: count,
});
export const operatorFeaturesSchema = z.object({ features: z.array(operatorFeatureSchema) });
export type OperatorFeature = z.infer<typeof operatorFeatureSchema>;
export type OperatorFeatures = z.infer<typeof operatorFeaturesSchema>;

/** POST /api/v1/operator/features/{code}: on or off. Switching to what stands changes nothing and writes no audit row. */
export const operatorFeatureSetBodySchema = z.object({ on: z.boolean() });
export const operatorFeatureSetSchema = z.object({ code: platformFeatureSchema, enabled: z.boolean(), changed: z.boolean() });
export type OperatorFeatureSet = z.infer<typeof operatorFeatureSetSchema>;
