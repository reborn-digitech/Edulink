import type { Metadata } from "next";
import { DateField } from "@/components/ui/field";
import { CalendarPlusIcon, UsersThreeIcon, WarningIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { teacherSlots } from "@/lib/meetings";
import { formatInZone } from "@/lib/dates";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getT } from "@/lib/i18n/server";
import { publishSlotsAction, cancelSlotAction } from "./actions";
import { PageHeader } from "@/components/ui/page-header";
import { fieldClass } from "@/components/ui/field-class";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meetings.teacherTitle") };
}

/**
 * The teacher's meeting afternoon: publish a run of back-to-back slots, watch
 * families claim them, cancel the ones that can no longer happen (which tells
 * the family, by construction).
 */
export default async function TeacherMeetingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const ctx = await requireRole("TEACHER");
  const t = await getT();
  const { error } = await searchParams;

  const [slots, school] = await Promise.all([
    teacherSlots(ctx),
    db.school.findUniqueOrThrow({ where: { id: ctx.schoolId! }, select: { timezone: true } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("meetings.teacherTitle")} description={t("meetings.teacherIntro")} />

      {error && (
        <Card>
          <CardBody className="flex items-center gap-2 text-sm text-danger">
            <WarningIcon weight="fill" className="size-4 shrink-0" />
            {error}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader
          icon={<CalendarPlusIcon weight="duotone" className="size-5" />}
          title={t("meetings.publishTitle")}
          description={t("meetings.publishHint")}
        />
        <CardBody>
          <form action={publishSlotsAction} className="grid gap-3 sm:grid-cols-5">
            {/* The app's date field, day-month-year, where the browser's own wrote mm/dd/yyyy. */}
            <DateField label={t("meetings.fieldDate")} name="date" required />
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-fg">{t("meetings.fieldFrom")}</span>
              <input
                type="time"
                name="time"
                required
                defaultValue="15:00"
                className={fieldClass()}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-fg">{t("meetings.fieldLength")}</span>
              <input
                type="number"
                name="duration"
                min={5}
                max={120}
                defaultValue={15}
                required
                className={fieldClass()}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-fg">{t("meetings.fieldCount")}</span>
              <input
                type="number"
                name="count"
                min={1}
                max={20}
                defaultValue={6}
                required
                className={fieldClass()}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-fg">{t("meetings.fieldWhere")}</span>
              <input
                type="text"
                name="location"
                maxLength={120}
                placeholder={t("meetings.wherePlaceholder")}
                className={fieldClass()}
              />
            </label>
            <div className="sm:col-span-5">
              <Button type="submit" icon={<CalendarPlusIcon weight="bold" />}>
                {t("meetings.publish")}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          icon={<UsersThreeIcon weight="duotone" className="size-5" />}
          title={t("meetings.upcomingTitle")}
        />
        <CardBody className="p-0">
          {slots.length === 0 ? (
            <p className="px-5 py-6 text-sm text-fg-muted">{t("meetings.upcomingEmpty")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {slots.map((slot) => (
                <li key={slot.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-fg">
                      {formatInZone(slot.startsAt, school.timezone)} –{" "}
                      {formatInZone(slot.endsAt, school.timezone, { timeStyle: "short" })}
                      {slot.location ? ` · ${slot.location}` : ""}
                    </p>
                    {slot.booking ? (
                      <p className="mt-0.5 text-xs text-fg-muted">
                        {t("meetings.bookedBy", {
                          child: slot.booking.childName,
                          parent: slot.booking.parentName,
                        })}
                        {slot.booking.note ? ` — “${slot.booking.note}”` : ""}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs text-fg-muted">{t("meetings.stillOpen")}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {slot.booking && (
                      <Badge tone="ok" size="sm">
                        {t("meetings.bookedChip")}
                      </Badge>
                    )}
                    <form action={cancelSlotAction}>
                      <input type="hidden" name="slotId" value={slot.id} />
                      <Button type="submit" size="sm" variant="ghost">
                        {t("common.cancel")}
                      </Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
