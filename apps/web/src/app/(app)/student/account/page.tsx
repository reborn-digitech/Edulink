import type { Metadata } from "next";
import Link from "next/link";
import { DownloadSimpleIcon, LockKeyIcon, ShieldCheckIcon, UsersIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { studentAccount } from "@/lib/college-records";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EVENT_KEY } from "@/components/college-office/parts";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("collegeOffice.accountTitle") };
}

/**
 * THE ADULT STUDENT'S OWN ACCOUNT (4 Oct 2026): what their guardians may see
 * (granted and revoked at /student/consent), two-step sign-in, their own data
 * to take away, and whether each no-dues clearance stands complete.
 */
export default async function StudentAccountPage() {
  const ctx = await requireRole("STUDENT");
  const t = await getT();
  const a = await studentAccount(ctx);
  const granted = a.grants.filter((g) => g.on);
  return (
    <div className="space-y-6">
      <PageHeader title={t("collegeOffice.accountTitle")} description={t("collegeOffice.accountIntro")} />
      <Card>
        <CardHeader icon={<UsersIcon weight="duotone" className="size-5" />} title={t("collegeOffice.guardiansSee")} />
        <CardBody className="space-y-3">
          {!a.consentApplies ? (
            <p className="text-sm text-fg-muted">{t("collegeOffice.consentNotApplies")}</p>
          ) : granted.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("collegeOffice.consentNothing")}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {granted.map((g) => (
                <Badge key={g.grant} tone="ok">
                  {t(`consent.grant.${g.grant}.name`)}
                </Badge>
              ))}
            </div>
          )}
          {a.consentApplies ? (
            <Button asChild size="sm" variant="secondary">
              <Link href="/student/consent">{t("collegeOffice.changeGrants")}</Link>
            </Button>
          ) : null}
        </CardBody>
      </Card>
      <Card>
        <CardHeader icon={<LockKeyIcon weight="duotone" className="size-5" />} title={t("collegeOffice.twoStep")} />
        <CardBody className="flex flex-wrap items-center gap-3">
          <Badge tone={a.twoFactorOn ? "ok" : "warn"}>{a.twoFactorOn ? t("collegeOffice.twoStepOn") : t("collegeOffice.twoStepOff")}</Badge>
          <Button asChild size="sm" variant="secondary">
            <Link href="/account">{t("collegeOffice.manageAccount")}</Link>
          </Button>
        </CardBody>
      </Card>
      <Card>
        <CardHeader icon={<DownloadSimpleIcon weight="duotone" className="size-5" />} title={t("exports.myDataTitle")} description={t("exports.myDataBody")} />
        <CardBody>
          <Button asChild size="sm" variant="secondary">
            <a href={a.exportPath} download>
              {t("exports.download")}
            </a>
          </Button>
        </CardBody>
      </Card>
      {a.noDues.length > 0 ? (
        <Card>
          <CardHeader icon={<ShieldCheckIcon weight="duotone" className="size-5" />} title={t("collegeOffice.navNoDues")} />
          <CardBody className="flex flex-wrap gap-2">
            {a.noDues.map((n) => (
              <Badge key={n.event} tone={n.completed ? "ok" : "warn"}>
                {t(EVENT_KEY(n.event))}: {n.completed ? t("collegeOffice.cleared") : t("collegeOffice.notCleared")}
              </Badge>
            ))}
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
