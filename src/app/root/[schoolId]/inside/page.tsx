import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { requireSuperuser } from "@/lib/tenancy";
import {
  accessHistory,
  activeGrant,
  getSchool,
  OPERATOR_ACCESS_MINUTES,
} from "@/lib/superuser";
import { listPosts, schoolOverview } from "@/lib/operator-oversight";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { OpenForm } from "./open-form";
import { OversightPanel } from "./oversight-panel";

export const metadata = { title: "Inside a school", robots: { index: false, follow: false } };

/**
 * The inside of one school, for whoever runs the server.
 *
 * THE PAGE IS TWO PAGES. Closed, it shows the door and the visitor book —
 * nothing of the school's, because there is no grant and every read would be
 * refused anyway. Open, it shows the school. Keeping them on one route means
 * the history of who looked is in front of somebody at the moment they are
 * deciding to look again.
 */
export default async function InsideSchoolPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const session = await requireSuperuser();
  const { schoolId } = await params;

  const school = await getSchool(session, schoolId);
  if (!school) notFound();

  const grant = await activeGrant(session, schoolId);
  const history = await accessHistory(schoolId, 20);

  // Only fetched when there is a grant. Asking without one throws by design, and
  // a page that catches its own AccessError to render an empty state would be
  // hiding the boundary rather than respecting it.
  const [overview, posts] = grant
    ? await Promise.all([schoolOverview(session, schoolId), listPosts(session, schoolId)])
    : [null, []];

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
          Inside {school.name}
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          Running the server is not by itself a way in. Open the school, say why, and the school
          sees that you did.
        </p>
      </div>

      {grant ? (
        <>
          {overview && (
            <section aria-labelledby="numbers-heading">
              <Card>
                <CardHeader title={<span id="numbers-heading">The school, in numbers</span>} />
                <CardBody>
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      ["Classes", overview.classes],
                      ["Posts waiting", overview.pendingPosts],
                      ["Open reports", overview.openReports],
                      [
                        "People",
                        overview.members.reduce((sum, m) => sum + m.count, 0),
                      ],
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
          )}
          <OversightPanel
            schoolId={schoolId}
            posts={posts}
            expiresAt={grant.expiresAt.toUTCString().slice(17, 22)}
          />
        </>
      ) : (
        <section aria-labelledby="closed-heading">
          <Card>
            <CardHeader
              title={<span id="closed-heading">This school is closed to you</span>}
              description="Which is the default, and stays the default."
            />
            <CardBody>
              <OpenForm schoolId={schoolId} minutes={OPERATOR_ACCESS_MINUTES} />
            </CardBody>
          </Card>
        </section>
      )}

      {/* THE VISITOR BOOK, shown to the operator as well as to the school —
          somebody about to open a school should see how often it has been
          opened, including by them. */}
      <Card>
        <CardHeader
          title="Every time this school has been opened"
          description="The school sees this list too."
        />
        <CardBody>
          {history.length === 0 ? (
            <p className="text-sm text-fg-muted">Never.</p>
          ) : (
            <ul className="space-y-2">
              {history.map((row) => (
                <li key={row.id} className="rounded-[--radius-sm] bg-surface-muted p-3">
                  <p className="text-sm font-medium text-fg">
                    {row.operatorName}
                    {row.live && " · open now"}
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
