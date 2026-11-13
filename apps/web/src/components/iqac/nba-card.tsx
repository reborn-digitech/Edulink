import Link from "next/link";
import { MedalIcon } from "@phosphor-icons/react/ssr";
import type { Translate } from "@/lib/i18n/dictionary";
import type { ActiveContext } from "@/lib/session";
import { isModuleOn } from "@/lib/modules";
import { db } from "@/lib/db";
import { filingsOf, nbaDepartments } from "@/lib/council-filings";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * The HOD's way to their department's NBA report (5 Oct 2026): drawn only at
 * a college whose streams bring the SAR, with the IQAC on, for the head of an
 * engineering department; nothing otherwise.
 */
export async function NbaCard({ ctx, t }: { ctx: ActiveContext; t: Translate }) {
  if (ctx.role !== "HOD" || !ctx.schoolId || !(await isModuleOn(ctx.schoolId, "IQAC")) || !(await filingsOf(ctx.schoolId)).includes("NBA_SAR")) return null;
  // Any department the HOD heads (TA-480: one person may head two).
  const own = await db.department.findMany({ where: { schoolId: ctx.schoolId, hodMembershipId: ctx.membershipId }, select: { id: true } });
  if (!(await nbaDepartments(ctx.schoolId)).some((d) => own.some((o) => o.id === d.id))) return null;
  return (
    <Card data-testid="nba-card">
      <CardHeader icon={<MedalIcon weight="duotone" className="size-5" />} title={t("councilFilings.hodCardTitle")} description={t("councilFilings.hodCardBody")} />
      <CardBody>
        <Button asChild size="sm">
          <Link href="/hod/nba">{t("councilFilings.hodCardButton")}</Link>
        </Button>
      </CardBody>
    </Card>
  );
}
