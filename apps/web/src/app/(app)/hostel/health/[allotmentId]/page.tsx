import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FirstAidKitIcon, PhoneIcon } from "@phosphor-icons/react/ssr";
import { requireRole, AccessError } from "@/lib/tenancy";
import { isModuleOn } from "@/lib/modules";
import { boarderHealth } from "@/lib/hostel";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ModuleOff } from "@/components/module-off";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("hostel.healthTitle"), robots: { index: false, follow: false } };
}

/**
 * What the warden needs at night from a boarder's health and emergency card:
 * blood group, allergies, conditions, medicines, the doctor and the people to
 * call. Opening it is recorded, and the family sees it in "who has read this
 * card", as every staff read is.
 */
export default async function HostelHealthPage({ params }: { params: Promise<{ allotmentId: string }> }) {
  const ctx = await requireRole("WARDEN");
  const t = await getT();
  const back = { href: "/hostel/rooms", label: t("hostel.tabRooms") };
  if (!(await isModuleOn(ctx.schoolId, "HOSTEL"))) {
    return (
      <div className="space-y-5">
        <PageHeader title={t("hostel.healthTitle")} back={back} />
        <ModuleOff module="HOSTEL" t={t} />
      </div>
    );
  }
  const { allotmentId } = await params;
  const h = await boarderHealth(ctx, allotmentId).catch((e) => {
    if (e instanceof AccessError) notFound();
    throw e;
  });
  const rows: [string, string][] = [
    [t("hostel.bloodGroup"), h.bloodGroup ?? t("hostel.notGiven")],
    [t("hostel.allergies"), h.allergies || t("hostel.none")],
    [t("hostel.conditions"), h.conditions || t("hostel.none")],
    [t("hostel.medicines"), h.medications || t("hostel.none")],
    [t("hostel.dietary"), h.dietary || t("hostel.none")],
    [t("hostel.doctor"), [h.doctorName, h.doctorPhone].filter(Boolean).join(" · ") || t("hostel.notGiven")],
  ];
  return (
    <div className="space-y-5">
      <PageHeader title={h.name} description={t("hostel.healthIntro")} back={back} />
      <Card>
        <CardHeader icon={<FirstAidKitIcon weight="duotone" className="size-5" />} title={t("hostel.healthTitle")} description={h.hasCard ? undefined : t("hostel.noCard")} />
        <CardBody>
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[12rem_1fr]">
            {rows.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="font-medium text-fg-muted">{k}</dt>
                <dd className="text-fg">{v}</dd>
              </div>
            ))}
          </dl>
        </CardBody>
      </Card>
      <Card>
        <CardHeader icon={<PhoneIcon weight="duotone" className="size-5" />} title={t("hostel.peopleToCall")} />
        <CardBody>
          {h.contacts.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("hostel.noContacts")}</p>
          ) : (
            <ol className="list-decimal space-y-1 pl-5 text-sm text-fg">
              {h.contacts.map((c, i) => (
                <li key={`${c.phone}-${i}`}>
                  {c.name} ({c.relation}) ·{" "}
                  <a href={`tel:${c.phone}`} className="font-medium text-accent-strong hover:underline">
                    {c.phone}
                  </a>
                </li>
              ))}
            </ol>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
