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
import { ROLE_META, type Role } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Accept your invitation",
  robots: { index: false, follow: false },
};

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
      }))
    : null;

  // One message for every failure mode. Distinguishing "no such invite" from
  // "already used" would let someone probe for valid tokens.
  const usable =
    invite && invite.status === "PENDING" && invite.expiresAt.getTime() > Date.now();

  if (!usable) {
    return (
      <Shell>
        <EmptyState
          title="This invitation is no longer valid"
          description="It may have been used already, withdrawn, or simply expired. Ask whoever invited you to send a fresh link — it only takes them a moment."
          action={
            <Button asChild variant="secondary">
              <Link href="/login">Go to log in</Link>
            </Button>
          }
        />
      </Shell>
    );
  }

  const role = invite.role as Role;
  const inviter = context?.createdBy?.user.preferredName ?? context?.createdBy?.user.name ?? null;

  return (
    <Shell brand={context?.school.brandPrimary ?? null}>
      <div data-role={role.toLowerCase()}>
        <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent-strong">
          {t(ROLE_META[role].labelKey)} invitation
        </span>

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          Join {context?.school.name}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">
          {inviter ? (
            <>
              <strong className="text-fg">{inviter}</strong> invited you
              {invite.email ? (
                <>
                  {" "}
                  at <strong className="text-fg">{invite.email}</strong>
                </>
              ) : null}
              . Set a password and you are in.
            </>
          ) : (
            <>Set a password and you are in.</>
          )}
        </p>

        <AcceptForm
          className="mt-7"
          token={token}
          defaultName={invite.name ?? ""}
          defaultSubjects={readJsonArray<string>(invite.subjects)}
          role={role}
        />
      </div>
    </Shell>
  );
}

function Shell({ children, brand }: { children: React.ReactNode; brand?: string | null }) {
  return (
    <div
      className="min-h-safe bg-bg"
      // A school's own colour on the very first screen a teacher sees.
      style={brand ? ({ "--accent": brand } as React.CSSProperties) : undefined}
    >
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-lg items-center px-4">
          <Link href="/" aria-label="EduLink home">
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
