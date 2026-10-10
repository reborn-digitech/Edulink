import "server-only";
import type { CertificateLayout, PaperSignatureView, SignaturesView } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./tenancy";
import { audit } from "./audit";
import { notify } from "./notify";
import type { ActiveContext } from "./session";

/**
 * Signatures and the school's seal, as pictures on the school's papers.
 *
 * WHO HAS ONE. An admin, the head and a teacher each keep one signature;
 * the school keeps one seal, which is the admin's to set. A certificate's
 * template and the report card's rules say who signs each of the two lines
 * (the contracts' paperSignerSchema and cardSignerSchema) and whether the
 * seal is printed. A teacher signs report cards, of the classes they teach,
 * and no certificate.
 *
 * A REPORT CARD IS SIGNED A CLASS AT A TIME, as it is published: one row
 * for the set (the class and the title), one approval for every card in
 * it. Thirty approvals for one class's term would be thirty presses nobody
 * reads between. The head opens any card of the set, reads it, and signs
 * them all; a set taken back to drafts loses its signatures, and published
 * again it asks again.
 *
 * ⚠ A SIGNATURE IS ITS OWNER'S TO PUT. It is drawn at once on a paper its
 * owner issues. On a paper somebody else issues it WAITS: the line is
 * printed bare until the owner has opened that paper and approved it. An
 * admin therefore cannot issue a paper carrying the head's signature, which
 * is the reason a picture of a signature is worth anything at all.
 *
 * THE PAPER KEEPS ITS OWN COPY. What is drawn on an issued paper is the
 * picture as it was when the paper was signed; a signature changed or
 * removed afterwards changes the next paper and not the last.
 *
 * THE PICTURE IS FETCHED BY AN ADDRESS THAT ASKS WHO IS ASKING. It was
 * handed over inside the paper's own answer as a data URL, and a signature
 * drawn by hand is twenty kilobytes of it: the page's stream broke on it
 * twice under a full run ("ArrayBuffer is not detachable", 2026-09-30).
 * The answer now carries an address, /api/v1/shared/signatures/{id}, which
 * gives the picture only to a reader the paper's own rule lets in, and
 * /api/v1/office/signatures/image for one's own and the seal.
 *
 * The audit log carries who set, removed, signed and declined, and which
 * paper; never the picture.
 */

export type PaperKind = "CERTIFICATE" | "REPORT_CARD_SET";
type SignerRole = "TEACHER" | "ADMIN" | "PRINCIPAL";
const SIGNERS: readonly SignerRole[] = ["TEACHER", "ADMIN", "PRINCIPAL"];

/** A set of report cards is named by its class and its title; the class's id holds no bar. */
export const cardSetId = (classId: string, title: string) => `${classId}|${title}`;
const cardSetOf = (paperId: string) => {
  const at = paperId.indexOf("|");
  return { classId: paperId.slice(0, at), title: paperId.slice(at + 1) };
};
/** Whether this teacher teaches the class a set is of: a teacher's signature is for their own classes. */
async function teaches(membershipId: string, schoolId: string, classId: string): Promise<boolean> {
  return Boolean(await db.classTeacher.findFirst({ where: { classId, schoolId, teacherMembershipId: membershipId }, select: { id: true } }));
}
/** Whether a line that waits is this reader's to sign: their role, and for a teacher their class. */
async function mine(me: { schoolId: string; membershipId: string; role: SignerRole }, row: { schoolId: string; role: string | null; paperKind: string; paperId: string }): Promise<boolean> {
  if (row.schoolId !== me.schoolId || row.role !== me.role) return false;
  if (me.role !== "TEACHER") return true;
  return row.paperKind === "REPORT_CARD_SET" && (await teaches(me.membershipId, me.schoolId, cardSetOf(row.paperId).classId));
}

/** A signature is a strip; the seal is a square. Both are small, because both are drawn small. */
export const SIGNATURE_LIMIT = { bytes: 200 * 1024, width: 1200, height: 600 } as const;
export const SEAL_LIMIT = { bytes: 250 * 1024, width: 800, height: 800 } as const;
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** The bytes of a PNG handed over as a data URL, or a refusal: read, measured, and nothing else believed. */
export function pngFrom(dataUrl: string, limit: { bytes: number; width: number; height: number }): Uint8Array<ArrayBuffer> {
  const match = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new AccessError("signatures.notARealPicture");
  const bytes = Buffer.from(match[1]!, "base64");
  if (bytes.length > limit.bytes) throw new AccessError("signatures.tooLarge", "FORBIDDEN", { kb: Math.round(limit.bytes / 1024) });
  // The eight bytes every PNG begins with, then the header chunk with the size in it.
  if (bytes.length < 33 || !bytes.subarray(0, 8).equals(PNG_MAGIC) || bytes.subarray(12, 16).toString("latin1") !== "IHDR") throw new AccessError("signatures.notARealPicture");
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (width < 16 || height < 16 || width > limit.width || height > limit.height) throw new AccessError("signatures.notARealPicture");
  // A copy with a buffer of its own, which is what the database's client takes.
  return new Uint8Array(bytes);
}

export const pngUrl = (png: Uint8Array | null | undefined): string | null => (png && png.length > 0 ? `data:image/png;base64,${Buffer.from(png).toString("base64")}` : null);
/** The address a paper's copy of a picture is fetched at; the row's id is the address, and the paper's rule the lock. */
export const signatureUrl = (row: { id: string; png: Uint8Array | null }): string | null => (row.png && row.png.length > 0 ? `/api/v1/shared/signatures/${row.id}` : null);

function signer(ctx: ActiveContext): { schoolId: string; membershipId: string; role: SignerRole } {
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role || !(SIGNERS as readonly string[]).includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  return { schoolId: ctx.schoolId, membershipId: ctx.membershipId, role: ctx.role as SignerRole };
}

/* -------------------------------------------------------------------------- */
/* Setting one's own, and the seal                                             */
/* -------------------------------------------------------------------------- */

export async function saveMySignature(ctx: ActiveContext, image: string): Promise<void> {
  const me = signer(ctx);
  const png = pngFrom(image, SIGNATURE_LIMIT);
  await db.signatureImage.upsert({ where: { membershipId: me.membershipId }, create: { schoolId: me.schoolId, kind: "PERSON", membershipId: me.membershipId, png }, update: { png, schoolId: me.schoolId } });
  await audit({ schoolId: me.schoolId, actorUserId: ctx.user.id, action: "signature.set", targetType: "Membership", targetId: me.membershipId });
}

export async function removeMySignature(ctx: ActiveContext): Promise<void> {
  const me = signer(ctx);
  const gone = await db.signatureImage.deleteMany({ where: { membershipId: me.membershipId, schoolId: me.schoolId } });
  if (gone.count > 0) await audit({ schoolId: me.schoolId, actorUserId: ctx.user.id, action: "signature.remove", targetType: "Membership", targetId: me.membershipId });
}

export async function saveSeal(ctx: ActiveContext, image: string): Promise<void> {
  const me = signer(ctx);
  if (me.role !== "ADMIN") throw new AccessError("signatures.sealOnlyAdmin");
  const png = pngFrom(image, SEAL_LIMIT);
  const seal = await db.signatureImage.findFirst({ where: { schoolId: me.schoolId, kind: "SEAL" }, select: { id: true } });
  if (seal) await db.signatureImage.update({ where: { id: seal.id }, data: { png } });
  else await db.signatureImage.create({ data: { schoolId: me.schoolId, kind: "SEAL", png } });
  await audit({ schoolId: me.schoolId, actorUserId: ctx.user.id, action: "seal.set", targetType: "School", targetId: me.schoolId });
}

export async function removeSeal(ctx: ActiveContext): Promise<void> {
  const me = signer(ctx);
  if (me.role !== "ADMIN") throw new AccessError("signatures.sealOnlyAdmin");
  const gone = await db.signatureImage.deleteMany({ where: { schoolId: me.schoolId, kind: "SEAL" } });
  if (gone.count > 0) await audit({ schoolId: me.schoolId, actorUserId: ctx.user.id, action: "seal.remove", targetType: "School", targetId: me.schoolId });
}

/* -------------------------------------------------------------------------- */
/* Signing a paper                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Called once, when a paper is issued: the issuer's own signature on the
 * lines that are theirs, a wait on the lines that are somebody else's, and
 * the seal as it stands today. A paper whose template asks for nobody gets
 * no rows at all and prints as papers always did.
 */
export async function signOnIssue(ctx: ActiveContext, paper: { kind: PaperKind; id: string; schoolId: string; title: string; studentName: string; count?: number }, layout: { signerLeft: CertificateLayout["signerLeft"] | "TEACHER"; signerRight: CertificateLayout["signerRight"] | "TEACHER"; showSeal: boolean }): Promise<void> {
  const slots = ([["LEFT", layout.signerLeft], ["RIGHT", layout.signerRight]] as const).filter(([, who]) => (SIGNERS as readonly string[]).includes(who) && (who !== "TEACHER" || paper.kind === "REPORT_CARD_SET")) as ["LEFT" | "RIGHT", SignerRole][];
  const issuerName = ctx.user.name;
  const own = ctx.membershipId && ctx.schoolId === paper.schoolId ? await db.signatureImage.findFirst({ where: { membershipId: ctx.membershipId, schoolId: paper.schoolId, kind: "PERSON" }, select: { png: true } }) : null;
  const waitingOn = new Set<SignerRole>();
  for (const [slot, role] of slots) {
    // The issuer's own line: their role, and for a teacher a class they teach — which publishing the set has already required of them.
    const mine = ctx.role === role && ctx.schoolId === paper.schoolId && own !== null && (role !== "TEACHER" || (ctx.membershipId !== null && (await teaches(ctx.membershipId, paper.schoolId, cardSetOf(paper.id).classId))));
    await db.paperSignature.upsert({
      where: { paperKind_paperId_slot: { paperKind: paper.kind, paperId: paper.id, slot } },
      create: mine
        ? { schoolId: paper.schoolId, paperKind: paper.kind, paperId: paper.id, slot, role, status: "SIGNED", signerUserId: ctx.user.id, signerName: issuerName, png: own!.png, requestedByUserId: ctx.user.id, decidedAt: new Date() }
        : { schoolId: paper.schoolId, paperKind: paper.kind, paperId: paper.id, slot, role, status: "PENDING", requestedByUserId: ctx.user.id },
      update: {},
    });
    if (mine) await audit({ schoolId: paper.schoolId, actorUserId: ctx.user.id, action: "paper.sign", targetType: paper.kind, targetId: paper.id, meta: { slot, role, own: true } });
    else waitingOn.add(role);
  }
  if (layout.showSeal) {
    const seal = await db.signatureImage.findFirst({ where: { schoolId: paper.schoolId, kind: "SEAL" }, select: { png: true } });
    if (seal) await db.paperSignature.upsert({ where: { paperKind_paperId_slot: { paperKind: paper.kind, paperId: paper.id, slot: "SEAL" } }, create: { schoolId: paper.schoolId, paperKind: paper.kind, paperId: paper.id, slot: "SEAL", status: "SIGNED", png: seal.png, requestedByUserId: ctx.user.id, decidedAt: new Date() }, update: {} });
  }
  if (waitingOn.size === 0) return;
  // Told once per person, however many of the paper's lines wait for them; and not the issuer, who knows.
  const office = [...waitingOn].filter((r) => r !== "TEACHER");
  const holders = office.length > 0 ? await db.membership.findMany({ where: { schoolId: paper.schoolId, role: { in: office }, status: "ACTIVE", leftAt: null, userId: { not: ctx.user.id } }, select: { userId: true, role: true } }) : [];
  // A teacher's line waits for the teachers of that class, and no other teacher.
  const classTeachers = waitingOn.has("TEACHER") ? await db.classTeacher.findMany({ where: { classId: cardSetOf(paper.id).classId, schoolId: paper.schoolId, teacher: { status: "ACTIVE", leftAt: null, userId: { not: ctx.user.id } } }, select: { teacher: { select: { userId: true } } } }) : [];
  const told = new Map<string, string>();
  for (const h of holders) told.set(h.userId, "/admin/signatures");
  for (const c of classTeachers) if (!told.has(c.teacher.userId)) told.set(c.teacher.userId, "/teacher/signatures");
  const set = paper.kind === "REPORT_CARD_SET";
  await Promise.all(
    [...told].map(([userId, url]) =>
      notify({ userId, schoolId: paper.schoolId, kind: "SYSTEM", titleKey: set ? "signatures.notifSetWaiting" : "signatures.notifWaiting", titleVars: set ? { className: paper.studentName, title: paper.title, count: paper.count ?? 1 } : { name: paper.studentName, title: paper.title }, bodyKey: "signatures.notifWaitingBody", url }).catch((error) => console.error("[signOnIssue] notice failed", error)),
    ),
  );
}

/** The signatures and the seal of one paper, for a reader the paper's own rule has already let in. */
export async function paperSignatures(ctx: ActiveContext, paper: { kind: PaperKind; id: string; schoolId: string }): Promise<{ signatures: PaperSignatureView[]; seal: string | null }> {
  const rows = await db.paperSignature.findMany({ where: { paperKind: paper.kind, paperId: paper.id, schoolId: paper.schoolId }, orderBy: { slot: "asc" } });
  const signatures0 = rows
    .filter((r) => (r.slot === "LEFT" || r.slot === "RIGHT") && (SIGNERS as readonly string[]).includes(r.role ?? ""));
  const reader = ctx.schoolId && ctx.membershipId && ctx.role && (SIGNERS as readonly string[]).includes(ctx.role) ? { schoolId: ctx.schoolId, membershipId: ctx.membershipId, role: ctx.role as SignerRole } : null;
  const decidable = new Set<string>();
  for (const r of signatures0) if (r.status === "PENDING" && reader && (await mine(reader, r))) decidable.add(r.id);
  const signatures: PaperSignatureView[] = signatures0
    .map((r) => ({
      id: r.id,
      slot: r.slot as "LEFT" | "RIGHT",
      role: r.role as SignerRole,
      status: r.status as PaperSignatureView["status"],
      signerName: r.signerName,
      image: r.status === "SIGNED" ? signatureUrl(r) : null,
      decidedAt: r.decidedAt?.toISOString() ?? null,
      can: { decide: decidable.has(r.id) },
    }));
  const seal = rows.find((r) => r.slot === "SEAL" && r.status === "SIGNED");
  return { signatures, seal: seal ? signatureUrl(seal) : null };
}

/** One's own signature or the school's seal, as bytes, for the office's page. */
export async function ownImage(ctx: ActiveContext, of: "mine" | "seal"): Promise<Uint8Array | null> {
  const me = signer(ctx);
  const row = of === "mine" ? await db.signatureImage.findFirst({ where: { membershipId: me.membershipId, schoolId: me.schoolId, kind: "PERSON" }, select: { png: true } }) : await db.signatureImage.findFirst({ where: { schoolId: me.schoolId, kind: "SEAL" }, select: { png: true } });
  return row?.png ?? null;
}

/**
 * A paper's copy of a picture, for a reader the PAPER's own rule lets in: the
 * certificate's, or for a set any card of it. Nobody fetches a picture of
 * a paper they could not open.
 */
export async function paperImage(ctx: ActiveContext, signatureId: string): Promise<Uint8Array | null> {
  const row = await db.paperSignature.findFirst({ where: { id: signatureId }, select: { schoolId: true, paperKind: true, paperId: true, status: true, png: true } });
  if (!row || row.status !== "SIGNED" || !row.png) return null;
  if (row.paperKind === "CERTIFICATE") {
    const { mayReadCertificate } = await import("./certificates");
    // The kind too: an appointment letter's own reader is the member of staff it was issued to (risks batch 5A).
    const cert = await db.issuedCertificate.findFirst({ where: { id: row.paperId, schoolId: row.schoolId }, select: { schoolId: true, studentMembershipId: true, kind: true } });
    if (!cert || !(await mayReadCertificate(ctx, cert))) return null;
    return row.png;
  }
  const { mayReadCard } = await import("./report-cards");
  const { classId, title } = cardSetOf(row.paperId);
  const cards = await db.reportCard.findMany({ where: { schoolId: row.schoolId, classId, title }, select: { classId: true, studentMembershipId: true, status: true, schoolId: true } });
  for (const card of cards) if (await mayReadCard(ctx, card)) return row.png;
  return null;
}

/** The pictures a paper's view names, as bytes by slot, for a PDF whose reader the route has already let in. */
export async function paperImages(view: { signatures: { slot: "LEFT" | "RIGHT"; image: string | null }[]; seal: string | null }): Promise<Partial<Record<"LEFT" | "RIGHT" | "SEAL", Uint8Array>>> {
  const idOf = (url: string | null) => url?.match(/\/api\/v1\/shared\/signatures\/([a-z0-9]+)$/)?.[1] ?? null;
  const wanted: { slot: "LEFT" | "RIGHT" | "SEAL"; id: string }[] = [];
  for (const s of view.signatures) {
    const id = idOf(s.image);
    if (id) wanted.push({ slot: s.slot, id });
  }
  const seal = idOf(view.seal);
  if (seal) wanted.push({ slot: "SEAL", id: seal });
  if (wanted.length === 0) return {};
  const rows = await db.paperSignature.findMany({ where: { id: { in: wanted.map((w) => w.id) }, status: "SIGNED" }, select: { id: true, png: true } });
  const out: Partial<Record<"LEFT" | "RIGHT" | "SEAL", Uint8Array>> = {};
  for (const w of wanted) {
    const png = rows.find((r) => r.id === w.id)?.png;
    if (png) out[w.slot] = png;
  }
  return out;
}

/** The owner signs a paper that waited for them, or declines to. A settled one is left as it stands. */
export async function decidePaperSignature(ctx: ActiveContext, signatureId: string, approve: boolean): Promise<{ paperKind: PaperKind; paperId: string; status: string }> {
  const me = signer(ctx);
  const row = await db.paperSignature.findFirst({ where: { id: signatureId, schoolId: me.schoolId } });
  if (!row || row.slot === "SEAL") throw new AccessError("signatures.notFound", "NOT_FOUND");
  const paper = { paperKind: row.paperKind as PaperKind, paperId: row.paperId };
  // A settled one is answered as it stands to either of the two who sign the school's papers: both read the paper.
  if (row.status !== "PENDING") return { ...(await opened(me.schoolId, paper)), status: row.status };
  if (!(await mine(me, row))) throw new AccessError("signatures.notYours");
  let png: Uint8Array<ArrayBuffer> | null = null;
  if (approve) {
    const own = await db.signatureImage.findFirst({ where: { membershipId: me.membershipId, schoolId: me.schoolId, kind: "PERSON" }, select: { png: true } });
    if (!own) throw new AccessError("signatures.addYoursFirst");
    png = new Uint8Array(own.png);
  }
  // From PENDING only: two of the same role pressing together sign once.
  const won = await db.paperSignature.updateMany({ where: { id: row.id, status: "PENDING" }, data: approve ? { status: "SIGNED", signerUserId: ctx.user.id, signerName: ctx.user.name, png, decidedAt: new Date() } : { status: "DECLINED", signerUserId: ctx.user.id, signerName: ctx.user.name, decidedAt: new Date() } });
  if (won.count === 0) {
    const now = await db.paperSignature.findUniqueOrThrow({ where: { id: row.id }, select: { status: true } });
    return { ...(await opened(me.schoolId, paper)), status: now.status };
  }
  await audit({ schoolId: me.schoolId, actorUserId: ctx.user.id, action: approve ? "paper.sign" : "paper.sign.decline", targetType: row.paperKind, targetId: row.paperId, meta: { slot: row.slot, role: row.role, own: false } });
  if (row.requestedByUserId && row.requestedByUserId !== ctx.user.id) {
    const named = await paperNamed(me.schoolId, paper.paperKind, paper.paperId);
    if (named) await notify({ userId: row.requestedByUserId, schoolId: me.schoolId, kind: "SYSTEM", titleKey: approve ? "signatures.notifSigned" : "signatures.notifDeclined", titleVars: { signer: ctx.user.name, name: named.studentName, title: named.title }, url: named.url }).catch((error) => console.error("[decidePaperSignature] notice failed", error));
  }
  return { ...(await opened(me.schoolId, paper)), status: approve ? "SIGNED" : "DECLINED" };
}

/** The paper a decision's answer names: the certificate, or for a set one of its cards, which is what a page can open. */
async function opened(schoolId: string, paper: { paperKind: PaperKind; paperId: string }): Promise<{ paperKind: PaperKind; paperId: string }> {
  if (paper.paperKind !== "REPORT_CARD_SET") return paper;
  const named = await paperNamed(schoolId, paper.paperKind, paper.paperId);
  return { paperKind: paper.paperKind, paperId: named?.openId ?? paper.paperId };
}

/** What a paper is called, for the list of what waits and for a notice. Null for one that is gone or revoked. */
async function paperNamed(schoolId: string, kind: PaperKind, id: string): Promise<{ title: string; serial: string | null; studentName: string; url: string; openId: string; count: number } | null> {
  if (kind === "CERTIFICATE") {
    const c = await db.issuedCertificate.findFirst({ where: { id, schoolId, revokedAt: null }, select: { title: true, serial: true, studentName: true, student: { select: { user: { select: { name: true } } } } } });
    return c ? { title: c.title, serial: c.serial, studentName: c.studentName ?? c.student.user.name, url: `/certificates/${id}`, openId: id, count: 1 } : null;
  }
  // A set: named by its class, opened at the first of its cards by the pupil's name, counted.
  const { classId, title } = cardSetOf(id);
  const cards = await db.reportCard.findMany({ where: { schoolId, classId, title, status: "PUBLISHED" }, orderBy: [{ student: { user: { name: "asc" } } }, { id: "asc" }], select: { id: true, layout: true, class: { select: { name: true } } } });
  const first = cards[0];
  if (!first) return null;
  let className = first.class.name;
  try {
    const frozen = first.layout ? (JSON.parse(first.layout) as { className?: string }).className : undefined;
    if (typeof frozen === "string" && frozen) className = frozen;
  } catch {
    // The class as it is called today.
  }
  return { title, serial: null, studentName: className, url: `/report-cards/${first.id}`, openId: first.id, count: cards.length };
}

/** A set taken back to drafts loses its signatures: published again, it asks again. */
export async function unsignCardSet(schoolId: string, classId: string, title: string): Promise<void> {
  await db.paperSignature.deleteMany({ where: { schoolId, paperKind: "REPORT_CARD_SET", paperId: cardSetId(classId, title) } });
}

/** The reader's own signature, the seal, and the papers that wait for the reader's word. */
export async function signaturesView(ctx: ActiveContext): Promise<SignaturesView> {
  const me = signer(ctx);
  const [own, seal, pendingAll] = await Promise.all([
    db.signatureImage.findFirst({ where: { membershipId: me.membershipId, schoolId: me.schoolId, kind: "PERSON" }, select: { png: true, updatedAt: true } }),
    db.signatureImage.findFirst({ where: { schoolId: me.schoolId, kind: "SEAL" }, select: { png: true, updatedAt: true } }),
    db.paperSignature.findMany({ where: { schoolId: me.schoolId, status: "PENDING", role: me.role, slot: { in: ["LEFT", "RIGHT"] } }, orderBy: { createdAt: "asc" }, take: 200 }),
  ]);
  const pending: typeof pendingAll = [];
  for (const p of pendingAll) if (await mine(me, p)) pending.push(p);
  const askers = await db.user.findMany({ where: { id: { in: [...new Set(pending.map((p) => p.requestedByUserId).filter((x): x is string => Boolean(x)))] } }, select: { id: true, name: true, preferredName: true } });
  const asker = new Map(askers.map((u) => [u.id, u.preferredName ?? u.name]));
  const waiting: SignaturesView["waiting"] = [];
  const seen = new Set<string>();
  for (const p of pending) {
    const named = await paperNamed(me.schoolId, p.paperKind as PaperKind, p.paperId);
    if (!named) continue;
    // A paper with both lines waiting for the same role is one paper to open.
    if (seen.has(`${p.paperKind}:${p.paperId}`)) continue;
    seen.add(`${p.paperKind}:${p.paperId}`);
    waiting.push({ id: p.id, paperKind: p.paperKind as PaperKind, paperId: named.openId, count: named.count, title: named.title, serial: named.serial, studentName: named.studentName, requestedByName: p.requestedByUserId ? (asker.get(p.requestedByUserId) ?? null) : null, createdAt: p.createdAt.toISOString() });
  }
  // The address carries the time it was last set, so a browser does not show yesterday's picture from its cache.
  const at = (row: { png: Uint8Array; updatedAt: Date } | null, of: "mine" | "seal") => (row && row.png.length > 0 ? `/api/v1/office/signatures/image?of=${of}&v=${row.updatedAt.getTime()}` : null);
  return { mine: { image: at(own, "mine"), updatedAt: own?.updatedAt.toISOString() ?? null }, seal: { image: at(seal, "seal"), updatedAt: seal?.updatedAt.toISOString() ?? null }, canSetSeal: me.role === "ADMIN", waiting };
}

/** How many papers wait for the reader, for the menu's count. Nothing for somebody who signs nothing. */
export async function waitingSignatureCount(ctx: ActiveContext): Promise<number> {
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role || !(SIGNERS as readonly string[]).includes(ctx.role)) return 0;
  const where = { schoolId: ctx.schoolId, status: "PENDING", role: ctx.role, slot: { in: ["LEFT", "RIGHT"] } };
  if (ctx.role !== "TEACHER") return db.paperSignature.count({ where });
  const me = { schoolId: ctx.schoolId, membershipId: ctx.membershipId, role: "TEACHER" as const };
  let n = 0;
  for (const row of await db.paperSignature.findMany({ where, select: { schoolId: true, role: true, paperKind: true, paperId: true } })) if (await mine(me, row)) n += 1;
  return n;
}

/* -------------------------------------------------------------------------- */
/* Before issuing: will the lines print?                                       */
/* -------------------------------------------------------------------------- */

export type SignerReadiness = {
  /** The lines the template asks for, each with whether a picture is on file to fill it. */
  lines: { slot: "LEFT" | "RIGHT"; role: SignerRole; mine: boolean; onFile: boolean }[];
  /** The template asks for the seal and the school has none. */
  sealMissing: boolean;
};

/**
 * What the issuer should know before pressing Issue (10 Oct 2026): a line
 * whose signer has no picture on file prints bare, the issuer's own at once and
 * somebody else's after a wait that can never end. Pure over the facts, so the
 * rule is testable without a database; `signerReadiness` gathers the facts.
 */
export function readinessFrom(
  layout: Pick<CertificateLayout, "signerLeft" | "signerRight" | "showSeal">,
  facts: { myRole: string | null; mineOnFile: boolean; onFileByRole: Partial<Record<SignerRole, boolean>>; sealOnFile: boolean },
): SignerReadiness {
  const lines: SignerReadiness["lines"] = [];
  for (const [slot, who] of [["LEFT", layout.signerLeft], ["RIGHT", layout.signerRight]] as const) {
    if (who !== "ADMIN" && who !== "PRINCIPAL") continue;
    const role: SignerRole = who;
    const mine = facts.myRole === role;
    lines.push({ slot, role, mine, onFile: mine ? facts.mineOnFile : Boolean(facts.onFileByRole[role]) });
  }
  return { lines, sealMissing: layout.showSeal && !facts.sealOnFile };
}

/** The facts for `readinessFrom`, read for the issuer's school. */
export async function signerReadiness(ctx: ActiveContext, layout: Pick<CertificateLayout, "signerLeft" | "signerRight" | "showSeal">): Promise<SignerReadiness> {
  if (!ctx.schoolId) return { lines: [], sealMissing: false };
  const schoolId = ctx.schoolId;
  const signers = await db.membership.findMany({ where: { schoolId, role: { in: ["ADMIN", "PRINCIPAL"] }, status: "ACTIVE", leftAt: null }, select: { id: true, role: true } });
  const [mine, withImage, seal] = await Promise.all([
    ctx.membershipId ? db.signatureImage.findFirst({ where: { schoolId, kind: "PERSON", membershipId: ctx.membershipId }, select: { id: true } }) : null,
    db.signatureImage.findMany({ where: { schoolId, kind: "PERSON", membershipId: { in: signers.map((m) => m.id) } }, select: { membershipId: true } }),
    db.signatureImage.findFirst({ where: { schoolId, kind: "SEAL" }, select: { id: true } }),
  ]);
  const roleOf = new Map(signers.map((m) => [m.id, m.role]));
  const onFileByRole: Partial<Record<SignerRole, boolean>> = {};
  for (const row of withImage) {
    const role = row.membershipId ? roleOf.get(row.membershipId) : undefined;
    if (role === "ADMIN" || role === "PRINCIPAL") onFileByRole[role] = true;
  }
  return readinessFrom(layout, { myRole: ctx.role, mineOnFile: Boolean(mine), onFileByRole, sealOnFile: Boolean(seal) });
}

