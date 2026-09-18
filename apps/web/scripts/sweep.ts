/**
 * Route sweep. Mints a real session row per role, then requests every route the
 * navigation offers AS a signed-in user of the role that owns it.
 *
 * Asserts 200 specifically. "200 or a redirect" is what previously let a 404 and
 * a five-commit-old 500 through — a redirect to /login is a route that never
 * rendered, not a route that works.
 *
 * Run: tsx --tsconfig scripts/tsconfig.json scripts/sweep.ts
 */
import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { config } from "dotenv";
import { NAV, PRIMARY_ACTION, QUICK_ACTIONS } from "@/lib/nav";
import { ROLES, type Role } from "@/lib/constants";

config();

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL });

type Actor = { label: string; cookie: string; sessionId: string };

async function mint(email: string, role: string | null, schoolId: string | null, label: string): Promise<Actor> {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) throw new Error(`no such user: ${email}`);
  const token = randomBytes(32).toString("base64url");
  const session = await db.session.create({
    data: {
      userId: user.id,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      activeSchoolId: schoolId,
      activeRole: role,
      userAgent: "sweep",
      // 24h, not 1h: a cold dev server compiling every route on first hit has
      // pushed a full run past the hour, at which point every remaining check
      // "failed" as 307 → /login — the harness outliving its own sessions.
      expiresAt: new Date(Date.now() + 86_400_000),
    },
  });
  return { label, cookie: `edulink_session=${token}`, sessionId: session.id };
}

/**
 * RETRIES TRANSPORT FAILURES, NEVER STATUSES. `next dev` recycles keep-alive
 * sockets while it compiles on demand, so a long sequential sweep sees
 * "other side closed" mid-run — a fact about the socket, not the route. A GET
 * is safe to reissue; a 500 is a result and is still reported first time.
 */
async function hit(actor: Actor | null, path: string): Promise<{ status: number; body: string; loc: string | null }> {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(BASE + path, {
        headers: actor ? { cookie: actor.cookie } : {},
        redirect: "manual",
      });
      const body = res.status === 200 ? await res.text() : "";
      return { status: res.status, body, loc: res.headers.get("location") };
    } catch (error) {
      if (attempt >= 3) throw error;
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
}

/**
 * ⚠ WHAT A BODY CHECK IS ALLOWED TO LOOK FOR: MARKUP, NEVER PROSE.
 *
 * Status alone proves the route rendered, not that the thing worth rendering is
 * on it, so about a dozen checks in this file read the body. They used to read
 * it for an English sentence — and the day the app was translated, every one of
 * them quietly stopped being a fact about the ROUTE and became a fact about the
 * ACTOR'S LANGUAGE.
 *
 * That is not theoretical. `/admin/calendar` looked for "Birthdays" and went red
 * for an admin whose `prefs.locale` was Marathi, with nothing whatsoever wrong
 * with the page. A net that cries about its reader is worse than no net: it
 * teaches you to disbelieve it.
 *
 * SO THE HOOK IS STRUCTURE — an `id` an `aria-labelledby` points at, a `data-`
 * attribute, an `href`, a `type="password"`. All identical in every language,
 * and all load-bearing, so deleting the feature deletes the hook and the check
 * goes red for the right reason.
 *
 * ⚠ WHAT THIS DELIBERATELY GIVES UP, because it should be said rather than
 * discovered: rewording is no longer caught. A page that renders the right
 * regions with the wrong sentences in them passes. That is the correct trade —
 * "the birthdays section is on the staff calendar" is a claim about the route
 * and holds in every language; "the page says Birthdays" never was one.
 *
 * NOT DONE, and rejected on purpose: setting each actor's `prefs.locale` to
 * English before the check. That writes to rows the sweep did not create, which
 * this project treats as destructive whether the write adds, edits, or removes.
 *
 * Fixture names the sweep itself made ("ZZ Sweep Term"), school names, and the
 * Devanagari check that proves the language switcher renders `मराठी` are all
 * fine and stay: none of them is prose the app translates.
 */
const results: { role: string; path: string; status: number; expected: number; ok: boolean; note: string }[] = [];

/**
 * Checks this run did NOT make, and why.
 *
 * A check that quietly does nothing is indistinguishable from one that passed,
 * and "217/217" over a role nothing was minted for is a lie the report tells
 * with a straight face. Every `if (!fixture) return` in this file used to end
 * the story there. Now it says so, and the count says how many.
 */
const skipped: string[] = [];
function skip(what: string, why: string) {
  skipped.push(`${what} — ${why}`);
}

/** Made for the length of a run and removed in a `finally`. */
const SWEEP_EXPERT_EMAIL = "zz.sweep.expert@edulink.test";

async function check(actor: Actor | null, path: string, expected = 200, note = "") {
  const { status, loc } = await hit(actor, path);
  const ok = status === expected;
  results.push({
    role: actor?.label ?? "anonymous",
    path,
    status,
    expected,
    ok,
    note: ok ? note : `${note}${loc ? ` → ${loc}` : ""}`.trim(),
  });
}

/**
 * One person, two schools — built for the length of this check and taken away
 * again, because the seed has nobody in this position and adding one would move
 * every count the other suites assert.
 *
 * It is here rather than in `npm test` because it is invisible from there: the
 * suite connects as the database owner, where the policies do not apply and the
 * bug this catches cannot happen. What it catches is a joined read across
 * schools — the switcher asking for a school row the tenant is not scoped to,
 * which Prisma turns into a 500 rather than a null. The nav shell calls it on
 * every page, so it was a 500 on all of them, not just `/switch`.
 *
 * And the half that matters more: that the widening the switcher needs stays
 * inside the switcher.
 */
/**
 * A paused membership, end to end and through the DATABASE.
 *
 * The unit tests run as the database owner, so they can only show that the app
 * layer refuses. This shows the thing that actually does the revoking: once the
 * status is SUSPENDED, `ownMembershipIn` no longer resolves a tenant, so
 * Postgres itself stops handing that school's rows over. Every page the person
 * could open a moment ago now redirects.
 *
 * Restored at the end, and restored even if a check fails, so a red sweep does
 * not leave a seeded teacher locked out of the demo database.
 */
async function suspension(schoolId: string) {
  // Somebody whose ONLY membership is this one. The seed's first teacher is
  // also an admin of the same school, and pausing one of two memberships proves
  // something much weaker — they simply carry on in the other role, which is
  // correct but is not what this scenario is about.
  const candidates = await db.membership.findMany({
    where: { schoolId, role: "TEACHER", status: "ACTIVE", user: { email: { not: null } } },
    include: { user: { select: { id: true, email: true } } },
  });
  let victim: (typeof candidates)[number] | null = null;
  for (const candidate of candidates) {
    const total = await db.membership.count({
      where: { userId: candidate.user.id, status: "ACTIVE", leftAt: null },
    });
    if (total === 1) {
      victim = candidate;
      break;
    }
  }
  if (!victim?.user.email) return;

  const actor = await mint(victim.user.email, "TEACHER", schoolId, "suspended-teacher");

  // Before: an ordinary working day.
  await check(actor, "/teacher", 200, "before pausing, their own school opens");

  try {
    await db.membership.update({
      where: { id: victim.id },
      data: { status: "SUSPENDED", suspendedAt: new Date(), suspendedReason: "sweep" },
    });

    // After: the session cookie is still valid and still names the school. What
    // changed is that the school no longer claims them, and that is enough.
    await check(actor, "/teacher", 307, "⚠ a paused teacher is turned away from their own school");
    await check(actor, "/teacher/attendance", 307, "⚠ …including the register");
    await check(actor, "/admin/people", 307, "⚠ …and anything else scoped to it");
    await check(actor, "/suspended", 200, "…and is told why, rather than sent to a join code");

    /**
     * ⚠ AND CAN STILL REACH THEIR OWN ACCOUNT, which is the fix this asserts.
     *
     * This check read 307 for months, with a comment calling it a known
     * limitation: `/account` lived inside the role-gated shell, so a paused
     * member could not reach their own language, password or notification
     * settings. It has moved out. The pages under it never needed a role — they
     * have always been `requireUser` — so this is the layout no longer refusing
     * on behalf of a page that was happy to render.
     */
    await check(actor, "/account", 200, "⚠ …but can still reach their OWN settings");
    await check(actor, "/account/merge", 200, "⚠ …including joining two accounts");
  } finally {
    await db.membership.update({
      where: { id: victim.id },
      data: { status: "ACTIVE", suspendedAt: null, suspendedReason: null },
    });
  }

  await check(actor, "/teacher", 200, "restored, and back in");
}

/**
 * Class staffing, and the register duty that comes out of it.
 *
 * The interesting check is the LAST one: a teacher who is on a class but whose
 * register duty has been withdrawn must be refused by the API, not merely left
 * out of a list. The list is a convenience; the endpoint is the boundary.
 */
/**
 * ⚠ A PUPIL TRANSFERRING FROM ONE SCHOOL TO ANOTHER, END TO END.
 *
 * The claim this feature lives or dies on is a pair that pulls in opposite
 * directions, and neither half can be shown by `npm test` — that suite runs as
 * the database owner with no policies in force, so every read comes back the
 * same whether the policy is right or deleted.
 *
 *   - The child's access to the school they LEFT ends. Not hidden: refused, by
 *     the same tenant set that makes suspension work.
 *   - The school they joined can read what the first school certified, and
 *     nothing else of that school's.
 *
 * `rls:verify` proves both against raw SQL. This proves them through a real
 * signed-in session and a rendered page, which is the other execution context —
 * and this codebase has been caught more than once by a thing that held in one
 * and not the other.
 */
async function transfer(fromSchoolId: string, toSchoolId: string) {
  const pupil = await db.membership.findFirst({
    where: {
      schoolId: fromSchoolId,
      role: "STUDENT",
      status: "ACTIVE",
      leftAt: null,
      user: { email: { not: null } },
    },
    include: { user: { select: { id: true, email: true } } },
  });
  if (!pupil?.user.email) {
    skip("the transfer walk-through", `no pupil with an email at ${fromSchoolId}`);
    return;
  }

  const atOldSchool = await mint(pupil.user.email, "STUDENT", fromSchoolId, "transfer-pupil");
  await check(atOldSchool, "/student", 200, "before leaving, their school opens");

  // The receiving school's admin, who must NOT see the certificate until the
  // child is actually one of theirs.
  const receivingAdmin = await db.membership.findFirst({
    where: { schoolId: toSchoolId, role: "ADMIN", status: "ACTIVE", user: { email: { not: null } } },
    include: { user: { select: { email: true } } },
  });

  const record = await db.schoolRecord.create({
    data: {
      schoolId: fromSchoolId,
      studentUserId: pupil.user.id,
      studentMembershipId: pupil.id,
      schoolName: "ZZ Sweep Old School",
      joinedAt: new Date("2024-04-01T00:00:00Z"),
      leftAt: new Date(),
      reason: "TRANSFERRED",
      attendanceMarked: 10,
      attendancePresent: 9,
      reportCardCount: 2,
    },
    select: { id: true },
  });
  await db.membership.update({ where: { id: pupil.id }, data: { leftAt: new Date() } });

  let newMembershipId: string | null = null;
  try {
    // ---- the school they left is closed to them now ----------------------
    //
    // The cookie is unchanged and still names that school. What changed is that
    // the school no longer claims them — the revocation is the database's.
    await check(atOldSchool, "/student", 307, "⚠ after leaving, their old school is closed to them");
    await check(atOldSchool, "/student/assignments", 307, "⚠ …including their marks there");

    // ---- and their new school can read what the old one certified --------
    const joined = await db.membership.create({
      data: { userId: pupil.user.id, schoolId: toSchoolId, role: "STUDENT", status: "ACTIVE" },
    });
    newMembershipId = joined.id;

    const atNewSchool = await mint(pupil.user.email!, "STUDENT", toSchoolId, "transfer-pupil-new");
    const own = await hit(atNewSchool, "/student/profile");
    results.push({
      role: "transfer-pupil-new",
      path: "/student/profile",
      status: own.status,
      expected: 200,
      ok: own.status === 200 && own.body.includes("ZZ Sweep Old School"),
      note: "⚠ the child carries their old school's record to the new one",
    });

    if (receivingAdmin?.user.email) {
      const head = await mint(receivingAdmin.user.email, "ADMIN", toSchoolId, "transfer-new-admin");
      const seen = await hit(head, `/reports/${joined.id}`);
      results.push({
        role: "transfer-new-admin",
        path: "/reports/[new-membership]",
        status: seen.status,
        expected: 200,
        ok: seen.status === 200 && seen.body.includes("ZZ Sweep Old School"),
        note: "⚠ the receiving school reads the certificate the other school wrote",
      });

      // …and nothing else of the old school's. A guessed membership id from
      // the school they left is still a 404, certificate or no certificate.
      await check(
        head,
        `/reports/${pupil.id}`,
        404,
        "⚠ …but not the old school's own page about them",
      );

      // THE DOCUMENT ITSELF. The child opens it from their new school; the
      // receiving head does not — a certificate is the family's to hand over,
      // the office that reads /reports sees its figures there. Same 404 as a
      // guessed id.
      await check(atNewSchool, `/certificate/${record.id}`, 200, "⚠ the child opens the certificate as a document");
      await check(head, `/certificate/${record.id}`, 404, "⚠ …the receiving office cannot, by id");
    }
    await check(atOldSchool, `/certificate/${record.id}`, 200, "⚠ …and from the old cookie too: it is theirs, not the school's");
    await check(null, `/certificate/${record.id}`, 307, "signed-out certificate redirects to login");
  } finally {
    if (newMembershipId) await db.membership.deleteMany({ where: { id: newMembershipId } });
    await db.schoolRecord.deleteMany({ where: { id: record.id } });
    await db.membership.update({ where: { id: pupil.id }, data: { leftAt: null } });
  }
}

/**
 * ⚠ A BOOKING WITH AN EXPERT, ON BOTH OF ITS URLS.
 *
 * Neither `/experts/bookings/<id>` nor `/expert/bookings/<id>` had ever been
 * requested by this sweep, and that is where a pupil was found reading their
 * school's conversation with an adult from outside it: `assertBookingAccess`
 * matched on `schoolId` alone, so "may read this booking" meant "belongs to
 * this school". It is fixed and has nineteen library tests — but the library is
 * not what an attacker calls. This asserts the boundary at the ROUTE.
 *
 * BOTH SPELLINGS, because the two pages are one component and one entitlement,
 * and a future split must not quietly authorise one of them differently.
 *
 * `/expert/pending` rides along, because it needs the same thing this function
 * already builds — an expert to be signed in as — and the sweep had never
 * requested it either.
 */
async function expertBooking(
  schoolId: string,
  parent: Actor,
  admin: Actor,
  otherAdmin: Actor,
  student: Actor,
): Promise<void> {
  const EMAIL = "zz.sweep.booked@edulink.test";
  const booker = await db.membership.findFirst({
    where: { schoolId, role: "ADMIN", status: "ACTIVE" },
    select: { id: true },
  });
  if (!booker) return skip("the expert booking", "no admin to book with");

  const expertUser = await db.user.upsert({
    where: { email: EMAIL },
    create: { email: EMAIL, name: "ZZ Sweep Bookable", prefs: "{}" },
    update: {},
  });
  const profile = await db.expertProfile.upsert({
    where: { userId: expertUser.id },
    create: { userId: expertUser.id, headline: "ZZ bookable", offering: "SESSIONS", publishedAt: new Date() },
    update: { publishedAt: new Date(), offering: "SESSIONS" },
  });
  const startsAt = new Date(Date.now() + 21 * 86_400_000);
  const slot = await db.expertSlot.create({
    data: {
      expertProfileId: profile.id,
      startsAt,
      endsAt: new Date(startsAt.getTime() + 3_600_000),
      bookedAt: new Date(),
    },
  });
  const booking = await db.expertBooking.create({
    data: {
      schoolId,
      expertProfileId: profile.id,
      expertUserId: expertUser.id,
      slotId: slot.id,
      bookedByMembershipId: booker.id,
      topic: "ZZ sweep booking",
      status: "CONFIRMED",
    },
    select: { id: true },
  });

  try {
    const expert = await mint(EMAIL, "EXPERT", null, "booked-expert");

    /**
     * ⚠ A GUARDIAN WITH THE SCHOOL BOUND TO THEIR SESSION, and the ordinary
     * `parent` actor cannot stand in for them.
     *
     * That actor is minted with no school — which is what `resolveContext`
     * gives a guardian on login — so the old tenant-only predicate
     * (`schoolId ?? "__none__"`) never matched and they got a 404 for a reason
     * that had nothing to do with the boundary. It passed while the bug was
     * live. A check that is right for the wrong reason is worth less than no
     * check, because it reads as covered.
     *
     * A session like this one is reachable: `setActiveContext` validates only
     * that a guardianship EXISTS when the role is PARENT, and takes the school
     * id from the switch form, so a guardian can carry one. What stops it being
     * a cross-tenant hole is the database — `resolveRequestTenant` builds a
     * parent's school set from their actual guardianships and ignores the
     * session's claim — which is the layering `tenant-request.ts` describes.
     */
    const guardianInSchool = await mint("parent@example.com", "PARENT", schoolId, "guardian-bound");

    for (const spelling of ["/experts/bookings", "/expert/bookings"]) {
      const path = `${spelling}/${booking.id}`;
      if (spelling === "/expert/bookings") {
        // ONE PAGE NOW. This spelling reads nothing and sends everybody on to
        // the other before any lookup, so every actor sees the same 307 and
        // the boundary is asserted once, on the page that actually renders.
        for (const [actor, note] of [
          [admin, "the school that booked it"],
          [expert, "and the expert it is with"],
          [student, "a pupil is sent on, to be refused there"],
          [guardianInSchool, "a guardian likewise"],
          [parent, "a guardian without a school likewise"],
          [otherAdmin, "another school likewise"],
          [null, "signed out"],
        ] as const) {
          await check(actor, path, 307, `redirects to /experts/bookings — ${note}`);
        }
        continue;
      }
      await check(admin, path, 200, "the school that booked it");
      await check(expert, path, 200, "and the expert it is with");
      // ⚠ THE BOUNDARY. Both of these were 200 before it was fixed.
      await check(student, path, 404, "⚠ NOT a pupil at that school");
      await check(guardianInSchool, path, 404, "⚠ nor a guardian, even with the school bound");
      await check(parent, path, 404, "nor a guardian without one");
      await check(otherAdmin, path, 404, "nor another school");
      await check(null, path, 307, "signed out");
    }

    await check(expert, "/expert/pending", 200, "an expert waiting to be reviewed");
  } finally {
    await db.expertMessage.deleteMany({ where: { bookingId: booking.id } });
    await db.expertBooking.deleteMany({ where: { id: booking.id } });
    await db.expertSlot.deleteMany({ where: { expertProfileId: profile.id } });
    await db.expertProfile.deleteMany({ where: { userId: expertUser.id } });
    await db.notification.deleteMany({ where: { userId: expertUser.id } });
    await db.session.deleteMany({ where: { userId: expertUser.id } });
    await db.user.deleteMany({ where: { id: expertUser.id } });
  }
}

/**
 * ⚠ SERVING A STORED FILE, which nothing automated has ever requested.
 *
 * This file's own header says every refusal is a 404 rather than a 403, because
 * a distinguishable error confirms the file exists. The README and §13 of the
 * checklist both claim another school's file 404s "even for an admin", and
 * until now **nothing asserted it**: `tests/uploads.test.ts` exercises the
 * storage library, not the route.
 *
 * ⚠ IT WRITES REAL BYTES, and that is the point rather than thoroughness for
 * its own sake. A fabricated id 404s for EVERYBODY — authorised or not — because
 * `readStoredFile` returns null, so a test using one would pass for the wrong
 * reason and keep passing with the authorisation removed. The 200 is what makes
 * the 404s mean something.
 *
 * THE PATH SCHEME IS DUPLICATED FROM `storage.ts` ON PURPOSE. That module is
 * `server-only` and cannot be imported into a plain Node script; the layout it
 * mirrors is `<STORAGE_DIR>/<first two chars>/<fileId>`, and if it ever changes
 * this check fails loudly by returning 404 where it expects 200, which is the
 * failure mode to want.
 */
async function storedFile(
  schoolId: string,
  admin: Actor,
  teacher: Actor,
  otherAdmin: Actor,
): Promise<void> {
  /**
   * ⚠ AN ASSIGNMENT THE SWEEP'S TEACHER DOES NOT TEACH, chosen deliberately.
   *
   * The first version took any assignment in the school and expected the
   * teacher to read it — and got a 404, because `authorizeFileRead` requires a
   * teacher to teach that assignment's CLASS. Being at the school is not
   * enough. That refusal is worth asserting rather than designing around, so
   * the admin carries the 200 (an admin at the owning school is allowed
   * unconditionally, which is exactly the claim the README makes) and the
   * teacher becomes a negative.
   */
  const tom = await db.user.findUnique({
    where: { email: "tom@riverside.school" },
    select: { id: true },
  });
  const hisClasses = tom
    ? (
        await db.classTeacher.findMany({
          where: { schoolId, teacher: { userId: tom.id } },
          select: { classId: true },
        })
      ).map((row) => row.classId)
    : [];

  const assignment = await db.assignment.findFirst({
    where: { schoolId, attachments: "[]", classId: { notIn: hisClasses } },
    select: { id: true, attachments: true },
  });
  if (!assignment) return skip("the file route", "no assignment outside the teacher's classes");
  // With a bucket configured the layout below is not where the app reads from;
  // the S3 suite covers that path, and this check keeps proving the disk one.
  if (process.env.STORAGE_BUCKET?.trim()) return skip("the file route", "uploads go to a bucket here; the storage-s3 suite covers that path");

  // A 1×1 PNG, small enough to inline and real enough to sniff as an image.
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );
  const fileId = `${randomUUID()}.png`;
  const root = resolve(process.cwd(), process.env.STORAGE_DIR ?? "./storage");
  const dir = join(root, fileId.slice(0, 2));
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, fileId), png);

  await db.assignment.update({
    where: { id: assignment.id },
    data: {
      attachments: JSON.stringify([
        { fileId, name: "zz-sweep.png", size: png.byteLength, mime: "image/png" },
      ]),
    },
  });

  try {
    const path = `/api/files/${fileId}`;
    /**
     * The 200 first: every 404 below is only evidence if this one works.
     *
     * ⚠ WHICH LAYER REFUSES WHICH, established by mutation rather than assumed.
     * Neutering the cross-school branch of `authorizeFileRead` does NOT turn
     * the other school's 404 green — ROW-LEVEL SECURITY has already hidden the
     * assignment, so that branch never runs and is defence in depth behind the
     * database. Neutering the teacher-teaches-this-class check DOES turn its
     * check red, because that refusal happens inside one school where RLS
     * cannot help. The teacher line is the one carrying its own weight here.
     */
    await check(admin, path, 200, "⚠ an admin at the owning school reads it");
    await check(teacher, path, 404, "⚠ …but NOT a teacher of a different class");
    await check(otherAdmin, path, 404, "⚠ …and not ANOTHER SCHOOL'S ADMIN");
    await check(null, path, 404, "⚠ …nor anybody signed out — 404, never 401");
    await check(teacher, `/api/files/${randomUUID()}.png`, 404, "an id that names nothing");
    // Traversal, since the id becomes a path segment.
    await check(teacher, "/api/files/..%2F..%2Fpackage.json", 404, "⚠ …and no way out of the folder");
  } finally {
    await db.assignment.update({
      where: { id: assignment.id },
      data: { attachments: assignment.attachments },
    });
    await rm(join(dir, fileId), { force: true });
  }
}

/**
 * ⚠ OPENING A MENTORING THREAD, WHICH THIS SWEEP HAD NEVER ONCE DONE.
 *
 * It visited `/mentoring` for four roles and stopped there — and that gap is
 * precisely how six notifications came to point at `/parent/mentoring/…`,
 * `/expert/mentoring/…` and `/student/margdarshak/…`, none of which have ever
 * been routes. Nearly 7,400 stored notifications carried a link to a 404.
 *
 * The sweep could not have caught it by walking navigation, because nothing in
 * the navigation ever mentions those URLs — they exist only inside a
 * notification. What it CAN do is prove the one real thread route serves every
 * reader `readerOf` grants, which is what makes collapsing all six onto it
 * correct rather than merely tidy.
 *
 * FOUR READERS, THREE OUTCOMES. The expert and the child are in the
 * conversation; the guardian and the school read it and cannot write. A pupil
 * from another family gets a 404 — the same 404 as an id that never existed,
 * because "that is not your thread" answers a question nobody asking it is
 * entitled to have answered.
 *
 * Everything here is made for the length of the check and removed in the
 * `finally`, including on the failure path.
 */
async function mentorshipThread(
  schoolId: string,
  parent: Actor,
  admin: Actor,
  otherAdmin: Actor,
): Promise<void> {
  const child = await db.guardianship.findFirst({
    where: { parent: { email: "parent@example.com" }, status: "ACTIVE", studentSchoolId: schoolId },
    select: { studentMembershipId: true },
  });
  if (!child) return skip("the mentoring thread", "no guardian-linked pupil to mentor");

  const expertUser = await db.user.upsert({
    where: { email: "zz.sweep.mentor@edulink.test" },
    create: { email: "zz.sweep.mentor@edulink.test", name: "ZZ Sweep Mentor", prefs: "{}" },
    update: {},
  });
  const profile = await db.expertProfile.upsert({
    where: { userId: expertUser.id },
    create: { userId: expertUser.id, headline: "ZZ Sweep mentor", publishedAt: new Date() },
    update: { publishedAt: new Date() },
  });

  // ACTIVE and consented: the state a notification actually links to. A
  // PENDING_CONSENT thread would 200 as well and would not prove the same thing.
  const thread = await db.mentorThread.create({
    data: {
      schoolId,
      expertProfileId: profile.id,
      expertUserId: expertUser.id,
      studentMembershipId: child.studentMembershipId,
      purpose: "ZZ sweep mentorship",
      status: "ACTIVE",
      parentConsentAt: new Date(),
    },
    select: { id: true },
  });

  try {
    const path = `/mentoring/${thread.id}`;

    // THE EXPERT. No membership and no school on their session — their tenant
    // access is derived from this very thread, so a 200 here also proves that
    // derivation still works.
    const mentor = await mint("zz.sweep.mentor@edulink.test", "EXPERT", null, "mentor");
    await check(mentor, path, 200, "⚠ the expert opens the thread a notification links to");

    // THE CHILD, whose notification says "your mentor sent you a message".
    const pupil = await db.membership.findUniqueOrThrow({
      where: { id: child.studentMembershipId },
      include: { user: { select: { email: true } } },
    });
    if (pupil.user.email) {
      const kid = await mint(pupil.user.email, "STUDENT", schoolId, "mentored-pupil");
      await check(kid, path, 200, "⚠ …and so does the child");
    }

    // THE GUARDIAN — the reader with the most notifications pointing here, and
    // the one whose links were dead: 6,826 of the 7,351 said /parent/mentoring/.
    await check(parent, path, 200, "⚠ …and the guardian, whose link was the broken one");

    // THE SCHOOL, which may always read.
    await check(admin, path, 200, "⚠ …and their school, which is never optional");

    // AND NOBODY ELSE.
    await check(otherAdmin, path, 404, "⚠ …but not another school");
    const stranger = await db.membership.findFirst({
      where: {
        schoolId,
        role: "STUDENT",
        status: "ACTIVE",
        id: { not: child.studentMembershipId },
      },
      include: { user: { select: { email: true } } },
    });
    if (stranger?.user.email) {
      const classmate = await mint(stranger.user.email, "STUDENT", schoolId, "not-mentored");
      await check(classmate, path, 404, "⚠ …nor a classmate who is not in it");
    }
    await check(null, path, 307, "signed out");
  } finally {
    await db.mentorMessage.deleteMany({ where: { threadId: thread.id } });
    await db.mentorThread.deleteMany({ where: { id: thread.id } });
    await db.expertProfile.deleteMany({ where: { userId: expertUser.id } });
    await db.session.deleteMany({ where: { userId: expertUser.id } });
    await db.user.deleteMany({ where: { id: expertUser.id } });
  }
}

/**
 * ⚠ AN ALUMNUS: SIGNED IN, NO SCHOOL, AND THEIR RECORD STILL THERE.
 *
 * The state nothing else in this sweep reaches. A pupil who has left every
 * school on this platform has no ACTIVE membership, so `getSession` hands back
 * no role and no school and the tenant is empty — which is why the record has
 * to be readable from the policies keyed on the PERSON rather than from a
 * bound school. A 200 on `/record` is the only check in this file that
 * exercises that.
 *
 * AND THE OTHER HALF, which matters just as much: the same cookie must open
 * NOTHING ELSE. The record is what they keep; the bulletin, practice and the
 * class pages were the school's, and they end with the membership.
 */
async function alumniRecord(schoolId: string) {
  const klass = await db.class.findFirst({ where: { schoolId }, select: { id: true } });
  if (!klass) {
    skip("the alumni record walk-through", `no class at ${schoolId}`);
    return;
  }

  const email = "zz.sweep.alumnus@edulink.test";
  const parentEmail = "zz.sweep.alumni.parent@edulink.test";
  const madeUserIds: string[] = [];

  try {
    const user = await db.user.create({
      data: { email, name: "Sweep Alumnus", preferredName: "Sweep", prefs: "{}" },
    });
    madeUserIds.push(user.id);

    // Left, and gone somewhere this platform has never heard of.
    const membership = await db.membership.create({
      data: {
        userId: user.id,
        schoolId,
        role: "STUDENT",
        status: "ACTIVE",
        gradeLevel: "5",
        joinedAt: new Date("2024-04-01T00:00:00Z"),
        leftAt: new Date("2026-03-20T00:00:00Z"),
      },
    });

    const card = await db.reportCard.create({
      data: {
        schoolId,
        classId: klass.id,
        studentMembershipId: membership.id,
        title: "ZZ Sweep Term",
        status: "PUBLISHED",
        publishedAt: new Date(),
        fromDateKey: "2026-01-05",
        toDateKey: "2026-03-01",
        attendancePresent: 9,
        attendanceTotal: 10,
        overallPercentMilli: 84_200,
      },
      select: { id: true },
    });
    await db.reportCardItem.create({
      data: { schoolId, reportCardId: card.id, title: "ZZ Sweep Maths", scoreMilli: 90_000 },
    });
    await db.earnedBadge.create({
      data: {
        schoolId,
        studentMembershipId: membership.id,
        badgeId: "zz-sweep",
        label: "ZZ Sweep Badge",
      },
    });

    // NO ROLE AND NO SCHOOL on the session, which is exactly what a leaver has.
    const alumnus = await mint(email, null, null, "alumnus");

    const page = await hit(alumnus, "/record");
    results.push({
      role: "alumnus",
      path: "/record",
      status: page.status,
      expected: 200,
      ok:
        page.status === 200 &&
        page.body.includes("ZZ Sweep Term") &&
        page.body.includes("ZZ Sweep Badge"),
      note: "⚠ a pupil who has left every school still reads their own record",
    });

    // …AND NOTHING ELSE. Each of these is a school's working surface and each
    // one independently requires a live membership.
    for (const path of ["/student", "/student/practice", "/bulletin", "/student/assignments"]) {
      await check(alumnus, path, 307, "⚠ …and the school's own pages are closed to them");
    }

    /**
     * ⚠ THEIR OWN ACCOUNT IS NOT ONE OF THOSE, and that is the distinction the
     * whole move rests on. A school's working surface needs a school. A
     * person's own settings do not — and an alumnus is the population this
     * created: they left the only school they were at, so they have no role,
     * and they were locked out of their own language, password and sign-out.
     */
    await check(alumnus, "/account", 200, "⚠ …but their OWN account is theirs, with no school at all");

    // A guardian follows the same child, across a school the child has left.
    const parent = await db.user.create({
      data: { email: parentEmail, name: "Sweep Alumni Parent", prefs: "{}" },
    });
    madeUserIds.push(parent.id);
    await db.guardianship.create({
      data: {
        parentUserId: parent.id,
        studentMembershipId: membership.id,
        studentSchoolId: schoolId,
        relation: "PARENT",
        status: "ACTIVE",
      },
    });

    const guardian = await mint(parentEmail, null, null, "alumni-parent");
    const childPage = await hit(guardian, `/record/${user.id}`);
    results.push({
      role: "alumni-parent",
      path: "/record/[child]",
      status: childPage.status,
      expected: 200,
      ok: childPage.status === 200 && childPage.body.includes("ZZ Sweep Term"),
      note: "⚠ a guardian follows their child through a school the child has LEFT",
    });

    // A guessed id is a 404, never "that is not your child" — which would
    // answer a question nobody asking it is entitled to have answered.
    const stranger = await db.membership.findFirst({
      where: { schoolId, role: "STUDENT", leftAt: null },
      select: { userId: true },
    });
    if (stranger) {
      await check(
        guardian,
        `/record/${stranger.userId}`,
        404,
        "⚠ …and no other family's child",
      );
      await check(
        alumnus,
        `/record/${stranger.userId}`,
        404,
        "⚠ …nor can a pupil read a classmate's",
      );
    } else {
      skip("the alumni cross-family check", "no other pupil at this school");
    }

    await check(null, "/record", 307, "signed-out record redirects to login");
  } finally {
    if (madeUserIds.length > 0) {
      await db.user.deleteMany({ where: { id: { in: madeUserIds } } });
    }
  }
}

async function staffingAndDuty(schoolId: string) {
  /* THE OLDEST CLASS, NOT ANY CLASS. `findFirst` with no order picked whatever
   * Postgres offered — three runs in a row that was a disposable class some
   * other section (or the unit suite, which shares this database) had just
   * made and was about to delete, and this check failed with a 404 or a
   * bounced session that looked like an app bug. The seed's first class
   * outlives every fixture. */
  const klass = await db.class.findFirst({
    where: { schoolId, archivedAt: null, NOT: { name: { startsWith: "ZZ" } } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!klass) return;

  const adminActor = await mintFor(schoolId, "ADMIN", "staffing-admin");
  if (adminActor) {
    await check(adminActor, `/admin/classes/${klass.id}`, 200, "an admin may staff a class");
  }

  const link = await db.classTeacher.findFirst({
    where: { schoolId, classId: klass.id, canTakeAttendance: true },
    include: { teacher: { include: { user: { select: { email: true } } } } },
  });
  if (!link?.teacher.user.email) return;

  const teacherActor = await mint(link.teacher.user.email, "TEACHER", schoolId, "duty-teacher");
  await check(teacherActor, "/teacher/attendance", 200, "the class teacher reaches the register");
  // Past registers: the class teacher reads their own class back, with a
  // month or without one; a class they are not on is refused with a
  // sentence, not a blank month.
  await check(teacherActor, `/attendance/history?classId=${klass.id}`, 200, "…and reads its past registers");
  await check(teacherActor, `/attendance/history?classId=${klass.id}&month=2026-07`, 200, "…for any month");
  await check(teacherActor, "/attendance/history", 200, "…from the history page itself");
  if (adminActor) {
    await check(adminActor, `/attendance/history?classId=${klass.id}`, 200, "an admin reads any class's past registers");
    await check(adminActor, "/admin/promotion", 200, "…and plans the year-end move");
    await check(adminActor, "/admin/intake", 200, "…and admits pupils from a list");
  }
  await check(teacherActor, "/admin/promotion", 307, "⚠ a teacher does not move the school up");
  await check(teacherActor, "/admin/intake", 307, "⚠ …nor admit pupils");
  if (adminActor) {
    await check(teacherActor, `/admin/classes/${klass.id}`, 307, "…but not the staffing page");
  }

  // Withdraw the duty and prove the WRITE path refuses, not just the list.
  try {
    await db.classTeacher.update({
      where: { id: link.id },
      data: { canTakeAttendance: false },
    });

    // A REAL MARK, not an empty array. The first version of this sent `marks:
    // []`, which zod rejects with 422 before the request reaches the duty check
    // at all — so it was asserting the payload was malformed, not that the
    // permission held. A check that fails for the wrong reason is as useless as
    // one that passes for the wrong reason.
    const pupil = await db.enrollment.findFirst({
      where: { classId: klass.id, status: "ACTIVE" },
      select: { studentMembershipId: true },
    });
    if (!pupil) return;

    const res = await fetch(`${BASE}/api/attendance`, {
      method: "POST",
      headers: { cookie: teacherActor.cookie, "content-type": "application/json" },
      body: JSON.stringify({
        classId: klass.id,
        dateKey: "2020-01-06",
        // `clientId` is REQUIRED by the schema — it is the offline outbox's
        // idempotency key. Omitting it was the second way this check managed to
        // 422 before reaching the permission it exists to test.
        marks: [
          {
            studentMembershipId: pupil.studentMembershipId,
            status: "PRESENT",
            clientId: "sweep-duty-probe-0001",
          },
        ],
      }),
    });
    // 422 means the PAYLOAD was wrong, not the permission — and this check spent
    // three runs reporting that as a failure of the thing it was testing. Named
    // separately so the next person reads the right diagnosis off the line.
    const note =
      res.status === 422
        ? "payload rejected before the permission was reached — fix the probe, not the app"
        : "⚠ a withdrawn register duty is refused by the ENDPOINT, not merely hidden";
    results.push({
      role: teacherActor.label,
      path: "POST /api/attendance",
      status: res.status,
      expected: 403,
      // A 200 here means the duty check is decoration: the page hides the class
      // and the endpoint accepts the write anyway.
      ok: res.status === 403,
      note,
    });
  } finally {
    await db.classTeacher.update({
      where: { id: link.id },
      data: { canTakeAttendance: true },
    });
  }
}

/**
 * ⚠ EVERY LINK THE APP DRAWS, FOLLOWED.
 *
 * THIS IS THE CHECK THE OTHER 160 COULD NOT MAKE. A role-by-role audit turned up
 * eight gaps and six were the same shape: a capability built and authorised
 * correctly, with nothing linking to it — or, worse, a link in the side rail and
 * the ⌘K palette pointing at a route that did not exist. `/expert/profile` was a
 * 404 in both places for months.
 *
 * Nothing caught it, and the reason is structural. The unit suites test
 * functions that exist. The rest of this file tests URLs somebody thought to
 * type into it. A link that goes nowhere is invisible to both — it only shows up
 * when a person clicks it.
 *
 * So this does not take a list. It reads `NAV` and `QUICK_ACTIONS` — the single
 * definition the side rail, the bottom bar, the FAB and the palette all render
 * from — and requests every static href AS the role that is shown it. Add a nav
 * entry for a page you have not built and this fails on the next run.
 *
 * Dynamic hrefs are skipped: there are none today, and one added later would
 * need a real id, which the rest of this file already does per feature.
 */
async function everyNavLink(schoolId: string, actorFor: (role: Role) => Promise<Actor | null>) {
  for (const role of ROLES) {
    const actor = await actorFor(role);
    if (!actor) continue;

    const hrefs = [
      ...NAV[role].map((item) => item.href),
      ...QUICK_ACTIONS[role].map((action) => action.href),
      ...(PRIMARY_ACTION[role] ? [PRIMARY_ACTION[role]!.href] : []),
    ].filter((href) => !href.includes("["));

    for (const href of [...new Set(hrefs)]) {
      await check(actor, href, 200, `⚠ ${role} is shown this link`);
    }
  }
}


/**
 * ⚠ THE SIGNPOSTS SOMEBODY NEEDS BEFORE THEY HAVE A SESSION — or while they
 * have the WRONG one.
 *
 * Every check here exists because walking the onboarding in a browser found the
 * screen saying too little. They are content checks rather than status checks:
 * each of these pages was a healthy 200 the whole time it was unusable, which is
 * exactly the class of bug a status sweep cannot see.
 */
async function onboardingSignposts(schoolId: string) {
  // 1. A reader who cannot read the page can change the language WITHOUT a
  //    session. `setLocale` always wrote the cookie; only the control was
  //    missing, and only on the page that most needs it.
  const login = await hit(null, "/login");
  results.push({
    role: "anonymous",
    path: "/login",
    status: login.status,
    expected: 200,
    ok: login.status === 200 && login.body.includes("मराठी") && login.body.includes("हिन्दी"),
    note: "⚠ the language switcher is reachable with no session",
  });

  // 1b. Every date box asks for dd/mm/yyyy, and the ISO value still goes to the
  //     server under the same name. `<input type="date">` renders in the
  //     BROWSER's locale and ignores `lang`, so a school in Pune was asked for
  //     the month first with no sign that it was — and 05/04 is two different
  //     days depending on who reads it.
  const admin = await db.membership.findFirst({
    where: { schoolId, role: "ADMIN", status: "ACTIVE", user: { email: { not: null } } },
    include: { user: { select: { email: true } } },
  });
  if (!admin?.user.email) {
    skip("the dd/mm/yyyy date check", `no admin with an email at ${schoolId}`);
  } else {
    const actor = await mint(admin.user.email, "ADMIN", schoolId, "date-format");
    const cal = await hit(actor, "/admin/calendar");
    const boxes = (cal.body.match(/placeholder="dd\/mm\/yyyy"/g) ?? []).length;
    // The hidden ISO input is what actually submits — losing it would send the
    // typed text to a server that expects YYYY-MM-DD.
    const isoInputs = (cal.body.match(/type="date"[^>]*class="sr-only"/g) ?? []).length;
    results.push({
      role: "date-format",
      path: "/admin/calendar",
      status: cal.status,
      expected: 200,
      ok: cal.status === 200 && boxes > 0 && isoInputs >= boxes,
      note: `⚠ ${boxes} date box(es) ask dd/mm/yyyy, each backed by an ISO input`,
    });

    // 1b. The birthdays section renders at all. A 200 proves the page came
    //     back; it does not prove the section derived from User.birthdate is on
    //     it, and a heading that silently stopped rendering would look exactly
    //     like a school where nobody has a birthday on file.
    results.push({
      role: "date-format",
      path: "/admin/calendar (birthdays)",
      status: cal.status,
      expected: 200,
      // THE ID, NOT THE WORD — this is the check that taught the rule above.
      // `id="birthday-heading"` is what `aria-labelledby` points at, so it is
      // load-bearing rather than a convenience.
      ok: cal.status === 200 && cal.body.includes('id="birthday-heading"'),
      note: "⚠ the staff calendar carries a birthdays section",
    });
  }

  // 2. A school's FIRST invitation names its recipient. Operator invites carry
  //    `createdByMembershipId: null`, and the page used to show the email only
  //    when there was a sender — so the one invitation that starts a school
  //    said neither who sent it nor who it was for.
  const token = randomBytes(32).toString("base64url");
  const invite = await db.invite.create({
    data: {
      schoolId,
      email: "zz.sweep.first@edulink.test",
      role: "ADMIN",
      tokenHash: createHash("sha256").update(token).digest("hex"),
      createdByMembershipId: null,
      expiresAt: new Date(Date.now() + 86_400_000),
      status: "PENDING",
    },
    select: { id: true },
  });

  try {
    const page = await hit(null, `/invite/${token}`);
    results.push({
      role: "anonymous",
      path: "/invite/[operator-token]",
      status: page.status,
      expected: 200,
      ok:
        page.status === 200 &&
        // An address the sweep itself wrote, not app copy — safe to read.
        page.body.includes("zz.sweep.first@edulink.test") &&
        // The birthday field, which is what fills the calendar and gives a
        // guardian something to claim against. A 200 proves the page rendered,
        // not that the field somebody has to type into is on it. `name` is the
        // attribute `DateField` puts on the input that carries the ISO value.
        page.body.includes('name="birthdate"'),
      note: "⚠ an invitation names who it is for, and asks for a birthday",
    });
  } finally {
    await db.invite.deleteMany({ where: { id: invite.id } });
  }

  // 3. AN INVITATION TO AN ADDRESS THAT ALREADY HAS AN ACCOUNT IS A TRANSFER,
  //    and the page has to say so. `acceptInvite` has always attached the new
  //    school to the existing account rather than minting a second one — which
  //    is what stops a transferring pupil stranding their leaving certificate —
  //    but the page asked them to choose a password it then threw away. A 200
  //    proves neither half, so this reads the body for both.
  const existing = await db.membership.findFirst({
    where: { schoolId, role: "TEACHER", status: "ACTIVE", user: { email: { not: null } } },
    include: { user: { select: { email: true, passwordHash: true } } },
  });

  if (!existing?.user.email || !existing.user.passwordHash) {
    skip("the transfer-by-invitation page", "no staff account with a password to invite");
  } else {
    const transferToken = randomBytes(32).toString("base64url");
    const transferInvite = await db.invite.create({
      data: {
        schoolId,
        email: existing.user.email,
        role: "TEACHER",
        tokenHash: createHash("sha256").update(transferToken).digest("hex"),
        expiresAt: new Date(Date.now() + 86_400_000),
        status: "PENDING",
      },
      select: { id: true },
    });

    try {
      const page = await hit(null, `/invite/${transferToken}`);
      results.push({
        role: "anonymous",
        path: "/invite/[known-address]",
        status: page.status,
        expected: 200,
        ok:
          page.status === 200 &&
          // The promise, by the id on the element that carries it…
          page.body.includes('id="password-unchanged"') &&
          // …and no password field at all. `type="password"` is the input's own
          // markup, so this stays true of a page in any language.
          !page.body.includes('type="password"'),
        note: "⚠ an invitation to a known address adds a school and asks for no password",
      });
    } finally {
      await db.invite.deleteMany({ where: { id: transferInvite.id } });
    }
  }
}

/**
 * ⚠ AND THE SIGNPOSTS FOR SOMEBODY HOLDING THE WRONG SESSION.
 *
 * A shared school laptop is the ordinary case, not the edge one.
 */
async function sharedDeviceSignposts(schoolId: string) {
  const staff = await db.membership.findFirst({
    where: { schoolId, role: "TEACHER", status: "ACTIVE", user: { email: { not: null } } },
    include: { user: { select: { id: true, email: true } } },
  });
  if (!staff?.user.email) {
    skip("the shared-device signposts", `no teacher with an email at ${schoolId}`);
    return;
  }

  const actor = await mint(staff.user.email, "TEACHER", schoolId, "shared-device");

  // /join used to redirect a signed-in visitor to THEIR dashboard, silently.
  // A pupil sent to join on a teacher's laptop landed on the teacher's home
  // with nothing saying why — a dead end, which §7 forbids.
  const join = await hit(actor, "/join");
  results.push({
    role: "shared-device",
    path: "/join",
    status: join.status,
    expected: 200,
    ok: join.status === 200 && join.body.includes('id="signed-in-warning"'),
    note: "⚠ a signed-in visitor is told, not silently bounced",
  });

  // The operator entry on the page titled "Where would you like to go?" —
  // present for whoever runs the server, absent for everybody else.
  const plainSwitch = await hit(actor, "/switch");
  results.push({
    role: "shared-device",
    path: "/switch",
    status: plainSwitch.status,
    expected: 200,
    // THE DESTINATION, NOT ITS LABEL. `/root` is the one thing on this page that
    // is not a school, and the link to it is the whole feature — so the href is
    // both the most load-bearing thing to read and the same in every language.
    ok: plainSwitch.status === 200 && !plainSwitch.body.includes('href="/root"'),
    note: "⚠ …and an ordinary teacher is offered no operator area",
  });

  try {
    await db.user.update({ where: { id: staff.user.id }, data: { isSuperuser: true } });
    const asOperator = await hit(actor, "/switch");
    results.push({
      role: "shared-device",
      path: "/switch",
      status: asOperator.status,
      expected: 200,
      ok: asOperator.status === 200 && asOperator.body.includes('href="/root"'),
      note: "⚠ …while a superuser with a school role IS, on the page that asks where to go",
    });
  } finally {
    await db.user.update({ where: { id: staff.user.id }, data: { isSuperuser: false } });
  }
}

/** The operator area: reachable by a superuser, invisible to everybody else. */
async function operatorArea() {
  const staff = await db.membership.findFirst({
    where: { role: "TEACHER", status: "ACTIVE", user: { email: { not: null } } },
    include: { user: { select: { id: true, email: true } } },
  });
  if (!staff?.user.email) return;

  const actor = await mint(staff.user.email, "TEACHER", staff.schoolId, "would-be-operator");
  await check(actor, "/root", 307, "⚠ /root is closed to ordinary staff");
  await check(null, "/root", 307, "…and to nobody at all");
  // The server log is as closed as the rest of it — it names every school on
  // the installation, which is precisely what a tenant must not see.
  await check(actor, "/root/audit", 307, "⚠ …as is the server log");
  await check(actor, "/root/jobs", 307, "⚠ …and the jobs page");
  await check(actor, "/root/jobs/schools", 307, "⚠ …and the cross-school job health page");
  await check(null, "/root/audit", 307, "…to nobody at all either");
  // The marketplace queue names every expert on the installation, so it is as
  // closed as the rest of this area.
  await check(actor, "/root/experts", 307, "⚠ …as is the expert queue");
  await check(null, "/root/experts", 307, "…to nobody at all either");
  // The inside of a school is the widest thing in this area, so it is the
  // one most worth checking is shut to everybody else.
  await check(actor, `/root/${staff.schoolId}/inside`, 307, "⚠ …as is the inside of a school");
  await check(null, `/root/${staff.schoolId}/inside`, 307, "…to nobody at all either");

  try {
    await db.user.update({ where: { id: staff.user.id }, data: { isSuperuser: true } });
    await check(actor, "/root", 200, "…and open to somebody who runs the server");
    await check(actor, "/root/new", 200, "…who may add a school");
    // The operator's own trail. Written with schoolId NULL since superusers
    // existed, and until now nothing in the app could read it.
    await check(actor, "/root/audit", 200, "⚠ …and may read what they have done");
    await check(actor, "/root/jobs", 200, "…and whether the scheduled jobs have run");
    await check(actor, "/root/jobs/schools", 200, "…and what those runs did school by school");
    // THE DOOR THAT HAD NO HANDLE. `publishedAt` has always gated the
    // marketplace and nothing in the app could set it — only the seed — so no
    // expert could ever be listed on a real installation.
    await check(actor, "/root/experts", 200, "⚠ …and may list an expert on the marketplace");
    /**
     * ⚠ THE DOOR IS GONE, AND THE LOOK IS WRITTEN DOWN.
     *
     * These two checks used to assert the request-a-grant flow — door shown
     * without a grant, school shown with one — and kept asserting it after
     * the design changed, which is how they went red against a page that was
     * behaving exactly as intended. The inside of a school is now ALWAYS
     * open to the operator; what remains of the door is the visitor book:
     * rendering the page records the visit through `withSchoolAccess` (at
     * most one row an hour), and the school reads the same list in its own
     * Safety Centre.
     *
     * So the check changes shape with the design. The page must show the
     * school — the overview section, which is the half that reads real rows
     * through the policies — and rendering it must have LEFT A ROW in the
     * visitor book. Both, because a page that opened without writing the row
     * is precisely the regression this area now exists to prevent.
     */
    const before = new Date();
    const inside = await hit(actor, `/root/${staff.schoolId}/inside`);
    const visit = await db.operatorAccess.findFirst({
      where: { userId: staff.user.id, schoolId: staff.schoolId, startedAt: { gte: before } },
      select: { id: true },
    });
    try {
      results.push({
        role: "would-be-operator",
        path: "/root/[school]/inside",
        status: inside.status,
        expected: 200,
        ok: inside.status === 200 && inside.body.includes('id="numbers-heading"'),
        note: "⚠ the inside of a school opens to the operator, through the real policies",
      });
      results.push({
        role: "would-be-operator",
        path: "/root/[school]/inside (visitor book)",
        status: inside.status,
        expected: 200,
        ok: visit !== null,
        note: "⚠ …and the look itself is recorded where the school can read it",
      });
    } finally {
      // The check's own visit does not belong in the school's book. Deleted as
      // the OWNER — the app role has no DELETE policy on this table, which is
      // the point of it.
      if (visit) await db.operatorAccess.deleteMany({ where: { id: visit.id } });
    }
  } finally {
    await db.user.update({ where: { id: staff.user.id }, data: { isSuperuser: false } });
  }
}

/** A session for whoever holds `role` at this school, when there is one. */
async function mintFor(schoolId: string, role: string, label: string) {
  const membership = await db.membership.findFirst({
    where: { schoolId, role, status: "ACTIVE", user: { email: { not: null } } },
    include: { user: { select: { email: true } } },
  });
  if (!membership?.user.email) return null;
  return mint(membership.user.email, role, schoolId, label);
}

/**
 * Staff leave, and the principal's area.
 *
 * The check that matters is the LAST one: approved leave must be invisible to a
 * pupil and a guardian. It is staff-only by construction — the data lives in
 * LeaveRequest, which no student page reads — but "by construction" is a claim,
 * and this asks the running app.
 */
async function leaveAndPrincipal(schoolId: string) {
  const teacherActor = await mintFor(schoolId, "TEACHER", "leave-teacher");
  if (teacherActor) {
    await check(teacherActor, "/teacher/leave", 200, "a teacher may apply for leave");
    await check(teacherActor, "/principal/leave", 307, "…but not decide anybody's");
    await check(teacherActor, "/principal/staff", 307, "⚠ …nor read colleagues' staff records");
    await check(teacherActor, "/principal", 307, "…nor open the principal's dashboard");
    await check(teacherActor, "/principal/classes", 307, "⚠ …nor the whole-school class figures");
  }

  const studentActor = await mintFor(schoolId, "STUDENT", "leave-pupil");
  if (studentActor) {
    await check(studentActor, "/teacher/leave", 307, "⚠ a pupil has no leave page");
    await check(studentActor, "/principal/leave", 307, "⚠ …and cannot read staff leave");
    await check(studentActor, "/admin/calendar", 307, "⚠ …nor the staff calendar it appears on");
    await check(studentActor, "/attendance/history", 307, "⚠ …nor any class's past registers");
  }

  // A principal, made for the sweep and removed afterwards.
  const teacher = await db.membership.findFirst({
    where: { schoolId, role: "TEACHER", status: "ACTIVE", user: { email: { not: null } } },
    include: { user: { select: { id: true, email: true } } },
  });
  if (!teacher?.user.email) return;

  const made = await db.membership.upsert({
    where: {
      userId_schoolId_role: { userId: teacher.user.id, schoolId, role: "PRINCIPAL" },
    },
    create: { userId: teacher.user.id, schoolId, role: "PRINCIPAL", status: "ACTIVE" },
    update: { status: "ACTIVE" },
  });

  try {
    const head = await mint(teacher.user.email, "PRINCIPAL", schoolId, "principal");
    await check(head, "/principal", 200, "the principal's dashboard");
    await check(head, "/principal?days=90", 200, "…over a longer window");
    // Garbage in the window parameter must fall back, not 500: it lands in a
    // date range and then in a query.
    await check(head, "/principal?days=99999", 200, "…and a nonsense window falls back");
    await check(head, "/principal/classes", 200, "…the class list");
    await check(head, "/principal/leave", 200, "…and the requests waiting for them");
    await check(head, "/principal/staff", 200, "…and the staff roster with its records");
    await check(head, "/admin/calendar", 200, "…and the staff calendar, where leave shows");
    await check(head, "/teacher/leave", 200, "a principal takes leave like anybody else");
    // A principal READS the school; they do not mark registers or set it up.
    await check(head, "/teacher/attendance", 307, "⚠ …but does not take a register");
    await check(head, "/attendance/history", 200, "…yet reads every class's past registers");
    await check(head, "/admin/people", 307, "⚠ …nor run the directory");
    await check(head, "/admin/classes/new", 307, "⚠ …nor create classes");
    await check(head, "/admin/promotion", 307, "⚠ …nor move the school up a year");
    await check(head, "/admin/intake", 307, "⚠ …nor admit pupils from a list");
    // Hiring is the principal's desk alongside the admin's; the directory
    // profile stays the admin's alone.
    await check(head, "/admin/vacancies", 200, "…and the principal runs the vacancy desk");
    await check(head, "/admin/vacancies/new", 200, "…including posting one");
    await check(head, "/vacancies", 200, "…and reads the platform board");
    await check(head, "/enquiries", 200, "…and the school's enquiries");
    await check(head, "/admin/directory", 307, "⚠ …but does not edit the directory profile");
    await check(head, "/bulletin/global", 200, "…and reads the global feed, which once locked principals out by omission");

    const anyClass = await db.class.findFirst({
      where: { schoolId, archivedAt: null },
      select: { id: true },
    });
    if (anyClass) {
      await check(head, `/principal/classes/${anyClass.id}`, 200, "…and drills into one class");
    }
    const elsewhere = await db.class.findFirst({
      where: { schoolId: { not: schoolId } },
      select: { id: true },
    });
    if (elsewhere) {
      await check(
        head,
        `/principal/classes/${elsewhere.id}`,
        404,
        "⚠ …but never into another school's",
      );
    }
  } finally {
    await db.membership.deleteMany({ where: { id: made.id } });
  }
}

/**
 * Report cards.
 *
 * The check that carries the feature is the DRAFT one: a card that has not been
 * published must 404 for the child it is about and for their guardian. Not 403 —
 * a card somebody may not read should not confirm that it exists.
 */
async function reportCards(schoolId: string) {
  /**
   * A class with a LEAD teacher who can be signed in AS, and — preferred — a
   * pupil somebody actually guards.
   *
   * THE PREFERENCE IS NOT COSMETIC. The last check in this function is the one
   * that catches a notification pointing at a page with no report card on it,
   * and it needs a guardian. Taking the first LEAD class picked one whose pupils
   * have none, so that check silently did not run while the report said
   * everything passed.
   */
  const leadWhere = { schoolId, role: "LEAD" as const, teacher: { user: { email: { not: null } } } };
  const leadInclude = {
    teacher: { include: { user: { select: { email: true } } } },
    class: { select: { id: true } },
  };
  const link =
    (await db.classTeacher.findFirst({
      where: {
        ...leadWhere,
        class: {
          enrollments: {
            some: {
              status: "ACTIVE",
              student: {
                user: { email: { not: null } },
                guardianships: { some: { status: "ACTIVE", parent: { email: { not: null } } } },
              },
            },
          },
        },
      },
      include: leadInclude,
    })) ?? (await db.classTeacher.findFirst({ where: leadWhere, include: leadInclude }));

  if (!link?.teacher.user.email) {
    skip("every report-card check", "no LEAD class teacher with an email in this school");
    return;
  }

  const classId = link.class.id;
  const teacherActor = await mint(link.teacher.user.email, "TEACHER", schoolId, "card-teacher");
  await check(
    teacherActor,
    `/teacher/classes/${classId}/report-cards`,
    200,
    "the class teacher builds report cards",
  );

  // A teacher who is NOT this class's lead must be turned away.
  const stranger = await db.membership.findFirst({
    where: {
      schoolId,
      role: "TEACHER",
      status: "ACTIVE",
      user: { email: { not: null } },
      id: { not: link.teacherMembershipId },
      classTeachers: { none: { classId } },
    },
    include: { user: { select: { email: true } } },
  });
  if (stranger?.user.email) {
    const other = await mint(stranger.user.email, "TEACHER", schoolId, "card-stranger");
    // 404, not 403: a screen somebody may not use should not confirm it exists.
    await check(
      other,
      `/teacher/classes/${classId}/report-cards`,
      404,
      "⚠ …and nobody else's class teacher does",
    );
  }

  /**
   * ⚠ AN ADMIN CAN GET THERE.
   *
   * `assertMayWriteCards` has always let an admin through — a class whose
   * teacher left mid-term still has to issue report cards — and nothing linked
   * to the builder from the admin's side. The link now sits on the admin's own
   * class page; this asserts the destination answers them.
   */
  const adminMember = await db.membership.findFirst({
    where: { schoolId, role: "ADMIN", status: "ACTIVE", user: { email: { not: null } } },
    include: { user: { select: { email: true } } },
  });
  if (adminMember?.user.email) {
    const adminActor = await mint(adminMember.user.email, "ADMIN", schoolId, "card-admin");
    await check(adminActor, `/admin/classes/${classId}`, 200, "the admin's class page…");
    await check(
      adminActor,
      `/teacher/classes/${classId}/report-cards`,
      200,
      "⚠ …links to report cards, and an admin may write them",
    );
  }

  /**
   * ⚠ A PRINCIPAL WHO IS THIS CLASS'S TEACHER CAN, AND ONE WHO IS NOT CANNOT.
   *
   * `cohort.ts` deliberately lets a school make a principal the LEAD — in a
   * small school the head takes Class 5 on Tuesdays — and the page's role gate
   * turned them away before `assertMayWriteCards` ever ran. Two decisions that
   * contradicted each other. Both halves are checked, because admitting the
   * role without keeping the LEAD test would be the opposite bug.
   */
  const headHost = await db.membership.findFirst({
    where: { schoolId, role: "TEACHER", status: "ACTIVE", user: { email: { not: null } } },
    include: { user: { select: { id: true, email: true } } },
  });
  if (headHost?.user.email) {
    const head = await db.membership.upsert({
      where: {
        userId_schoolId_role: { userId: headHost.user.id, schoolId, role: "PRINCIPAL" },
      },
      create: { userId: headHost.user.id, schoolId, role: "PRINCIPAL", status: "ACTIVE" },
      update: { status: "ACTIVE" },
    });
    try {
      const headActor = await mint(headHost.user.email, "PRINCIPAL", schoolId, "card-principal");
      await check(
        headActor,
        `/teacher/classes/${classId}/report-cards`,
        404,
        "⚠ a principal who is not this class's teacher still cannot write its cards",
      );

      const asLead = await db.classTeacher.upsert({
        where: { classId_teacherMembershipId: { classId, teacherMembershipId: head.id } },
        create: { classId, schoolId, teacherMembershipId: head.id, role: "LEAD" },
        update: { role: "LEAD" },
      });
      try {
        await check(
          headActor,
          `/teacher/classes/${classId}/report-cards`,
          200,
          "⚠ …but one the school made LEAD of it can",
        );
      } finally {
        await db.classTeacher.deleteMany({ where: { id: asLead.id } });
      }
    } finally {
      await db.membership.deleteMany({ where: { id: head.id } });
    }
  }

  // A live draft, and who may open it.
  //
  // A PUPIL WITH A GUARDIAN, preferred over the first one on the roll. The
  // guardian half of this block — the one that catches a notification pointing
  // at a page with no report card on it — is the reason the card exists at all,
  // and picking a pupil nobody guards skipped it silently.
  const pupil =
    (await db.enrollment.findFirst({
      where: {
        classId,
        status: "ACTIVE",
        student: {
          user: { email: { not: null } },
          guardianships: { some: { status: "ACTIVE", parent: { email: { not: null } } } },
        },
      },
      include: { student: { include: { user: { select: { email: true } } } } },
    })) ??
    (await db.enrollment.findFirst({
      where: { classId, status: "ACTIVE" },
      include: { student: { include: { user: { select: { email: true } } } } },
    }));
  if (!pupil?.student.user.email) {
    skip("the report-card reader checks", `no enrolled pupil with an email on class ${classId}`);
    return;
  }

  const draft = await db.reportCard.create({
    data: {
      schoolId,
      classId,
      studentMembershipId: pupil.studentMembershipId,
      title: "ZZ Sweep Draft",
      status: "DRAFT",
      fromDateKey: "2026-01-01",
      toDateKey: "2026-03-31",
    },
  });

  try {
    const pupilActor = await mint(pupil.student.user.email, "STUDENT", schoolId, "card-pupil");
    await check(
      pupilActor,
      `/report-cards/${draft.id}`,
      404,
      "⚠ an unpublished card is invisible to the child it is about",
    );
    await check(teacherActor, `/report-cards/${draft.id}`, 200, "…while their teacher may read it");

    await db.reportCard.update({
      where: { id: draft.id },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    });
    await check(
      pupilActor,
      `/report-cards/${draft.id}`,
      200,
      "…and they may read it once it is published",
    );

    /**
     * ⚠ THE NOTIFICATION'S DESTINATION ACTUALLY SHOWS THE CARD.
     *
     * `publishCards` sends every guardian a notification pointing at
     * /parent/grades, and that page did not read report cards at all. The
     * family tapped "your child's report card is ready" and landed on a page
     * with no report card on it — the one screen the whole feature exists to
     * deliver. A status check could never catch that: the page was a healthy
     * 200 throughout. So this looks at what came back.
     */
    const guardianship = await db.guardianship.findFirst({
      where: { studentMembershipId: pupil.studentMembershipId, status: "ACTIVE" },
      include: { parent: { select: { email: true } } },
    });
    if (!guardianship?.parent.email) {
      skip(
        "the guardian's view of a published report card",
        `no active guardian with an email for the pupil on class ${classId}`,
      );
    } else {
      const guardianActor = await mint(
        guardianship.parent.email,
        "PARENT",
        schoolId,
        "card-guardian",
      );
      const { status, body } = await hit(guardianActor, "/exams?tab=cards");
      results.push({
        role: "card-guardian",
        path: "/exams?tab=cards",
        status,
        expected: 200,
        ok: status === 200 && body.includes("ZZ Sweep Draft"),
        note: "⚠ the published card is ON the page the notification points at",
      });
    }
  } finally {
    await db.reportCard.deleteMany({ where: { id: draft.id } });
  }
}

async function twoSchoolTeacher(riversideId: string, oakfieldId: string) {
  const tom = await db.user.findUniqueOrThrow({ where: { email: "tom@riverside.school" } });
  const oakClass = await db.class.findFirstOrThrow({ where: { schoolId: oakfieldId } });
  const homeClass = await db.classTeacher.findFirstOrThrow({
    where: { teacher: { userId: tom.id, schoolId: riversideId } },
  });

  const second = await db.membership.create({
    data: { userId: tom.id, schoolId: oakfieldId, role: "TEACHER", status: "ACTIVE" },
  });
  // A class he genuinely teaches at the other school, so the only thing between
  // him and it is which school he is currently ACTING for.
  await db.classTeacher.create({
    data: { classId: oakClass.id, schoolId: oakfieldId, teacherMembershipId: second.id, role: "LEAD" },
  });

  try {
    const atRiverside = await mint("tom@riverside.school", "TEACHER", riversideId, "two-school");
    for (const p of ["/switch", "/teacher", "/account", "/teacher/classes"]) {
      await check(atRiverside, p, 200, "a teacher with a post at two schools");
    }

    const { body } = await hit(atRiverside, "/switch");
    results.push({
      role: "two-school",
      path: "/switch",
      status: 200,
      expected: 200,
      ok: body.includes("Riverside") && body.includes("Oakfield"),
      note: "the switcher offers BOTH schools",
    });

    // The widening must not escape listContexts: his OWN class at the other
    // school is still out of reach while he is being a Riverside teacher.
    await check(
      atRiverside,
      `/teacher/classes/${oakClass.id}`,
      404,
      "his own other-school class, while acting for this one",
    );

    // …and switching genuinely re-scopes, in both directions.
    const atOakfield = await mint("tom@riverside.school", "TEACHER", oakfieldId, "two-school");
    await check(atOakfield, `/teacher/classes/${oakClass.id}`, 200, "after switching schools");
    await check(atOakfield, `/teacher/classes/${homeClass.classId}`, 404, "and the first school is now out of reach");
  } finally {
    await db.classTeacher.deleteMany({ where: { teacherMembershipId: second.id } });
    await db.membership.delete({ where: { id: second.id } });
  }
}

/**
 * The front door: an unguessable code, presented by somebody with no session.
 *
 * These are the pages a child or a new member of staff meets FIRST, and they are
 * the ones tenant scoping breaks most quietly — the row a code names is the very
 * thing that would say which school to scope to, so a school-scoped policy
 * refuses the only query that could answer it. Every join code on the
 * installation read as "we could not find that code", and an invitation link as
 * "no longer valid".
 *
 * Signed out on purpose. That is the whole point.
 */
async function joinCodeBootstrap(riversideId: string) {
  const klass = await db.class.findFirstOrThrow({
    where: { schoolId: riversideId, archivedAt: null },
  });
  const creator = await db.membership.findFirstOrThrow({
    where: { schoolId: riversideId, role: "ADMIN" },
  });

  const token = randomBytes(24).toString("base64url");
  const invite = await db.invite.create({
    data: {
      schoolId: riversideId,
      classId: klass.id,
      email: "sweep-invitee@riverside.school",
      role: "TEACHER",
      status: "PENDING",
      tokenHash: createHash("sha256").update(token).digest("hex"),
      createdByMembershipId: creator.id,
      expiresAt: new Date(Date.now() + 7 * 86_400_000),
    },
  });

  try {
    const page = await hit(null, `/invite/${token}`);
    results.push({
      role: "anonymous",
      path: "/invite/<token>",
      status: page.status,
      expected: 200,
      // The page renders either way; what matters is whether it could READ the
      // invitation, or fell through to the refusal. Asserted the POSITIVE way
      // round now: the accept form only exists on the branch that read it, so
      // this says what the check means instead of naming the failure's wording.
      ok: page.status === 200 && page.body.includes('id="accept-invite"'),
      note: "a real invitation link, signed out",
    });

    await check(null, `/invite/${randomBytes(24).toString("base64url")}`, 200, "a forged one still renders its refusal");
  } finally {
    await db.invite.delete({ where: { id: invite.id } });
  }
}

async function main() {
  const riverside = await db.school.findFirst({ where: { name: { contains: "Riverside" } } });
  const oakfield = await db.school.findFirst({ where: { name: { contains: "Oakfield" } } });
  if (!riverside || !oakfield) throw new Error("seed missing");

  // A student who actually belongs to Riverside.
  const studentMembership = await db.membership.findFirst({
    where: { schoolId: riverside.id, role: "STUDENT", status: "ACTIVE" },
    include: { user: true },
  });
  if (!studentMembership?.user.email && !studentMembership) throw new Error("no student");

  const admin = await mint("priya@riverside.school", "ADMIN", riverside.id, "admin");
  const teacher = await mint("tom@riverside.school", "TEACHER", riverside.id, "teacher");
  const otherAdmin = await mint("sam@oakfield.school", "ADMIN", oakfield.id, "oakfield-admin");
  const parent = await mint("parent@example.com", "PARENT", null, "parent");

  // The uptime probe: signed out, 200, and it must say the database answered.
  await check(null, "/api/health", 200, "the uptime probe answers signed out");

  // Students may have no email (self-joined), so mint straight off the user row.
  const studentUser = studentMembership!.user;
  const studentToken = randomBytes(32).toString("base64url");
  await db.session.create({
    data: {
      userId: studentUser.id,
      tokenHash: createHash("sha256").update(studentToken).digest("hex"),
      activeSchoolId: riverside.id,
      activeRole: "STUDENT",
      userAgent: "sweep",
      // 24h for the same reason as mint(): the run must outlast a slow server.
      expiresAt: new Date(Date.now() + 86_400_000),
    },
  });
  const student: Actor = { label: "student", cookie: `edulink_session=${studentToken}`, sessionId: "" };

  // Real ids for the dynamic routes.
  const klass = await db.class.findFirst({ where: { schoolId: riverside.id, archivedAt: null } });
  const teacherClasses = await db.classTeacher.findMany({
    where: { teacher: { user: { email: "tom@riverside.school" } } },
    include: { class: true },
  });
  const teacherClass = teacherClasses[0] ?? null;

  // ALL of this teacher's classes, not just the first, and that distinction was
  // a live bug in this file. It picked any assignment in the school and expected
  // a 404 on the grounds that it belonged to "another teacher's class" — but Tom
  // teaches two, and once the seed put the first assignment in the second of
  // them he legitimately got a 200 and the sweep reported a failure in code that
  // had not changed. The check is only meaningful against a class he does not
  // teach at all.
  const teacherClassIdSet = new Set(teacherClasses.map((t) => t.classId));
  const assignment = await db.assignment.findFirst({
    where: { schoolId: riverside.id, classId: { notIn: [...teacherClassIdSet] } },
  });
  // An assignment in a class this teacher actually teaches. Picking any
  // assignment gets a correct 404 and reads as a bug — teachers are scoped to
  // their own classes, not merely to their school.
  // NOT a GLOBAL post: /bulletin/[postId] is the SCHOOL bulletin, and a post
  // published to the global feed correctly 404s there — it lives at
  // /bulletin/global instead.
  const post = await db.post.findFirst({
    where: { schoolId: riverside.id, status: "APPROVED", scope: { not: "GLOBAL" } },
  });
  const thread = await db.remarkThread.findFirst({ where: { schoolId: riverside.id } });

  /* ---- public routes, signed out ---- */
  for (const p of [
    "/", "/login", "/register", "/join", "/join/student", "/join/parent", "/offline",
    // The two pages the stores need a signed-out URL for: PRIVACY_URL and ACCOUNT_DELETION_URL in apps/mobile/store.
    "/privacy", "/delete-account",
    "/manifest.webmanifest",
    // Getting back in, which by definition nobody signed in is doing — and
    // which has to work for somebody whose sessions their own reset just
    // revoked.
    "/forgot", "/first-signin", "/first-signin?handle=amara.k4f9", "/forgot?id=someone%40example.test", "/login?reset=1",
    /**
     * ⚠ THE TWO ROUTES THAT DID NOT EXIST while the app emailed links to them.
     * Registration sent `/verify?token=…` and the login page sent
     * `/magic?token=…`, and both 404ed — which this sweep did not catch for the
     * only reason it could not: a route nothing links to INSIDE the app is a
     * route a link-following sweep never visits. They are listed by hand now.
     *
     * Bare and with a junk token, because both have to answer a person holding
     * a mangled link, and both must do it signed out.
     */
    "/verify", "/verify?token=not-a-real-token",
    // The three ways a sign-in link can fail, each landing on the login form
    // with its own sentence. `/magic` itself is a route handler and redirects.
    "/login?link=expired", "/login?link=used", "/login?link=bad",
  ]) {
    await check(null, p);
  }
  /**
   * ⚠ A DEAD SIGN-IN LINK REDIRECTS, IT DOES NOT RENDER. `/magic` is a route
   * handler because signing somebody in writes a cookie, which Next.js refuses
   * from a Server Component. The first version was a page, and it rendered
   * perfectly for every FAILING token — so a junk token here went green while
   * the success path 500ed. That is why this asserts the redirect rather than a
   * 200, and why a real emailed link was opened by hand.
   */
  await check(null, "/magic?token=not-a-real-token", 307, "a dead sign-in link goes to the form");
  await check(null, "/magic", 307, "no token at all goes to the form");
  /**
   * The mailbox is NODE_ENV-gated, so the right answer depends on which server
   * the sweep was pointed at: it must 404 in production and must OPEN in dev,
   * where it is the only way to read the links the app "sent". Asserting the
   * production answer unconditionally kept this line red on every dev run,
   * which is how a real failure learns to hide behind an expected one. The
   * sweep tells the servers apart by a fingerprint in any page's own HTML:
   * webpack's `next dev` cache-busts its static chunks with `?v=<timestamp>`,
   * Turbopack's `next dev` ships its HMR client as a chunk that names itself
   * (`[turbopack]…hmr-client`, URL-encoded in the HTML), and a production
   * build does neither — it serves hashed filenames only.
   */
  const probe = await hit(null, "/login");
  const devServer =
    /\/_next\/static\/[^"]*\?v=/.test(probe.body) ||
    /%5Bturbopack%5D[^"]*hmr-client/.test(probe.body);
  await check(
    null,
    "/dev/mailbox",
    devServer ? 200 : 404,
    devServer ? "the dev mailbox opens on a dev server" : "must 404 in production",
  );
  await check(null, "/admin", 307, "signed-out admin redirects to login");
  await check(null, "/api/push", 401, "unauthenticated push registration");
  // Joining two accounts needs one of them to be signed in ALREADY — that is
  // half the authorisation. A signed-out merge form would be a password
  // prompt for arbitrary accounts, offered to anybody.
  await check(null, "/account/merge", 307, "signed-out account merge redirects to login");

  /* ---- admin ---- */
  for (const p of [
    "/admin", "/admin/classes", "/admin/classes/new", "/admin/invites", "/admin/invites/new",
    "/admin/people", "/admin/people?q=a", "/admin/people?role=STUDENT", "/admin/safety",
    "/admin/settings", "/admin/calendar", "/bulletin", "/bulletin/global", "/experts", "/mentoring", "/bulletin?filter=mine", "/bulletin?filter=pending",
    "/bulletin/new", "/notifications", "/notifications?tab=unread", "/account", "/account/merge", "/switch",
    "/remarks", "/admin/people/export",
    // Cross-school outreach: the directory desk, the vacancy desk, the board.
    "/admin/vacancies", "/admin/vacancies/new", "/vacancies", "/explore", "/enquiries",
  ]) {
    await check(admin, p);
  }
  // The directory profile moved onto Settings; the old route lands on the card.
  await check(admin, "/admin/directory", 307, "directory profile edited on Settings now");
  // Messages are teacher↔parent, so an admin is sent to pick a role rather than
  // shown a compose box they cannot post from.
  await check(admin, "/remarks/new", 307, "admin is not a teacher here");
  if (klass) await check(admin, `/teacher/classes/${klass.id}`, 200, "admin viewing a class");

  /* ---- teacher ---- */
  for (const p of [
    "/teacher", "/teacher/attendance", "/teacher/assignments", "/teacher/assignments/new",
    "/teacher/classes", "/bulletin", "/bulletin/global", "/experts", "/mentoring", "/bulletin/new", "/remarks", "/remarks/new",
    "/notifications", "/account", "/account/merge", "/switch", "/mentoring",
    // A teacher browses the platform-wide board and their own enquiries.
    "/vacancies", "/explore", "/enquiries",
  ]) {
    await check(teacher, p);
  }
  if (teacherClass) await check(teacher, `/teacher/classes/${teacherClass.classId}`);
  const ownAssignment = teacherClass
    ? await db.assignment.findFirst({ where: { classId: teacherClass.classId } })
    : null;
  if (ownAssignment) {
    await check(teacher, `/teacher/assignments/${ownAssignment.id}`, 200, "gradebook");
  }
  if (assignment) {
    await check(teacher, `/teacher/assignments/${assignment.id}`, 404, "another teacher's class");
  }
  if (assignment) await check(admin, `/teacher/assignments/${assignment.id}`, 200, "gradebook");

  /* ---- student ---- */
  for (const p of [
    "/student", "/student/assignments", "/student/assignments?tab=marked", "/exams?tab=cards", "/student/profile",
    "/student/practice", "/student/practice?subject=MATHS", "/mentoring", "/bulletin", "/bulletin/global",
    "/bulletin/new", "/notifications", "/account", "/account/merge", "/record",
    // A pupil is now a participant in their own conversations with a teacher,
    // and may ask for a mentor.
    "/remarks", "/remarks/new", "/mentoring",
  ]) {
    await check(student, p);
  }
  if (post) await check(student, `/bulletin/${post.id}`);

  /* ---- practice: the question bank is shared, the practising is not ---- */
  const topic = await db.quizTopic.findFirst({ orderBy: { slug: "asc" }, select: { slug: true } });
  if (topic) {
    await check(student, `/student/practice/${topic.slug}`, 200, "a pupil may practise");
    // The bank is global, so a pupil at the OTHER school reaches the same topic.
    // What must never cross is their attempts, which are school-scoped rows.
    await check(teacher, `/student/practice/${topic.slug}`, 307, "practice is not a teacher's page");
    await check(parent, `/student/practice/${topic.slug}`, 307, "nor a guardian's");
  }
  await check(student, "/student/practice/no-such-topic", 404, "an invented topic slug");

  /* ---- parent ---- */
  for (const p of [
    "/parent", "/parent/attendance", "/parent/assignments", "/parent/assignments?tab=marked", "/exams?tab=cards", "/parent/settings", "/remarks",
    "/notifications", "/account", "/account/merge", "/switch", "/record",
    // A guardian can now START a conversation, not only reply to one.
    "/remarks/new",
    // A parent explores other schools and keeps their enquiry threads.
    "/explore", "/enquiries",
  ]) {
    await check(parent, p);
  }

  // A guardian reads the global feed through their CHILDREN'S schools: the
  // hide set is the union across them, so nothing a child's school took down
  // is shown. The old answer here — 307 to a switcher that had no school to
  // offer a parent — was a locked door with a sign saying "use the door",
  // found by a person testing with children at two schools.
  await check(parent, "/bulletin/global", 200, "⚠ a guardian reads the global feed through their children's schools");
  if (thread) await check(parent, `/remarks/${thread.id}`, 200, "own thread");

  /* ---- health card: the printable document, opened by the people the lib admits ---- */
  const healthChild = await db.guardianship.findFirst({
    where: { parent: { email: "parent@example.com" }, status: "ACTIVE" },
    select: { studentMembershipId: true },
  });
  if (healthChild) {
    await check(parent, `/parent/health?child=${healthChild.studentMembershipId}`, 200, "a guardian reads the child's health card");
    await check(parent, `/health/cards/${healthChild.studentMembershipId}`, 200, "…and prints it");
    await check(admin, `/health/cards/${healthChild.studentMembershipId}`, 200, "the office prints any pupil's card");
    await check(otherAdmin, `/health/cards/${healthChild.studentMembershipId}`, 404, "⚠ another school's office cannot, by id");
    await check(null, `/health/cards/${healthChild.studentMembershipId}`, 307, "signed-out card redirects to login");
  }
  if (teacherClass) {
    const taught = await db.enrollment.findFirst({ where: { classId: teacherClass.classId, status: "ACTIVE" }, select: { studentMembershipId: true } });
    if (taught) await check(teacher, `/health/cards/${taught.studentMembershipId}`, 200, "a teacher prints the card of a pupil they teach");
    const notTaught = await db.enrollment.findFirst({
      where: { schoolId: riverside.id, status: "ACTIVE", classId: { notIn: [...teacherClassIdSet] } },
      select: { studentMembershipId: true },
    });
    if (notTaught) await check(teacher, `/health/cards/${notTaught.studentMembershipId}`, 404, "⚠ …and not one they do not");
  }
  await check(parent, "/health/cards/cnope00000000000000000000", 404, "an invented card id");

  /* ---- incident log: the pupil's file, read by the people the lib admits ---- */
  // The fixtures' two incidents are ZZ Northgate's (a closed grazed knee on
  // pupil01, an open sick-room visit on pupil02), so the actors here are that
  // school's office, a teacher of pupil02's class and pupil02's guardian, minted
  // for the length of this block; Riverside's own log is walked by everyNavLink.
  const northgate = await db.school.findFirst({ where: { name: "ZZ Northgate School" }, select: { id: true } });
  const openIncident = northgate
    ? await db.incident.findFirst({ where: { schoolId: northgate.id, status: "OPEN" }, select: { id: true, studentMembershipId: true } })
    : null;
  if (northgate && openIncident) {
    const zzAdmin = await mint("zz.admin@zz.test", "ADMIN", northgate.id, "zz-admin");
    const zzGuardian = await db.guardianship.findFirst({
      where: { studentMembershipId: openIncident.studentMembershipId, status: "ACTIVE" },
      select: { parent: { select: { email: true } } },
    });
    const zzTeaching = await db.classTeacher.findFirst({
      where: { class: { schoolId: northgate.id, enrollments: { some: { studentMembershipId: openIncident.studentMembershipId, status: "ACTIVE" } } }, teacher: { status: "ACTIVE" } },
      select: { classId: true, teacher: { select: { user: { select: { email: true } } } } },
    });
    await check(zzAdmin, "/admin/incidents", 200, "the office reads the school's incident log");
    await check(zzAdmin, "/admin/incidents?status=CLOSED", 200, "…and the closed ones");
    await check(zzAdmin, `/admin/incidents?status=ALL&student=${openIncident.studentMembershipId}`, 200, "…and one pupil's file");
    await check(zzAdmin, `/incidents/${openIncident.id}`, 200, "…and opens an incident");
    await check(zzAdmin, `/incidents/new?student=${openIncident.studentMembershipId}`, 200, "…and records one for any pupil");
    await check(admin, `/incidents/${openIncident.id}`, 404, "⚠ another school's office cannot, by id");
    await check(otherAdmin, `/incidents/${openIncident.id}`, 404, "⚠ …nor a third school's");
    await check(null, `/incidents/${openIncident.id}`, 307, "signed-out incident redirects to login");
    await check(null, "/admin/incidents", 307, "signed-out log redirects to login");
    if (zzGuardian?.parent.email) {
      const zzParent = await mint(zzGuardian.parent.email, "PARENT", null, "zz-parent");
      await check(zzParent, `/parent/incidents?child=${openIncident.studentMembershipId}`, 200, "a guardian reads the child's incidents");
      await check(zzParent, `/parent/incidents?child=${openIncident.studentMembershipId}&incident=${openIncident.id}`, 200, "…landing from the notification");
      await check(zzParent, `/incidents/${openIncident.id}`, 307, "⚠ …but the staff record is not a guardian's page");
    }
    if (zzTeaching?.teacher.user.email) {
      const zzTeacher = await mint(zzTeaching.teacher.user.email, "TEACHER", northgate.id, "zz-teacher");
      await check(zzTeacher, "/teacher/incidents", 200, "a teacher reads their own pupils' incidents");
      await check(zzTeacher, `/incidents/${openIncident.id}`, 200, "…and opens one on a pupil they teach");
      await check(zzTeacher, `/incidents/new?student=${openIncident.studentMembershipId}`, 200, "…and records one for a pupil they teach");
      await check(zzTeacher, "/admin/incidents", 307, "⚠ …but not the whole school's log");
      // A pupil in none of this teacher's classes, not merely in another class.
      const notTaught = await db.enrollment.findFirst({
        where: {
          schoolId: northgate.id,
          status: "ACTIVE",
          student: { enrollments: { none: { status: "ACTIVE", class: { teachers: { some: { teacher: { user: { email: zzTeaching.teacher.user.email } } } } } } } },
        },
        select: { studentMembershipId: true },
      });
      if (notTaught) await check(zzTeacher, `/incidents/new?student=${notTaught.studentMembershipId}`, 404, "⚠ …and not for one they do not");
    }
  } else {
    skip("incident log", "no ZZ fixtures with an open incident (run zz:fixtures)");
  }
  await check(admin, "/incidents/cnope00000000000000000000", 404, "an invented incident id");
  await check(admin, "/incidents/new", 404, "recording with no pupil named");

  /* ---- circular reach: the notice, its report, the print sheet and the waiting list ---- */
  // The fixtures' circular is ZZ Northgate's (annual-day consent, audience
  // PARENTS, told a day ago), so the actors are that school's office, a
  // teacher with a class and a guardian, minted for the length of this block.
  const circular = northgate
    ? await db.post.findFirst({ where: { schoolId: northgate.id, requiresAck: true, status: "APPROVED" }, select: { id: true } })
    : null;
  if (northgate && circular) {
    const zzAdmin = await mint("zz.admin@zz.test", "ADMIN", northgate.id, "zz-admin");
    await check(zzAdmin, "/admin/circulars", 200, "the office reads the school's circulars");
    await check(zzAdmin, `/bulletin/${circular.id}`, 200, "…and opens a circular with its reach report");
    await check(zzAdmin, `/bulletin/${circular.id}/print`, 200, "…and the print sheet for the notice board");
    await check(zzAdmin, `/bulletin/${circular.id}/outstanding`, 200, "…and downloads the waiting list");
    await check(zzAdmin, `/bulletin/${circular.id}/outstanding?format=xlsx`, 200, "…and as a workbook");
    await check(admin, `/bulletin/${circular.id}/print`, 404, "⚠ another school's office cannot print it");
    await check(admin, `/bulletin/${circular.id}/outstanding`, 404, "⚠ …nor download its waiting list");
    await check(null, `/bulletin/${circular.id}/print`, 307, "signed-out print sheet redirects to login");
    await check(null, "/admin/circulars", 307, "signed-out circulars list redirects to login");
    const zzTeaching = await db.classTeacher.findFirst({
      where: { class: { schoolId: northgate.id, archivedAt: null }, teacher: { status: "ACTIVE" } },
      select: { teacher: { select: { user: { select: { email: true } } } } },
    });
    if (zzTeaching?.teacher.user.email) {
      const zzTeacher = await mint(zzTeaching.teacher.user.email, "TEACHER", northgate.id, "zz-teacher");
      await check(zzTeacher, `/bulletin/${circular.id}`, 200, "a teacher reads the circular and their classes' reach");
      await check(zzTeacher, "/admin/circulars", 307, "⚠ …but not the office's list");
    }
    const zzGuardian = await db.guardianship.findFirst({ where: { studentSchoolId: northgate.id, status: "ACTIVE" }, select: { parent: { select: { email: true } } } });
    if (zzGuardian?.parent.email) {
      const zzParent = await mint(zzGuardian.parent.email, "PARENT", null, "zz-parent");
      await check(zzParent, `/bulletin/${circular.id}`, 200, "a guardian reads the circular");
      await check(zzParent, "/admin/circulars", 307, "⚠ …but not the office's list");
      await check(zzParent, `/bulletin/${circular.id}/outstanding`, 404, "⚠ …nor the waiting list");
    }
  } else {
    skip("circular reach", "no ZZ fixtures with a circular (run zz:fixtures)");
  }

  /* ---- staff attendance: the office's register and the month, a teacher's own days ---- */
  // Riverside's own office, teacher and guardian; the dates are the server's
  // calendar, which the library clamps to the school's own today.
  {
    const staffToday = new Date();
    const staffYesterday = new Date(staffToday.getTime() - 86_400_000).toISOString().slice(0, 10);
    const staffMonth = staffToday.toISOString().slice(0, 7);
    await check(admin, "/admin/staff-attendance", 200, "the office reads today's staff register");
    await check(admin, `/admin/staff-attendance?date=${staffYesterday}`, 200, "…and yesterday's");
    await check(admin, `/admin/staff-attendance?month=${staffMonth}`, 200, "…and this month, person by person");
    await check(admin, `/admin/staff-attendance/export?month=${staffMonth}`, 200, "…and downloads the month");
    await check(admin, `/admin/staff-attendance/export?month=${staffMonth}&format=xlsx`, 200, "…and as a workbook");
    await check(teacher, "/teacher/attendance/me", 200, "a teacher reads their own attendance");
    await check(teacher, "/admin/staff-attendance", 307, "⚠ …but not the office's register");
    await check(parent, "/teacher/attendance/me", 307, "⚠ a guardian has no staff attendance");
    await check(parent, "/admin/staff-attendance", 307, "⚠ …nor the register");
    await check(null, "/admin/staff-attendance", 307, "signed-out register redirects to login");
    await check(null, "/teacher/attendance/me", 307, "signed-out own attendance redirects to login");
  }

  /* ---- substitutions: the board for the day, its print, a teacher's covers; the teaching week on settings ---- */
  // Riverside's own office, teacher and guardian. The board is empty on a
  // day nobody is away, and closed on a day the school does not teach, and
  // both render; the pages are the office's alone.
  {
    const boardToday = new Date().toISOString().slice(0, 10);
    await check(admin, "/admin/substitutions", 200, "the office reads today's substitution board");
    await check(admin, `/admin/substitutions?date=${boardToday}`, 200, "…and by date");
    await check(admin, `/admin/substitutions/print?date=${boardToday}`, 200, "…and prints it");
    await check(admin, "/admin/settings", 200, "the settings page carries the teaching week");
    await check(teacher, "/admin/substitutions", 307, "⚠ a teacher is not shown the board");
    await check(teacher, "/teacher", 200, "a teacher's Today carries their covers");
    await check(parent, "/admin/substitutions", 307, "⚠ a guardian has no board");
    await check(parent, `/admin/substitutions/print?date=${boardToday}`, 307, "⚠ …nor its print");
    await check(null, "/admin/substitutions", 307, "signed-out board redirects to login");
  }

  /* ---- syllabus: the office's lists and coverage, a class's chapters and lessons ---- */
  // ZZ Northgate carries Mathematics and English lists for grade 3 and its
  // grade-3 class is two chapters in; the actors are that school's office,
  // the class's lead teacher, a teacher with no class of that grade, and a
  // guardian, minted for the length of this block.
  const syllabusClass = northgate
    ? await db.class.findFirst({
        where: { schoolId: northgate.id, gradeLevel: "3", archivedAt: null },
        select: { id: true, teachers: { where: { role: "LEAD" }, select: { teacher: { select: { user: { select: { email: true } } } } }, take: 1 } },
        orderBy: { name: "asc" },
      })
    : null;
  const syllabusUnits = northgate ? await db.syllabusUnit.count({ where: { schoolId: northgate.id, gradeLevel: "3" } }) : 0;
  if (northgate && syllabusClass && syllabusUnits > 0) {
    const zzOffice = await mint("zz.admin@zz.test", "ADMIN", northgate.id, "zz-office");
    await check(zzOffice, "/admin/syllabus", 200, "the office reads the syllabus lists");
    await check(zzOffice, "/admin/syllabus?gradeLevel=3&subject=Mathematics", 200, "…and opens grade 3 Mathematics to edit");
    await check(zzOffice, "/admin/syllabus?gradeLevel=3&subject=Nothing%20Yet", 200, "…and a pair with no list yet, to start one");
    await check(zzOffice, "/admin/syllabus/coverage", 200, "…and the coverage table");
    await check(zzOffice, `/teacher/classes/${syllabusClass.id}/syllabus?subject=Mathematics`, 200, "…and a class's page from the table");
    const leadEmail = syllabusClass.teachers[0]?.teacher.user.email;
    if (leadEmail) {
      const lead = await mint(leadEmail, "TEACHER", northgate.id, "zz-lead-teacher");
      await check(lead, `/teacher/classes/${syllabusClass.id}/syllabus`, 200, "the class's teacher reads its syllabus");
      await check(lead, `/teacher/classes/${syllabusClass.id}/syllabus?subject=English`, 200, "…and the English tab");
      await check(lead, `/teacher/classes/${syllabusClass.id}`, 200, "…and the class page carrying the syllabus button");
      await check(lead, "/admin/syllabus", 307, "⚠ …but not the office's lists");
      await check(lead, "/admin/syllabus/coverage", 307, "⚠ …nor the coverage table");
      // A teacher of the school with no class of grade 3 at all, not merely another class.
      const stranger = await db.membership.findFirst({
        where: { schoolId: northgate.id, role: "TEACHER", status: "ACTIVE", user: { email: { not: leadEmail } }, classTeachers: { none: { classId: syllabusClass.id } } },
        select: { user: { select: { email: true } } },
      });
      if (stranger?.user.email) {
        const other = await mint(stranger.user.email, "TEACHER", northgate.id, "zz-other-teacher");
        await check(other, `/teacher/classes/${syllabusClass.id}/syllabus`, 404, "⚠ a teacher who does not teach the class must NOT find its syllabus");
      } else {
        skip("syllabus stranger", "no second teacher at ZZ Northgate");
      }
    } else {
      skip("syllabus teacher", "the ZZ grade-3 class has no lead teacher");
    }
    const syllabusGuardian = await db.guardianship.findFirst({ where: { studentSchoolId: northgate.id, status: "ACTIVE" }, select: { parent: { select: { email: true } } } });
    if (syllabusGuardian?.parent.email) {
      const zzParent = await mint(syllabusGuardian.parent.email, "PARENT", null, "zz-parent");
      await check(zzParent, `/teacher/classes/${syllabusClass.id}/syllabus`, 307, "⚠ a guardian has no class syllabus page");
      await check(zzParent, "/admin/syllabus", 307, "⚠ …nor the office's lists");
    }
    await check(null, "/admin/syllabus", 307, "signed-out syllabus redirects to login");
    await check(null, "/admin/syllabus/coverage", 307, "signed-out coverage redirects to login");
    await check(null, `/teacher/classes/${syllabusClass.id}/syllabus`, 307, "signed-out class syllabus redirects to login");
  } else {
    skip("syllabus", "no ZZ fixtures with a grade-3 syllabus (run zz:fixtures)");
  }

  /* ---- negative: cross-tenant and cross-role ---- */
  if (klass) await check(otherAdmin, `/teacher/classes/${klass.id}`, 404, "other school's class must NOT be found");
  if (thread) await check(otherAdmin, `/remarks/${thread.id}`, 404, "other school's remark thread");
  await check(teacher, "/admin/people/export", 403, "teacher on the admin export");
  await check(student, "/admin/people", 307, "student on an admin page");
  // Outreach edges: the board is staff's, the directory desk the admin's.
  await check(student, "/vacancies", 307, "⚠ a pupil is not on the job market");
  await check(parent, "/vacancies", 307, "⚠ nor is a guardian");
  await check(student, "/explore", 200, "a pupil may read the public directory");
  await check(teacher, "/admin/directory", 307, "⚠ a teacher does not run the directory profile");
  await check(teacher, "/admin/vacancies", 307, "⚠ …nor the vacancy desk");

  await reportCards(riverside.id);
  await leaveAndPrincipal(riverside.id);
  await staffingAndDuty(riverside.id);
  await operatorArea();
  await onboardingSignposts(riverside.id);
  await sharedDeviceSignposts(riverside.id);

  /**
   * Every link the app draws, followed as the role that is shown it.
   *
   * A PRINCIPAL is made for the length of this check, the same way
   * `leaveAndPrincipal` does, because the seed has none and adding one would
   * move counts that other suites assert. An EXPERT is minted from a published
   * profile if the seed has one.
   */
  const principalHost = await db.membership.findFirst({
    where: {
      schoolId: riverside.id,
      role: "TEACHER",
      status: "ACTIVE",
      user: { email: { not: null } },
    },
    include: { user: { select: { id: true, email: true } } },
  });
  const madePrincipal = principalHost?.user.email
    ? await db.membership.upsert({
        where: {
          userId_schoolId_role: {
            userId: principalHost.user.id,
            schoolId: riverside.id,
            role: "PRINCIPAL",
          },
        },
        create: {
          userId: principalHost.user.id,
          schoolId: riverside.id,
          role: "PRINCIPAL",
          status: "ACTIVE",
        },
        update: { status: "ACTIVE" },
      })
    : null;

  // A published expert, made for the length of this check. `/expert/*` is
  // reachable only by somebody holding an ExpertProfile, and the seed has none.
  const sweepExpertUser = await db.user.upsert({
    where: { email: SWEEP_EXPERT_EMAIL },
    create: { email: SWEEP_EXPERT_EMAIL, name: "ZZ Sweep Expert", prefs: "{}" },
    update: {},
  });
  await db.expertProfile.upsert({
    where: { userId: sweepExpertUser.id },
    create: {
      userId: sweepExpertUser.id,
      headline: "ZZ Sweep expert",
      publishedAt: new Date(),
    },
    update: { publishedAt: new Date() },
  });

  try {
    await everyNavLink(riverside.id, async (role) => {
      if (role === "ADMIN") return admin;
      if (role === "TEACHER") return teacher;
      if (role === "STUDENT") return student;
      if (role === "PARENT") return parent;
      if (role === "PRINCIPAL") {
        return principalHost?.user.email
          ? mint(principalHost.user.email, "PRINCIPAL", riverside.id, "nav-principal")
          : null;
      }
      // The seed has no expert, and this is the exact role whose nav pointed at
      // a 404 for months. Skipping it would recreate the blind spot that let
      // that happen, so one is made and taken away again.
      return mint(SWEEP_EXPERT_EMAIL, "EXPERT", null, "nav-expert");
    });
  } finally {
    if (madePrincipal) await db.membership.deleteMany({ where: { id: madePrincipal.id } });
    await db.expertProfile.deleteMany({ where: { userId: sweepExpertUser.id } });
    await db.session.deleteMany({ where: { userId: sweepExpertUser.id } });
    await db.user.deleteMany({ where: { id: sweepExpertUser.id } });
  }

  await mentorshipThread(riverside.id, parent, admin, otherAdmin);
  await expertBooking(riverside.id, parent, admin, otherAdmin, student);
  await storedFile(riverside.id, admin, teacher, otherAdmin);

  /**
   * ⚠ TWO PAGES THIS SWEEP HAD NEVER REQUESTED. Both are reached from outside
   * the navigation — `/parent/link` from a claim email and the join flow,
   * `/expert/pending` from an expert's own landing after they accept an
   * invitation — so `everyNavLink` was never going to find either.
   */
  await check(parent, "/parent/link", 200, "a guardian links another child");
  await check(null, "/parent/link", 307, "⚠ signed out, it sends them to sign up first");

  await suspension(riverside.id);
  await transfer(riverside.id, oakfield.id);
  await alumniRecord(riverside.id);

  await twoSchoolTeacher(riverside.id, oakfield.id);
  await joinCodeBootstrap(riverside.id);

  /* ---- progress reports: a summary must not outrank its parts ---- */
  const reportChild = await db.guardianship.findFirst({
    where: { parent: { email: "parent@example.com" }, status: "ACTIVE", studentSchoolId: riverside.id },
    select: { studentMembershipId: true },
  });
  if (reportChild) {
    const id = reportChild.studentMembershipId;
    await check(parent, `/reports/${id}`, 200, "their own child");
    await check(admin, `/reports/${id}`, 200, "their school's pupil");
    // A DIFFERENT pupil: the sweep's own student actor may well be this child,
    // and "you can read your own report" is not the check being made here.
    const otherPupil = await db.membership.findFirst({
      where: { schoolId: riverside.id, role: "STUDENT", status: "ACTIVE", id: { not: id } },
      include: { user: { select: { email: true } } },
    });
    if (otherPupil?.user.email) {
      const classmate = await mint(otherPupil.user.email, "STUDENT", riverside.id, "classmate");
      await check(classmate, `/reports/${id}`, 404, "another pupil's report");
      await check(classmate, `/reports/${otherPupil.id}`, 200, "…but their own is fine");
    }
    await check(otherAdmin, `/reports/${id}`, 404, "another school's pupil");
    await check(null, `/reports/${id}`, 307, "signed out");
    await check(parent, `/reports/${id}?from=2026-05-01&to=2026-06-30`, 200, "a narrower window");
  }

  /* ---- competitions: the one thing that is NOT school-scoped ---- */
  const openComp = await db.competition.findFirst({ where: { status: "PUBLISHED" } });
  const draftComp = await db.competition.findFirst({ where: { status: "DRAFT" } });

  for (const actor of [admin, teacher, student, parent]) {
    await check(actor, "/competitions");
  }
  await check(student, "/competitions?show=all", 200, "including closed ones");
  await check(admin, "/competitions/new", 200, "posting one");
  await check(teacher, "/competitions/new", 307, "a teacher cannot post one");
  await check(student, "/competitions/new", 307, "nor can a pupil");

  if (openComp) {
    // EVERY role, at BOTH schools. A competition is not school-owned, and this
    // is the check that would fail if somebody "helpfully" scoped it.
    for (const actor of [admin, teacher, student, parent, otherAdmin]) {
      await check(actor, `/competitions/${openComp.id}`, 200, "the catalogue is shared");
    }
  }
  if (openComp) {
    // The results page is staff-only, and school-scoped by the policy rather
    // than by anything the page does.
    await check(admin, `/competitions/${openComp.id}/entries`, 200, "this school's entries");
    await check(teacher, `/competitions/${openComp.id}/entries`, 200, "staff record results");
    await check(student, `/competitions/${openComp.id}/entries`, 404, "not a pupil's page");
    await check(parent, `/competitions/${openComp.id}/entries`, 404, "nor a guardian's");
  }

  if (draftComp) {
    // …but an unpublished one is nobody's business, and 404 rather than 403 so
    // it does not confirm itself.
    for (const actor of [teacher, student, parent, otherAdmin]) {
      await check(actor, `/competitions/${draftComp.id}`, 404, "a draft is not visible");
    }
  }

  /* ---- report ---- */
  const pad = (s: string, n: number) => s.padEnd(n);
  console.log("\n" + pad("ROLE", 16) + pad("STATUS", 14) + "PATH");
  console.log("-".repeat(96));
  for (const r of results) {
    const mark = r.ok ? "ok  " : "FAIL";
    // A handful of checks assert what came BACK, not merely the status — a page
    // can be a healthy 200 and still be missing the one thing it exists to
    // show. "FAIL 200 (want 200)" reads as a bug in this script; it is not.
    const status = r.ok
      ? `${mark} ${r.status}`
      : r.status === r.expected
        ? `${mark} ${r.status} (body)`
        : `${mark} ${r.status} (want ${r.expected})`;
    console.log(pad(r.role, 16) + pad(status, 14) + r.path + (r.note ? `   — ${r.note}` : ""));
  }
  const failed = results.filter((r) => !r.ok);
  console.log("-".repeat(96));
  if (skipped.length > 0) {
    // Said out loud, because a count that does not mention what it left out
    // reads as coverage it does not have.
    console.log(`${skipped.length} check(s) NOT made:`);
    for (const line of skipped) console.log(`  skip  ${line}`);
    console.log("-".repeat(96));
  }
  console.log(
    `${results.length - failed.length}/${results.length} as expected, ${failed.length} unexpected` +
      (skipped.length > 0 ? `, ${skipped.length} skipped.` : "."),
  );

  await db.session.deleteMany({ where: { userAgent: "sweep" } });
  process.exit(failed.length ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  await db.session.deleteMany({ where: { userAgent: "sweep" } });
  process.exit(1);
});
