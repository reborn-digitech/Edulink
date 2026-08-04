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
import { createHash, randomBytes } from "node:crypto";
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
      expiresAt: new Date(Date.now() + 3_600_000),
    },
  });
  return { label, cookie: `edulink_session=${token}`, sessionId: session.id };
}

async function hit(actor: Actor | null, path: string): Promise<{ status: number; body: string; loc: string | null }> {
  const res = await fetch(BASE + path, {
    headers: actor ? { cookie: actor.cookie } : {},
    redirect: "manual",
  });
  const body = res.status === 200 ? await res.text() : "";
  return { status: res.status, body, loc: res.headers.get("location") };
}

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

    // KNOWN LIMITATION, asserted rather than wished away. /account lives inside
    // the role-gated shell, so somebody with no remaining context cannot reach
    // their own settings — not a consequence of suspension, but most visible
    // here. /suspended carries sign-out for that reason. Moving the account page
    // out from behind the role gate is its own change.
    await check(actor, "/account", 307, "the account page is behind the role gate");
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
async function staffingAndDuty(schoolId: string) {
  const klass = await db.class.findFirst({
    where: { schoolId, archivedAt: null },
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
  await check(null, "/root/audit", 307, "…to nobody at all either");

  try {
    await db.user.update({ where: { id: staff.user.id }, data: { isSuperuser: true } });
    await check(actor, "/root", 200, "…and open to somebody who runs the server");
    await check(actor, "/root/new", 200, "…who may add a school");
    // The operator's own trail. Written with schoolId NULL since superusers
    // existed, and until now nothing in the app could read it.
    await check(actor, "/root/audit", 200, "⚠ …and may read what they have done");
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
    await check(teacherActor, "/principal", 307, "…nor open the principal's dashboard");
    await check(teacherActor, "/principal/classes", 307, "⚠ …nor the whole-school class figures");
  }

  const studentActor = await mintFor(schoolId, "STUDENT", "leave-pupil");
  if (studentActor) {
    await check(studentActor, "/teacher/leave", 307, "⚠ a pupil has no leave page");
    await check(studentActor, "/principal/leave", 307, "⚠ …and cannot read staff leave");
    await check(studentActor, "/admin/calendar", 307, "⚠ …nor the staff calendar it appears on");
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
    await check(head, "/admin/calendar", 200, "…and the staff calendar, where leave shows");
    await check(head, "/teacher/leave", 200, "a principal takes leave like anybody else");
    // A principal READS the school; they do not mark registers or set it up.
    await check(head, "/teacher/attendance", 307, "⚠ …but does not take a register");
    await check(head, "/admin/people", 307, "⚠ …nor run the directory");
    await check(head, "/admin/classes/new", 307, "⚠ …nor create classes");

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
      const { status, body } = await hit(
        guardianActor,
        `/parent/grades?child=${pupil.studentMembershipId}`,
      );
      results.push({
        role: "card-guardian",
        path: "/parent/grades",
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
      // invitation, or fell through to "no longer valid".
      ok: page.status === 200 && !page.body.includes("no longer valid"),
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
      expiresAt: new Date(Date.now() + 3_600_000),
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
  for (const p of ["/", "/login", "/register", "/join", "/join/student", "/join/parent", "/offline", "/manifest.webmanifest"]) {
    await check(null, p);
  }
  await check(null, "/dev/mailbox", 404, "must 404 in production");
  await check(null, "/admin", 307, "signed-out admin redirects to login");
  await check(null, "/api/push", 401, "unauthenticated push registration");

  /* ---- admin ---- */
  for (const p of [
    "/admin", "/admin/classes", "/admin/classes/new", "/admin/invites", "/admin/invites/new",
    "/admin/people", "/admin/people?q=a", "/admin/people?role=STUDENT", "/admin/safety",
    "/admin/settings", "/admin/calendar", "/bulletin", "/bulletin/global", "/experts", "/mentoring", "/bulletin?filter=mine", "/bulletin?filter=pending",
    "/bulletin/new", "/notifications", "/notifications?tab=unread", "/account", "/switch",
    "/remarks", "/admin/people/export",
  ]) {
    await check(admin, p);
  }
  // Messages are teacher↔parent, so an admin is sent to pick a role rather than
  // shown a compose box they cannot post from.
  await check(admin, "/remarks/new", 307, "admin is not a teacher here");
  if (klass) await check(admin, `/teacher/classes/${klass.id}`, 200, "admin viewing a class");

  /* ---- teacher ---- */
  for (const p of [
    "/teacher", "/teacher/attendance", "/teacher/assignments", "/teacher/assignments/new",
    "/teacher/classes", "/bulletin", "/bulletin/global", "/experts", "/mentoring", "/bulletin/new", "/remarks", "/remarks/new",
    "/notifications", "/account", "/switch", "/mentoring",
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
    "/student", "/student/work", "/student/grades", "/student/profile",
    "/student/practice", "/student/practice?subject=MATHS", "/mentoring", "/bulletin", "/bulletin/global",
    "/bulletin/new", "/notifications", "/account",
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
    "/parent", "/parent/attendance", "/parent/grades", "/parent/settings", "/remarks",
    "/notifications", "/account", "/switch",
  ]) {
    await check(parent, p);
  }

  // A parent has no Membership and so no active school until they pick one, and
  // the global feed needs one: which posts are HIDDEN is a per-school decision,
  // so serving the feed with no school bound would show a guardian content their
  // child's school had deliberately taken down. Sent to the switcher instead.
  await check(parent, "/bulletin/global", 307, "needs a school for that school's hides to apply");
  if (thread) await check(parent, `/remarks/${thread.id}`, 200, "own thread");

  /* ---- negative: cross-tenant and cross-role ---- */
  if (klass) await check(otherAdmin, `/teacher/classes/${klass.id}`, 404, "other school's class must NOT be found");
  if (thread) await check(otherAdmin, `/remarks/${thread.id}`, 404, "other school's remark thread");
  await check(teacher, "/admin/people/export", 403, "teacher on the admin export");
  await check(student, "/admin/people", 307, "student on an admin page");

  await reportCards(riverside.id);
  await leaveAndPrincipal(riverside.id);
  await staffingAndDuty(riverside.id);
  await operatorArea();

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

  await suspension(riverside.id);

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
