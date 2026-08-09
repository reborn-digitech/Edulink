import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { requireSuperuser } from "@/lib/tenancy";
import { accessHistory, getSchool } from "@/lib/superuser";
import { listPeople, listPosts, schoolOverview } from "@/lib/operator-oversight";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { OversightPanel } from "./oversight-panel";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("root.insideMeta"), robots: { index: false, follow: false } };
}

/**
 * The inside of one school, for whoever runs the server.
 *
 * ALWAYS OPEN TO THE OPERATOR. The old request-a-grant door is gone; what
 * remains of it is the visitor book. Rendering this page records a visit
 * (through `withSchoolAccess`, at most one row an hour), and the school reads
 * the same list in its own Safety Centre — the operator no longer asks, and is
 * still seen.
 */
export default async function InsideSchoolPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const t = await getT();
  const session = await requireSuperuser();
  const { schoolId } = await params;

  const school = await getSchool(session, schoolId);
  if (!school) notFound();

  const [overview, posts, people, history] = await Promise.all([
    schoolOverview(session, schoolId),
    listPosts(session, schoolId),
    listPeople(session, schoolId),
    accessHistory(schoolId, 20),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href={`/root/${schoolId}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon weight="bold" className="size-4" />
        {school.name}
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {t("root.insideTitle", { school: school.name })}
        </h1>
        <p className="mt-1 text-sm text-fg-muted">{t("root.insideIntro")}</p>
      </div>

      <section aria-labelledby="numbers-heading">
        <Card>
          <CardHeader title={<span id="numbers-heading">{t("root.inNumbers")}</span>} />
          <CardBody>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                [t("root.classes"), overview.classes],
                [t("root.postsWaiting"), overview.pendingPosts],
                [t("root.openReports"), overview.openReports],
                [t("root.people"), overview.members.reduce((sum, m) => sum + m.count, 0)],
              ].map(([label, value]) => (
                <li
                  key={String(label)}
                  className="rounded-[--radius-md] border border-border p-3 text-center"
                >
                  <p className="text-xl font-bold tabular-nums text-fg">{value}</p>
                  <p className="mt-0.5 text-xs text-fg-muted">{label}</p>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </section>

      <OversightPanel schoolId={schoolId} posts={posts} people={people} />

      {/* THE VISITOR BOOK, shown to the operator as well as to the school —
          somebody looking inside should see how often it has been looked at,
          including by them. */}
      <Card>
        <CardHeader
          title={t("root.everyTimeOpened")}
          description={t("root.schoolSeesList")}
        />
        <CardBody>
          {history.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("root.never")}</p>
          ) : (
            <ul className="space-y-2">
              {history.map((row) => (
                <li key={row.id} className="rounded-[--radius-sm] bg-surface-muted p-3">
                  <p className="text-sm font-medium text-fg">
                    {row.operatorName}
                    {row.live && ` · ${t("root.openNow")}`}
                  </p>
                  <p className="mt-0.5 text-xs text-fg-muted">
                    {row.startedAt.toUTCString().slice(0, 22)} — {row.reason}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
