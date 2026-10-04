import Link from "next/link";
import { GlobeIcon, HourglassMediumIcon, MegaphoneIcon, UserCircleIcon } from "@phosphor-icons/react/ssr";
import { MODULE_OF_ROLE } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { institutionNoun, isCollegeKind } from "@/lib/institution";
import { ROLE_META, type CollegeRole } from "@/lib/constants";
import { getT } from "@/lib/i18n/server";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { ModuleOff } from "@/components/module-off";

/**
 * The home of a college staff role (4 October 2026): /faculty, /hod,
 * /exam-cell, /iqac, /placement and /accounts. Says whether the college has
 * the role's module on (FACULTY and HOD hang on ACADEMICS, the exam
 * controller on EXAMS, IQAC on IQAC, the placement officer on PLACEMENT;
 * ACCOUNTS on none) and, while it is on, that the role's screens are coming,
 * with the college's feed and the account beside. Each module's builder
 * replaces the "coming" half with the role's real day and keeps the "off"
 * half; the words say "college" by the tenant's kind (institutionNoun).
 */
export async function CollegeRoleHome({ role }: { role: CollegeRole }) {
  const ctx = await requireRole(role);
  const t = await getT();
  const own = MODULE_OF_ROLE[role];
  const [kind, on, school] = await Promise.all([
    institutionKindOf(ctx.schoolId),
    own ? isModuleOn(ctx.schoolId, own) : Promise.resolve(true),
    db.school.findUnique({ where: { id: ctx.schoolId }, select: { name: true } }),
  ]);
  const roleName = t(ROLE_META[role].labelKey);
  const noun = institutionNoun(kind, t);
  return (
    <div className="space-y-6">
      <PageHeader title={roleName} description={t("college.homeIntro", { role: roleName, place: school?.name ?? noun })} />
      {own && !on ? (
        <ModuleOff module={own} t={t} college={isCollegeKind(kind)} />
      ) : (
        <EmptyState
          icon={<HourglassMediumIcon weight="duotone" className="size-8" />}
          title={t("college.homeComingTitle", { role: roleName })}
          description={t("college.homeComingBody", { role: roleName, noun })}
        />
      )}
      <Card>
        <CardBody className="flex flex-wrap gap-3">
          <Button asChild variant="primary">
            <Link href="/bulletin">
              <MegaphoneIcon weight="duotone" className="size-5" aria-hidden />
              {t("college.homeFeed", { noun })}
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/bulletin/global">
              <GlobeIcon weight="duotone" className="size-5" aria-hidden />
              {t("bulletin.globalFeed")}
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/account">
              <UserCircleIcon weight="duotone" className="size-5" aria-hidden />
              {t("nav.account")}
            </Link>
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
