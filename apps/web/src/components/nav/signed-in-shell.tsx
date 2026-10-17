import { AppShell } from "./app-shell";
import { listContexts, type ActiveContext } from "@/lib/session";
import { getT } from "@/lib/i18n/server";
import { db } from "@/lib/db";
import { anyOpenReviews } from "@/lib/reviews";
import { anyEnquiries } from "@/lib/enquiries";
import { waitingJoinCount } from "@/lib/join-requests";
import { waitingClaimCount } from "@/lib/guardian-claims";
import { waitingSignatureCount } from "@/lib/signatures";
import { tidyNotificationsFor } from "@/lib/notification-housekeeping";
import { unreadConversationCount } from "@/lib/conversations";
import { listThreads } from "@/lib/remarks";
import type { Role } from "@/lib/constants";
import { NAV } from "@/lib/nav";
import { enabledModules, enabledModulesForFamily } from "@/lib/modules";
import { myDuties } from "@/lib/duties";
import { streamsOf } from "@/lib/streams";
import { hiddenByFeature, hiddenByKind } from "@/lib/nav";
import { accessTo, featuresFor } from "@/lib/platform-features";
import { ASSISTANT_NOT_FOR } from "@/lib/nav";
import { institutionKindsForFamily } from "@/lib/family-child";
import { isCollegeKind, streamLabel } from "@/lib/institution";

/**
 * The signed-in chrome, for a session that HAS a role.
 *
 * Extracted from `(app)/layout.tsx` when `/account` moved out from behind the
 * role gate, and extracted rather than copied for the obvious reason: the school
 * name, the context count and the unread badge are live queries, and two copies
 * of them would drift the first time one was changed. `(app)` gates and then
 * calls this; `/account` calls it only when there is a role to call it with.
 *
 * IT DOES NOT GATE. Every caller decides for itself what a missing role means —
 * which is the whole point of the split, because `(app)` and `/account` answer
 * that question differently and both answers are right.
 */
export async function SignedInShell({
  session,
  children,
}: {
  session: ActiveContext & { role: string };
  children: React.ReactNode;
}) {
  const role = session.role as Role;
  const t = await getT();

  // Before the badge is counted: a notice nobody opened in a term is read,
  // one read a year ago is gone. Probes first, so this is free on most days.
  await tidyNotificationsFor(session.user.id).catch((error) =>
    console.error("[shell] notification tidy failed", error),
  );

  const contexts = await listContexts(session.user.id);
  const contextCount = contexts.memberships.length + (contexts.children.length > 0 ? 1 : 0);

  let college = false;
  let kind: string | null = null;
  const [schoolName, unreadCount, streams] = await Promise.all([
    session.schoolId
      ? db.school
          .findUnique({ where: { id: session.schoolId }, select: { name: true, kind: true } })
          // The product's name is a word in each language (Shalaghar, शालाघर,
          // शाळाघर), so it comes from the dictionary like everything else.
          .then((s) => {
            college = isCollegeKind(s?.kind);
            kind = s?.kind ?? null;
            return s?.name ?? t("brand.name");
          })
      : // No school on the session: a parent's slot describes where they are,
        // but an EXPERT also has no school and is not looking at their
        // children — a walkthrough found the expert sidebar headed "Your
        // children". For everyone school-less who isn't a parent, the app's
        // own name is the only honest title.
        Promise.resolve(role === "PARENT" ? t("shell.yourChildren") : t("brand.name")),
    db.notification.count({ where: { userId: session.user.id, readAt: null } }),
    // A college's streams (5 Oct 2026): a chip beside its name on every page; [] at a school or with none chosen.
    session.schoolId ? streamsOf(session.schoolId) : Promise.resolve([]),
  ]);

  /**
   * The Messages entry wears its unread count. Two rooms feed it: people
   * writing to people (conversations) and the pupil-centred threads. Both
   * reads are bounded, and either failing must not take the shell down —
   * a badge is the least important thing on the page.
   */
  let unreadMessages = 0;
  try {
    const [conversations, threads] = await Promise.all([
      unreadConversationCount(session),
      listThreads(session).then((list) => list.filter((th) => th.unread).length),
    ]);
    unreadMessages = conversations + threads;
  } catch (error) {
    console.error("[shell] unread message count failed", error);
  }

  /**
   * The Feedback entry EXISTS ONLY WHILE THE SCHOOL IS ASKING. The admin
   * opening a round is what puts it in a pupil's or parent's menu; closing
   * the last round takes it away again. A permanent item pointing at a
   * permanent "nothing to answer" would teach people to stop looking, which
   * is the opposite of what a questionnaire needs.
   */
  const hiddenHrefs: string[] = [];
  /**
   * A module's entries exist only while the school has it switched on
   * (3 Oct 2026): an entry carrying `module` is hidden otherwise, for every
   * role. A parent's session names no school, so a family's menu entries
   * follow the children's schools instead (4 Oct 2026).
   */
  if (NAV[role].some((item) => item.module)) {
    const on = role === "PARENT" ? await enabledModulesForFamily(session.user.id) : await enabledModules(session.schoolId);
    for (const item of NAV[role]) if (item.module && !on.includes(item.module)) hiddenHrefs.push(item.href);
  }
  // A platform feature's entries (15 Oct 2026) exist only while this person may use it (platform-features.ts `mayUse`), for every role.
  if (NAV[role].some((item) => item.feature)) {
    const features = await featuresFor(session);
    for (const href of hiddenByFeature(NAV[role], features)) if (!hiddenHrefs.includes(href)) hiddenHrefs.push(href);
  }
  // A duty's entries (5 Oct 2026) exist only for a FACULTY or HOD who holds the duty (lib/duties.ts).
  if (NAV[role].some((item) => item.duty)) {
    const mine = await myDuties(session);
    for (const item of NAV[role]) if (item.duty && !mine.includes(item.duty) && !hiddenHrefs.includes(item.href)) hiddenHrefs.push(item.href);
  }
  // A stream's entries (5 Oct 2026) at a college whose recorded streams include none of the entry's (none recorded: kept).
  if (streams.length > 0) {
    for (const item of NAV[role]) if (item.streams && !item.streams.some((s) => streams.includes(s)) && !hiddenHrefs.includes(item.href)) hiddenHrefs.push(item.href);
  }
  // An institution kind's entries (DS-4, 10 Oct 2026): the school's exams, syllabus, substitutions and admissions go at
  // a college; a guardian's menu follows the children's institutions and keeps an entry while any child is at a school.
  {
    const kinds = role === "PARENT" ? await institutionKindsForFamily(session.user.id) : kind ? [kind] : [];
    for (const href of hiddenByKind(NAV[role], kinds)) if (!hiddenHrefs.includes(href)) hiddenHrefs.push(href);
  }
  if (role === "STUDENT" || role === "PARENT") {
    if (!(await anyOpenReviews(session))) hiddenHrefs.push("/reviews");
  }

  /**
   * VIDURA'S ROUND BUTTON (pass 1, 17 Oct 2026; docs/plans/vidura.md): drawn where this person may use it — the
   * operator's ASSISTANT switch, the school's ASSISTANT module (a guardian's: any child's school), and the plan where
   * the role needs one (platform-features.ts `accessTo`, the question `mayUse` asks) — and drawn as the way to the plan
   * card where only the plan is missing. Never for the expert or the recruiter, who belong to no school.
   */
  let vidura: "open" | "plan" | null = null;
  if (!ASSISTANT_NOT_FOR.includes(role)) {
    const moduleOn = (role === "PARENT" ? await enabledModulesForFamily(session.user.id) : await enabledModules(session.schoolId)).includes("ASSISTANT");
    if (moduleOn) {
      const access = await accessTo(["ASSISTANT"], session);
      vidura = access.state === "open" ? "open" : access.state === "plan" ? "plan" : null;
    }
  }

  /**
   * Enquiries obey the same rule as Feedback: the entry exists only while
   * there is a conversation to show. A parent who never enquired, a teacher
   * who is nobody's contact and an admin whose school has drawn none all see
   * no menu item — the notification that announces the first one is what
   * makes the entry appear.
   */
  if (role === "PARENT" || role === "TEACHER" || role === "ADMIN" || role === "PRINCIPAL") {
    if (!(await anyEnquiries(session))) hiddenHrefs.push("/enquiries");
  }

  /**
   * People waiting for a yes: the entry exists while somebody waits on this
   * reader, and carries how many. A guardian's is the claims on their own
   * children.
   */
  const badges: Record<string, number> = unreadMessages > 0 ? { "/remarks": unreadMessages } : {};
  if (role === "ADMIN" || role === "PRINCIPAL" || role === "TEACHER") {
    const waiting = (await waitingJoinCount(session)) + (await waitingClaimCount(session));
    if (waiting > 0) badges["/joins"] = waiting;
    else hiddenHrefs.push("/joins");
  }
  // Papers somebody else issued that wait for this reader's signature: the count on the entry, which is always there.
  if (role === "ADMIN" || role === "PRINCIPAL" || role === "TEACHER") {
    const toSign = await waitingSignatureCount(session);
    if (toSign > 0) badges[role === "TEACHER" ? "/teacher/signatures" : "/admin/signatures"] = toSign;
  }
  if (role === "PARENT") {
    const waiting = await waitingClaimCount(session);
    if (waiting > 0) badges["/parent/claims"] = waiting;
    else hiddenHrefs.push("/parent/claims");
  }

  return (
    <AppShell
      user={{
        name: session.user.preferredName ?? session.user.name,
        avatarKey: session.user.avatarKey,
        role,
        schoolName,
        streams: streams.map((code) => streamLabel(code, t)),
        college,
        contextCount,
        isSuperuser: session.user.isSuperuser,
      }}
      unreadCount={unreadCount}
      hiddenHrefs={hiddenHrefs}
      badges={badges}
      vidura={vidura}
    >
      {children}
    </AppShell>
  );
}
