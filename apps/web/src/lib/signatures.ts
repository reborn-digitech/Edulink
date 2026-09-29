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
 * WHO HAS ONE. An admin and the head each keep one signature; the school
 * keeps one seal, which is the admin's to set. A template says who signs
 * each of its two lines (the contracts' paperSignerSchema) and whether the
 * seal is printed.
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
 * THE PICTURE IS NEVER A LINK. It is kept in the row, read only to be drawn
 * on a paper its reader may already see, and handed over inside that
 * paper's own answer. There is no address at which a signature can be
 * fetched by itself.
 *
 * The audit log carries who set, removed, signed and declined, and which
 * paper; never the picture.
 */

export type PaperKind = "CERTIFICATE" | "REPORT_CARD";
type SignerRole = "ADMIN" | "PRINCIPAL";
const SIGNERS: readonly SignerRole[] = ["ADMIN", "PRINCIPAL"];

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
export async function signOnIssue(ctx: ActiveContext, paper: { kind: PaperKind; id: string; schoolId: string; title: string; studentName: string }, layout: Pick<CertificateLayout, "signerLeft" | "signerRight" | "showSeal">): Promise<void> {
  const slots = ([["LEFT", layout.signerLeft], ["RIGHT", layout.signerRight]] as const).filter(([, who]) => who === "ADMIN" || who === "PRINCIPAL") as ["LEFT" | "RIGHT", SignerRole][];
  const issuerName = ctx.user.name;
  const own = ctx.membershipId && ctx.schoolId === paper.schoolId ? await db.signatureImage.findFirst({ where: { membershipId: ctx.membershipId, schoolId: paper.schoolId, kind: "PERSON" }, select: { png: true } }) : null;
  const waitingOn = new Set<SignerRole>();
  for (const [slot, role] of slots) {
    const mine = ctx.role === role && ctx.schoolId === paper.schoolId && own !== null;
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
  const holders = await db.membership.findMany({ where: { schoolId: paper.schoolId, role: { in: [...waitingOn] }, status: "ACTIVE", leftAt: null, userId: { not: ctx.user.id } }, select: { userId: true } });
  await Promise.all(
    [...new Set(holders.map((h) => h.userId))].map((userId) =>
      notify({ userId, schoolId: paper.schoolId, kind: "SYSTEM", titleKey: "signatures.notifWaiting", titleVars: { name: paper.studentName, title: paper.title }, bodyKey: "signatures.notifWaitingBody", url: "/admin/signatures" }).catch((error) => console.error("[signOnIssue] notice failed", error)),
    ),
  );
}

/** The signatures and the seal of one paper, for a reader the paper's own rule has already let in. */
export async function paperSignatures(ctx: ActiveContext, paper: { kind: PaperKind; id: string; schoolId: string }): Promise<{ signatures: PaperSignatureView[]; seal: string | null }> {
  const rows = await db.paperSignature.findMany({ where: { paperKind: paper.kind, paperId: paper.id, schoolId: paper.schoolId }, orderBy: { slot: "asc" } });
  const signatures: PaperSignatureView[] = rows
    .filter((r) => (r.slot === "LEFT" || r.slot === "RIGHT") && (r.role === "ADMIN" || r.role === "PRINCIPAL"))
    .map((r) => ({
      id: r.id,
      slot: r.slot as "LEFT" | "RIGHT",
      role: r.role as SignerRole,
      status: r.status as PaperSignatureView["status"],
      signerName: r.signerName,
      image: r.status === "SIGNED" ? pngUrl(r.png) : null,
      decidedAt: r.decidedAt?.toISOString() ?? null,
      can: { decide: r.status === "PENDING" && ctx.schoolId === paper.schoolId && ctx.role === r.role },
    }));
  const seal = rows.find((r) => r.slot === "SEAL" && r.status === "SIGNED");
  return { signatures, seal: pngUrl(seal?.png) };
}

/** The owner signs a paper that waited for them, or declines to. A settled one is left as it stands. */
export async function decidePaperSignature(ctx: ActiveContext, signatureId: string, approve: boolean): Promise<{ paperKind: PaperKind; paperId: string; status: string }> {
  const me = signer(ctx);
  const row = await db.paperSignature.findFirst({ where: { id: signatureId, schoolId: me.schoolId } });
  if (!row || row.slot === "SEAL") throw new AccessError("signatures.notFound", "NOT_FOUND");
  const paper = { paperKind: row.paperKind as PaperKind, paperId: row.paperId };
  // A settled one is answered as it stands to either of the two who sign the school's papers: both read the paper.
  if (row.status !== "PENDING") return { ...paper, status: row.status };
  if (row.role !== me.role) throw new AccessError("signatures.notYours");
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
    return { ...paper, status: now.status };
  }
  await audit({ schoolId: me.schoolId, actorUserId: ctx.user.id, action: approve ? "paper.sign" : "paper.sign.decline", targetType: row.paperKind, targetId: row.paperId, meta: { slot: row.slot, role: row.role, own: false } });
  if (row.requestedByUserId && row.requestedByUserId !== ctx.user.id) {
    const named = await paperNamed(me.schoolId, paper.paperKind, paper.paperId);
    if (named) await notify({ userId: row.requestedByUserId, schoolId: me.schoolId, kind: "SYSTEM", titleKey: approve ? "signatures.notifSigned" : "signatures.notifDeclined", titleVars: { signer: ctx.user.name, name: named.studentName, title: named.title }, url: named.url }).catch((error) => console.error("[decidePaperSignature] notice failed", error));
  }
  return { ...paper, status: approve ? "SIGNED" : "DECLINED" };
}

/** What a paper is called, for the list of what waits and for a notice. Null for one that is gone or revoked. */
async function paperNamed(schoolId: string, kind: PaperKind, id: string): Promise<{ title: string; serial: string | null; studentName: string; url: string } | null> {
  if (kind === "CERTIFICATE") {
    const c = await db.issuedCertificate.findFirst({ where: { id, schoolId, revokedAt: null }, select: { title: true, serial: true, studentName: true, student: { select: { user: { select: { name: true } } } } } });
    return c ? { title: c.title, serial: c.serial, studentName: c.studentName ?? c.student.user.name, url: `/certificates/${id}` } : null;
  }
  const card = await db.reportCard.findFirst({ where: { id, schoolId }, select: { title: true, studentName: true, student: { select: { user: { select: { name: true } } } } } });
  return card ? { title: card.title, serial: null, studentName: card.studentName ?? card.student.user.name, url: `/report-cards/${id}` } : null;
}

/** The reader's own signature, the seal, and the papers that wait for the reader's word. */
export async function signaturesView(ctx: ActiveContext): Promise<SignaturesView> {
  const me = signer(ctx);
  const [mine, seal, pending] = await Promise.all([
    db.signatureImage.findFirst({ where: { membershipId: me.membershipId, schoolId: me.schoolId, kind: "PERSON" }, select: { png: true, updatedAt: true } }),
    db.signatureImage.findFirst({ where: { schoolId: me.schoolId, kind: "SEAL" }, select: { png: true, updatedAt: true } }),
    db.paperSignature.findMany({ where: { schoolId: me.schoolId, status: "PENDING", role: me.role, slot: { in: ["LEFT", "RIGHT"] } }, orderBy: { createdAt: "asc" }, take: 200 }),
  ]);
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
    waiting.push({ id: p.id, paperKind: p.paperKind as PaperKind, paperId: p.paperId, title: named.title, serial: named.serial, studentName: named.studentName, requestedByName: p.requestedByUserId ? (asker.get(p.requestedByUserId) ?? null) : null, createdAt: p.createdAt.toISOString() });
  }
  return { mine: { image: pngUrl(mine?.png), updatedAt: mine?.updatedAt.toISOString() ?? null }, seal: { image: pngUrl(seal?.png), updatedAt: seal?.updatedAt.toISOString() ?? null }, canSetSeal: me.role === "ADMIN", waiting };
}

/** How many papers wait for the reader, for the menu's count. Nothing for somebody who signs nothing. */
export async function waitingSignatureCount(ctx: ActiveContext): Promise<number> {
  if (!ctx.schoolId || !ctx.role || !(SIGNERS as readonly string[]).includes(ctx.role)) return 0;
  return db.paperSignature.count({ where: { schoolId: ctx.schoolId, status: "PENDING", role: ctx.role, slot: { in: ["LEFT", "RIGHT"] } } });
}
