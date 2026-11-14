import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

// Before the events route loads (imports are hoisted): a keep-alive every 150 ms, so its recheck runs in the test.
vi.hoisted(() => {
  process.env.EVENTS_KEEPALIVE_MS = "150";
});
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import type { ActiveContext } from "@/lib/session";
import { createThread, getThread, listThreads, replyToThread } from "@/lib/remarks";
import { channel, publish } from "@/lib/realtime";
import { GET as eventsGet } from "@/app/api/v1/events/route";
import { GET as threadGet } from "@/app/api/v1/shared/threads/[threadId]/route";
import { __resetCookies, __setHeaders } from "./stubs/next-headers";

/**
 * Two things a session kept or lacked, from the testing analysis of 13 November 2026.
 *
 *   TA-212: at a college a student (or their guardian) may open a remark thread with a FACULTY or HOD member who
 *           teaches their class, as owner's item 14 has it, and the faculty member was told of it, but could never
 *           read or answer it: assertRemarkAccess and listThreads knew only the role TEACHER, and the two thread
 *           doors named no limited role. They are now the thread's teacher, on the web and through the doors.
 *   TA-433: an events stream's channels were fixed when it opened, so a guardian whose link to a child ended went on
 *           hearing the child's bus and threads while the page stayed open. The keep-alive's recheck now works the
 *           channels out again and ends a stream whose set shrank; the client opens a fresh one.
 *
 * A ZZ college and a ZZ school of this file's own, removed after by id with everything under them.
 */

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const EMAIL = (key: string) => `zz-pcte-${key.toLowerCase()}-${STAMP}@test.invalid`;
type Person = { userId: string; membershipId: string; schoolId: string };
const P: Record<string, Person> = {};
const ids = { college: "", school: "", klass: "", child: "" };

const ctxOf = (p: Person, role: string): ActiveContext =>
  ({ sessionId: "test", membershipId: p.membershipId, schoolId: p.schoolId, role: role as never, user: { id: p.userId, name: "ZZ PCTE", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false } }) as unknown as ActiveContext;

beforeAll(async () => {
  const school = (tag: string, kind: string) =>
    db.school.create({ data: { name: `ZZ PCTE ${tag} ${STAMP}`, slug: `zz-pcte-${tag.toLowerCase()}-${STAMP}`, code: `ZPT${tag[0]}${SUFFIX}`, contactEmail: EMAIL(`${tag}-office`), timezone: "Asia/Kolkata", kind, isTestFixture: true }, select: { id: true } });
  ids.college = (await school("College", "COLLEGE")).id;
  ids.school = (await school("School", "SCHOOL")).id;
  await db.schoolModule.create({ data: { schoolId: ids.college, module: "ACADEMICS" } });
  const person = async (key: string, schoolId: string, role: string) => {
    const userId = (await db.user.create({ data: { name: `ZZ PCTE ${key}`, email: EMAIL(key), isTestFixture: true, ...(role === "STUDENT" ? { birthdate: new Date("2005-01-15T00:00:00Z") } : {}) }, select: { id: true } })).id;
    const membershipId = (await db.membership.create({ data: { userId, schoolId, role, status: "ACTIVE", ...(role === "STUDENT" ? { studentCode: `ZPT${key.slice(0, 5)}${SUFFIX}` } : {}) }, select: { id: true } })).id;
    P[key] = { userId, membershipId, schoolId };
  };
  await person("Faculty", ids.college, "FACULTY");
  await person("Hod", ids.college, "HOD");
  await person("Student", ids.college, "STUDENT");
  await person("Other", ids.college, "FACULTY");
  ids.klass = (await db.class.create({ data: { schoolId: ids.college, name: "ZZ PCTE FY · A", gradeLevel: "6", joinCode: `ZPTC${SUFFIX}` }, select: { id: true } })).id;
  // The faculty member was invited with the division's class, as acceptance writes it for FACULTY and HOD; the HOD takes it too.
  await db.classTeacher.createMany({ data: [{ classId: ids.klass, schoolId: ids.college, teacherMembershipId: P.Faculty!.membershipId, role: "LEAD" }, { classId: ids.klass, schoolId: ids.college, teacherMembershipId: P.Hod!.membershipId }] });
  await db.enrollment.create({ data: { classId: ids.klass, schoolId: ids.college, studentMembershipId: P.Student!.membershipId, status: "ACTIVE" } });

  // The school side of TA-433: a guardian and their child.
  await person("Child", ids.school, "STUDENT");
  ids.child = P.Child!.membershipId;
  P.Guardian = { userId: (await db.user.create({ data: { name: "ZZ PCTE Guardian", email: EMAIL("Guardian"), isTestFixture: true }, select: { id: true } })).id, membershipId: "", schoolId: "" };
  await db.guardianship.create({ data: { parentUserId: P.Guardian.userId, studentMembershipId: ids.child, studentSchoolId: ids.school, relation: "PARENT", status: "ACTIVE" } });
});

afterEach(() => {
  __resetCookies();
  __setHeaders({});
});

afterAll(async () => {
  const schools = [ids.college, ids.school];
  const users = Object.values(P).map((p) => p.userId);
  await db.session.deleteMany({ where: { userId: { in: users } } });
  await db.notification.deleteMany({ where: { OR: [{ schoolId: { in: schools } }, { userId: { in: users } }] } });
  await db.guardianship.deleteMany({ where: { studentSchoolId: { in: schools } } });
  await db.auditLog.deleteMany({ where: { schoolId: { in: schools } } });
  await db.school.deleteMany({ where: { id: { in: schools } } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
});

describe("TA-212: a college student's thread with a faculty member", () => {
  let threadId = "";

  it("TA-212: the faculty member it was opened with reads it, finds it in their list, and answers it", async () => {
    threadId = (await createThread(ctxOf(P.Student!, "STUDENT"), { teacherMembershipId: P.Faculty!.membershipId, subject: "ZZ PCTE a question", body: "ZZ PCTE When is the practical?" })).threadId;
    const thread = await getThread(ctxOf(P.Faculty!, "FACULTY"), threadId);
    expect(thread.teacher.membershipId).toBe(P.Faculty!.membershipId);
    expect((await listThreads(ctxOf(P.Faculty!, "FACULTY"))).map((t) => t.id)).toContain(threadId);
    await replyToThread(ctxOf(P.Faculty!, "FACULTY"), { threadId, body: "ZZ PCTE On Friday." });
    expect(await db.remarkMessage.count({ where: { threadId, authorUserId: P.Faculty!.userId } })).toBe(1);
  });

  it("TA-212: through the door, as a FACULTY session, it is a 200 with the thread", async () => {
    __setHeaders({ "x-edulink-route": `GET /api/v1/shared/threads/${threadId}` });
    await createSession(P.Faculty!.userId, { schoolId: ids.college, role: "FACULTY" });
    const res = await threadGet(new Request(`http://localhost/api/v1/shared/threads/${threadId}`), { params: Promise.resolve({ threadId }) });
    expect(res.status).toBe(200);
    expect(((await res.json()) as { id: string }).id).toBe(threadId);
  });

  it("TA-212: an HOD reads a thread opened with them, and another faculty member reads neither", async () => {
    const hodThread = (await createThread(ctxOf(P.Student!, "STUDENT"), { teacherMembershipId: P.Hod!.membershipId, subject: "ZZ PCTE to the HOD", body: "ZZ PCTE A word." })).threadId;
    expect((await getThread(ctxOf(P.Hod!, "HOD"), hodThread)).id).toBe(hodThread);
    expect((await listThreads(ctxOf(P.Hod!, "HOD"))).map((t) => t.id)).toEqual([hodThread]);
    await expect(getThread(ctxOf(P.Other!, "FACULTY"), threadId)).rejects.toMatchObject({ key: "access.threadNotFound" });
    expect(await listThreads(ctxOf(P.Other!, "FACULTY"))).toEqual([]);
  });
});

describe("TA-433: a guardian's stream after their link to the child ends", () => {
  const decoder = new TextDecoder();

  it("TA-433: the stream says its channels changed and ends; the child's bus is no longer heard on it", async () => {
    await createSession(P.Guardian!.userId, { schoolId: null, role: "PARENT" });
    const controller = new AbortController();
    const res = await eventsGet(new Request("http://localhost/api/v1/events", { signal: controller.signal }));
    expect(res.status).toBe(200);
    const reader = res.body!.getReader();
    let text = "";
    const until = async (pattern: RegExp, ms: number) => {
      const deadline = Date.now() + ms;
      while (!pattern.test(text) && Date.now() < deadline) {
        const chunk = await Promise.race([reader.read(), new Promise<"t">((r) => setTimeout(() => r("t"), Math.max(0, deadline - Date.now())))]);
        if (chunk === "t" || chunk.done) break;
        text += decoder.decode(chunk.value);
      }
      return pattern.test(text);
    };
    try {
      expect(await until(/event: ready/, 2_000)).toBe(true);
      expect(text).toContain(channel.student(ids.child));
      await db.guardianship.updateMany({ where: { parentUserId: P.Guardian!.userId, studentMembershipId: ids.child }, data: { status: "REVOKED" } });
      expect(await until(/event: channels\.changed/, 3_000)).toBe(true);
      publish([channel.student(ids.child)], { type: "transport.position", lat: 18.5, lng: 73.8 } as never);
      await until(/event: transport\.position/, 400);
      expect(text).not.toContain("event: transport.position");
    } finally {
      controller.abort();
    }
  });
});
