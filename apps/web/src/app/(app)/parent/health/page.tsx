import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, FirstAidKitIcon, PrinterIcon, StethoscopeIcon } from "@phosphor-icons/react/ssr";
import { requireParent, assertGuardianAccess } from "@/lib/tenancy";
import { listContexts } from "@/lib/session";
import { healthCardFor, healthCardReadsFor } from "@/lib/health";
import { HealthCardReadsDisclosure } from "@/components/health-card-reads";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ChildSwitcher } from "../child-switcher";
import { ChildLeftBanner } from "../child-left";
import { PageHeader } from "@/components/ui/page-header";
import { HealthCardEditor, HealthChecksList } from "@/components/health-card";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("health.metaTitle"), robots: { index: false, follow: false } };
}

/**
 * The guardian's side of the health card: the child in the switcher, the
 * card as the school's teachers read it, the form to write it, and the
 * school's check-ups as a list the family reads but never edits. Access is
 * the guardianship: `healthCardFor` refuses a child who is not theirs.
 */
export default async function ParentHealthPage({ searchParams }: { searchParams: Promise<{ child?: string }> }) {
  const session = await requireParent();
  const t = await getT();
  const { child: requested } = await searchParams;

  const { children } = await listContexts(session.user.id);
  const selectedId = requested && children.some((c) => c.studentMembershipId === requested) ? requested : children[0]!.studentMembershipId;

  const link = await assertGuardianAccess(session.user.id, selectedId);
  const student = link.student;
  const childName = student.user.preferredName ?? student.user.name;
  const [view, reads] = await Promise.all([healthCardFor(session, selectedId), healthCardReadsFor(session, selectedId)]);
  const selected = children.find((c) => c.studentMembershipId === selectedId);

  return (
    <div className="space-y-5">
      <Link href="/parent" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg">
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("parent.overview")}
      </Link>

      {children.length > 1 && <ChildSwitcher pupils={children} selectedId={selectedId} basePath="/parent/health" />}
      {selected?.leftAt ? (
        <ChildLeftBanner child={{ studentMembershipId: selected.studentMembershipId, studentUserId: selected.studentUserId, name: selected.name, schoolName: selected.schoolName, leftAt: selected.leftAt }} />
      ) : null}

      <PageHeader title={t("health.forChild", { name: childName })} description={[student.school.name, view.className].filter(Boolean).join(" · ")} />

      <p className="max-w-prose text-sm leading-relaxed text-fg-muted">{t("health.intro")}</p>

      <Card>
        <CardHeader
          icon={<FirstAidKitIcon weight="duotone" className="size-5" />}
          title={t("health.title")}
          action={
            view.card ? (
              <Link href={`/health/cards/${selectedId}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted underline underline-offset-2 hover:text-fg">
                <PrinterIcon weight="bold" className="size-4" aria-hidden="true" />
                {t("health.print")}
              </Link>
            ) : undefined
          }
        />
        <CardBody className="space-y-4">
          <HealthCardEditor view={view} timezone={student.school.timezone} />
          {/* Who at the school has opened the card: the one question a family should be able to ask of a medical page. */}
          <HealthCardReadsDisclosure reads={reads} timezone={student.school.timezone} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={<StethoscopeIcon weight="duotone" className="size-5" />} title={t("health.checks")} description={t("health.checksHint")} />
        <CardBody>
          <HealthChecksList checks={view.checks} />
        </CardBody>
      </Card>
    </div>
  );
}
