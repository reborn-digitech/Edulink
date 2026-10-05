import type { Metadata } from "next";
import Link from "next/link";
import { BusIcon, MapPinIcon, RoadHorizonIcon, UsersIcon, WarningIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { isModuleOn } from "@/lib/modules";
import { dayTrips, listAllotments, transportOverview } from "@/lib/transport";
import { minuteLabel } from "@/lib/transport-geo";
import { db } from "@/lib/db";
import { formatDateKey, formatInZone } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import type { Translate } from "@/lib/i18n/dictionary";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { TabBar } from "@/components/ui/tabs";
import { buttonVariants } from "@/components/ui/button";
import { ModuleOff } from "@/components/module-off";
import { BusMap } from "@/components/transport/bus-map";
import { directionLabel, statusLabel, statusTone } from "@/components/transport/labels";
import { AllotForm, AssignmentForm, BusForm, EndButton, RouteEditor, SettingsForm, TransportLive } from "./forms";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("transport.metaTitle"), robots: { index: false, follow: false } };
}

const TABS = ["today", "routes", "buses", "drivers", "pupils", "settings"] as const;
type Tab = (typeof TABS)[number];

/**
 * Transport for the office and the head (3 Oct 2026): today's trips with the
 * buses on one map and the missed starts; the routes and their stops; the
 * buses with each one's roster as a file; who drives which bus; the pupils'
 * seats; and whether families see the driver. The ADMIN writes, the head
 * reads. One page with tabs that are links, so a notification can land on
 * ?tab=today.
 */
export default async function TransportPage({ searchParams }: { searchParams: Promise<{ tab?: string; edit?: string; class?: string }> }) {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const t = await getT();
  const locale = await getLocale();
  if (!(await isModuleOn(ctx.schoolId, "TRANSPORT"))) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("transport.title")} />
        <ModuleOff module="TRANSPORT" t={t} />
      </div>
    );
  }
  const params = await searchParams;
  const tab: Tab = (TABS as readonly string[]).includes(params.tab ?? "") ? (params.tab as Tab) : "today";
  const [overview, school] = await Promise.all([transportOverview(ctx), db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } })]);
  const time = (iso: string | null) => (iso ? formatInZone(new Date(iso), school.timezone, { hour: "2-digit", minute: "2-digit" }, locale) : "");
  const canEdit = overview.canEdit;

  return (
    <div className="space-y-5">
      <PageHeader title={t("transport.title")} description={t("transport.intro")} />
      <TabBar
        ariaLabel={t("transport.tabsLabel")}
        current={tab}
        tabs={[
          { key: "today", href: "/admin/transport?tab=today", label: t("transport.tabToday") },
          { key: "routes", href: "/admin/transport?tab=routes", label: t("transport.tabRoutes"), count: overview.routes.length },
          { key: "buses", href: "/admin/transport?tab=buses", label: t("transport.tabBuses"), count: overview.buses.length },
          { key: "drivers", href: "/admin/transport?tab=drivers", label: t("transport.tabAssignments") },
          { key: "pupils", href: "/admin/transport?tab=pupils", label: t("transport.tabAllotments") },
          { key: "settings", href: "/admin/transport?tab=settings", label: t("transport.tabSettings") },
        ]}
      />

      {tab === "today" && <Today ctx={ctx} t={t} time={time} />}

      {tab === "routes" && (
        <div className="space-y-4">
          {overview.routes.length === 0 && !canEdit && <EmptyState icon={<RoadHorizonIcon weight="duotone" className="size-8" />} title={t("transport.noRoutes")} description={t("transport.noRoutesBody")} />}
          {overview.routes.map((r) => (
            <Card key={r.id} data-testid="transport-route">
              <CardHeader
                icon={<RoadHorizonIcon weight="duotone" className="size-5" />}
                title={r.name}
                description={
                  <>
                    {directionLabel(t, r.direction)} · {t("transport.ridersCount", { count: r.riders })} {!r.active && <Badge tone="neutral">{t("transport.archived")}</Badge>}
                  </>
                }
                action={canEdit && params.edit !== r.id ? <Link className={buttonVariants({ variant: "secondary", size: "sm" })} href={`/admin/transport?tab=routes&edit=${r.id}`}>{t("transport.editRoute")}</Link> : undefined}
              />
              <CardBody className="space-y-4">
                {params.edit === r.id && canEdit ? (
                  <RouteEditor route={r} />
                ) : (
                  <>
                    <ol className="space-y-1 text-sm">
                      {r.stops.map((s) => (
                        <li key={s.id} className="flex flex-wrap gap-x-3">
                          <span className="font-medium text-fg">
                            {s.order}. {s.name}
                          </span>
                          <span className="text-fg-muted tabular-nums">
                            {[minuteLabel(s.morningMinute), minuteLabel(s.eveningMinute)].filter(Boolean).join(" · ")}
                          </span>
                        </li>
                      ))}
                    </ol>
                    <BusMap stops={r.stops.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, label: [s.order, s.name].join(". ") }))} />
                  </>
                )}
              </CardBody>
            </Card>
          ))}
          {canEdit && (
            <Card>
              <CardHeader icon={<MapPinIcon weight="duotone" className="size-5" />} title={t("transport.newRoute")} description={overview.routes.length === 0 ? t("transport.noRoutesBody") : undefined} />
              <CardBody>
                <RouteEditor />
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {tab === "buses" && (
        <div className="space-y-4">
          {overview.buses.length === 0 ? (
            <EmptyState icon={<BusIcon weight="duotone" className="size-8" />} title={t("transport.noBuses")} description={t("transport.noBusesBody")} />
          ) : (
            <ul className="space-y-3">
              {overview.buses.map((b) => (
                <li key={b.id}>
                  <Card>
                    <CardHeader
                      icon={<BusIcon weight="duotone" className="size-5" />}
                      title={b.registration}
                      description={
                        <>
                          {t("transport.seatsCount", { count: b.capacity })} {b.note && <>· {b.note}</>} {!b.active && <Badge tone="neutral">{t("transport.offRoad")}</Badge>}
                        </>
                      }
                      action={
                        <a className={buttonVariants({ variant: "secondary", size: "sm" })} href={`/api/v1/admin/transport/buses/${b.id}/roster`} download>
                          {t("transport.rosterFile")}
                        </a>
                      }
                    />
                    {canEdit && (
                      <CardBody>
                        <details>
                          <summary className="cursor-pointer text-sm font-medium text-accent-strong">{t("transport.editBus")}</summary>
                          <div className="pt-3">
                            <BusForm bus={b} />
                          </div>
                        </details>
                      </CardBody>
                    )}
                  </Card>
                </li>
              ))}
            </ul>
          )}
          {canEdit && (
            <Card>
              <CardHeader icon={<BusIcon weight="duotone" className="size-5" />} title={t("transport.newBus")} />
              <CardBody>
                <BusForm />
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {tab === "drivers" && (
        <div className="space-y-4">
          {overview.drivers.length === 0 && <EmptyState icon={<UsersIcon weight="duotone" className="size-8" />} title={t("transport.noDrivers")} description={t("transport.noDriversBody")} />}
          {overview.assignments.length === 0 ? (
            <EmptyState icon={<BusIcon weight="duotone" className="size-8" />} title={t("transport.noAssignments")} description={t("transport.noAssignmentsBody")} />
          ) : (
            <Card>
              <CardHeader icon={<BusIcon weight="duotone" className="size-5" />} title={t("transport.assignmentsTitle")} />
              <CardBody>
                <ul className="divide-y divide-border">
                  {overview.assignments.map((a) => (
                    <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3" data-testid="transport-assignment">
                      <div className="min-w-0 text-sm">
                        <p className="font-medium text-fg">
                          {a.busRegistration} · {a.routeName}
                        </p>
                        <p className="text-fg-muted">
                          {t("transport.driver")}: {a.driverName}
                          {a.attendantName && (
                            <>
                              {" "}· {t("transport.attendant")}: {a.attendantName}
                            </>
                          )}
                        </p>
                        <p className="text-xs text-fg-muted">
                          {t("transport.sinceDate", { date: formatDateKey(a.fromDateKey, { day: "numeric", month: "numeric", year: "numeric" }) })}
                          {a.toDateKey && <> · {t("transport.untilDate", { date: formatDateKey(a.toDateKey, { day: "numeric", month: "numeric", year: "numeric" }) })}</>}
                        </p>
                      </div>
                      <span className="flex items-center gap-2">
                        <Badge tone={a.current ? "ok" : "neutral"}>{a.current ? t("transport.running") : t("transport.endedLabel")}</Badge>
                        {canEdit && a.current && !a.toDateKey && <EndButton kind="assignment" id={a.id} label={t("transport.endAssignment")} />}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}
          {canEdit && (
            <Card>
              <CardHeader icon={<RoadHorizonIcon weight="duotone" className="size-5" />} title={t("transport.newAssignment")} />
              <CardBody>{overview.buses.some((b) => b.active) && overview.routes.some((r) => r.active) && overview.drivers.length > 0 ? <AssignmentForm overview={overview} /> : <p className="text-sm text-fg-muted">{t("transport.needRouteAndBus")}</p>}</CardBody>
            </Card>
          )}
        </div>
      )}

      {tab === "pupils" && <Seats ctx={ctx} t={t} overview={overview} classId={params.class} />}

      {tab === "settings" && (
        <Card>
          <CardHeader icon={<UsersIcon weight="duotone" className="size-5" />} title={t("transport.tabSettings")} />
          <CardBody className="space-y-4">
            {canEdit ? <SettingsForm showDriverToParents={overview.settings.showDriverToParents} /> : <p className="text-sm text-fg">{overview.settings.showDriverToParents ? t("transport.showDriver") : t("transport.showDriverHint")}</p>}
            <p className="text-sm text-fg-muted">{t("transport.notCertified")}</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

async function Today({ ctx, t, time }: { ctx: Parameters<typeof dayTrips>[0]; t: Translate; time: (iso: string | null) => string }) {
  const { trips } = await dayTrips(ctx);
  const live = trips.filter((x) => x.status === "LIVE" && x.lastPosition);
  const missed = trips.filter((x) => x.status === "MISSED");
  return (
    <div className="space-y-4">
      <TransportLive />
      {live.length > 0 && (
        <Card>
          <CardHeader icon={<MapPinIcon weight="duotone" className="size-5" />} title={t("transport.mapLiveTitle")} />
          <CardBody>
            <BusMap testId="transport-live-map" buses={live.map((x) => ({ id: x.id, lat: x.lastPosition!.lat, lng: x.lastPosition!.lng, label: x.busRegistration }))} />
          </CardBody>
        </Card>
      )}
      {missed.length > 0 && (
        <Card data-testid="transport-missed">
          <CardHeader icon={<WarningIcon weight="duotone" className="size-5" />} title={t("transport.missedTitle")} description={t("transport.missedBody")} />
          <CardBody>
            <ul className="space-y-1 text-sm">
              {missed.map((x) => (
                <li key={x.id} className="text-fg">
                  {t("transport.tripLine", { bus: x.busRegistration, route: x.routeName, driver: x.driverName })} · {t("transport.scheduledAt", { time: minuteLabel(x.scheduledMinute) })}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}
      {trips.length === 0 ? (
        <EmptyState icon={<BusIcon weight="duotone" className="size-8" />} title={t("transport.noTrips")} description={t("transport.noTripsBody")} />
      ) : (
        <Card>
          <CardHeader icon={<BusIcon weight="duotone" className="size-5" />} title={t("transport.todayTitle")} />
          <CardBody>
            <ul className="divide-y divide-border">
              {trips.map((x) => (
                <li key={x.id} className="flex flex-wrap items-center justify-between gap-3 py-3" data-testid="transport-trip">
                  <div className="min-w-0 text-sm">
                    <p className="font-medium text-fg">
                      {directionLabel(t, x.direction)} · {t("transport.tripLine", { bus: x.busRegistration, route: x.routeName, driver: x.driverName })}
                    </p>
                    <p className="text-fg-muted">
                      {x.scheduledMinute !== null && t("transport.scheduledAt", { time: minuteLabel(x.scheduledMinute) })}
                      {x.startedAt && <> · {t("transport.startedAtTime", { time: time(x.startedAt) })}</>}
                      {x.endedAt && <> · {t("transport.endedAtTime", { time: time(x.endedAt) })}</>}
                      {x.lastPosition && x.status === "LIVE" && <> · {t("transport.lastSeenAt", { time: time(x.lastPosition.at) })}</>}
                      {" · "}
                      {t("transport.boardedCount", { boarded: x.boarded, riders: x.riders })}
                    </p>
                    {x.startReason && <p className="text-xs text-fg-muted">{t("transport.startedAway", { reason: x.startReason })}</p>}
                    {x.lowBattery && <p className="text-xs font-medium text-warn">{t("transport.lowBattery")}</p>}
                  </div>
                  <span className="flex items-center gap-2">
                    <Badge tone={statusTone(x.status)}>{statusLabel(t, x.status)}</Badge>
                    <Link className={buttonVariants({ variant: "secondary", size: "sm" })} href={`/admin/transport/trips/${x.id}`}>
                      {t("transport.openTrip")}
                    </Link>
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}
      <p className="text-xs text-fg-muted">{t("transport.notCertified")}</p>
    </div>
  );
}

async function Seats({ ctx, t, overview, classId }: { ctx: Parameters<typeof listAllotments>[0]; t: Translate; overview: Awaited<ReturnType<typeof transportOverview>>; classId?: string }) {
  const data = await listAllotments(ctx, { classId: classId && overview.canEdit ? classId : undefined });
  return (
    <div className="space-y-4">
      {overview.canEdit && (
        <Card>
          <CardHeader icon={<UsersIcon weight="duotone" className="size-5" />} title={t("transport.allotTitle")} />
          <CardBody className="space-y-4">
            <form method="get" action="/admin/transport" className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="tab" value="pupils" />
              <label className="text-sm">
                <span className="mb-1 block font-medium text-fg">{t("transport.chooseClass")}</span>
                <select name="class" defaultValue={classId ?? ""} className="min-h-11 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm">
                  <option value="">{t("transport.chooseClassPrompt")}</option>
                  {data.classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" className={buttonVariants({ variant: "secondary", size: "sm" })}>
                {t("transport.chooseClassPrompt")}
              </button>
            </form>
            {data.pupils.length > 0 ? (
              overview.routes.some((r) => r.active) ? <AllotForm overview={overview} pupils={data.pupils} /> : <p className="text-sm text-fg-muted">{t("transport.needRouteAndBus")}</p>
            ) : (
              <p className="text-sm text-fg-muted">{t("transport.pickClassFirst")}</p>
            )}
          </CardBody>
        </Card>
      )}
      {data.allotments.length === 0 ? (
        <EmptyState icon={<UsersIcon weight="duotone" className="size-8" />} title={t("transport.noSeats")} description={t("transport.noSeatsBody")} />
      ) : (
        <Card>
          <CardHeader icon={<UsersIcon weight="duotone" className="size-5" />} title={t("transport.seatsTitle")} />
          <CardBody>
            <ul className="divide-y divide-border">
              {data.allotments.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm" data-testid="transport-seat">
                  <div className="min-w-0">
                    <p className="font-medium text-fg">
                      {a.studentName}
                      {a.className && <span className="font-normal text-fg-muted"> · {a.className}</span>}
                    </p>
                    <p className="text-fg-muted">
                      {a.routeName} · {a.stopName}
                      {a.boards && <> · {t("transport.directionMorning")}</>}
                      {a.alights && <> · {t("transport.directionEvening")}</>}
                    </p>
                  </div>
                  {overview.canEdit && !a.toDateKey && <EndButton kind="seat" id={a.id} label={t("transport.endSeat")} />}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
