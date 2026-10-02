import { HandshakeIcon } from "@phosphor-icons/react/ssr";
import { formatPaise } from "@edulink/i18n";
import { requireSuperuser } from "@/lib/tenancy";
import { listPartners } from "@/lib/subscriptions";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { getT, getLocale } from "@/lib/i18n/server";
import { statusLabel } from "../subscription-words";
import { PartnerForm, PartnerRowCard } from "./partner-form";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("root.partnersMeta"), robots: { index: false, follow: false } };
}

/**
 * The commission partners: who brings schools in, their schools, and what
 * each is owed this month — their share of the plan's recorded price over
 * the schools whose subscription is ACTIVE, computed on read and stored
 * nowhere. Settled outside the app (decision 0003); the intro says so.
 */
export default async function PartnersPage() {
  const t = await getT();
  const locale = await getLocale();
  const session = await requireSuperuser();
  const partners = await listPartners(session);

  return (
    <div className="space-y-5">
      <PageHeader title={t("root.partners")} description={t("root.partnersIntro")} />

      {partners.length === 0 ? (
        <EmptyState icon={<HandshakeIcon weight="duotone" className="size-8" />} title={t("root.noPartnersYet")} description={t("root.noPartnersBody")} />
      ) : (
        <ul className="space-y-3">
          {partners.map((p) => (
            <li key={p.id}>
              <PartnerRowCard
                partner={{
                  id: p.id,
                  name: p.name,
                  phone: p.phone,
                  email: p.email,
                  percentTenths: p.percentTenths,
                  notes: p.notes,
                  schools: p.schools.map((s) => ({ id: s.id, name: s.name, statusLabel: statusLabel(t, s.subscriptionStatus), planName: s.planName })),
                  owed: formatPaise(p.owedThisMonthPaise, locale),
                }}
              />
            </li>
          ))}
        </ul>
      )}

      <Card>
        <CardHeader icon={<HandshakeIcon weight="duotone" className="size-5" />} title={t("root.partnerAdd")} description={t("root.commissionPercentHint")} />
        <CardBody>
          <PartnerForm />
        </CardBody>
      </Card>
    </div>
  );
}
