import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRightIcon } from "@phosphor-icons/react/ssr";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/tenancy";
import { myChildren, myRecord } from "@/lib/student-record";
import { RecordView } from "./record-view";

export const metadata: Metadata = { title: "Your record", robots: { index: false, follow: false } };

/**
 * Somebody's own record, and the way in to their children's.
 *
 * BOTH ON ONE PAGE, because one person is often both: a parent who was
 * themselves a pupil on this platform, or — much more commonly — a sixteen-year
 * old with a younger sibling they are linked to. Two pages would mean choosing
 * which of those a person "is", and the answer is both.
 */
export default async function RecordPage() {
  /**
   * ⚠ `requireUser()`, NOT `(await getSession())!`, AND THE DIFFERENCE IS NOT
   * STYLE. The `!` said "the layout already redirected, so there is a session
   * here" — which is a true statement about the RESPONSE and a false one about
   * this function. A layout and its page render in PARALLEL: the layout's
   * redirect wins the response, so a signed-out visit correctly returned 307
   * and the sweep was right to assert one, but this body had already run and
   * thrown a TypeError on `session.user` inside `myRecord`. Nine requests, nine
   * logged errors, invisible from outside.
   *
   * A gate that is somewhere else is not a gate this function has. `requireUser`
   * redirects the same way and costs the same lookup.
   *
   * THE ASSERTION IS FINE WHERE THE GATE IS AWAITED IN THE SAME FUNCTION —
   * `student/work`, `admin/safety` and `/account` all call `requireRole` or
   * `requireUser` on the line above, so the redirect throws before the `!` is
   * reached. Checked, and left alone. It is the gate living in a LAYOUT that
   * makes it a lie.
   */
  const session = await requireUser();

  const [record, children] = await Promise.all([myRecord(session), myChildren(session)]);

  // Nothing to show and nobody to show it for. Not a dead end: they are told
  // what would put something here, and given the door they actually need.
  if (!record && children.length === 0) {
    return (
      <EmptyState
        title="No record yet"
        description="A record appears once a school on EduLink has marked a register, issued a report card, or recorded that you have left. If you are joining a school, log in when they invite you and it will build itself."
        action={
          <Button asChild variant="secondary">
            <Link href="/join">Join a school with a code</Link>
          </Button>
        }
      />
    );
  }

  // A guardian who has never been a pupil themselves goes straight to the one
  // child they have, rather than to a list of one.
  if (!record && children.length === 1) {
    redirect(`/record/${children[0]!.studentUserId}`);
  }

  return (
    <div className="space-y-6">
      {record && <RecordView record={record} self />}

      {children.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-fg">
              {record ? "Your children" : "Your children's records"}
            </h2>
            <p className="mt-1 text-sm text-fg-muted">
              Everything each school has written, across every school you are linked to.
            </p>
          </div>
          <ul className="space-y-3">
            {children.map((child) => (
              <li key={child.studentUserId}>
                <Card interactive>
                  <Link
                    href={`/record/${child.studentUserId}`}
                    className="flex items-center gap-4 p-4"
                  >
                    <Avatar avatarKey={child.avatarKey} name={child.name} size="md" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-fg">
                        {child.preferredName ?? child.name}
                      </span>
                      <span className="block text-sm text-fg-muted">
                        {child.schoolCount} school{child.schoolCount === 1 ? "" : "s"}
                      </span>
                    </span>
                    <ArrowRightIcon
                      weight="bold"
                      className="size-5 shrink-0 text-fg-subtle"
                      aria-hidden="true"
                    />
                  </Link>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
