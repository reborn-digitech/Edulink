"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import type { BusView, TransportOverview, TransportRoute, TransportStopInput } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { CheckboxField, SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { useEvents } from "@/lib/use-events";
import { minuteLabel, parseMinute } from "@/lib/transport-geo";
import { parseRupees } from "@edulink/i18n";
import { allotAction, createAssignmentAction, endAllotmentAction, endAssignmentAction, saveBusAction, saveRouteAction, settingsAction } from "./actions";

type Result = { ok: true; count?: number } | { ok: false; error: string };

/** One press of a write: the toast says how it went and the page reads again. */
function useWrite() {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const write = (action: () => Promise<Result>, okTitle: (r: Extract<Result, { ok: true }>) => string, then?: () => void) =>
    start(async () => {
      const result = await action();
      if (!result.ok) {
        toast({ tone: "danger", title: result.error });
        return;
      }
      toast({ tone: "ok", title: okTitle(result) });
      then?.();
      router.refresh();
    });
  return { pending, write };
}

/** The office's and the head's pages read again when a bus moves, starts or ends (at most every 15 s per trip, the server's throttle). */
export function TransportLive() {
  const router = useRouter();
  useEvents(() => router.refresh(), { types: ["transport.position", "transport.trip"], onResume: () => router.refresh() });
  return null;
}

/* -------------------------------------------------------------------------- */
/* Routes                                                                      */
/* -------------------------------------------------------------------------- */

type StopDraft = { id?: string; name: string; lat: string; lng: string; morning: string; evening: string; radius: string };
const blankStop = (): StopDraft => ({ name: "", lat: "", lng: "", morning: "", evening: "", radius: "150" });

export function RouteEditor({ route, onDone }: { route?: TransportRoute; onDone?: () => void }) {
  const t = useT();
  const { toast } = useToast();
  const { pending, write } = useWrite();
  const [name, setName] = useState(route?.name ?? "");
  // owner-batch-item5: the route's fee per term, in rupees as typed; the office raises it on the riders' ledgers.
  const [fee, setFee] = useState(route ? (route.feePerTermPaise / 100).toFixed(2) : "0");
  const [direction, setDirection] = useState<string>(route?.direction ?? "BOTH");
  const [active, setActive] = useState(route?.active ?? true);
  const [note, setNote] = useState(route?.note ?? "");
  const [stops, setStops] = useState<StopDraft[]>(
    route?.stops.map((s) => ({ id: s.id, name: s.name, lat: String(s.lat), lng: String(s.lng), morning: minuteLabel(s.morningMinute), evening: minuteLabel(s.eveningMinute), radius: String(s.radiusM) })) ?? [blankStop()],
  );
  const set = (i: number, patch: Partial<StopDraft>) => setStops((all) => all.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const move = (i: number, by: number) =>
    setStops((all) => {
      const next = [...all];
      const [it] = next.splice(i, 1);
      next.splice(i + by, 0, it!);
      return next;
    });

  function save() {
    const feePerTermPaise = parseRupees(fee);
    if (feePerTermPaise === null) {
      toast({ tone: "danger", title: t("common.checkTheForm") });
      return;
    }
    const body = {
      name,
      direction,
      active,
      note,
      feePerTermPaise,
      stops: stops.map(
        (s): TransportStopInput => ({
          ...(s.id ? { id: s.id } : {}),
          name: s.name,
          lat: Number(s.lat),
          lng: Number(s.lng),
          morningMinute: parseMinute(s.morning),
          eveningMinute: parseMinute(s.evening),
          radiusM: Number(s.radius) || 150,
        }),
      ),
    };
    write(() => saveRouteAction(route?.id ?? null, body), () => t("transport.routeSaved"), onDone);
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      data-testid="route-editor"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label={t("transport.routeName")} value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
        <SelectField label={t("transport.runs")} value={direction} onChange={(e) => setDirection(e.target.value)}>
          <option value="BOTH">{t("transport.directionBoth")}</option>
          <option value="MORNING">{t("transport.directionMorning")}</option>
          <option value="EVENING">{t("transport.directionEvening")}</option>
        </SelectField>
      </div>
      <TextAreaField label={t("transport.note")} value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={500} />
      <TextField label={t("collegeOffice.routeFee")} inputMode="decimal" value={fee} onChange={(e) => setFee(e.target.value)} hint={t("schoolCampus.routeFeeHint")} data-testid="route-fee" />
      <CheckboxField label={t("transport.inUse")} checked={active} onChange={(e) => setActive(e.target.checked)} />
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-fg">{t("transport.stopsTitle")}</h3>
        <p className="text-xs text-fg-muted">{t("transport.stopsHint")}</p>
        <ol className="space-y-3">
          {stops.map((s, i) => (
            <li key={s.id ?? `new-${i}`} className="rounded-[var(--radius-md)] border border-border p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-fg">{t("transport.stopNumber", { n: i + 1 })}</span>
                <span className="flex gap-1">
                  <Button type="button" size="icon-sm" variant="ghost" disabled={i === 0} onClick={() => move(i, -1)} aria-label={t("transport.moveUp", { n: i + 1 })} icon={<ArrowUpIcon className="size-4" />} />
                  <Button type="button" size="icon-sm" variant="ghost" disabled={i === stops.length - 1} onClick={() => move(i, 1)} aria-label={t("transport.moveDown", { n: i + 1 })} icon={<ArrowDownIcon className="size-4" />} />
                  <Button type="button" size="icon-sm" variant="ghost" disabled={stops.length === 1} onClick={() => setStops((all) => all.filter((_, j) => j !== i))} aria-label={t("transport.removeStop", { n: i + 1 })} icon={<TrashIcon className="size-4" />} />
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <TextField className="sm:col-span-3" label={t("transport.stopName")} value={s.name} onChange={(e) => set(i, { name: e.target.value })} required maxLength={80} />
                <TextField label={t("transport.lat")} inputMode="decimal" value={s.lat} onChange={(e) => set(i, { lat: e.target.value })} required hint={i === 0 ? t("transport.placeHint") : undefined} />
                <TextField label={t("transport.lng")} inputMode="decimal" value={s.lng} onChange={(e) => set(i, { lng: e.target.value })} required />
                <TextField label={t("transport.radius")} inputMode="numeric" value={s.radius} onChange={(e) => set(i, { radius: e.target.value })} />
                {direction !== "EVENING" && <TextField label={t("transport.morningTime")} placeholder="07:35" value={s.morning} onChange={(e) => set(i, { morning: e.target.value })} hint={t("transport.timeHint")} />}
                {direction !== "MORNING" && <TextField label={t("transport.eveningTime")} placeholder="16:10" value={s.evening} onChange={(e) => set(i, { evening: e.target.value })} hint={t("transport.timeHint")} />}
              </div>
            </li>
          ))}
        </ol>
        <Button type="button" variant="secondary" size="sm" icon={<PlusIcon className="size-4" />} onClick={() => setStops((all) => [...all, blankStop()])}>
          {t("transport.addStop")}
        </Button>
      </div>
      <Button type="submit" loading={pending}>
        {t("transport.saveRoute")}
      </Button>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Buses                                                                       */
/* -------------------------------------------------------------------------- */

export function BusForm({ bus, onDone }: { bus?: BusView; onDone?: () => void }) {
  const t = useT();
  const { pending, write } = useWrite();
  const [registration, setRegistration] = useState(bus?.registration ?? "");
  const [capacity, setCapacity] = useState(String(bus?.capacity ?? 40));
  const [note, setNote] = useState(bus?.note ?? "");
  const [active, setActive] = useState(bus?.active ?? true);
  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        write(() => saveBusAction(bus?.id ?? null, { registration, capacity: Number(capacity), note, active }), () => t("transport.busSaved"), () => {
          if (!bus) {
            setRegistration("");
            setNote("");
          }
          onDone?.();
        });
      }}
    >
      <TextField label={t("transport.registration")} placeholder="MH 12 AB 1234" value={registration} onChange={(e) => setRegistration(e.target.value)} required maxLength={16} />
      <TextField label={t("transport.capacity")} inputMode="numeric" value={capacity} onChange={(e) => setCapacity(e.target.value)} required />
      <TextField className="sm:col-span-2" label={t("transport.note")} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />
      {bus && <CheckboxField className="sm:col-span-2" label={t("transport.onRoad")} checked={active} onChange={(e) => setActive(e.target.checked)} />}
      <div className="sm:col-span-2">
        <Button type="submit" loading={pending}>
          {t("transport.saveBus")}
        </Button>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Assignments                                                                 */
/* -------------------------------------------------------------------------- */

export function AssignmentForm({ overview }: { overview: TransportOverview }) {
  const t = useT();
  const { pending, write } = useWrite();
  const buses = overview.buses.filter((b) => b.active);
  const routes = overview.routes.filter((r) => r.active);
  const [busId, setBusId] = useState(buses[0]?.id ?? "");
  const [routeId, setRouteId] = useState(routes[0]?.id ?? "");
  const [driver, setDriver] = useState(overview.drivers[0]?.membershipId ?? "");
  const [attendant, setAttendant] = useState("");
  const [from, setFrom] = useState(overview.todayKey);
  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        write(() => createAssignmentAction({ busId, routeId, driverMembershipId: driver, attendantMembershipId: attendant || null, fromDateKey: from }), () => t("transport.assignmentSaved"));
      }}
    >
      <SelectField label={t("transport.bus")} value={busId} onChange={(e) => setBusId(e.target.value)} required>
        {buses.map((b) => (
          <option key={b.id} value={b.id}>
            {b.registration}
          </option>
        ))}
      </SelectField>
      <SelectField label={t("transport.route")} value={routeId} onChange={(e) => setRouteId(e.target.value)} required>
        {routes.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </SelectField>
      <SelectField label={t("transport.driver")} value={driver} onChange={(e) => setDriver(e.target.value)} required>
        {overview.drivers.map((d) => (
          <option key={d.membershipId} value={d.membershipId}>
            {d.name}
          </option>
        ))}
      </SelectField>
      <SelectField label={t("transport.attendant")} value={attendant} onChange={(e) => setAttendant(e.target.value)}>
        <option value="">{t("transport.noAttendant")}</option>
        {overview.drivers
          .filter((d) => d.membershipId !== driver)
          .map((d) => (
            <option key={d.membershipId} value={d.membershipId}>
              {d.name}
            </option>
          ))}
      </SelectField>
      <TextField label={t("transport.fromDate")} type="date" value={from} onChange={(e) => setFrom(e.target.value)} required />
      <div className="flex items-end">
        <Button type="submit" loading={pending}>
          {t("transport.newAssignment")}
        </Button>
      </div>
    </form>
  );
}

/** "End" on an assignment or a seat: its last day is today. */
export function EndButton({ kind, id, label }: { kind: "assignment" | "seat"; id: string; label: string }) {
  const t = useT();
  const { pending, write } = useWrite();
  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      loading={pending}
      onClick={() =>
        kind === "assignment"
          ? write(() => endAssignmentAction(id), () => t("transport.assignmentEnded"))
          : write(() => endAllotmentAction(id), () => t("transport.seatEnded"))
      }
    >
      {label}
    </Button>
  );
}

/* -------------------------------------------------------------------------- */
/* Seats                                                                       */
/* -------------------------------------------------------------------------- */

export function AllotForm({ overview, pupils }: { overview: TransportOverview; pupils: { studentMembershipId: string; name: string; routeName: string | null; stopName: string | null }[] }) {
  const t = useT();
  const { toast } = useToast();
  const { pending, write } = useWrite();
  const routes = overview.routes.filter((r) => r.active);
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [routeId, setRouteId] = useState(routes[0]?.id ?? "");
  const stops = routes.find((r) => r.id === routeId)?.stops ?? [];
  const [stopId, setStopId] = useState(stops[0]?.id ?? "");
  const [boards, setBoards] = useState(true);
  const [alights, setAlights] = useState(true);
  const [feeHeadId, setFeeHeadId] = useState("");
  const toggle = (id: string) => setChosen((all) => {
    const next = new Set(all);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (chosen.size === 0) return toast({ tone: "warn", title: t("transport.pickPupils") });
        if (!routeId || !stopId) return toast({ tone: "warn", title: t("transport.chooseRouteStop") });
        write(
          () => allotAction({ studentMembershipIds: [...chosen], routeId, stopId, boards, alights, feeHeadId: feeHeadId || null }),
          (r) => t("transport.allotted", { count: r.count ?? chosen.size }),
          () => setChosen(new Set()),
        );
      }}
    >
      <fieldset className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <legend className="text-sm font-semibold text-fg">{t("transport.tabAllotments")}</legend>
          <Button type="button" size="sm" variant="ghost" onClick={() => setChosen(new Set(pupils.map((p) => p.studentMembershipId)))}>
            {t("transport.selectAll")}
          </Button>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {pupils.map((p) => (
            <li key={p.studentMembershipId}>
              <CheckboxField
                label={p.name}
                description={p.routeName ? t("transport.currentSeat", { route: p.routeName, stop: p.stopName ?? "" }) : t("transport.noSeatShort")}
                checked={chosen.has(p.studentMembershipId)}
                onChange={() => toggle(p.studentMembershipId)}
              />
            </li>
          ))}
        </ul>
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField
          label={t("transport.route")}
          value={routeId}
          onChange={(e) => {
            setRouteId(e.target.value);
            setStopId(routes.find((r) => r.id === e.target.value)?.stops[0]?.id ?? "");
          }}
        >
          {routes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </SelectField>
        <SelectField label={t("transport.stop")} value={stopId} onChange={(e) => setStopId(e.target.value)}>
          {stops.map((s) => (
            <option key={s.id} value={s.id}>
              {s.order}. {s.name}
            </option>
          ))}
        </SelectField>
        <CheckboxField label={t("transport.boards")} checked={boards} onChange={(e) => setBoards(e.target.checked)} />
        <CheckboxField label={t("transport.alights")} checked={alights} onChange={(e) => setAlights(e.target.checked)} />
        {overview.feeHeads.length > 0 && (
          <SelectField label={t("transport.feeHead")} value={feeHeadId} onChange={(e) => setFeeHeadId(e.target.value)}>
            <option value="">{t("transport.noFeeHead")}</option>
            {overview.feeHeads.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </SelectField>
        )}
      </div>
      <Button type="submit" loading={pending} disabled={chosen.size === 0}>
        {t("transport.allot", { count: chosen.size })}
      </Button>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Settings                                                                    */
/* -------------------------------------------------------------------------- */

export function SettingsForm({ showDriverToParents }: { showDriverToParents: boolean }) {
  const t = useT();
  const { pending, write } = useWrite();
  const [on, setOn] = useState(showDriverToParents);
  return (
    <div className="space-y-3">
      <CheckboxField
        label={t("transport.showDriver")}
        description={t("transport.showDriverHint")}
        checked={on}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.checked;
          setOn(next);
          write(() => settingsAction({ showDriverToParents: next }), () => t("transport.settingsSaved"));
        }}
      />
    </div>
  );
}
