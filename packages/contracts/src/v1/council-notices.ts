import { z } from "zod";

/**
 * STUDENT COUNCIL NOTICES (risks batch 5A, 5 October 2026). The office keeps
 * the school's student council — a committee of kind STUDENT_COUNCIL whose
 * members are students named by their student codes — and a member of the
 * council (or the office, on the council's behalf) posts a notice on the
 * bulletin in the category COUNCIL, signed by the council rather than the
 * writer. A student's notice waits for the office's review as any student post
 * does; it is read by the bulletin's own audience rules.
 */
const audience = z.enum(["ALL", "PARENTS", "TEACHERS", "STUDENTS"]);

/** GET /api/v1/shared/bulletin/council — the council, and what the reader may do with it. */
export const studentCouncilViewSchema = z.object({
  council: z
    .object({
      id: z.string(),
      name: z.string(),
      members: z.array(z.object({ membershipId: z.string(), name: z.string(), role: z.string(), className: z.string().nullable() })),
    })
    .nullable(),
  /** A member of the council, or the office. */
  canPost: z.boolean(),
  /** The office: names the council and its members. */
  canKeep: z.boolean(),
});
export type StudentCouncilView = z.infer<typeof studentCouncilViewSchema>;

/** POST /api/v1/office/council — the office names the council and its members by student code, each with a role on it (president, secretary…). */
export const studentCouncilSaveSchema = z.object({
  name: z.string().trim().min(3).max(120),
  members: z.array(z.object({ code: z.string().trim().min(1).max(40), role: z.string().trim().max(60).default("") })).min(1).max(40),
});
export type StudentCouncilSave = z.infer<typeof studentCouncilSaveSchema>;

/** POST /api/v1/shared/bulletin/council — a notice from the council. `audience` narrows only the office's notice; a student's is for everyone. */
export const studentCouncilNoticeSaveSchema = z.object({
  title: z.string().trim().min(2).max(200),
  body: z.string().trim().max(20_000).default(""),
  audience: audience.default("ALL"),
});
export type StudentCouncilNoticeSave = z.infer<typeof studentCouncilNoticeSaveSchema>;
export const studentCouncilNoticeCreatedSchema = z.object({ postId: z.string(), status: z.enum(["PENDING", "APPROVED"]) });
