/**
 * Four Low findings of the testing analysis of 13 November 2026 in the website and social area, each held by a case
 * that fails while the defect stands.
 *
 *   TA-395  A college's directory profile counted TEACHER and PRINCIPAL memberships as its teachers, so a college with
 *           sixty faculty showed its head alone (and a person in two counted roles was counted twice).
 *   TA-396  The daily Meta check marked a sound connection "reconnect" on any answer that was not a network failure,
 *           a rate limit or a bad minute at Meta included.
 *   TA-429  A custom page near the size limit was cut after escaping, mid-entity and with its closing tags lost.
 *   TA-423  The website's enquiry form and the expert application door capped a body by its declared length only, so
 *           a body sent with no length was read and parsed whole.
 *
 * Scratch ZZ schools and people of this suite's own through the owner connection (the stamp in every name), removed
 * afterwards; Meta is a fetch fake.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { readSchoolProfile } from "@/lib/school-profile";
import { refreshSocialConnections } from "@/lib/social";
import { sanitiseRichText, SITE_RICH_TEXT_MAX } from "@/lib/site-rich-text";
import { siteEnquiry } from "@/lib/site-host-routes";
import { POST as expertApply } from "@/app/api/v1/public/expert-applications/route";
import { EXPERT_APPLICATION_DOCUMENT_MAX_BYTES } from "@edulink/contracts";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-tawsm-${who}-${STAMP}@test.invalid`;
const ids = { college: "", social: "", f1: "", f2: "", head: "", admin: "" };
const savedKey = process.env.FEES_SECRET_KEY;

async function as(userId: string, role: string, schoolId: string): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, { schoolId, role: role as never });
  return (await getSession())!;
}

/** A body that arrives as a stream with no declared length, as a chunked upload does. */
function streamed(total: number, chunk = 4096): ReadableStream<Uint8Array> {
  let sent = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (sent >= total) return controller.close();
      const n = Math.min(chunk, total - sent);
      sent += n;
      controller.enqueue(new TextEncoder().encode("x".repeat(n)));
    },
  });
}

beforeAll(async () => {
  if (!process.env.FEES_SECRET_KEY) process.env.FEES_SECRET_KEY = randomBytes(32).toString("base64");
  const school = (key: string, extra: object) =>
    db.school.create({ data: { name: `ZZ TA Misc ${key} ${STAMP}`, slug: `zz-tawsm-${key.toLowerCase()}-${STAMP}`, code: `ZTWM${key[0]}${String(STAMP).slice(-6)}`, contactEmail: MAIL(`office-${key}`), timezone: "Asia/Kolkata", isTestFixture: true, ...extra }, select: { id: true } });
  ids.college = (await school("College", { kind: "COLLEGE", profilePublishedAt: new Date() })).id;
  ids.social = (await school("Social", {})).id;
  const user = (who: string) => db.user.create({ data: { name: `ZZ TA Misc ${who}`, email: MAIL(who.toLowerCase()), isTestFixture: true }, select: { id: true } });
  ids.f1 = (await user("FacultyOne")).id;
  ids.f2 = (await user("FacultyTwo")).id;
  ids.head = (await user("Head")).id;
  ids.admin = (await user("Admin")).id;
  await db.membership.createMany({
    data: [
      { userId: ids.f1, schoolId: ids.college, role: "FACULTY", status: "ACTIVE" },
      { userId: ids.f1, schoolId: ids.college, role: "HOD", status: "ACTIVE" },
      { userId: ids.f2, schoolId: ids.college, role: "FACULTY", status: "ACTIVE" },
      { userId: ids.head, schoolId: ids.college, role: "PRINCIPAL", status: "ACTIVE" },
      { userId: ids.admin, schoolId: ids.social, role: "ADMIN", status: "ACTIVE" },
    ],
  });
  const { seal } = await import("@/lib/secret-box");
  await db.socialConnection.create({ data: { schoolId: ids.social, pageId: `zz-tawsm-page-${STAMP}`, pageName: "ZZ TA Misc Page", pageTokenSealed: seal("zz-page-token", `social:${ids.social}:page-token`), connectedByUserId: ids.admin, error: null } });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  if (savedKey === undefined) delete process.env.FEES_SECRET_KEY;
  else process.env.FEES_SECRET_KEY = savedKey;
  const schools = [ids.college, ids.social];
  await db.auditLog.deleteMany({ where: { schoolId: { in: schools } } });
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.school.deleteMany({ where: { id: { in: schools } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("TA-395: a college's directory profile", () => {
  it("TA-395: counts the distinct people in every teaching role, as the website does", async () => {
    const profile = await readSchoolProfile(await as(ids.f2, "FACULTY", ids.college), ids.college);
    expect(profile).not.toBeNull();
    // FacultyOne (FACULTY and HOD, counted once), FacultyTwo and the head.
    expect(profile!.metrics.teachers).toBe(3);
  });
});

describe("TA-396: the daily Meta check", () => {
  const cfg = { appId: "zz-meta-app", appSecret: "zz-meta-secret", graphBase: "https://graph.zz-meta.test/v23.0", dialogBase: "https://www.zz-meta.test/v23.0" };
  const answering = (status: number, body: unknown) => async () => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  const scope = () => ({ schoolIds: [ids.social] });
  const state = () => db.socialConnection.findUniqueOrThrow({ where: { schoolId: ids.social }, select: { error: true } });
  const audits = () => db.auditLog.count({ where: { schoolId: ids.social, action: "social.connection.status" } });

  it("TA-396: leaves a sound connection alone when Meta answers with a server error or a rate limit", async () => {
    const out = await refreshSocialConnections({ now: new Date(), fetchImpl: answering(500, { error: { message: "An unexpected error has occurred.", code: 2 } }), cfg }, scope());
    expect(out.reconnect).toBe(0);
    expect((await state()).error).toBeNull();
    await refreshSocialConnections({ now: new Date(), fetchImpl: answering(400, { error: { message: "Application request limit reached", code: 4 } }), cfg }, scope());
    expect((await state()).error).toBeNull();
    expect(await audits()).toBe(0);
  });

  it("TA-396: still marks a refused token, and a permission taken away, as reconnect", async () => {
    expect(await refreshSocialConnections({ now: new Date(), fetchImpl: answering(400, { error: { message: "The session has been invalidated.", code: 190 } }), cfg }, scope())).toMatchObject({ reconnect: 1 });
    expect((await state()).error).toBe("RECONNECT");
    await db.socialConnection.update({ where: { schoolId: ids.social }, data: { error: null } });
    expect(await refreshSocialConnections({ now: new Date(), fetchImpl: answering(403, { error: { message: "Permission denied", code: 200 } }), cfg }, scope())).toMatchObject({ reconnect: 1 });
    expect((await state()).error).toBe("RECONNECT");
  });
});

describe("TA-429: a custom page near the size limit", () => {
  it("TA-429: stays within the limit with its tags closed and no entity cut in half", () => {
    const out = sanitiseRichText(`<p><a href="https://ok.test/">${"'".repeat(19_000)}</a></p>`);
    expect(out.length).toBeLessThanOrEqual(SITE_RICH_TEXT_MAX);
    expect(out.startsWith('<p><a href="https://ok.test/" rel="noopener">')).toBe(true);
    expect(out.endsWith("</a></p>")).toBe(true);
    // Every & begins a whole entity.
    expect(out.replace(/&(amp|lt|gt|quot|#39);/g, "")).not.toContain("&");
    expect(sanitiseRichText(out)).toBe(out);
  });

  it("TA-429: cuts a long list of escaped words within the limit and closes the list", () => {
    const items = Array.from({ length: 2_000 }, (_, i) => `<li>Item "${i}" & more</li>`).join("");
    const out = sanitiseRichText(`<ul>${items}</ul>`.slice(0, SITE_RICH_TEXT_MAX));
    expect(out.length).toBeLessThanOrEqual(SITE_RICH_TEXT_MAX);
    expect(out.endsWith("</ul>")).toBe(true);
    expect(out.replace(/&(amp|lt|gt|quot|#39);/g, "")).not.toContain("&");
    expect(sanitiseRichText(out)).toBe(out);
  });
});

describe("TA-423: signed-out bodies with no declared length", () => {
  it("TA-423: the website's enquiry form refuses a body past its cap without parsing it", async () => {
    const host = `www.zz-tawsm-nobody-${STAMP}.test`;
    const fields = new URLSearchParams({ name: "ZZ TA Parent", contact: "parent@zz-tawsm.test", grade: "5", message: "Hello", lang: "en" }).toString();
    const body = `${fields}&pad=${"x".repeat(20 * 1024)}`;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const bytes = new TextEncoder().encode(body);
        for (let i = 0; i < bytes.length; i += 4096) controller.enqueue(bytes.subarray(i, i + 4096));
        controller.close();
      },
    });
    const request = new Request("http://localhost/enquiry", { method: "POST", headers: { host, "content-type": "application/x-www-form-urlencoded" }, body: stream, duplex: "half" } as RequestInit);
    expect(request.headers.get("content-length")).toBeNull();
    const res = await siteEnquiry(request, host);
    // Refused for what was sent (the form's own 422), not taken as a form for a host that is nobody's (404).
    expect(res.status).toBe(422);
  });

  it("TA-423: the expert application door refuses a body past its cap without parsing it", async () => {
    const total = EXPERT_APPLICATION_DOCUMENT_MAX_BYTES + 200 * 1024;
    const request = new Request("http://localhost/api/v1/public/expert-applications", { method: "POST", headers: { "content-type": "multipart/form-data; boundary=zzboundary" }, body: streamed(total, 64 * 1024), duplex: "half" } as RequestInit);
    expect(request.headers.get("content-length")).toBeNull();
    const res = await expertApply(request);
    expect(res.status).toBe(413);
  });
});
