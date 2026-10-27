import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { requireParent } from "@/lib/tenancy";
import { familyChildren, pickChild, childAccess } from "@/lib/family-child";
import { NotSharedState } from "@/components/family/not-shared";
import { familyTransport } from "@/lib/transport";
import { db } from "@/lib/db";
import { formatInZone } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { FamilyTransportCards } from "@/components/transport/family-view";
import { FamilyTransportLive } from "@/components/transport/family-live";
import { ChildSwitcher } from "../child-switcher";
import { NearAlertsSwitch } from "./live";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("transport.parentTitle"), robots: { index: false, follow: false } };
}

/**
 * A child's bus for the family (3 Oct 2026): the route, the stop and its
 * times, the bus's number; while a trip runs, the bus on the map, how long
 * ago it was last heard from when the feed is stale, the stops it has passed
 * and when it is expected at theirs, as a range; and the guardian's own
 * "tell me when the bus is near" for this child. The BUS — never the child:
 * the page has no location of the child's to show. The guardianship decides
 * which child (familyTransport refuses one not theirs).
 */
export default async function ParentTransportPage({ searchParams }: { searchParams: Promise<{ child?: string }> }) {
  const session = await requireParent();
  const t = await getT();
  const locale = await getLocale();
  const { child: requested } = await searchParams;
  // The children with what each lets the guardian see, opening on one the guardian may read (DS-1, 10 Oct 2026).
  const children = await familyChildren(session.user.id);
  const chosen = pickChild(children, requested) ?? children[0]!;
  const selectedId = chosen.studentMembershipId;
  // The bus is shared under HOSTEL_TRANSPORT (transport.ts asks the same): a refusal is a state here, not a 404.
  const access = await childAccess(session.user.id, selectedId, "HOSTEL_TRANSPORT");
  if (access.refused) {
    return (
      <div className="space-y-5">
        <Link href="/parent" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg">
          <ArrowLeftIcon weight="bold" className="size-4" />
          {t("parent.overview")}
        </Link>
        {children.length > 1 && <ChildSwitcher pupils={children} selectedId={selectedId} basePath="/parent/transport" />}
        <PageHeader title={t("transport.forChild", { name: chosen.name })} description={chosen.schoolName} />
        <NotSharedState name={chosen.name} />
      </div>
    );
  }
  const view = await familyTransport(session, selectedId);
  const school = await db.membership.findUniqueOrThrow({ where: { id: selectedId }, select: { school: { select: { timezone: true } } } });
  const time = (iso: string | null) => (iso ? formatInZone(new Date(iso), school.school.timezone, { hour: "2-digit", minute: "2-digit" }, locale) : "");

  return (
    <div className="space-y-5">
      <FamilyTransportLive />
      <Link href="/parent" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg">
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("parent.overview")}
      </Link>
      {children.length > 1 && <ChildSwitcher pupils={children} selectedId={selectedId} basePath="/parent/transport" />}
      <PageHeader title={t("transport.forChild", { name: view.childName })} description={view.schoolName} />
      {/* The cards are shared with the pupil's own page (owner-batch-item5); the near-stop switch is the guardian's alone. */}
      <FamilyTransportCards
        view={view}
        t={t}
        time={time}
        noSeatTitle={t("transport.noSeat", { name: view.childName })}
        noTripBody={t("transport.noTripTodayBody", { name: view.childName })}
        seatExtra={session.role === "PARENT" ? <NearAlertsSwitch childId={view.studentMembershipId} childName={view.childName} on={view.nearAlerts} /> : null}
      />
    </div>
  );
}
