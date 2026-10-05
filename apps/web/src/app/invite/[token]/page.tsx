import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { forJoinCode, forSchool } from "@/lib/tenant-context";
import { hashToken } from "@/lib/crypto";
import { readJsonArray } from "@/lib/json";
import { Wordmark } from "@/components/brand";
import { AcceptForm } from "./form";
import { EmptyState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/session";
import { isFuture } from "@/lib/dates";
import { ROLE_META, type Role } from "@/lib/constants";
import type { Translate } from "@/lib/i18n/dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
  title: t("meta.acceptInvite"),
  robots: { index: false, follow: false },
};
}

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const t = await getT();
  const { token } = await params;

  // The token opens its own invitation and nothing else — not the school it
  // belongs to, and not the member of staff who sent it, neither of which the
  // token names. Both are read in a second pass, scoped to the school the
  // invitation identifies.
  const invite = await forJoinCode(hashToken(token), () =>
    db.invite.findUnique({ where: { tokenHash: hashToken(token) } }),
  );

  const context = invite
    ? await forSchool(invite.schoolId, async () => ({
        school: await db.school.findUniqueOrThrow({
          where: { id: invite.schoolId },
          select: { name: true, logoPath: true, brandPrimary: true },
        }),
        createdBy: invite.createdByMembershipId
          ? await db.membership.findUnique({
              where: { id: invite.createdByMembershipId },
              include: { user: { select: { name: true, preferredName: true } } },
            })
          : null,
        // A parent invitation names the child; the page says who.
        child: invite.studentMembershipId
          ? await db.membership.findUnique({
              where: { id: invite.studentMembershipId },
              select: { user: { select: { name: true, preferredName: true } } },
            })
          : null,
      }))
    : null;

  // One message for every failure mode. Distinguishing "no such invite" from
  // "already used" would let someone probe for valid tokens.
  const usable =
    invite && invite.status === "PENDING" && isFuture(invite.expiresAt);

  if (!usable) {
    return (
      <Shell t={t}>
        <EmptyState
          heading="h1"
          title={t("invite.invalidTitle")}
          description={t("invite.invalidBody")}
          action={
            <Button asChild variant="secondary">
              <Link href="/login">{t("invite.goToLogIn")}</Link>
            </Button>
          }
        />
      </Shell>
    );
  }

  const role = invite.role as Role;
  const inviter = context?.createdBy?.user.preferredName ?? context?.createdBy?.user.name ?? null;

  /**
   * Whether this address already has an account — which turns this page from a
   * sign-up into a TRANSFER, and is the difference between the two sentences
   * below.
   *
   * `acceptInvite` has always attached the new school to an existing account
   * rather than minting a second one. That is what makes an invitation the way
   * a pupil changes school without stranding their leaving certificate on a
   * login nobody uses. The page simply never said so, and asked them to choose
   * a password that was then kept out of the database.
   *
   * Not an enumeration oracle: the token was emailed to this address, so anyone
   * reading this page already controls the mailbox.
   */
  const holder = invite.email
    ? await db.user.findUnique({
        where: { email: invite.email.toLowerCase() },
        select: { id: true, name: true, preferredName: true, passwordHash: true, emailVerifiedAt: true },
      })
    : null;
  // An account counts as somebody's only once its address was proved; an
  // unverified holder is reclaimed by the invitation (actions.ts) and sets a
  // fresh password like a newcomer.
  const hasAccount = Boolean(holder?.passwordHash && holder?.emailVerifiedAt);

  // Whoever is already signed in on this browser, if anybody. A server fact,
  // read here rather than guessed in the client, because the banner below is
  // about a session.
  const current = await getSession();
  // The warning is for SOMEBODY ELSE's session on this browser — a staffroom
  // machine still signed in as a colleague. The invitee already signed in as
  // themselves is not being signed out of anything worth a warning.
  const someoneElse =
    current !== null &&
    (current.user.email ?? "").toLowerCase() !== (invite?.email ?? "").toLowerCase();
  const signedInAs = someoneElse ? (current.user.preferredName ?? current.user.name) : null;
  // A verified holder who is not signed in as themselves proves it with their
  // password before the membership attaches; signed in as themselves, the
  // session is the proof.
  const needsPassword = hasAccount && !(current !== null && holder !== null && current.user.id === holder.id);

  return (
    <Shell t={t} brand={context?.school.brandPrimary ?? null}>
      <div data-role={role.toLowerCase()}>
        <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent-strong">
          {t("invite.roleInvitation", { role: t(ROLE_META[role].labelKey) })}
        </span>

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {role === "PARENT"
            ? t("invite.seeChildsDay", {
                child: context?.child?.user.preferredName ?? context?.child?.user.name ?? "",
                school: context?.school.name ?? "",
              })
            : hasAccount
              ? t("invite.addSchoolToAccount", { school: context?.school.name ?? "" })
              : t("invite.joinSchool", { school: context?.school.name ?? "" })}
        </h1>
        {/*
          THE ADDRESS IS SHOWN WHETHER OR NOT THERE IS A SENDER, and that split
          is the whole reason this was wrong. `inviter` comes from
          `createdByMembershipId`, and `superuser.ts` writes NULL there on
          purpose — an operator holds no membership in the school they are
          setting up. So the branch below used to fall through to a bare "Set a
          password and you are in" for exactly one invitation: the FIRST one a
          school ever receives, sent by somebody the recipient has very likely
          never met, and the only one where they cannot check the link was meant
          for them. The most important invitation in the system was the least
          informative. Found by walking the onboarding in a browser.
        */}
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">
          {role === "PARENT"
            ? t("invite.parentLinkBody", {
                name: inviter ?? context?.school.name ?? "",
                child: context?.child?.user.preferredName ?? context?.child?.user.name ?? "",
              })
            : inviter
            ? invite.email
              ? t("invite.invitedByAt", { name: inviter, email: invite.email })
              : t("invite.invitedBy", { name: inviter })
            : role === "ADMIN"
              // The operator's invitation, which is how a school starts: there
              // is genuinely nobody at the school to name yet.
              ? invite.email
                ? t("invite.invitedToHelpRunAt", { email: invite.email })
                : t("invite.invitedToHelpRun")
              // …and every other senderless invitation. "Help run this school"
              // was being said to pupils, because the branch above was written
              // for the one case that has no inviter and then met the others.
              : invite.email
                ? t("invite.invitedToJoinAt", { email: invite.email })
                : t("invite.invitedToJoin")}
        </p>

        {/* ⚠ ITS OWN SENTENCE, in its own paragraph. This was a clause glued to
            the end of the one above, which fixed English word order into the
            markup. The id stays exactly where it was — the sweep reads it. */}
        <p
          id={hasAccount ? "password-unchanged" : undefined}
          className="mt-2 text-sm leading-relaxed text-fg-muted"
        >
          {role === "PARENT"
            ? hasAccount
              ? t("invite.parentHasAccountNote")
              : t("invite.parentSignupNote")
            : hasAccount
              ? t("invite.transferNote")
              : t("invite.signupNote")}
        </p>

        {/*
          THE SENTENCE A TRANSFERRING FAMILY NEEDS, said before the button.
          The whole reason a leaving certificate is worth writing is that the
          next school can read it, and the only thing that makes that true is
          arriving on the SAME account — which an invitation does, and which
          the class code now also does for somebody already signed in.
        */}
        {hasAccount && role === "STUDENT" && (
          <p className="mt-3 rounded-[var(--radius-md)] border border-ok/30 bg-ok-soft px-3.5 py-2.5 text-xs leading-relaxed text-fg">
            {t("invite.changedSchool", { school: context?.school.name ?? "" })}
          </p>
        )}

        {/*
          Said out loud rather than left to be discovered. Accepting signs this
          browser in AS the invited person, so on a shared staffroom machine the
          previous session simply ends — which is correct, and is not something
          anybody should meet by surprise.
        */}
        {signedInAs && (
          <p className="mt-3 rounded-[var(--radius-md)] border border-warn/30 bg-warn-soft px-3.5 py-2.5 text-xs leading-relaxed text-fg">
            {t("invite.signedInAs", {
              name: signedInAs,
              invited: invite.email ?? t("invite.thePersonItWasSentTo"),
            })}
          </p>
        )}

        <AcceptForm
          className="mt-7"
          token={token}
          defaultName={holder?.name ?? invite.name ?? ""}
          defaultSubjects={readJsonArray<string>(invite.subjects)}
          role={role}
          hasAccount={hasAccount}
          needsPassword={needsPassword}
        />
      </div>
    </Shell>
  );
}

function Shell({
  t,
  children,
  brand,
}: {
  t: Translate;
  children: React.ReactNode;
  brand?: string | null;
}) {
  return (
    <div
      className="min-h-safe bg-bg"
      // A school's own colour on the very first screen a teacher sees.
      style={brand ? ({ "--accent": brand } as React.CSSProperties) : undefined}
    >
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-lg items-center px-4">
          <Link href="/" aria-label={t("common.homeLink")}>
            <Wordmark size={26} />
          </Link>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-lg px-4 py-10 sm:py-14">
        {children}
      </main>
    </div>
  );
}
