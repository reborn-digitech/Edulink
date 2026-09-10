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
