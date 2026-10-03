import type { Metadata } from "next";
import Link from "next/link";
import { BedIcon, ClipboardTextIcon, DoorOpenIcon, UsersIcon, WarningCircleIcon } from "@phosphor-icons/react/ssr";
import { getT } from "@/lib/i18n/server";
import { hostelOverview, rollCallSheet } from "@/lib/hostel";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SLOT_KEY, WardenFrame, wardenContext } from "@/components/hostel/parts";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("modules.hostelName"), robots: { index: false, follow: false } };
}

/**
 * The hostel today (module HOSTEL, 3 Oct 2026) — the WARDEN's home, and the
 * office's and the head's from their NAV: each house's beds and whether
 * tonight's roll call is taken, who is out, what waits for a decision, who
 * was absent at the last call and who came back late.
 */
export default async function HostelHomePage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { ctx, t, on, canWrite } = await wardenContext();
  const { ok, error } = await searchParams;
  if (!on) return <WardenFrame t={t} on={false} current="home" title={t("modules.hostelName")}>{null}</WardenFrame>;
  const o = await hostelOverview(ctx);
  const sheets = await Promise.all(o.hostels.map((h) => rollCallSheet(ctx, h.id, "NIGHT")));
  return (
    <WardenFrame t={t} on current="home" title={t("modules.hostelName")} description={t("hostel.homeIntro")} ok={ok} error={error}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label={t("hostel.statBoarders")} value={o.hostels.reduce((a, h) => a + h.occupied, 0)} icon={<BedIcon weight="duotone" className="size-5" />} />
        <StatTile label={t("hostel.statOut")} value={o.outNow} icon={<DoorOpenIcon weight="duotone" className="size-5" />} />
        <StatTile label={t("hostel.statPending")} value={o.pendingLeave} tone={o.pendingLeave ? "accent" : "neutral"} icon={<ClipboardTextIcon weight="duotone" className="size-5" />} />
        <StatTile label={t("hostel.statVisitors")} value={o.visitorsToday} icon={<UsersIcon weight="duotone" className="size-5" />} />
      </div>
      {o.hostels.length === 0 ? (
        <Card>
          <CardBody className="pt-5 text-sm text-fg-muted">{ctx.role === "ADMIN" ? t("hostel.noHostelsOffice") : t("hostel.noHostels")}</CardBody>
        </Card>
      ) : null}
      {o.hostels.map((h, i) => {
        const sheet = sheets[i]!;
        return (
          <Card key={h.id}>
            <CardHeader icon={<BedIcon weight="duotone" className="size-5" />} title={h.name} description={t("hostel.occupancy", { occupied: h.occupied, beds: h.beds })} />
            <CardBody className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-fg">{sheet.taken ? t("hostel.rollDone", { slot: t(SLOT_KEY.NIGHT), name: sheet.taken.byName }) : t("hostel.rollNotYet", { slot: t(SLOT_KEY.NIGHT) })}</p>
              {canWrite && !sheet.taken ? (
                <Button asChild size="sm">
                  <Link href={`/hostel/rollcall?hostel=${h.id}&slot=NIGHT`}>{t("hostel.takeRollCall")}</Link>
                </Button>
              ) : null}
            </CardBody>
          </Card>
        );
      })}
      {o.absentees.length > 0 ? (
        <Card>
          <CardHeader icon={<WarningCircleIcon weight="duotone" className="size-5" />} title={t("hostel.absenteesTitle")} />
          <CardBody>
            <ul className="space-y-1 text-sm text-fg">
              {o.absentees.map((a, k) => (
                <li key={`${a.name}-${k}`}>
                  {a.name} · {t("hostel.roomShort", { room: a.roomNumber })} · {a.hostelName} · {t(SLOT_KEY[a.slot])} {a.dateKey}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ) : null}
    </WardenFrame>
  );
}
