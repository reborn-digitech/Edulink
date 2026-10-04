import type { Metadata } from "next";
import { HandshakeIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { myStudentConsent } from "@/lib/student-consent";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GrantSwitch } from "./grant-switch";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("consent.title") };
}

/**
 * What an adult student lets their guardians see (4 Oct 2026,
 * student-consent.ts): six grants, each on or off, the student's to change
 * whenever they like. A minor, or a pupil at a school, is told their
 * guardians see everything and offered no switch.
 */
export default async function ConsentPage() {
  const ctx = await requireRole("STUDENT");
  const t = await getT();
  const view = await myStudentConsent(ctx);
  const guardians = view.guardians.map((g) => g.name).join(", ");
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title={t("consent.title")} description={view.applies ? t("consent.intro") : t("consent.notApplies")} />
      <p className="text-sm text-fg-muted">{guardians ? t("consent.guardiansLine", { names: guardians }) : t("consent.noGuardians")}</p>
      <ul className="space-y-3">
        {view.grants.map(({ grant, on }) => (
          <li key={grant}>
            <Card>
              <CardHeader icon={<HandshakeIcon weight="duotone" className="size-5" />} title={t(`consent.grant.${grant}.name`)} description={t(`consent.grant.${grant}.what`)} />
              <CardBody className="flex flex-wrap items-center justify-between gap-3">
                <Badge tone={on ? "ok" : "neutral"}>{on ? t("consent.on") : t("consent.off")}</Badge>
                {view.applies && <GrantSwitch grant={grant} on={on} />}
              </CardBody>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
