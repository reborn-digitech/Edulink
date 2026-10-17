/**
 * The school website's third pass (website-three, 17 October 2026).
 *
 * Pure first: the menu's one order (custom pages among the built-in ones, an older draft's order, keys that name no page),
 * where a draft uses each uploaded file, a faculty member's photo on the Faculty page, the thread quoted under a reply,
 * and the nightly signature moving with the faculty. Then one ZZ school of this suite's own: two editors saving at once
 * (the stale save refused, "Also editing", PUT's If-Match), a facility's consent stamp following its picture through a
 * move, the Files panel's uses and delete (refused while used, the bytes gone after), a reply thread with Reply-To and
 * the threading headers, the phone's summary door. And one ZZ college of its own: a faculty member's photo with their
 * consent, readable by them and the office before it is public, public only with the page published while the website
 * is live, and closed again at once when they remove it. Every row it makes is its own school's or college's.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { type SiteConfig } from "@edulink/contracts";
import { createSession, getSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { renderSite, sitePagesShown, type SiteData } from "@/lib/site-render";
import { draftFileUses, menuKeys } from "@/lib/site-content";
import { defaultSiteConfig, repairSiteConfig } from "@/lib/site-config";
import { loadSite, publishSite, saveSite } from "@/lib/site-admin";
import { draftConfigFor, refreshSignature } from "@/lib/site-publish";
import { deleteSiteFile, siteFiles, uploadSiteFile } from "@/lib/site-files";
import { quotedThread, replyToSiteEnquiry, siteInbox, siteReplyToAddress } from "@/lib/site-inbox";
import { siteSummary } from "@/lib/site-summary";
import { myPublicProfile, publicFaculty, removeMyPublicPhoto, setMyPublicPhoto, setMyPublicProfile } from "@/lib/faculty-profile";
import { authorizeFileRead } from "@/lib/files";
import { deleteStoredFile, readStoredFile } from "@/lib/storage";
import { ENDPOINTS } from "@/lib/api-catalog";
import { actionKey } from "@/lib/safety-labels";
import { FILE_REFERENCES } from "@/lib/orphans";
import { fixturePng } from "../scripts/png";
import { GET as siteGet, PUT as sitePut } from "@/app/api/v1/admin/site/route";
import { GET as filesGet } from "@/app/api/v1/admin/site/files/route";
import { DELETE as fileDelete } from "@/app/api/v1/admin/site/files/[fileId]/route";
import { GET as summaryGet } from "@/app/api/v1/admin/site/summary/route";

const db = new PrismaClient();
const STAMP = Date.now();
const SLUG = `zz-three-${STAMP}`;
const CSLUG = `zz-three-c-${STAMP}`;
const ids = { school: "", admin: "", head: "", teacher: "", college: "", cadmin: "", faculty: "", facultyM: "", other: "", record: "" };
const stored: string[] = [];

async function as(userId: string, role: string, schoolId: string) {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, { schoolId, role: role as never });
  const ctx = await getSession();
  if (!ctx) throw new Error("no session");
  return ctx;
}
const admin = () => as(ids.admin, "ADMIN", ids.school);
const head = () => as(ids.head, "PRINCIPAL", ids.school);
function signedOut() {
  __resetCookies();
  __setHeaders({});
}
const png = (name: string, w = 320, h = 240) => new File([new Uint8Array(fixturePng(w, h))], name, { type: "image/png" });
const pic = (fileId: string, alt = "A picture") => ({ fileId, postId: null, alt, consent: true });

/* ------------------------------------------------------------------------------------------------ */
/* The pure parts                                                                                  */
/* ------------------------------------------------------------------------------------------------ */

const BASE: SiteConfig = defaultSiteConfig({ locale: "en", profileAbout: "A school by the river.", addressLine: "1 River Road", city: "Pune", region: "Maharashtra", postalCode: "411001", contactEmail: "office@zz-river.test", contactPhone: "+91 20 1234 5678", board: "CBSE", affiliationNumber: "", kind: "COLLEGE", medium: "English" });
const CONFIG: SiteConfig = {
  ...BASE,
  facilities: [{ code: "LIBRARY", label: "", line: "Books.", picture: pic("f-lib", "Shelves") }],
  albums: [{ id: "a1", title: "Sports day", pictures: [pic("f-album")] }],
  achievements: [{ id: "x1", title: "Science fair", dateKey: "2026-09-12", line: "", picture: pic("f-ach") }],
  heroPicture: pic("f-hero"),
  prospectusFileId: "f-pros",
  downloads: [{ id: "d1", kind: "OTHER", title: "Fees", fileId: "f-fees" }],
  customPages: [
    { id: "c1", slug: "bus-routes", title: "Bus routes", on: true, html: "<p>Three buses.</p>", seoDescription: "" },
    { id: "c2", slug: "hostel-life", title: "Hostel life", on: true, html: "<p>Rooms.</p>", seoDescription: "" },
  ],
};
const DATA: SiteData = {
  schoolName: "ZZ River College",
  slug: "zz-river",
  logoFileId: null,
  numbers: [],
  numbersDateKey: "2026-10-17",
  faculty: [
    { name: "Asha Rao", designation: "ASSISTANT_PROFESSOR", department: "Physics", photo: { fileId: "f-asha", alt: "Asha Rao" } },
    { name: "Vikram Joshi", designation: "PROFESSOR", department: "Chemistry", photo: null },
  ],
  appUrl: "https://app.example.test",
  disclosurePublished: false,
  facultyPublished: true,
  news: [],
  gallery: [],
  principalName: null,
  todayKey: "2026-10-17",
  college: true,
  events: [],
  academics: { classes: [], departments: [] },
  admissionsCycle: null,
  files: { "f-lib": { size: 1, kind: "IMAGE" }, "f-album": { size: 1, kind: "IMAGE" }, "f-ach": { size: 1, kind: "IMAGE" }, "f-hero": { size: 1, kind: "IMAGE" }, "f-pros": { size: 1, kind: "PDF" }, "f-fees": { size: 1, kind: "PDF" }, "f-asha": { size: 0, kind: "IMAGE" } },
};

describe("the menu's one order (pure)", () => {
  it("reads an older draft's order: the pages' own, then the custom pages, Home first", () => {
    expect(menuKeys(CONFIG)).toEqual(["HOME", ...CONFIG.pages.filter((p) => p.code !== "HOME").map((p) => p.code), "custom:c1", "custom:c2"]);
  });

  it("puts a custom page among the built-in ones, keeps Home first, drops keys that name no page and appends the ones it does not name", () => {
    const config = { ...CONFIG, menuOrder: ["ABOUT", "custom:c2", "HOME", "custom:gone", "FACULTY", "CONTACT"] };
    const keys = menuKeys(config);
    expect(keys.slice(0, 5)).toEqual(["HOME", "ABOUT", "custom:c2", "FACULTY", "CONTACT"]);
    expect(keys).not.toContain("custom:gone");
    expect(keys).toContain("custom:c1");
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.length).toBe(CONFIG.pages.length + 2);
    // The menu the pages print follows it: the custom page sits between About and Faculty.
    const shown = sitePagesShown(config, DATA).map((p) => p.key);
    expect(shown.indexOf("custom:c2")).toBe(shown.indexOf("ABOUT") + 1);
    expect(shown.indexOf("FACULTY")).toBe(shown.indexOf("custom:c2") + 1);
    const about = renderSite(config, DATA, "en", "ABOUT");
    expect(about.indexOf(">Hostel life<")).toBeGreaterThan(about.indexOf(">About the school<"));
    expect(about.indexOf(">Hostel life<")).toBeLessThan(about.indexOf(">Our faculty<"));
  });

  it("repairs a stored draft to carry the whole order", () => {
    const repaired = repairSiteConfig({ ...CONFIG, menuOrder: ["custom:c1"] }, BASE);
    expect(repaired.menuOrder[0]).toBe("HOME");
    expect(repaired.menuOrder[1]).toBe("custom:c1");
    expect(repaired.menuOrder.length).toBe(CONFIG.pages.length + 2);
  });
});

describe("files, faculty photos and the thread (pure)", () => {
  it("says where a draft uses each uploaded file, and leaves a post's picture out", () => {
    const uses = draftFileUses({ ...CONFIG, facilities: [...CONFIG.facilities, { code: "CANTEEN", label: "", line: "", picture: { ...pic("f-post"), postId: "p1" } }] }, () => "Library");
    expect(uses.get("f-hero")).toEqual([{ use: "HERO", label: "" }]);
    expect(uses.get("f-lib")).toEqual([{ use: "FACILITY", label: "Library" }]);
    expect(uses.get("f-album")).toEqual([{ use: "ALBUM", label: "Sports day" }]);
    expect(uses.get("f-ach")).toEqual([{ use: "ACHIEVEMENT", label: "Science fair" }]);
    expect(uses.get("f-pros")).toEqual([{ use: "PROSPECTUS", label: "" }]);
    expect(uses.get("f-fees")).toEqual([{ use: "DOWNLOAD", label: "Fees" }]);
    expect(uses.has("f-post")).toBe(false);
  });

  it("draws a faculty member's own photo above their name, words their name, and none for one without", () => {
    const html = renderSite({ ...CONFIG, pages: CONFIG.pages.map((p) => ({ ...p, on: true })) }, DATA, "en", "FACULTY");
    expect(html).toContain(`src="/api/files/f-asha?w=320" alt="Asha Rao"`);
    expect(html.match(/<img[^>]+f-asha/g)?.length).toBe(1);
    expect(html).toMatch(/<li>Vikram Joshi<span>/);
  });

  it("moves the nightly signature when a photo is set or a page leaves, and not otherwise", () => {
    const sig = refreshSignature(CONFIG, DATA);
    expect(refreshSignature(CONFIG, { ...DATA })).toBe(sig);
    expect(refreshSignature(CONFIG, { ...DATA, faculty: [DATA.faculty[0]!, { ...DATA.faculty[1]!, photo: { fileId: "f-v", alt: "V" } }] })).not.toBe(sig);
    expect(refreshSignature(CONFIG, { ...DATA, faculty: [DATA.faculty[1]!] })).not.toBe(sig);
  });

  it("quotes the thread under a reply, newest first, the enquirer's own message last, every line marked", () => {
    const quoted = quotedThread({ message: "Is there a bus?\nFrom the north side.", createdAt: new Date("2026-10-15T04:00:00Z"), replies: [{ text: "Yes, three.", at: "2026-10-15T05:00:00Z", byUserId: "u1", messageId: "<a@x>" }, { text: "At 7:30.", at: "2026-10-16T05:00:00Z", byUserId: "u1", messageId: "<b@x>" }], school: "ZZ River", timeZone: "Asia/Kolkata", locale: "en" });
    expect(quoted.map((q) => q.lines)).toEqual([["> At 7:30."], ["> Yes, three."], ["> Is there a bus?", "> From the north side."]]);
    expect(quoted[0]!.intro).toMatch(/^On .*16.*2026.*, ZZ River wrote:$/);
    expect(quoted[2]!.intro).toMatch(/^On .*15.*2026.*, you wrote:$/);
    expect(quotedThread({ message: "बस?", createdAt: new Date(), replies: [], school: "ZZ", timeZone: "Asia/Kolkata", locale: "hi" })[0]!.intro).toContain("आपने लिखा:");
  });
});

/* ------------------------------------------------------------------------------------------------ */
/* The school and the college of this suite                                                        */
/* ------------------------------------------------------------------------------------------------ */

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ Three ${STAMP}`, slug: SLUG, code: `ZTH${String(STAMP).slice(-6)}`, contactEmail: `zz-three-office-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", board: "CBSE", profileAbout: "A ZZ school for the third website suite.", isTestFixture: true }, select: { id: true } })).id;
  await db.schoolModule.create({ data: { schoolId: ids.school, module: "WEBSITE" } });
  const mk = (who: string) => db.user.create({ data: { name: `ZZ Three ${who}`, email: `zz-three-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
  const [a, h, t, ca, f, o] = await Promise.all([mk("Admin"), mk("Head"), mk("Teacher"), mk("CAdmin"), mk("Faculty"), mk("Other")]);
  Object.assign(ids, { admin: a.id, head: h.id, teacher: t.id, cadmin: ca.id, faculty: f.id, other: o.id });
  await db.membership.createMany({
    data: [
      { userId: a.id, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" },
      { userId: h.id, schoolId: ids.school, role: "PRINCIPAL", status: "ACTIVE" },
      { userId: t.id, schoolId: ids.school, role: "TEACHER", status: "ACTIVE" },
    ],
  });
  ids.college = (await db.school.create({ data: { name: `ZZ Three College ${STAMP}`, slug: CSLUG, code: `ZTC${String(STAMP).slice(-6)}`, contactEmail: `zz-three-college-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind: "COLLEGE", isTestFixture: true }, select: { id: true } })).id;
  await db.schoolModule.createMany({ data: ["ACADEMICS", "IQAC", "WEBSITE"].map((module) => ({ schoolId: ids.college, module })) });
  await db.membership.create({ data: { userId: ca.id, schoolId: ids.college, role: "ADMIN", status: "ACTIVE" } });
  ids.facultyM = (await db.membership.create({ data: { userId: f.id, schoolId: ids.college, role: "FACULTY", status: "ACTIVE" }, select: { id: true } })).id;
  await db.membership.create({ data: { userId: o.id, schoolId: ids.college, role: "FACULTY", status: "ACTIVE" } });
  ids.record = (await db.facultyRecord.create({ data: { schoolId: ids.college, membershipId: ids.facultyM, designation: "ASSISTANT_PROFESSOR", appointment: "REGULAR", highestQualification: "PHD" }, select: { id: true } })).id;
});

afterAll(async () => {
  signedOut();
  for (const fileId of stored) await deleteStoredFile(fileId).catch(() => undefined);
  await db.outboundEmail.deleteMany({ where: { to: { contains: `-${STAMP}@` } } });
  await db.notification.deleteMany({ where: { schoolId: { in: [ids.school, ids.college] } } });
  await db.auditLog.deleteMany({ where: { schoolId: { in: [ids.school, ids.college] } } });
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.school.deleteMany({ where: { id: { in: [ids.school, ids.college] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("two editors at once", () => {
  it("counts every save, refuses one made on a draft somebody else saved since, and names who else is editing", async () => {
    const first = await saveSite(await admin(), { motto: "ZZ First" }, { baseVersion: 0 });
    expect(first).toMatchObject({ ok: true, draftVersion: 1, alsoEditing: null });
    // The head saves on top of it.
    const second = await saveSite(await head(), { motto: "ZZ Second" }, { baseVersion: 1 });
    expect(second).toMatchObject({ ok: true, draftVersion: 2 });
    // The admin still holds version 1: refused with the sentence, nothing written.
    const stale = await saveSite(await admin(), { motto: "ZZ Stale" }, { baseVersion: 1 });
    expect(stale).toEqual({ ok: false, field: "draftVersion", errorKey: "siteThree.refuseStale", stale: true });
    expect((await draftConfigFor(ids.school)).config.motto).toBe("ZZ Second");
    // Reloaded, the admin sees the head's name and saves on the new count.
    const view = await loadSite(await admin());
    expect(view.draftVersion).toBe(2);
    expect(view.alsoEditing).toBe("ZZ Three Head");
    expect((await loadSite(await head())).alsoEditing).toBeNull();
    const third = await saveSite(await admin(), { motto: "ZZ Third" }, { baseVersion: 2 });
    expect(third).toMatchObject({ ok: true, draftVersion: 3, alsoEditing: "ZZ Three Head" });
  });

  it("names nobody once the other save is more than five minutes old", async () => {
    await db.schoolSite.update({ where: { schoolId: ids.school }, data: { updatedByUserId: ids.head, updatedAt: new Date(Date.now() - 6 * 60_000) } });
    expect((await loadSite(await admin())).alsoEditing).toBeNull();
  });

  it("PUT: If-Match makes the save conditional (409 CONFLICT when stale), GET hands out the count", async () => {
    await admin();
    const got = await (await siteGet()).json();
    expect(got.draftVersion).toBeGreaterThan(0);
    const body = JSON.stringify({ ...got.config, motto: "ZZ By PUT" });
    const stale = await sitePut(new Request("http://localhost/api/v1/admin/site", { method: "PUT", headers: { "content-type": "application/json", "if-match": String(got.draftVersion - 1) }, body }));
    expect(stale.status).toBe(409);
    expect((await stale.json()).code).toBe("CONFLICT");
    const fresh = await sitePut(new Request("http://localhost/api/v1/admin/site", { method: "PUT", headers: { "content-type": "application/json", "if-match": `"${got.draftVersion}"` }, body }));
    expect(fresh.status).toBe(200);
    expect((await fresh.json()).draftVersion).toBe(got.draftVersion + 1);
    const unconditional = await sitePut(new Request("http://localhost/api/v1/admin/site", { method: "PUT", headers: { "content-type": "application/json" }, body }));
    expect(unconditional.status).toBe(200);
  });
});

describe("a facility's consent stamp follows its picture", () => {
  it("keeps who ticked each picture and when through a move, and stamps only a newly ticked one", async () => {
    const a = await uploadSiteFile(await admin(), png("lib.png"), "IMAGE");
    const b = await uploadSiteFile(await admin(), png("lab.png"), "IMAGE");
    if (!a.ok || !b.ok) throw new Error("upload");
    stored.push(a.file.fileId, b.file.fileId);
    const facilities: SiteConfig["facilities"] = [
      { code: "LIBRARY", label: "", line: "", picture: pic(a.file.fileId, "Shelves") },
      { code: "LABORATORIES", label: "", line: "", picture: { ...pic(b.file.fileId, "Benches"), consent: false } },
    ];
    const saved = await saveSite(await admin(), { facilities });
    if (!saved.ok) throw new Error(saved.errorKey);
    const stampA = saved.config.facilities[0]!.picture!;
    expect(stampA.consentByUserId).toBe(ids.admin);
    // The head swaps the two and ticks the second: the first keeps the admin's stamp, the second is the head's.
    const moved = await saveSite(await head(), { facilities: [{ ...facilities[1]!, picture: { ...facilities[1]!.picture!, consent: true } }, facilities[0]!] });
    if (!moved.ok) throw new Error(moved.errorKey);
    expect(moved.config.facilities[1]!.picture).toMatchObject({ fileId: a.file.fileId, consentByUserId: ids.admin, consentAt: stampA.consentAt });
    expect(moved.config.facilities[0]!.picture).toMatchObject({ fileId: b.file.fileId, consentByUserId: ids.head });
  });
});

describe("the Files panel", () => {
  it("lists each upload with where it is used, refuses to delete a used one (naming where), deletes an unused one and its bytes", async () => {
    const spare = await uploadSiteFile(await admin(), png("spare.png"), "IMAGE");
    if (!spare.ok) throw new Error("upload");
    stored.push(spare.file.fileId);
    const files = await siteFiles(await admin());
    const lib = files.find((f) => f.name === "lib.png")!;
    expect(lib.usedBy).toEqual([{ use: "FACILITY", label: "LIBRARY" }]);
    expect(files.find((f) => f.fileId === spare.file.fileId)!.usedBy).toEqual([]);

    // The door: 409 with the sentence while used; the listing carries the count and the cap.
    await admin();
    const listed = await (await filesGet()).json();
    expect(listed).toMatchObject({ count: files.length, max: 120 });
    const refused = await fileDelete(new Request("http://localhost", { method: "DELETE" }), { params: Promise.resolve({ fileId: lib.fileId }) });
    expect(refused.status).toBe(409);
    expect((await refused.json()).error).toMatch(/still used: a facility \(Library\)/);
    expect(await db.schoolSiteFile.count({ where: { fileId: lib.fileId } })).toBe(1);

    // An unused one goes, row and bytes, audited; then it is not found.
    expect(await deleteSiteFile(await admin(), spare.file.fileId)).toEqual({ ok: true });
    expect(await db.schoolSiteFile.count({ where: { fileId: spare.file.fileId } })).toBe(0);
    expect(await readStoredFile(spare.file.fileId)).toBeNull();
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: "site.file.delete" } })).toBe(1);
    const gone = await fileDelete(new Request("http://localhost", { method: "DELETE" }), { params: Promise.resolve({ fileId: spare.file.fileId }) });
    expect(gone.status).toBe(404);
  });

  it("refuses while only the live site still shows it, and the versions kept forget a deleted file", async () => {
    await publishSite(await admin());
    const lab = (await siteFiles(await admin())).find((f) => f.name === "lab.png")!;
    // Off the draft, but the live version still shows it.
    const draft = (await draftConfigFor(ids.school)).config;
    const saved = await saveSite(await admin(), { facilities: draft.facilities.filter((f) => f.picture?.fileId !== lab.fileId) });
    expect(saved.ok).toBe(true);
    expect((await siteFiles(await admin())).find((f) => f.fileId === lab.fileId)!.usedBy).toEqual([{ use: "LIVE", label: "" }]);
    expect(await deleteSiteFile(await admin(), lab.fileId)).toMatchObject({ ok: false, status: 409 });
    // Published again without it, the old version keeps it named until the delete makes it forget.
    await publishSite(await admin());
    expect(await db.schoolSiteVersion.count({ where: { schoolId: ids.school, imageFileIds: { has: lab.fileId } } })).toBe(1);
    expect(await deleteSiteFile(await admin(), lab.fileId)).toEqual({ ok: true });
    expect(await db.schoolSiteVersion.count({ where: { schoolId: ids.school, imageFileIds: { has: lab.fileId } } })).toBe(0);
  });
});

describe("an enquiry's reply thread", () => {
  it("replies with Reply-To the school's own address, quotes the thread, and keeps a second reply on the first one's thread", async () => {
    // The live site's address first: the draft's own until it is published, the school's contact email before any.
    expect(await siteReplyToAddress(ids.school)).toBe(`zz-three-office-${STAMP}@test.invalid`);
    await saveSite(await admin(), { email: `zz-three-site-${STAMP}@test.invalid` });
    expect(await siteReplyToAddress(ids.school)).toBe(`zz-three-office-${STAMP}@test.invalid`);
    await publishSite(await admin());
    expect(await siteReplyToAddress(ids.school)).toBe(`zz-three-site-${STAMP}@test.invalid`);
    const enquiry = await db.schoolSiteEnquiry.create({ data: { schoolId: ids.school, name: "ZZ Parent", contact: `zz-three-parent-${STAMP}@test.invalid`, message: "Is there a bus from the north side?", locale: "en" } });
    const first = await replyToSiteEnquiry(await admin(), enquiry.id, "Yes, three buses.");
    expect(first.ok).toBe(true);
    const second = await replyToSiteEnquiry(await head(), enquiry.id, "The first leaves at 7:30.");
    if (!second.ok) throw new Error(second.errorKey);
    expect(second.enquiry.replies.map((r) => [r.text, r.byName])).toEqual([
      ["Yes, three buses.", "ZZ Three Admin"],
      ["The first leaves at 7:30.", "ZZ Three Head"],
    ]);
    expect(second.enquiry.replyText).toBe("The first leaves at 7:30.");

    const mails = await db.outboundEmail.findMany({ where: { to: `zz-three-parent-${STAMP}@test.invalid` }, orderBy: { createdAt: "asc" } });
    expect(mails).toHaveLength(2);
    const [m1, m2] = mails.map((m) => ({ ...m, headers: JSON.parse(m.headersJson) as { messageId: string; inReplyTo: string | null; references: string[] } }));
    expect(m1!.replyTo).toBe(`zz-three-site-${STAMP}@test.invalid`);
    expect(m1!.headers.messageId).toMatch(/^<site-enquiry\..+@.+>$/);
    expect(m1!.headers.inReplyTo).toBeNull();
    expect(m1!.text).toContain("you wrote:\n> Is there a bus from the north side?");
    expect(m2!.subject).toBe(m1!.subject);
    expect(m2!.headers.inReplyTo).toBe(m1!.headers.messageId);
    expect(m2!.headers.references).toEqual([m1!.headers.messageId]);
    expect(m2!.text).toMatch(/The first leaves at 7:30\.[\s\S]*wrote:\n> Yes, three buses\.[\s\S]*you wrote:\n> Is there a bus/);
    expect(m2!.html).toContain("<blockquote");

    const inbox = await siteInbox(await admin());
    expect(inbox.enquiries.find((e) => e.id === enquiry.id)!.replies).toHaveLength(2);
  });

  it("reads an enquiry answered before the thread was kept as a thread of its one reply", async () => {
    const old = await db.schoolSiteEnquiry.create({ data: { schoolId: ids.school, name: "ZZ Old", contact: `zz-three-old-${STAMP}@test.invalid`, message: "Fees?", locale: "en", status: "REPLIED", replyText: "In the prospectus.", repliedAt: new Date("2026-10-10T05:00:00Z"), repliedByUserId: ids.admin } });
    const row = (await siteInbox(await admin())).enquiries.find((e) => e.id === old.id)!;
    expect(row.replies).toEqual([{ text: "In the prospectus.", at: "2026-10-10T05:00:00.000Z", byName: "ZZ Three Admin" }]);
  });
});

describe("the phone's summary", () => {
  it("answers the office and the head with the site at a glance, and refuses a teacher", async () => {
    const summary = await siteSummary(await admin());
    expect(summary).toMatchObject({ state: "PUBLISHED", address: null, editPath: "/admin/website" });
    expect(summary.ready.total).toBe(7);
    expect(summary.enquiries.total).toBeGreaterThanOrEqual(2);
    expect(summary.enquiries.newest.length).toBeLessThanOrEqual(3);
    expect(Object.keys(summary.enquiries.newest[0]!)).toEqual(["id", "name", "createdAt", "status", "wantsVisit"]);
    expect(summary.visits.days).toHaveLength(30);
    await head();
    expect((await summaryGet()).status).toBe(200);
    await as(ids.teacher, "TEACHER", ids.school);
    expect((await summaryGet()).status).toBe(403);
  });
});

describe("a faculty member's own public photo", () => {
  const faculty = () => as(ids.faculty, "FACULTY", ids.college);
  let photo = "";

  it("is refused without the consent tick, and for a file that is not a picture", async () => {
    expect(await setMyPublicPhoto(await faculty(), png("me.png"), false)).toEqual({ ok: false, errorKey: "facultyPhoto.refuseConsent" });
    const pdf = new File([new TextEncoder().encode("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n")], "me.pdf", { type: "application/pdf" });
    expect(await setMyPublicPhoto(await faculty(), pdf, true)).toEqual({ ok: false, errorKey: "facultyPhoto.refuseNotPicture" });
  });

  it("is set with consent, read by its owner and the office, not by a colleague, and not public before the site is live", async () => {
    const made = await setMyPublicPhoto(await faculty(), png("me.png", 400, 400), true);
    if (!made.ok) throw new Error(made.errorKey);
    photo = made.profile.photo!.fileId;
    stored.push(photo);
    expect(made.profile.photo?.consentAt).toBeTruthy();
    expect(await db.auditLog.count({ where: { schoolId: ids.college, action: "faculty.photo.set" } })).toBe(1);
    expect(await authorizeFileRead(photo, await faculty())).toMatchObject({ allowed: true, kind: "site", public: false });
    expect(await authorizeFileRead(photo, await as(ids.cadmin, "ADMIN", ids.college))).toMatchObject({ allowed: true });
    expect(await authorizeFileRead(photo, await as(ids.other, "FACULTY", ids.college))).toMatchObject({ allowed: false });
    signedOut();
    expect(await authorizeFileRead(photo, null)).toMatchObject({ allowed: false });
  });

  it("goes on the published page and the website's Faculty page, public only while the website is live", async () => {
    await setMyPublicProfile(await faculty(), true);
    expect(await db.facultyPublicProfile.findFirst({ where: { facultyRecordId: ids.record }, select: { publicPhotoFileId: true } })).toEqual({ publicPhotoFileId: photo });
    // No live site yet: the public page names no photo and the file stays closed.
    expect((await publicFaculty(CSLUG)).profiles[0]!.photoFileId).toBeNull();
    expect((await publicFaculty(CSLUG, { photos: "always" })).profiles[0]!.photoFileId).toBe(photo);
    expect(await authorizeFileRead(photo, null)).toMatchObject({ allowed: false });

    const office = await as(ids.cadmin, "ADMIN", ids.college);
    await saveSite(office, { pages: (await loadSite(office)).config.pages.map((p) => ({ ...p, on: true })) });
    await publishSite(await as(ids.cadmin, "ADMIN", ids.college));
    const live = await db.schoolSiteVersion.findFirst({ where: { schoolId: ids.college, liveAt: { not: null } }, select: { imageFileIds: true, pagesHtml: true } });
    expect(live?.imageFileIds).toContain(photo);
    expect(live?.pagesHtml).toContain(`/api/files/${photo}?w=320`);
    signedOut();
    expect(await authorizeFileRead(photo, null)).toMatchObject({ allowed: true, kind: "site", public: true });
    expect((await publicFaculty(CSLUG)).profiles[0]!.photoFileId).toBe(photo);
    expect((await myPublicProfile(await faculty())).photo?.fileId).toBe(photo);
  });

  it("is removed from the record, the page and the live website at once", async () => {
    const before = await db.schoolSiteVersion.count({ where: { schoolId: ids.college } });
    await removeMyPublicPhoto(await faculty());
    expect(await db.facultyRecord.findUnique({ where: { id: ids.record }, select: { publicPhotoFileId: true, publicPhotoConsentAt: true } })).toEqual({ publicPhotoFileId: null, publicPhotoConsentAt: null });
    expect(await db.facultyPublicProfile.findFirst({ where: { facultyRecordId: ids.record }, select: { publicPhotoFileId: true } })).toEqual({ publicPhotoFileId: null });
    // The live site was re-rendered without it, so nobody signed out reads it any more.
    expect(await db.schoolSiteVersion.count({ where: { schoolId: ids.college } })).toBe(before + 1);
    const live = await db.schoolSiteVersion.findFirst({ where: { schoolId: ids.college, liveAt: { not: null } }, select: { imageFileIds: true } });
    expect(live?.imageFileIds).not.toContain(photo);
    signedOut();
    expect(await authorizeFileRead(photo, null)).toMatchObject({ allowed: false });
    expect(await db.auditLog.count({ where: { schoolId: ids.college, action: "faculty.photo.remove" } })).toBe(1);
  });
});

describe("the catalog, the audit words and the orphan sweep", () => {
  it("lists the two new doors for the office and the head behind WEBSITE", () => {
    for (const [method, path] of [["DELETE", "/api/v1/admin/site/files/{fileId}"], ["GET", "/api/v1/admin/site/summary"]] as const) {
      const door = ENDPOINTS.find((e) => e.method === method && e.path === path);
      expect(door, `${method} ${path}`).toMatchObject({ access: ["ADMIN", "PRINCIPAL"], module: "WEBSITE" });
    }
  });

  it("words every new audit action and claims the photo columns for the orphan sweep", () => {
    for (const action of ["site.file.delete", "faculty.photo.set", "faculty.photo.remove"]) expect(actionKey(action), action).toBeTruthy();
    expect(FILE_REFERENCES).toEqual(expect.arrayContaining(["facultyRecord.publicPhotoFileId", "facultyPublicProfile.publicPhotoFileId"]));
  });
});
