import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Before the route module loads (imports are hoisted): a keep-alive every
// 150 ms, so the session recheck happens within the test.
vi.hoisted(() => {
  process.env.EVENTS_KEEPALIVE_MS = "150";
});
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { channel, publish } from "@/lib/realtime";
import { GET as eventsGet } from "@/app/api/v1/events/route";
import { __resetCookies } from "../tests/stubs/next-headers";

/**
 * Who the events stream lets hear what.
 *
 * The school channel carries every grade, register and remark thread in the
 * school. A parent whose session row named a school used to be subscribed
 * to it. Now a parent hears their own children and themselves; a pupil hears
 * themselves; staff hear the school. Held by opening the real stream with a
 * real session and publishing on the real bus.
 */

const db = new PrismaClient();
const STAMP = Date.now();

let schoolId = "";
let parentId = "";
let teacherId = "";
let teacherMembershipId = "";
let adminId = "";
let classId = "";
let child = "";
let otherPupil = "";

const decoder = new TextDecoder();

/** Opens the stream and hands back a reader of parsed SSE events plus a stop. */
async function open() {
  const controller = new AbortController();
  const res = await eventsGet(new Request("http://localhost/api/v1/events", { signal: controller.signal }));
  expect(res.status).toBe(200);
  const reader = res.body!.getReader();
  let buffer = "";
  // A read that timed out is still pending and will take the next chunk;
  // it is kept and awaited again rather than raced against a fresh one.
  let pending: Promise<ReadableStreamReadResult<Uint8Array>> | null = null;
  const next = async (timeoutMs: number): Promise<{ event: string; data: unknown } | "timeout"> => {
    // One deadline for the call: a keep-alive (skipped below) must not start it over.
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      const idx = buffer.indexOf("\n\n");
      if (idx >= 0) {
        const block = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        if (block.startsWith(":")) continue;
        const event = /^event: (.*)$/m.exec(block)?.[1] ?? "";
        const data = /^data: (.*)$/m.exec(block)?.[1];
        return { event, data: data ? JSON.parse(data) : null };
      }
      pending ??= reader.read();
      const chunk = await Promise.race([pending, new Promise<"timeout">((r) => setTimeout(() => r("timeout"), Math.max(0, deadline - Date.now())))]);
      if (chunk === "timeout") return "timeout";
      pending = null;
      if (chunk.done) return "timeout";
      buffer += decoder.decode(chunk.value);
    }
  };
  return { next, stop: () => controller.abort() };
}

beforeAll(async () => {
  schoolId = (
    await db.school.create({
      data: { name: `ZZ Events School ${STAMP}`, slug: `zz-events-${STAMP}`, code: `ZEV${String(STAMP).slice(-6)}`, contactEmail: `zz-events-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" },
      select: { id: true },
    })
  ).id;
  const mk = (who: string) => db.user.create({ data: { name: `ZZ Events ${who}`, email: `zz-events-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
  const [parent, teacher, p1, p2, admin] = await Promise.all([mk("Parent"), mk("Teacher"), mk("Child"), mk("Other"), mk("Admin")]);
  parentId = parent.id;
  teacherId = teacher.id;
  adminId = admin.id;
  teacherMembershipId = (await db.membership.create({ data: { userId: teacherId, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  await db.membership.create({ data: { userId: adminId, schoolId, role: "ADMIN", status: "ACTIVE" } });
  classId = (await db.class.create({ data: { schoolId, name: "ZZ Events 5A", gradeLevel: "5", section: "A", joinCode: `ZZEV${STAMP}` }, select: { id: true } })).id;
  await db.classTeacher.create({ data: { classId, schoolId, teacherMembershipId } });
  child = (await db.membership.create({ data: { userId: p1.id, schoolId, role: "STUDENT", status: "ACTIVE" }, select: { id: true } })).id;
  otherPupil = (await db.membership.create({ data: { userId: p2.id, schoolId, role: "STUDENT", status: "ACTIVE" }, select: { id: true } })).id;
  await db.guardianship.create({ data: { parentUserId: parentId, studentMembershipId: child, studentSchoolId: schoolId, status: "ACTIVE" } });
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.guardianship.deleteMany({ where: { studentSchoolId: schoolId } });
  await db.classTeacher.deleteMany({ where: { class: { schoolId } } });
  await db.class.deleteMany({ where: { schoolId } });
  await db.membership.deleteMany({ where: { schoolId } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("who hears what", () => {
  it("⚠ a parent, even with a school planted on the session, is not on the school channel and hears no other pupil's grade", async () => {
    __resetCookies();
    const id = await createSession(parentId, { schoolId: null, role: "PARENT" });
    await db.session.update({ where: { id }, data: { activeSchoolId: schoolId } });

    const stream = await open();
    try {
      const ready = await stream.next(2_000);
      expect(ready).not.toBe("timeout");
      const channels = (ready as { data: { channels: string[] } }).data.channels;
      expect(channels).toContain(channel.user(parentId));
      expect(channels).toContain(channel.student(child));
      expect(channels).not.toContain(channel.school(schoolId));

      // Another pupil's grade, on the school channel as the grading code publishes it.
      publish([channel.student(otherPupil), channel.school(schoolId)], { type: "grade.updated", studentMembershipId: otherPupil, assignmentId: "zz-a" });
      expect(await stream.next(300)).toBe("timeout");

      // Their own child's, published the same way, arrives.
      publish([channel.student(child), channel.school(schoolId)], { type: "grade.updated", studentMembershipId: child, assignmentId: "zz-b" });
      const got = await stream.next(2_000);
      expect(got).not.toBe("timeout");
      expect((got as { data: { studentMembershipId: string } }).data.studentMembershipId).toBe(child);
    } finally {
      stream.stop();
    }
  });

  it("one session holds four streams, not a hundred, and a stream ends when its session is revoked", async () => {
    __resetCookies();
    const id = await createSession(teacherId, { schoolId, role: "TEACHER" });
    const streams = [];
    for (let i = 0; i < 4; i++) {
      const s = await open();
      expect(await s.next(2_000)).not.toBe("timeout");
      streams.push(s);
    }
    try {
      const fifth = await eventsGet(new Request("http://localhost/api/v1/events"));
      expect(fifth.status).toBe(429);
      // Closing one makes room for one.
      streams.pop()!.stop();
      await new Promise((r) => setTimeout(r, 50));
      const again = await open();
      streams.push(again);
      expect(await again.next(2_000)).not.toBe("timeout");

      // "Sign out everywhere": the stream hears it at the next keep-alive check, not when the tab closes.
      await db.session.update({ where: { id }, data: { revokedAt: new Date() } });
      let ended = false;
      for (let i = 0; i < 10 && !ended; i++) {
        const got = await again.next(1_000);
        if (got !== "timeout" && got.event === "session.ended") ended = true;
      }
      expect(ended).toBe(true);
    } finally {
      for (const s of streams) s.stop();
    }
  });

  it("a teacher hears their own classes and threads, not the whole school; the office hears the school", async () => {
    __resetCookies();
    await createSession(teacherId, { schoolId, role: "TEACHER" });
    const stream = await open();
    try {
      const ready = await stream.next(2_000);
      const channels = (ready as { data: { channels: string[] } }).data.channels;
      expect(channels).not.toContain(channel.school(schoolId));
      expect(channels).toContain(channel.class(classId));
      expect(channels).toContain(channel.staff(teacherMembershipId));
      // Another class's register, published as the register code does: not theirs.
      publish([channel.class("zz-other-class"), channel.school(schoolId)], { type: "attendance.updated", classId: "zz-other-class", dateKey: "2026-09-24" });
      expect(await stream.next(300)).toBe("timeout");
      // Their own class's: heard.
      publish([channel.class(classId), channel.school(schoolId)], { type: "attendance.updated", classId, dateKey: "2026-09-24" });
      const got = await stream.next(2_000);
      expect((got as { event: string }).event).toBe("attendance.updated");
    } finally {
      stream.stop();
    }

    __resetCookies();
    await createSession(adminId, { schoolId, role: "ADMIN" });
    const office = await open();
    try {
      const ready = await office.next(2_000);
      const channels = (ready as { data: { channels: string[] } }).data.channels;
      expect(channels).toContain(channel.school(schoolId));
      publish([channel.class("zz-other-class"), channel.school(schoolId)], { type: "attendance.updated", classId: "zz-other-class", dateKey: "2026-09-24" });
      expect((await office.next(2_000) as { event: string }).event).toBe("attendance.updated");
    } finally {
      office.stop();
    }
  });
});
