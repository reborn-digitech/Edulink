/**
 * Three demo accounts the QA campaign of 24–25 October 2026 asked for, beside the demo schools and colleges.
 *
 *   npm run demo:accounts
 *
 *   demo.expert01@demo.relay.test     an EXPERT who came in through the public application: the application
 *                                     submitted by the form's own function, approved by the operator's, the
 *                                     invitation's link taken from the dev mailbox and accepted as the invite
 *                                     page does, the profile published and identity-checked by the operator's
 *                                     curation, and two open slots next week added as the expert adds them
 *   demo.recruiter01@demo.relay.test  a RECRUITER of Sahyadri Data Labs Pvt Ltd, the company with the OPEN drive at
 *                                     Saraswati Arts and Science College: invited by the company's recruiter
 *                                     (recruiter.sahyadri) and accepting, the placement library's two writes in
 *                                     its order (the library itself does not load under tsx), so the drive is
 *                                     theirs to read
 *   demo.parent.two@demo.relay.test   a PARENT with one child at Sunrise Public School (Nakul Jadhav, grade 6,
 *                                     sunrise.pupil14) and one at Saraswati Vidya Mandir (Hrishikesh Pawar, grade
 *                                     5, svm.pupil07), two pupils the demo seed left without a guardian
 *
 * Every account signs in with the demo schools' shared password (scripts/demo-schools.ts PASSWORD), set the way
 * the fixture scripts set it. IDEMPOTENT: a second run finds each account, binding and link and adds nothing; it
 * resets the password as demo:schools does. Needs `npm run demo:schools` and `npm run demo:college` first (the
 * pupils and the company), and the ZZ fixture's operator (`npm run zz:fixtures`), who decides the application.
 *
 * WHAT IT TOUCHES: these three @demo.relay.test accounts and what hangs off them (the application, the profile,
 * the slots, the company binding, two guardianships), plus the operator's audit rows and the dev mailbox's mails
 * the library calls write. The library calls run as actors whose sessions (userAgent "zz-walk") are deleted at
 * the end. Runs on the ADMIN connection, like the other demo scripts.
 */
import { hash } from "@node-rs/argon2";
import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ActiveContext } from "../src/lib/session";
import { decideExpertApplication, submitExpertApplication } from "../src/lib/expert-applications";
import { acceptExpertInvite, addSlot } from "../src/lib/experts";
import { setExpertStanding } from "../src/lib/superuser";
import { audit } from "../src/lib/audit";
import { db, link, refuseUnlessLocal, upsertUser, type Ctx } from "./zz-fixtures";
import { PASSWORD } from "./demo-schools";

const DOMAIN = "demo.relay.test";
const ARGON = { memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;

const EXPERT = {
  email: `demo.expert01@${DOMAIN}`,
  name: "Dr Kavita Ranade",
  phone: "+919822099001",
  city: "Pune",
  organisation: "Fergusson College (retired)",
  headline: "Physics teacher of thirty years; careers in the sciences",
  bio: "Taught physics to classes 11 and 12 for thirty years and ran the college's science club. Now gives talks to schools on careers in the sciences and mentors pupils preparing for the olympiads.",
  specialisms: ["SCIENCE", "CAREERS"],
  languages: ["en", "mr"],
  yearsExperience: 30,
  links: ["https://example.org/kavita-ranade"],
  offering: "BOTH",
};
const RECRUITER = { email: `demo.recruiter01@${DOMAIN}`, name: "Rhea Fernandes", company: "Sahyadri Data Labs Pvt Ltd", colleague: `recruiter.sahyadri@${DOMAIN}` };
const PARENT = {
  email: `demo.parent.two@${DOMAIN}`,
  name: "Rohini Jadhav",
  phone: "+919822099002",
  children: [
    { email: `sunrise.pupil14@${DOMAIN}`, school: "sunrise-public-school" },
    { email: `svm.pupil07@${DOMAIN}`, school: "saraswati-vidya-mandir" },
  ],
};
const OPERATOR_EMAIL = "zz.operator@zz.test";

/* actors for the library calls, as demo-college-stream.ts makes them; their sessions are deleted at the end */
const PREFS = { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null } as const;
const sessionIds: string[] = [];
async function actor(userId: string, role: string | null): Promise<ActiveContext> {
  const u = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { id: true, name: true, email: true, isMinor: true, isSuperuser: true, isAppAdmin: true } });
  const session = await db.session.create({ data: { userId, tokenHash: `zz-walk-${randomBytes(24).toString("hex")}`, activeSchoolId: null, activeRole: role, userAgent: "zz-walk", expiresAt: new Date(Date.now() + 3_600_000) }, select: { id: true } });
  sessionIds.push(session.id);
  return { sessionId: session.id, membershipId: null, schoolId: null, role: role as ActiveContext["role"], user: { id: u.id, name: u.name, preferredName: null, email: u.email, avatarKey: null, isMinor: u.isMinor, isSuperuser: u.isSuperuser, isAppAdmin: u.isAppAdmin, prefs: PREFS as unknown as ActiveContext["user"]["prefs"] } };
}

/** The smallest document the byte sniffer reads as a PDF: the applicant's qualification, made up. */
function documentPdf(): File {
  const body = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n";
  return new File([body], "qualification.pdf", { type: "application/pdf" });
}

/** Next week's Tuesday and Thursday at 10:30 IST (05:00 UTC), an hour each. */
function nextWeekSlots(): { startsAt: Date; endsAt: Date }[] {
  const now = new Date();
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + ((8 - now.getUTCDay()) % 7 || 7), 5, 0));
  return [1, 3].map((offset) => {
    const startsAt = new Date(monday.getTime() + offset * 86_400_000);
    return { startsAt, endsAt: new Date(startsAt.getTime() + 60 * 60_000) };
  });
}

async function buildExpert(ctx: Ctx, operator: ActiveContext) {
  const steps: string[] = [];
  let user = await db.user.findUnique({ where: { email: EXPERT.email }, select: { id: true, expertProfile: { select: { id: true } } } });
  if (!user?.expertProfile) {
    if (user) throw new Error(`${EXPERT.email} exists without an expert profile: approve its application by hand or remove the account first`);
    // 1. The public form's function (no account is made by it).
    let application = await db.expertApplication.findFirst({ where: { email: EXPERT.email, status: "PENDING" }, select: { id: true } });
    if (!application) {
      const submitted = await submitExpertApplication(
        { name: EXPERT.name, email: EXPERT.email, phone: EXPERT.phone, city: EXPERT.city, organisation: EXPERT.organisation, headline: EXPERT.headline, specialisms: EXPERT.specialisms, languages: EXPERT.languages, yearsExperience: EXPERT.yearsExperience, bio: EXPERT.bio, links: EXPERT.links, offering: EXPERT.offering, declaration: true },
        documentPdf(),
        "en",
      );
      if (!submitted.ok) throw new Error(`the application was refused: ${JSON.stringify(submitted)}`);
      application = { id: submitted.id };
      steps.push(`application ${submitted.id} submitted`);
    }
    // 2. The operator approves: the account (no password), the unpublished profile and the invitation, in one transaction.
    const decided = await decideExpertApplication(operator, application.id, { decision: "APPROVE" });
    if (!decided.ok) throw new Error(`the approval was refused: ${decided.errorKey}`);
    steps.push(`approved by ${OPERATOR_EMAIL} (invite mailed: ${decided.inviteSent})`);
    // 3. The invitation's link, from the dev mailbox the approval wrote to.
    const mail = await db.outboundEmail.findFirst({ where: { to: EXPERT.email, text: { contains: "/expert/invite/" } }, orderBy: { createdAt: "desc" }, select: { text: true } });
    const token = mail ? /\/expert\/invite\/([A-Za-z0-9_-]+)/.exec(mail.text)?.[1] : undefined;
    if (!token) throw new Error("the invitation's mail was not found in the dev mailbox (is EMAIL_TRANSPORT devbox?)");
    // 4. Accepted as /expert/invite/[token]'s action accepts it for an approved applicant: the unproved account
    //    reclaimed (the password set, the address proved by opening the link), then the invitation consumed.
    const made = await db.user.findUniqueOrThrow({ where: { email: EXPERT.email }, select: { id: true } });
    await db.user.update({ where: { id: made.id }, data: { passwordHash: ctx.passwordHash, emailVerifiedAt: new Date() } });
    await acceptExpertInvite(token, { userId: made.id }, { headline: EXPERT.headline });
    steps.push("invitation accepted");
    user = await db.user.findUniqueOrThrow({ where: { email: EXPERT.email }, select: { id: true, expertProfile: { select: { id: true } } } });
  }
  // The fixture flag and the shared password, as every demo account carries them.
  await upsertUser(ctx, EXPERT.email, EXPERT.name);
  const profileId = user.expertProfile!.id;
  // 5. The operator publishes and records the identity check (the marketplace's badge).
  const profile = await db.expertProfile.findUniqueOrThrow({ where: { id: profileId }, select: { publishedAt: true, kycStatus: true } });
  if (!profile.publishedAt || profile.kycStatus !== "VERIFIED") {
    const curated = await setExpertStanding(operator, profileId, { published: true, verified: true });
    if (!curated.ok) throw new Error(`publishing was refused: ${curated.errorKey}`);
    steps.push("published and identity-checked");
  }
  // 6. Availability: two open hours next week, added as the expert adds them.
  const expert = await actor(user.id, "EXPERT");
  let slots = 0;
  for (const s of nextWeekSlots()) {
    const has = await db.expertSlot.findFirst({ where: { expertProfileId: profileId, startsAt: s.startsAt, cancelledAt: null }, select: { id: true } });
    if (has) continue;
    await addSlot(expert, { ...s, note: "A careers talk or a one-to-one" });
    slots += 1;
  }
  const open = await db.expertSlot.count({ where: { expertProfileId: profileId, cancelledAt: null, bookedAt: null, startsAt: { gt: new Date() } } });
  const application = await db.expertApplication.findFirst({ where: { email: EXPERT.email, status: "APPROVED" }, orderBy: { decidedAt: "desc" }, select: { id: true } });
  return { userId: user.id, profileId, applicationId: application?.id ?? null, steps, slotsAdded: slots, openSlots: open };
}

async function buildRecruiter(ctx: Ctx) {
  const steps: string[] = [];
  const user = await upsertUser(ctx, RECRUITER.email, RECRUITER.name);
  await db.recruiterProfile.upsert({ where: { userId: user.id }, create: { userId: user.id, companyName: RECRUITER.company }, update: { disabledAt: null } });
  const company = await db.company.findFirst({ where: { name: RECRUITER.company }, select: { id: true } });
  if (!company) throw new Error(`no company "${RECRUITER.company}": run npm run demo:college first`);
  const binding = await db.companyRecruiter.findUnique({ where: { companyId_userId: { companyId: company.id, userId: user.id } }, select: { acceptedAt: true, removedAt: true } });
  if (!binding?.acceptedAt || binding.removedAt) {
    // The two writes of src/lib/placement-recruiter.ts, in its order: addColleague's invitation (the bound
    // recruiter adds this account by its address; it reads nothing yet) and answerInvitation's acceptance. Not
    // called: that file reaches @react-pdf through placement-pdf.ts, whose export map tsx cannot resolve.
    const colleague = await db.user.findUnique({ where: { email: RECRUITER.colleague }, select: { id: true } });
    if (!colleague) throw new Error(`${RECRUITER.colleague} is missing: run npm run demo:college first`);
    const bound = await db.companyRecruiter.findFirst({ where: { companyId: company.id, userId: colleague.id, removedAt: null, acceptedAt: { not: null } }, select: { id: true } });
    if (!bound) throw new Error(`${RECRUITER.colleague} is not bound to ${RECRUITER.company}: run npm run demo:college first`);
    await db.companyRecruiter.upsert({ where: { companyId_userId: { companyId: company.id, userId: user.id } }, update: { removedAt: null, acceptedAt: null, addedByUserId: colleague.id, addedAt: new Date() }, create: { companyId: company.id, userId: user.id, addedByUserId: colleague.id } });
    await audit({ schoolId: null, actorUserId: colleague.id, action: "placement.company.colleague", targetType: "Company", targetId: company.id, meta: { invited: user.id } });
    steps.push(`invited by ${RECRUITER.colleague}`);
    await db.companyRecruiter.update({ where: { companyId_userId: { companyId: company.id, userId: user.id } }, data: { acceptedAt: new Date() } });
    await audit({ schoolId: null, actorUserId: user.id, action: "placement.company.colleagueAccept", targetType: "Company", targetId: company.id });
    steps.push("accepted");
  }
  const drives = await db.drive.findMany({ where: { companyId: company.id }, select: { status: true, school: { select: { name: true } } } });
  return { userId: user.id, companyId: company.id, steps, drives: drives.map((d) => `${d.school.name}: ${d.status}`) };
}

async function buildParent(ctx: Ctx) {
  const taken = await db.user.findUnique({ where: { phone: PARENT.phone }, select: { email: true } });
  const extra = !taken || taken.email === PARENT.email ? { phone: PARENT.phone, phoneVerifiedAt: new Date() } : {};
  const parent = await upsertUser(ctx, PARENT.email, PARENT.name, extra);
  const children: { name: string; school: string; grade: string | null; membershipId: string }[] = [];
  for (const c of PARENT.children) {
    const member = await db.membership.findFirst({
      where: { role: "STUDENT", status: "ACTIVE", leftAt: null, user: { email: c.email }, school: { slug: c.school } },
      select: { id: true, schoolId: true, gradeLevel: true, user: { select: { name: true } }, school: { select: { name: true } } },
    });
    if (!member) throw new Error(`${c.email} is not an active pupil at ${c.school}: run npm run demo:schools first`);
    await link(parent.id, member.id, member.schoolId);
    children.push({ name: member.user.name, school: member.school.name, grade: member.gradeLevel, membershipId: member.id });
  }
  return { userId: parent.id, children };
}

function rosterSection(input: { expert: Awaited<ReturnType<typeof buildExpert>>; recruiter: Awaited<ReturnType<typeof buildRecruiter>>; parent: Awaited<ReturnType<typeof buildParent>> }): string {
  const [a, b] = input.parent.children as [typeof input.parent.children[0], typeof input.parent.children[0]];
  return `<!-- demo-accounts:begin -->
## Three more demo accounts (demo:accounts)

Built by \`npm run demo:accounts\` (from \`apps/web\`; idempotent; after \`demo:schools\`, \`demo:college\` and \`zz:fixtures\`). The password is the shared \`${PASSWORD}\`.

| Account | Name | Role | Home | What to look at |
|---|---|---|---|---|
| ${EXPERT.email} | ${EXPERT.name} | EXPERT, through the public application (application ${input.expert.applicationId ?? "—"}, approved by the operator, invitation accepted, published and identity-checked) | /expert | /expert/availability (${input.expert.openSlots} open slots), /expert/profile; the operator's /root/experts (the approved application) |
| ${RECRUITER.email} | ${RECRUITER.name} | RECRUITER, ${RECRUITER.company} (invited by ${RECRUITER.colleague} and accepted; no membership) | /recruiter | ${input.recruiter.drives.join("; ") || "no drive"} |
| ${PARENT.email} | ${PARENT.name} | PARENT of ${a.name} (${a.school}, grade ${a.grade}) and ${b.name} (${b.school}, grade ${b.grade}) | /parent | the child switcher across two schools: \`?child=${a.membershipId}\` and \`?child=${b.membershipId}\`; /parent/fees at each school |
<!-- demo-accounts:end -->`;
}

async function main() {
  await refuseUnlessLocal("demo:accounts");
  const ctx: Ctx = { passwordHash: await hash(PASSWORD, ARGON), setPassword: true };
  const operatorUser = await db.user.findUnique({ where: { email: OPERATOR_EMAIL }, select: { id: true, isSuperuser: true } });
  if (!operatorUser?.isSuperuser) throw new Error(`${OPERATOR_EMAIL} is missing or not the operator: run npm run zz:fixtures first`);
  try {
    const operator = await actor(operatorUser.id, null);
    const expert = await buildExpert(ctx, operator);
    const recruiter = await buildRecruiter(ctx);
    const parent = await buildParent(ctx);

    const docPath = join(process.cwd(), "..", "..", "docs", "demo-schools.md");
    const before = await readFile(docPath, "utf8").catch(() => "");
    const section = rosterSection({ expert, recruiter, parent });
    const marked = /<!-- demo-accounts:begin -->[\s\S]*?<!-- demo-accounts:end -->/;
    await writeFile(docPath, marked.test(before) ? before.replace(marked, section) : `${before.trimEnd()}\n\n${section}\n`);

    console.log(`
  Demo accounts ready. Password: ${PASSWORD}
     ${EXPERT.email}   ${expert.steps.join("; ") || "already built"}; profile ${expert.profileId}; ${expert.slotsAdded} slot(s) added, ${expert.openSlots} open
     ${RECRUITER.email}   ${recruiter.steps.join("; ") || "already bound"}; drives: ${recruiter.drives.join("; ") || "none"}
     ${PARENT.email}   ${parent.children.map((c) => `${c.name} at ${c.school} (grade ${c.grade}, ${c.membershipId})`).join("; ")}
  Roster section written to ${docPath}
`);
  } finally {
    if (sessionIds.length) await db.session.deleteMany({ where: { id: { in: sessionIds }, userAgent: "zz-walk" } });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
