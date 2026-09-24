/**
 * Uploading from the phone, and the one rule that makes it safe: a file may
 * be attached to a post only by the person who uploaded it, and only once.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { POST as uploadPost } from "@/app/api/v1/uploads/route";
import { POST as bulletinPost } from "@/app/api/v1/shared/bulletin/route";
import { deleteStoredFile, MAX_VIDEO_BYTES } from "@/lib/storage";
import { UPLOAD_BYTES_DAILY } from "@/lib/rate-limit";

const db = new PrismaClient();
const STAMP = Date.now();
let schoolId = "";
let teacherId = "";
let otherTeacherId = "";
const storedIds: string[] = [];

// A 1×1 transparent PNG — enough for the sniffer to say "image/png".
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

function multipart(name = "zz.png") {
  const form = new FormData();
  form.set("file", new File([new Uint8Array(PNG)], name, { type: "image/png" }));
  return new Request("http://localhost/api/v1/uploads", { method: "POST", body: form });
}
const json = (body: unknown) =>
  new Request("http://localhost/api/v1/shared/bulletin", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

beforeAll(async () => {
  const school = await db.school.create({
    data: { name: `ZZ Uploads ${STAMP}`, slug: `zz-uploads-${STAMP}`, code: `ZU${String(STAMP).slice(-6)}`, contactEmail: `zz-uploads-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" },
    select: { id: true },
  });
  schoolId = school.id;
  const [a, b] = await Promise.all([
    db.user.create({ data: { name: "ZZ Upload Teacher", email: `zz-uploads-a-${STAMP}@test.invalid` }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ Other Teacher", email: `zz-uploads-b-${STAMP}@test.invalid` }, select: { id: true } }),
  ]);
  teacherId = a.id;
  otherTeacherId = b.id;
  await db.membership.createMany({ data: [{ userId: a.id, schoolId, role: "TEACHER", status: "ACTIVE" }, { userId: b.id, schoolId, role: "TEACHER", status: "ACTIVE" }] });
});

afterAll(async () => {
  __resetCookies();
  for (const id of storedIds) await deleteStoredFile(id).catch(() => {});
  await db.session.deleteMany({ where: { userId: { in: [teacherId, otherTeacherId] } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { id: { in: [teacherId, otherTeacherId] } } });
  await db.$disconnect();
});

describe("uploads", () => {
  it("signed out is 401; a real image stores and writes a ticket for the uploader", async () => {
    __resetCookies();
    expect((await uploadPost(multipart())).status).toBe(401);
    await createSession(teacherId, { schoolId, role: "TEACHER" });
    const res = await uploadPost(multipart());
    expect(res.status).toBe(201);
    const body = (await res.json()) as { fileId: string; mime: string };
    storedIds.push(body.fileId);
    expect(body.mime).toBe("image/png");
    const ticket = await db.uploadTicket.findUniqueOrThrow({ where: { fileId: body.fileId } });
    expect(ticket.userId).toBe(teacherId);
    expect(ticket.consumedAt).toBeNull();
  });

  it("a file attaches once, by its uploader only", async () => {
    __resetCookies();
    await createSession(teacherId, { schoolId, role: "TEACHER" });
    const up = (await (await uploadPost(multipart("zz-two.png"))).json()) as { fileId: string };
    storedIds.push(up.fileId);
    const media = [{ fileId: up.fileId, alt: "ZZ drawing", kind: "image" }];

    // Somebody else, who has seen the id, cannot make it theirs.
    __resetCookies();
    await createSession(otherTeacherId, { schoolId, role: "TEACHER" });
    const theft = await bulletinPost(json({ scope: "SCHOOL", title: "ZZ not mine", body: "", tags: [], media }));
    expect(theft.status).toBe(404);

    __resetCookies();
    await createSession(teacherId, { schoolId, role: "TEACHER" });
    const mine = await bulletinPost(json({ scope: "SCHOOL", title: "ZZ mine", body: "", tags: [], media }));
    expect(mine.status).toBe(201);
    expect((await db.uploadTicket.findUniqueOrThrow({ where: { fileId: up.fileId } })).consumedAt).not.toBeNull();

    // And not twice: the ticket is spent.
    const again = await bulletinPost(json({ scope: "SCHOOL", title: "ZZ again", body: "", tags: [], media }));
    expect(again.status).toBe(404);

    // A made-up id is the same 404 — an attacker learns nothing from the difference.
    const invented = await bulletinPost(json({ scope: "SCHOOL", title: "ZZ invented", body: "", tags: [], media: [{ fileId: "00000000-0000-4000-8000-000000000000.png", alt: "x", kind: "image" }] }));
    expect(invented.status).toBe(404);
  });

  it("a body declared larger than anything accepted is 413 before a byte of it is read", async () => {
    await createSession(teacherId, { schoolId, role: "TEACHER" });
    // A zero high-water mark: `pull` runs only when somebody reads, not on construction.
    let read = false;
    const body = new ReadableStream<Uint8Array>(
      {
        pull(controller) {
          read = true;
          controller.enqueue(new Uint8Array(PNG));
          controller.close();
        },
      },
      { highWaterMark: 0 },
    );
    const res = await uploadPost(
      new Request("http://localhost/api/v1/uploads", { method: "POST", body, duplex: "half", headers: { "content-length": String(MAX_VIDEO_BYTES * 2), "content-type": "multipart/form-data; boundary=zz" } } as RequestInit),
    );
    expect(res.status).toBe(413);
    expect(read).toBe(false);
    expect((await res.json()).issues.file).toContain("too large");
  });

  it("a person's day is capped by the sizes of what they stored in the last twenty-four hours", async () => {
    await createSession(otherTeacherId, { schoolId, role: "TEACHER" });
    const before = await db.uploadTicket.count({ where: { userId: otherTeacherId } });
    // Five tickets of a hundred megabytes each, minted directly: the day is full.
    await db.uploadTicket.createMany({ data: Array.from({ length: 5 }, (_, i) => ({ userId: otherTeacherId, fileId: `zz-quota-${STAMP}-${i}.mp4`, mime: "video/mp4", size: UPLOAD_BYTES_DAILY.limit / 5 })) });
    try {
      const res = await uploadPost(multipart());
      expect(res.status).toBe(429);
      expect((await res.json()).code).toBe("RATE_LIMITED");
      expect(await db.uploadTicket.count({ where: { userId: otherTeacherId } })).toBe(before + 5);
    } finally {
      await db.uploadTicket.deleteMany({ where: { fileId: { startsWith: `zz-quota-${STAMP}-` } } });
    }
  });
});
