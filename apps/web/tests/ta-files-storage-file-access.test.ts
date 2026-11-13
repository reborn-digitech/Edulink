/**
 * Who may read a stored file: two findings of the testing analysis of 13 November 2026 in
 * authorizeFileRead (src/lib/files.ts).
 *
 *   TA-138  The caller's id went into the reverse lookups' LIKE patterns unescaped, so % and _ in it
 *           were wildcards, and POST /api/v1/files/{fileId}/link answered 200 or 404 on whether a
 *           pattern matched: a yes/no question about other people's attachment JSON.
 *   TA-291  A purchase's scanned bill opened for the office and the head only, while the accounts
 *           desk records purchases and is shown the View bill link.
 *
 * One scratch ZZ college of this suite's own (made through the owner connection, removed after),
 * with a teacher's own post carrying one picture, and a purchase with a scanned bill; a second
 * scratch college whose accounts desk must not read the first one's bill.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { authorizeFileRead } from "@/lib/files";
import { createSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { POST as linkPost } from "@/app/api/v1/files/[fileId]/link/route";

const db = new PrismaClient();
const STAMP = Date.now();
const TAIL = String(STAMP).slice(-6);
const MAIL = (who: string) => `zz-tafs-${who}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};
const POST_FILE = `${randomUUID()}.png`;
const BILL_FILE = `${randomUUID()}.pdf`;

function ctx(userId: string, membershipId: string, schoolId: string, role: string): ActiveContext {
  return {
    sessionId: "test",
    membershipId,
    schoolId,
    role: role as ActiveContext["role"],
    user: {
      id: userId,
      name: "Test",
      preferredName: null,
      email: null,
      avatarKey: null,
      isMinor: false,
      isSuperuser: false,
      isAppAdmin: false,
      prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null },
    },
  };
}
const as = (who: string, school: "A" | "B", role: string) => ctx(ids[who]!, ids[`${who}M`]!, ids[school]!, role);
const allowed = (access: { allowed: boolean }) => access.allowed;

beforeAll(async () => {
  for (const key of ["A", "B"] as const) {
    ids[key] = (
      await db.school.create({
        data: { name: `ZZ TA Files ${key} ${STAMP}`, slug: `zz-tafs-${key.toLowerCase()}-${STAMP}`, code: `ZTFS${key}${TAIL}`, contactEmail: MAIL(`office-${key.toLowerCase()}`), timezone: "Asia/Kolkata", kind: "COLLEGE", isTestFixture: true },
        select: { id: true },
      })
    ).id;
  }
  const person = async (who: string, school: "A" | "B", role: string) => {
    ids[who] = (await db.user.create({ data: { name: `ZZ TA Files ${who}`, email: MAIL(who), prefs: "{}" }, select: { id: true } })).id;
    ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: ids[school]!, role, status: "ACTIVE" }, select: { id: true } })).id;
  };
  await person("author", "A", "TEACHER");
  await person("adminA", "A", "ADMIN");
  await person("accountsA", "A", "ACCOUNTS");
  await person("accountsB", "B", "ACCOUNTS");
  await person("teacherA", "A", "TEACHER");

  // The teacher's own post: a pending one, which its author always reads (files.ts, the post branch).
  await db.post.create({
    data: { schoolId: ids.A!, authorUserId: ids.author!, authorMembershipId: ids.authorM!, scope: "SCHOOL", title: `ZZ TA Files post ${STAMP}`, status: "PENDING", media: JSON.stringify([{ fileId: POST_FILE, alt: "a notebook page", kind: "image" }]) },
  });
  await db.purchaseRecord.create({
    data: { schoolId: ids.A!, vendorName: "ZZ Stationers", dateKey: "2026-11-13", invoiceRef: `ZZ-${TAIL}`, location: "Store", totalPaise: 12_300, billFileId: BILL_FILE, createdByUserId: ids.accountsA! },
  });
}, 60_000);

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = await db.user.findMany({ where: { email: { startsWith: "zz-tafs-", endsWith: `-${STAMP}@test.invalid` } }, select: { id: true } });
  const userIds = users.map((u) => u.id);
  const schools = [ids.A, ids.B].filter((x): x is string => Boolean(x));
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.post.deleteMany({ where: { schoolId: { in: schools } } });
  await db.purchaseRecord.deleteMany({ where: { schoolId: { in: schools } } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId: { in: schools } }, { actorUserId: { in: userIds } }] } });
  await db.school.deleteMany({ where: { id: { in: schools } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("TA-138: a file id is a name, never a LIKE pattern", () => {
  it("TA-138: the arrangement: the author reads their own post's picture by its real id", async () => {
    expect(allowed(await authorizeFileRead(POST_FILE, as("author", "A", "TEACHER")))).toBe(true);
  });

  it("TA-138: an id ending in % that matches the author's own post is refused, not read as a wildcard", async () => {
    const pattern = `${POST_FILE.slice(0, 30)}%`;
    expect(allowed(await authorizeFileRead(pattern, as("author", "A", "TEACHER")))).toBe(false);
  });

  it("TA-138: an id with _ standing for one character is refused", async () => {
    const pattern = `${POST_FILE.slice(0, 10)}_${POST_FILE.slice(11)}`;
    expect(allowed(await authorizeFileRead(pattern, as("author", "A", "TEACHER")))).toBe(false);
  });

  it("TA-138: the bare wildcards and a JSON-shaped pattern are refused for the office too", async () => {
    for (const id of ["%", "_%", '%"name":"%', "%_%"]) {
      expect(allowed(await authorizeFileRead(id, as("adminA", "A", "ADMIN"))), id).toBe(false);
    }
  });

  it("TA-138: POST /api/v1/files/{fileId}/link answers 404 to a pattern that matches the caller's own post", async () => {
    __resetCookies();
    __setHeaders({});
    await createSession(ids.author!, { schoolId: ids.A!, role: "TEACHER" });
    const res = await linkPost(new Request("http://localhost/x", { method: "POST" }), { params: Promise.resolve({ fileId: `${POST_FILE.slice(0, 30)}%` }) });
    expect(res.status).toBe(404);
  });
});

describe("TA-291: a purchase's scanned bill and the accounts desk", () => {
  it("TA-291: the accounts desk of the bill's own college opens it", async () => {
    expect(allowed(await authorizeFileRead(BILL_FILE, as("accountsA", "A", "ACCOUNTS")))).toBe(true);
  });

  it("TA-291: the office still opens it, and a teacher of the same college does not", async () => {
    expect(allowed(await authorizeFileRead(BILL_FILE, as("adminA", "A", "ADMIN")))).toBe(true);
    expect(allowed(await authorizeFileRead(BILL_FILE, as("teacherA", "A", "TEACHER")))).toBe(false);
  });

  it("TA-291: another college's accounts desk does not", async () => {
    expect(allowed(await authorizeFileRead(BILL_FILE, as("accountsB", "B", "ACCOUNTS")))).toBe(false);
  });
});
