import Link from "next/link";
import { ChatCircleDotsIcon, MegaphoneIcon, FileTextIcon } from "@phosphor-icons/react/ssr";
import { MODULE_OF_ROLE } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { isModuleOn } from "@/lib/modules";
import { MODULE_META } from "@/lib/module-meta";
import { getT } from "@/lib/i18n/server";
import { db } from "@/lib/db";
import type { ModuleRole } from "@/lib/constants";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ModuleComing, ModuleOff } from "@/components/module-off";

/**
 * The home of a module role (3 Oct 2026): /driver, /library, /hostel, /alumni.
 * Says whether the school has the module on; while it is on and its screens
 * are not built yet, says they are coming. The module's builder replaces the
 * "coming" half with the role's real day and keeps the "off" half.
 *
 * An alumnus's home already has what the role is for: the school's feed to
 * read, its staff to write to, and the record of their time there.
 */
export async function ModuleRoleHome({ role }: { role: ModuleRole }) {
  const ctx = await requireRole(role);
  const t = await getT();
  const mod = MODULE_OF_ROLE[role];
  const name = t(MODULE_META[mod].nameKey);
  const on = await isModuleOn(ctx.schoolId, mod);
  if (!on) {
    return (
      <div className="space-y-6">
        <PageHeader title={name} />
        <ModuleOff module={mod} t={t} />
      </div>
    );
  }
  if (role !== "ALUMNUS") {
    return (
      <div className="space-y-6">
        <PageHeader title={name} description={t(MODULE_META[mod].whatKey)} />
        <ModuleComing module={mod} t={t} />
      </div>
    );
  }
  const school = await db.school.findUnique({ where: { id: ctx.schoolId }, select: { name: true } });
  return (
    <div className="space-y-6">
      <PageHeader title={name} description={t("modules.alumniWelcome", { school: school?.name ?? "" })} />
      <Card>
        <CardBody className="flex flex-wrap gap-3">
          <Button asChild variant="primary">
            <Link href="/bulletin">
              <MegaphoneIcon weight="duotone" className="size-5" aria-hidden />
              {t("modules.alumniFeed")}
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/remarks">
              <ChatCircleDotsIcon weight="duotone" className="size-5" aria-hidden />
              {t("modules.alumniMessages")}
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/record">
              <FileTextIcon weight="duotone" className="size-5" aria-hidden />
              {t("modules.alumniRecord")}
            </Link>
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
