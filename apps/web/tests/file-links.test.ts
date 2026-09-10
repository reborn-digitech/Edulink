import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { fileLinkSchema } from "@edulink/contracts";
import { createSession } from "@/lib/session";
import { deleteStoredFile, storeFile } from "@/lib/storage";
import { FILE_LINK_TTL_SECONDS, signFileLink, verifyFileLink } from "@/lib/file-links";
import { __resetCookies } from "../tests/stubs/next-headers";
import { GET as fileGet } from "@/app/api/files/[fileId]/route";
import { POST as linkPost } from "@/app/api/v1/files/[fileId]/link/route";

/**
 * Five-minute file links (src/lib/file-links.ts): the way the phone opens a
 * PDF in its browser, which carries no bearer token.
 *
 * The file under test is stored for real and referenced by NOTHING — no
 * submission, handout, post or logo — so without a link nobody may read it.
 * A valid link opens exactly it; a link for another file, a tampered one and
 * an expired one open nothing. A logo (readable by anyone) proves the happy
 * path of asking for a link. ZZ rows and files only, removed afterwards.
 */
const db = new PrismaClient();
const STAMP = Date.now();
const PDF = new TextEncoder().encode("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");

let orphanId = "";
let logoId = "";
let schoolId = "";
let userId = "";

function fileRequest(fileId: string, token?: string) {
  const url = `http://localhost:3000/api/files/${encodeURIComponent(fileId)}${token ? `?t=${encodeURIComponent(token)}` : ""}`;
  return fileGet(new Request(url), { params: Promise.resolve({ fileId }) });
}

function linkRequest(fileId: string) {
  return linkPost(new Request(`http://localhost:3000/api/v1/files/${encodeURIComponent(fileId)}/link`, { method: "POST" }), { params: Promise.resolve({ fileId }) });
}

beforeAll(async () => {
  orphanId = (await storeFile(new File([PDF], "zz-orphan.pdf", { type: "application/pdf" }))).fileId;
  logoId = (await storeFile(new File([PDF], "zz-logo.pdf", { type: "application/pdf" }))).fileId;
  const school = await db.school.create({
    data: { name: `ZZ File Links ${STAMP}`, slug: `zz-file-links-${STAMP}`, code: `ZF${String(STAMP).slice(-6)}`, contactEmail: `zz-file-links-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", logoPath: logoId },
    select: { id: true },
  });
  schoolId = school.id;
  userId = (await db.user.create({ data: { name: "ZZ File Link Reader", email: `zz-file-link-${STAMP}@test.invalid` }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId } });
  await db.user.deleteMany({ where: { id: userId } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await Promise.all([orphanId, logoId].filter(Boolean).map((id) => deleteStoredFile(id)));
  await db.$disconnect();
});

describe("signing and checking a link", () => {
  it("a token opens only the file it was made for, only until it expires", () => {
    const now = Date.UTC(2026, 8, 10, 10, 0, 0);
    const link = signFileLink("zz-a.pdf", now)!;
    expect(link.expiresAt.getTime()).toBe(now + FILE_LINK_TTL_SECONDS * 1000);
    expect(verifyFileLink("zz-a.pdf", link.token, now)).toBe(true);
    expect(verifyFileLink("zz-b.pdf", link.token, now)).toBe(false);
    expect(verifyFileLink("zz-a.pdf", link.token, now + FILE_LINK_TTL_SECONDS * 1000 + 1)).toBe(false);
    const [exp, sig] = link.token.split(".");
    const flipped = `${exp}.${sig!.slice(0, -1)}${sig!.endsWith("A") ? "B" : "A"}`;
    expect(verifyFileLink("zz-a.pdf", flipped, now)).toBe(false);
    // An expiry pushed later than any link can live is refused, even with a signature for it.
    const longLived = signFileLink("zz-a.pdf", now, 86_400)!;
    expect(verifyFileLink("zz-a.pdf", longLived.token, now)).toBe(false);
    expect(verifyFileLink("zz-a.pdf", null, now)).toBe(false);
    expect(verifyFileLink("zz-a.pdf", "not-a-token", now)).toBe(false);
  });
});

describe("the file route with a link", () => {
  it("an unreferenced file is 404 without a link, and served with one", async () => {
    __resetCookies();
    expect((await fileRequest(orphanId)).status).toBe(404);
    const link = signFileLink(orphanId)!;
    const res = await fileRequest(orphanId, link.token);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("pdf");
    expect(res.headers.get("cache-control")).toContain("private");
    expect(Buffer.from(await res.arrayBuffer()).subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("a link made for another file, a tampered link and an expired link open nothing", async () => {
    __resetCookies();
    expect((await fileRequest(orphanId, signFileLink(logoId)!.token)).status).toBe(404);
    const good = signFileLink(orphanId)!.token;
    expect((await fileRequest(orphanId, `${good}x`)).status).toBe(404);
    const expired = signFileLink(orphanId, Date.now() - (FILE_LINK_TTL_SECONDS + 5) * 1000)!.token;
    expect((await fileRequest(orphanId, expired)).status).toBe(404);
  });
});

describe("asking for a link", () => {
  it("signed out is 401", async () => {
    __resetCookies();
    expect((await linkRequest(logoId)).status).toBe(401);
  });

  it("a file this person may not read is 404, the same answer the file route gives", async () => {
    __resetCookies();
    await createSession(userId);
    const res = await linkRequest(orphanId);
    expect(res.status).toBe(404);
  });

  it("a file this person may read comes back as a five-minute link to the file route, which opens it", async () => {
    __resetCookies();
    await createSession(userId);
    const res = await linkRequest(logoId);
    expect(res.status).toBe(200);
    const body = fileLinkSchema.parse(await res.json());
    expect(body.url.startsWith(`/api/files/${encodeURIComponent(logoId)}?t=`)).toBe(true);
    const expires = new Date(body.expiresAt).getTime();
    expect(expires - Date.now()).toBeLessThanOrEqual(FILE_LINK_TTL_SECONDS * 1000);
    expect(expires - Date.now()).toBeGreaterThan((FILE_LINK_TTL_SECONDS - 30) * 1000);
    const token = new URL(body.url, "http://localhost:3000").searchParams.get("t")!;
    __resetCookies();
    expect((await fileRequest(logoId, token)).status).toBe(200);
  });
});
