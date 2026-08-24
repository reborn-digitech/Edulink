import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { mkdir, writeFile, utimes, rm, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { reclaimOrphans } from "@/lib/orphans";

/**
 * Reclaiming unreferenced files.
 *
 * The dangerous direction is deleting something that IS referenced — that is a
 * child's submitted work gone with no way back. So most of this file is about
 * what must survive a sweep: one file of every kind that can hold a reference,
 * plus anything too recent to judge.
 *
 * The four "still referenced" cases mirror the four branches of
 * `authorizeFileRead`. If a fifth kind of attachment is ever added there and not
 * to `referencedFileIds`, the sweep would delete live files — these tests are
 * the tripwire, so keep them in step.
 */

const db = new PrismaClient();

/**
 * A scratch store, NOT the app's.
 *
 * This is the one suite that deletes files. Pointed at the real directory it
 * quietly reclaims every orphan in it — which is the tool working correctly and
 * a test overreaching, at the same time. `orphans.ts` resolves its root per call
 * so this can be swapped.
 */
const ROOT = resolve(process.cwd(), ".tmp-orphan-store");
const REAL_STORAGE_DIR = process.env.STORAGE_DIR;
process.env.STORAGE_DIR = ROOT;

/** Distinctive ids so nothing here can collide with real seeded data. */
const LOGO = "aaaa1111-2222-3333-4444-000000000001.png";
const ASSIGNMENT_FILE = "aaaa1111-2222-3333-4444-000000000002.pdf";
const SUBMISSION_FILE = "aaaa1111-2222-3333-4444-000000000003.pdf";
const POST_FILE = "aaaa1111-2222-3333-4444-000000000004.png";
const ORPHAN = "aaaa1111-2222-3333-4444-000000000005.png";
/** Referenced by the assignment but never written to disk — the missing case. */
const MISSING_FILE = "aaaa1111-2222-3333-4444-000000000007.pdf";
const FRESH_ORPHAN = "aaaa1111-2222-3333-4444-000000000006.png";
const NOT_OURS = "notes.txt";

const ALL = [LOGO, ASSIGNMENT_FILE, SUBMISSION_FILE, POST_FILE, ORPHAN, FRESH_ORPHAN];

let schoolId: string;
let classId: string;
let studentMembershipId: string;
let teacherMembershipId: string;
let previousLogo: string | null = null;
let assignmentId: string;
let postId: string;

function pathFor(fileId: string): string {
  return join(ROOT, fileId.slice(0, 2), fileId);
}

/** Writes a stored file, backdated so the grace window does not protect it. */
async function place(fileId: string, ageMs: number): Promise<void> {
  const target = pathFor(fileId);
  await mkdir(join(ROOT, fileId.slice(0, 2)), { recursive: true });
  await writeFile(target, Buffer.from("bytes"));
  const when = new Date(Date.now() - ageMs);
  await utimes(target, when, when);
}

beforeAll(async () => {
  const school = await db.school.findFirstOrThrow({ where: { name: "Riverside Primary School" } });
  schoolId = school.id;
  previousLogo = school.logoPath;

  const teacher = await db.membership.findFirstOrThrow({
    where: { schoolId, role: "TEACHER", status: "ACTIVE" },
  });
  teacherMembershipId = teacher.id;
  classId = (
    await db.classTeacher.findFirstOrThrow({ where: { teacherMembershipId: teacher.id } })
  ).classId;
  studentMembershipId = (
    await db.enrollment.findFirstOrThrow({ where: { classId, status: "ACTIVE" } })
  ).studentMembershipId;

  const DAY = 24 * 60 * 60 * 1000;
  for (const id of ALL) await place(id, id === FRESH_ORPHAN ? 0 : DAY);
  await mkdir(join(ROOT, "zz"), { recursive: true });
  await writeFile(join(ROOT, "zz", NOT_OURS), Buffer.from("not a stored file"));

  // One reference of each kind.
  await db.school.update({ where: { id: schoolId }, data: { logoPath: LOGO } });

  const assignment = await db.assignment.create({
    data: {
      schoolId,
      classId,
      authorMembershipId: teacherMembershipId,
      title: "TEST orphans assignment",
      publishedAt: new Date(),
      attachments: JSON.stringify([
        { fileId: ASSIGNMENT_FILE, name: "sheet.pdf", size: 5, mime: "application/pdf" },
        { fileId: MISSING_FILE, name: "answers.pdf", size: 5, mime: "application/pdf" },
      ]),
    },
  });
  assignmentId = assignment.id;

  await db.submission.create({
    data: {
      schoolId,
      assignmentId,
      studentMembershipId,
      status: "SUBMITTED",
      submittedAt: new Date(),
      attachments: JSON.stringify([
        { fileId: SUBMISSION_FILE, name: "work.pdf", size: 5, mime: "application/pdf" },
      ]),
    },
  });

  const post = await db.post.create({
    data: {
      schoolId,
      classId,
      authorUserId: (await db.membership.findUniqueOrThrow({ where: { id: teacherMembershipId } }))
        .userId,
      authorMembershipId: teacherMembershipId,
      scope: "CLASS",
      title: "TEST orphans post",
      status: "APPROVED",
      tags: "[]",
      media: JSON.stringify([{ fileId: POST_FILE, kind: "image", alt: "A picture" }]),
    },
  });
  postId = post.id;
});

afterAll(async () => {
  await db.school.update({ where: { id: schoolId }, data: { logoPath: previousLogo } });
  await db.post.deleteMany({ where: { id: postId } });
  await db.submission.deleteMany({ where: { assignmentId } });
  await db.assignment.deleteMany({ where: { id: assignmentId } });
  await rm(ROOT, { recursive: true, force: true });
  if (REAL_STORAGE_DIR === undefined) delete process.env.STORAGE_DIR;
  else process.env.STORAGE_DIR = REAL_STORAGE_DIR;
  await db.$disconnect();
});

describe("what must survive", () => {
  it("⚠ keeps every file a record still points at", async () => {
    const report = await reclaimOrphans({ dryRun: true, graceMs: 0 });
    const doomed = report.orphans.map((o) => o.fileId);

    // One per branch of authorizeFileRead. A missing query here deletes live work.
    expect(doomed).not.toContain(LOGO);
    expect(doomed).not.toContain(ASSIGNMENT_FILE);
    expect(doomed).not.toContain(SUBMISSION_FILE);
    expect(doomed).not.toContain(POST_FILE);
  });

  it("⚠ leaves recently written files alone even though nothing references them", async () => {
    // An upload writes its bytes before the row that references them. Without
    // this window a hand-in mid-flight is deleted out from under the request.
    const report = await reclaimOrphans({ dryRun: true });
    expect(report.orphans.map((o) => o.fileId)).not.toContain(FRESH_ORPHAN);
    expect(report.skippedRecent).toBeGreaterThan(0);
  });

  it("never touches a file it did not write", async () => {
    const report = await reclaimOrphans({ dryRun: true, graceMs: 0 });
    expect(report.orphans.map((o) => o.fileId)).not.toContain(NOT_OURS);
    expect(report.unrecognised.some((u) => u.endsWith(NOT_OURS))).toBe(true);
  });
});

describe("what goes", () => {
  it("finds the unreferenced file", async () => {
    const report = await reclaimOrphans({ dryRun: true, graceMs: 0 });
    expect(report.orphans.map((o) => o.fileId)).toContain(ORPHAN);
    expect(report.scanned).toBeGreaterThanOrEqual(ALL.length);
    expect(report.referenced).toBeGreaterThanOrEqual(4);
  });

  it("⚠ reports without deleting by default", async () => {
    const report = await reclaimOrphans({ graceMs: 0 });
    expect(report.deleted).toEqual([]);
    expect(report.bytesReclaimed).toBe(0);
    // Still there.
    await expect(stat(pathFor(ORPHAN))).resolves.toBeTruthy();
  });

  it("deletes only when asked, and only the orphan", async () => {
    const report = await reclaimOrphans({ dryRun: false, graceMs: 0 });

    expect(report.deleted).toContain(ORPHAN);
    await expect(stat(pathFor(ORPHAN))).rejects.toThrow();

    // Everything referenced is still on disk.
    for (const kept of [LOGO, ASSIGNMENT_FILE, SUBMISSION_FILE, POST_FILE]) {
      await expect(stat(pathFor(kept))).resolves.toBeTruthy();
    }
    expect(report.bytesReclaimed).toBeGreaterThan(0);
  });

  it("is safe to run twice", async () => {
    const report = await reclaimOrphans({ dryRun: false, graceMs: 0 });
    expect(report.deleted).not.toContain(ORPHAN); // already gone
  });
});

describe("⚠ a record whose bytes are gone is told to its school", () => {
  it("counts the referenced-but-absent file as missing, attributed per school, and never deletes for it", async () => {
    const report = await reclaimOrphans({ dryRun: true, graceMs: 0 });
    // Everything the real database references is absent from this scratch
    // store, so the totals are large; what is pinned is OUR file landing on
    // OUR school, which is the attribution path.
    expect(report.missing).toBeGreaterThanOrEqual(1);
    expect(report.perSchool[schoolId]?.missing ?? 0).toBeGreaterThanOrEqual(1);
    // Missing is a report, never an action: nothing about it reaches deleted.
    expect(report.deleted).toEqual([]);
  });
});

describe("⚠ an unreadable disk is not an empty one", () => {
  it("refuses to report a clean sweep when files are on record but the root cannot be read", async () => {
    const saved = process.env.STORAGE_DIR;
    process.env.STORAGE_DIR = join(ROOT, "does-not-exist");
    try {
      // The seed's school logos are on record, so the sweep must refuse.
      expect(await db.school.count({ where: { logoPath: { not: null } } })).toBeGreaterThan(0);
      await expect(reclaimOrphans({ dryRun: true })).rejects.toThrow(/not readable/);
    } finally {
      process.env.STORAGE_DIR = saved;
    }
  });
});
