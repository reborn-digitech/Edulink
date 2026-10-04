import type { Metadata } from "next";
import { BriefcaseIcon } from "@phosphor-icons/react/ssr";
import { requireParent } from "@/lib/tenancy";
import { listContexts } from "@/lib/session";
import { getT } from "@/lib/i18n/server";
import { AccessError } from "@/lib/access-error";
import { familyPlacement } from "@/lib/placement-student";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { Flash, INTERNSHIP_STATUS_KEY, offerLine } from "@/components/placement/parts";
import { guardianConsentAction } from "@/app/(app)/placement/actions";
import { ChildSwitcher } from "../child-switcher";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("placement.parentTitle"), robots: { index: false, follow: false } };
}

/**
 * A child's offers and internships, for the guardian (the placement module,
 * 4 October 2026): always for a minor; for an adult at a college only while
 * the student has granted PLACEMENT, and otherwise the page says so.
 */
export default async function ParentPlacementPage({ searchParams }: { searchParams: Promise<{ child?: string; ok?: string; error?: string }> }) {
  const session = await requireParent();
  const t = await getT();
  const { child, ok, error } = await searchParams;
  const { children } = await listContexts(session.user.id);
  const selected = children.find((c) => c.studentMembershipId === child) ?? children[0];
  const view = selected
    ? await familyPlacement(session, selected.studentMembershipId).catch((e: unknown) => {
        if (e instanceof AccessError) return { refused: t(e.key, e.vars) };
        throw e;
      })
    : null;
  return (
    <div className="space-y-5">
      <PageHeader title={t("placement.parentTitle")} description={t("placement.parentIntro")} />
      {children.length > 1 && selected ? <ChildSwitcher pupils={children} selectedId={selected.studentMembershipId} basePath="/parent/placement" /> : null}
      <Flash ok={ok} error={error} />
      {!view ? null : "refused" in view ? (
        <EmptyState icon={<BriefcaseIcon weight="duotone" className="size-8" />} title={t("placement.parentRefusedTitle")} description={view.refused} />
      ) : (
        <>
          {view.awaitingConsent.length && selected ? (
            <Card>
              <CardHeader title={t("placement.awaitingConsentTitle")} />
              <CardBody className="space-y-3 text-sm">
                {view.awaitingConsent.map((w) => (
                  <form key={w.applicationId} action={guardianConsentAction} className="flex flex-wrap items-center justify-between gap-2">
                    <input type="hidden" name="back" value={`/parent/placement?child=${selected.studentMembershipId}`} />
                    <input type="hidden" name="childId" value={selected.studentMembershipId} />
                    <input type="hidden" name="applicationId" value={w.applicationId} />
                    <span>{t("placement.awaitingConsentLine", { drive: w.driveTitle, company: w.companyName })}</span>
                    <Button type="submit" size="sm">{t("placement.giveConsent")}</Button>
                  </form>
                ))}
              </CardBody>
            </Card>
          ) : null}
          <Card>
            <CardHeader title={t("placement.offersOf", { name: view.name })} />
            <CardBody className="space-y-2 text-sm">
              {view.offers.length === 0 ? <p className="text-fg-muted">{t("placement.noOffers")}</p> : null}
              {view.offers.map((o) => <div key={o.id}>{o.driveTitle} · {offerLine(o, t)}</div>)}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title={t("placement.internshipsOf", { name: view.name })} />
            <CardBody className="space-y-2 text-sm">
              {view.internships.length === 0 ? <p className="text-fg-muted">{t("placement.noInternships")}</p> : null}
              {view.internships.map((i) => (
                <div key={i.id} className="flex flex-wrap justify-between gap-2">
                  <span>{i.companyName} · {i.from} – {i.to}</span>
                  <Badge>{t(INTERNSHIP_STATUS_KEY[i.status]!)}</Badge>
                </div>
              ))}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
