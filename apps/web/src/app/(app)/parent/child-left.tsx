import Link from "next/link";
import { CertificateIcon, GraduationCapIcon, PrinterIcon } from "@phosphor-icons/react/ssr";
import { db } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/dates";
import { getT } from "@/lib/i18n/server";

/**
 * What a parent sees when their child has left the school.
 *
 * THE CHILD MUST NOT SIMPLY VANISH. The guardianship survives a departure on
 * purpose — it is what keeps the record reachable — so before this existed
 * the parent pages carried on as if nothing had happened: today's status,
 * the streak, the homework list, all rendering yesterday's world, while the
 * marks card silently disappeared. The pupil's own /record page said it
 * plainly; the parent needed the same door. The PANEL replaces the
 * day-to-day dashboard on the overview; the BANNER sits on every other
 * child page, which below it now honestly shows history, not "today".
 */

export type LeftChild = {
  studentMembershipId: string;
  studentUserId: string;
  name: string;
  schoolName: string;
  leftAt: Date;
};

async function certificateIdFor(studentMembershipId: string): Promise<string | null> {
  const record = await db.schoolRecord.findUnique({ where: { studentMembershipId }, select: { id: true } });
  return record?.id ?? null;
}

export async function ChildLeftPanel({ child }: { child: LeftChild }) {
  const t = await getT();
  const certificateId = await certificateIdFor(child.studentMembershipId);
  return (
    <Card data-testid="child-left-panel">
      <CardBody className="space-y-4 py-6 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-accent-soft text-accent-strong">
          <GraduationCapIcon weight="duotone" className="size-8" />
        </div>
        <div>
          {/* The page's one heading (QA-58): the panel stands in for the whole overview. */}
          <h1 className="text-lg font-bold text-fg">
            {t("parent.childLeftTitle", { name: child.name, school: child.schoolName, date: formatDate(child.leftAt) })}
          </h1>
          <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-fg-muted">{t("parent.childLeftBody", { name: child.name })}</p>
        </div>
        <div className="flex flex-col justify-center gap-2 sm:flex-row">
          <Button asChild icon={<CertificateIcon weight="bold" />}>
            <Link href={`/record/${child.studentUserId}`}>{t("parent.childLeftRecord", { name: child.name })}</Link>
          </Button>
          {certificateId && (
            <Button asChild variant="secondary" icon={<PrinterIcon weight="bold" />}>
              <Link href={`/certificate/${certificateId}`}>{t("tc.openDocument")}</Link>
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

export async function ChildLeftBanner({ child }: { child: LeftChild }) {
  const t = await getT();
  return (
    <p
      data-testid="child-left-banner"
      className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-[var(--radius-md)] border border-warn/40 bg-warn-soft px-4 py-3 text-sm text-fg"
    >
      <GraduationCapIcon weight="fill" className="size-4 shrink-0 text-warn" aria-hidden="true" />
      <span>{t("parent.childLeftBanner", { name: child.name, date: formatDate(child.leftAt) })}</span>
      <Link href={`/record/${child.studentUserId}`} className="font-semibold text-accent-strong hover:underline">
        {t("parent.childLeftBannerLink")}
      </Link>
    </p>
  );
}
