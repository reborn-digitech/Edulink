import "server-only";
import type { ExamDocumentCheck } from "@edulink/contracts";
import { db } from "./db";
import { forJoinCode } from "./tenant-context";
import { readJson } from "./json";

/**
 * A COLLEGE'S PAPER CHECKED BY ITS CODE ALONE (A3-journeys-21, audit of
 * 5 October 2026). A grade card, transcript or degree certificate prints a
 * code and an address carrying the college's id; someone who types the code
 * by hand into /certificates/exam or /certificates/check has only the code.
 * ExamDocument is CODE_READABLE in scripts/gen-rls.ts, so a signed-out
 * connection bound to exactly this code (forJoinCode) reads that one row and
 * nothing else: the kind, the serial, the college's name from the paper's
 * own snapshot and the dates — never the student. Null when no paper carries
 * the code. Hall tickets stay on the college-fenced check (their validity is
 * their session's, which is not code-readable).
 */
export const EXAM_CODE_SHAPE = /^[A-Z0-9]{6,16}$/;

export async function examDocumentByCode(code: string): Promise<ExamDocumentCheck | null> {
  const clean = code.trim().toUpperCase();
  if (!EXAM_CODE_SHAPE.test(clean)) return null;
  const doc = await forJoinCode(clean, () =>
    db.examDocument.findUnique({ where: { code: clean }, select: { kind: true, serial: true, dataJson: true, issuedAt: true, revokedAt: true } }),
  );
  if (!doc) return null;
  const data = readJson<{ college?: { name?: string } }>(doc.dataJson, {});
  return {
    valid: !doc.revokedAt,
    kind: doc.kind as ExamDocumentCheck["kind"],
    serial: doc.serial,
    schoolName: data.college?.name ?? null,
    issuedAt: doc.issuedAt.toISOString(),
    revokedAt: doc.revokedAt?.toISOString() ?? null,
  };
}
