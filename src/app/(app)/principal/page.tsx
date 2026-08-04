import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheckIcon, ChalkboardTeacherIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * The principal's landing page.
 *
 * DELIBERATELY THIN FOR NOW. The interactive dashboard — attendance by class,
 * academic progress, report cards — is the next commit. Shipping a nav entry
 * that leads nowhere is worse than shipping a page that admits what it is, so
 * this is the honest placeholder: the two things a principal can already do,
 * and a sentence about what is coming.
 */
export default async function PrincipalHomePage() {
  const ctx = await requireRole("PRINCIPAL", "ADMIN");

  const pending = await db.leaveRequest.count({
    where: { schoolId: ctx.schoolId, status: "PENDING" },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-fg-muted">The school, seen whole.</p>
      </div>

      <Card>
        <Link href="/principal/leave" className="flex items-center gap-3 p-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-strong">
            <CalendarCheckIcon weight="duotone" className="size-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-fg">Staff leave</span>
            <span className="block text-xs text-fg-muted">
              {pending === 0
                ? "Nothing waiting for you"
                : `${pending} request${pending === 1 ? "" : "s"} waiting for you`}
            </span>
          </span>
        </Link>
      </Card>

      <Card>
        <Link href="/principal/classes" className="flex items-center gap-3 p-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-strong">
            <ChalkboardTeacherIcon weight="duotone" className="size-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-fg">Classes</span>
            <span className="block text-xs text-fg-muted">Attendance and progress, class by class</span>
          </span>
        </Link>
      </Card>
    </div>
  );
}
