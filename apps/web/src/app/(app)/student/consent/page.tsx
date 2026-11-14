import type { Metadata } from "next";
import { HandshakeIcon, UserCirclePlusIcon, UsersIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { myStudentConsent } from "@/lib/student-consent";
import { waitingClaimsForStudent } from "@/lib/guardian-claims";
import { formatDate } from "@/lib/dates";
import { getRelativeTime, getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClaimAnswer, EndLink, GrantSwitch } from "./grant-switch";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("consent.title") };
}

const RELATION_KEY = { PARENT: "parent.relationParent", GUARDIAN: "parent.relationGuardian", OTHER: "parent.relationOther" } as const;

/**
 * What an adult student lets their guardians see (4 Oct 2026, student-consent.ts): six grants, each on or off, the
 * student's to change whenever they like. A minor, or a pupil at a school, is told their guardians see everything
 * and offered no switch.
 *
 * GUARDIAN BY GUARDIAN (TA-555, the owner's decision of 14 November 2026): a grant is one guardian's, so each
 * guardian has a card of their own with the six switches and a button that ends their link, and a guardian linked
 * later starts with every switch off. Somebody asking to be the student's guardian waits here for the student's own
 * yes: nobody else can give it.
 */
export default async function ConsentPage() {
  const ctx = await requireRole("STUDENT");
  const t = await getT();
  const relativeTime = await getRelativeTime();
  const [view, claims] = await Promise.all([myStudentConsent(ctx), waitingClaimsForStudent(ctx)]);
  const names = view.guardians.map((g) => g.name).join(", ");
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title={t("consent.title")} description={view.applies ? t("consent.intro") : t("consent.notApplies")} />

      {claims.length > 0 && (
        <Card data-testid="consent-claims">
          <CardHeader icon={<UserCirclePlusIcon weight="duotone" className="size-5" />} title={t("consent.claimsTitle")} description={t("consent.claimsIntro")} />
          <CardBody>
            <ul className="space-y-3">
              {claims.map((claim) => (
                <li key={claim.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border p-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-fg">{claim.claimantName}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-muted">
                      <Badge tone="neutral" size="sm">
                        {t(RELATION_KEY[claim.relation])}
                      </Badge>
                      <span>{relativeTime(claim.createdAt)}</span>
                    </p>
                  </div>
                  <ClaimAnswer claimId={claim.id} claimantName={claim.claimantName} />
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      {view.guardians.length === 0 ? (
        <p className="text-sm text-fg-muted">{t("consent.noGuardians")}</p>
      ) : view.applies ? (
        <>
          <p className="text-sm text-fg-muted">{t("consent.perGuardianHint")}</p>
          {view.guardians.map((guardian) => (
            <Card key={guardian.guardianshipId} data-testid="consent-guardian">
              <CardHeader
                icon={<UsersIcon weight="duotone" className="size-5" />}
                title={guardian.name}
                description={[t(RELATION_KEY[guardian.relation]), t("people.familyLinkSince", { date: formatDate(guardian.since) })].join(" · ")}
              />
              <CardBody>
                <ul className="divide-y divide-border">
                  {guardian.grants.map(({ grant, on }) => (
                    <li key={grant} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-fg">{t(`consent.grant.${grant}.name`)}</p>
                        <p className="text-sm text-fg-muted">{t(`consent.grant.${grant}.what`)}</p>
                      </div>
                      <Badge tone={on ? "ok" : "neutral"}>{on ? t("consent.on") : t("consent.off")}</Badge>
                      <GrantSwitch grant={grant} on={on} guardianshipId={guardian.guardianshipId} guardianName={guardian.name} />
                    </li>
                  ))}
                </ul>
              </CardBody>
              <CardFooter>
                <EndLink guardianshipId={guardian.guardianshipId} guardianName={guardian.name} />
              </CardFooter>
            </Card>
          ))}
        </>
      ) : (
        <>
          <p className="text-sm text-fg-muted">{t("consent.guardiansLine", { names })}</p>
          <ul className="space-y-3">
            {view.grants.map(({ grant, on }) => (
              <li key={grant}>
                <Card>
                  <CardHeader icon={<HandshakeIcon weight="duotone" className="size-5" />} title={t(`consent.grant.${grant}.name`)} description={t(`consent.grant.${grant}.what`)} />
                  <CardBody className="flex flex-wrap items-center justify-between gap-3">
                    <Badge tone={on ? "ok" : "neutral"}>{on ? t("consent.on") : t("consent.off")}</Badge>
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
