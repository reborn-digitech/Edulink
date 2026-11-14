/**
 * TA-225 of the testing analysis of 13 November 2026, as the owner decided it on 14 November 2026 (option 1): a news
 * post's first picture went on the public site, and became a public file, with no consent tick, and the first draft
 * chose six posts with their pictures for the office, while the contract says a site never shows a picture without the
 * admin's consent tick (decision 0002). Now each news picture carries its own tick, stamped with who and when as the
 * Gallery's are; a news item goes public with its words alone until the tick; an unticked news picture keeps the Ready
 * to publish list's PICTURE_CONSENT open; the first draft still proposes the six latest posts, without pictures.
 *
 * As tests/ta-website-social-site.test.ts: the owner connection, one scratch ZZ school of this suite's own with its own
 * people and posts (the stamp in every name), removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { loadSite, publishSite, saveSite } from "@/lib/site-admin";
import { publishedSiteFor } from "@/lib/site-publish";
import { authorizeFileRead } from "@/lib/files";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-ta225-${who}-${STAMP}@test.invalid`;
const PIC = (n: number) => `zz-ta225-pic-${n}-${STAMP}`;
const SECOND = `zz-ta225-second-${STAMP}`;
const TITLE = (n: number) => `ZZ TA225 News ${n} ${STAMP}`;
const ids = { school: "", admin: "", head: "", posts: [] as string[] };

async function as(userId: string, role: string, schoolId: string): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, { schoolId, role: role as never });
  const ctx = await getSession();
  if (!ctx) throw new Error("no session");
  return ctx;
}
function signedOut() {
  __resetCookies();
  __setHeaders({});
}
async function allHtml(): Promise<string> {
  const live = await publishedSiteFor(ids.school);
  if (!live) throw new Error("no live site");
  return [live.html.en, ...Object.values(live.pages).map((p) => p.en)].join("\n");
}
const consentDone = (checklist: { code: string; done: boolean }[]) => checklist.find((c) => c.code === "PICTURE_CONSENT")?.done;

beforeAll(async () => {
  ids.school = (
    await db.school.create({ data: { name: `ZZ TA225 Site ${STAMP}`, slug: `zz-ta225-${STAMP}`, code: `ZT225${String(STAMP).slice(-6)}`, contactEmail: MAIL("office"), timezone: "Asia/Kolkata", profileAbout: "A ZZ school for TA-225.", isTestFixture: true }, select: { id: true } })
  ).id;
  await db.schoolModule.create({ data: { schoolId: ids.school, module: "WEBSITE" } });
  ids.admin = (await db.user.create({ data: { name: "ZZ TA225 Admin", email: MAIL("admin"), isTestFixture: true }, select: { id: true } })).id;
  ids.head = (await db.user.create({ data: { name: "ZZ TA225 Head", email: MAIL("head"), isTestFixture: true }, select: { id: true } })).id;
  await db.membership.createMany({
    data: [
      { userId: ids.admin, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" },
      { userId: ids.head, schoolId: ids.school, role: "PRINCIPAL", status: "ACTIVE" },
    ],
  });
  // Seven approved school-wide posts, each with a picture, one minute apart: posts[0] the oldest, posts[6] the newest.
  for (let n = 0; n < 7; n++) {
    const media = [{ fileId: PIC(n), kind: "image", alt: `Picture ${n}` }, ...(n === 6 ? [{ fileId: SECOND, kind: "image", alt: "Second picture" }] : [])];
    const post = await db.post.create({
      data: { schoolId: ids.school, authorUserId: ids.admin, scope: "SCHOOL", title: TITLE(n), body: `News ${n}, in words.`, media: JSON.stringify(media), status: "APPROVED", createdAt: new Date(Date.now() - (7 - n) * 60_000) },
      select: { id: true },
    });
    ids.posts.push(post.id);
  }
});

afterAll(async () => {
  signedOut();
  await db.notification.deleteMany({ where: { schoolId: ids.school } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId: ids.school }, { targetId: ids.school }] } });
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("TA-225: a news picture goes public only with its consent tick", () => {
  it("TA-225: the first draft proposes the six latest posts' words, without their pictures, and Ready to publish says the pictures wait", async () => {
    expect(await db.schoolSite.count({ where: { schoolId: ids.school } })).toBe(0);
    const view = await loadSite(await as(ids.admin, "ADMIN", ids.school));
    expect(view.config.newsPostIds).toEqual([...ids.posts].reverse().slice(0, 6));
    // The six pictures wait for their ticks: the list does not read complete.
    expect(consentDone(view.checklist)).toBe(false);
    expect(view.config.newsPictures).toEqual([]);

    await publishSite(await as(ids.admin, "ADMIN", ids.school));
    const html = await allHtml();
    for (let n = 1; n < 7; n++) {
      expect(html).toContain(TITLE(n));
      expect(html).not.toContain(PIC(n));
    }
    const live = await db.schoolSiteVersion.findFirstOrThrow({ where: { schoolId: ids.school, liveAt: { not: null } }, select: { imageFileIds: true } });
    for (let n = 0; n < 7; n++) expect(live.imageFileIds).not.toContain(PIC(n));
    signedOut();
    expect(await authorizeFileRead(PIC(6), null)).toMatchObject({ allowed: false });
  });

  it("TA-225: the office's tick puts the picture on the site, stamped by the server with who and when", async () => {
    const before = Date.now();
    // A stamp the form sends is never taken: the server writes who ticked and when.
    const saved = await saveSite(await as(ids.admin, "ADMIN", ids.school), {
      newsPictures: [{ postId: ids.posts[6]!, fileId: PIC(6), consent: true, consentByUserId: ids.head, consentAt: "2020-01-01T00:00:00.000Z" }],
    });
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const tick = saved.config.newsPictures.find((p) => p.postId === ids.posts[6]);
    expect(tick).toMatchObject({ fileId: PIC(6), consent: true, consentByUserId: ids.admin });
    expect(Date.parse(tick!.consentAt!)).toBeGreaterThanOrEqual(before - 1000);

    // Five pictures still wait.
    expect(consentDone((await loadSite(await as(ids.admin, "ADMIN", ids.school))).checklist)).toBe(false);

    await publishSite(await as(ids.admin, "ADMIN", ids.school));
    const html = await allHtml();
    expect(html).toContain(PIC(6));
    expect(html).not.toContain(PIC(5));
    // The post's second picture is not the news item's: it stays off.
    expect(html).not.toContain(SECOND);
    signedOut();
    expect(await authorizeFileRead(PIC(6), null)).toMatchObject({ allowed: true, public: true });
    expect(await authorizeFileRead(PIC(5), null)).toMatchObject({ allowed: false });
    // The published snapshot records the tick, as it records the Gallery's.
    const live = await db.schoolSiteVersion.findFirstOrThrow({ where: { schoolId: ids.school, liveAt: { not: null } }, select: { snapshotJson: true } });
    const snapshot = JSON.parse(live.snapshotJson) as { newsPictures?: { postId: string; fileId: string; consentByUserId: string | null; consentAt: string | null }[] };
    expect(snapshot.newsPictures).toEqual([{ postId: ids.posts[6], fileId: PIC(6), consentByUserId: ids.admin, consentAt: tick!.consentAt }]);
  });

  it("TA-225: with every news picture ticked, PICTURE_CONSENT is done", async () => {
    const ctx = await as(ids.admin, "ADMIN", ids.school);
    const { config } = await loadSite(ctx);
    const saved = await saveSite(ctx, { newsPictures: [...config.newsPictures, ...ids.posts.slice(1, 6).map((postId, i) => ({ postId, fileId: PIC(i + 1), consent: true }))] });
    expect(saved.ok).toBe(true);
    expect(consentDone((await loadSite(await as(ids.admin, "ADMIN", ids.school))).checklist)).toBe(true);
  });

  it("TA-225: another person's save keeps the stamp; unticking takes the picture off the site", async () => {
    const was = (await loadSite(await as(ids.admin, "ADMIN", ids.school))).config.newsPictures.find((p) => p.postId === ids.posts[6])!;
    const byHead = await saveSite(await as(ids.head, "PRINCIPAL", ids.school), { motto: "Learning together" });
    expect(byHead.ok).toBe(true);
    if (!byHead.ok) return;
    expect(byHead.config.newsPictures.find((p) => p.postId === ids.posts[6])).toEqual(was);

    const unticked = await saveSite(await as(ids.admin, "ADMIN", ids.school), { newsPictures: byHead.config.newsPictures.map((p) => (p.postId === ids.posts[6] ? { ...p, consent: false } : p)) });
    expect(unticked.ok).toBe(true);
    if (!unticked.ok) return;
    expect(unticked.config.newsPictures.some((p) => p.postId === ids.posts[6] && p.consent)).toBe(false);
    expect(consentDone((await loadSite(await as(ids.admin, "ADMIN", ids.school))).checklist)).toBe(false);
    await publishSite(await as(ids.admin, "ADMIN", ids.school));
    const html = await allHtml();
    expect(html).toContain(TITLE(6));
    expect(html).not.toContain(PIC(6));
    signedOut();
    expect(await authorizeFileRead(PIC(6), null)).toMatchObject({ allowed: false });
  });

  it("TA-225: a tick is kept only for a news post's own first picture", async () => {
    const saved = await saveSite(await as(ids.admin, "ADMIN", ids.school), {
      newsPostIds: [ids.posts[6]!],
      newsPictures: [
        // The post's second picture, and a post that is not in the news.
        { postId: ids.posts[6]!, fileId: SECOND, consent: true },
        { postId: ids.posts[0]!, fileId: PIC(0), consent: true },
      ],
    });
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    expect(saved.config.newsPictures).toEqual([]);
    await publishSite(await as(ids.admin, "ADMIN", ids.school));
    const html = await allHtml();
    expect(html).not.toContain(SECOND);
    expect(html).not.toContain(PIC(0));
    expect(html).not.toContain(PIC(6));
  });
});
