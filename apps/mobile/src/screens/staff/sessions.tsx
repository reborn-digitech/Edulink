import { useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gigSchoolSessionsSchema } from "@edulink/contracts";
import { Card, Failed, Loading, Screen, SwitchRow, Text } from "@/components";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { formatInstant, Note, Pill } from "@/screens/family/shared";
import { BOOKING_STATUS, PROVIDER_KIND, ReasonThen, SESSION_KIND } from "@/screens/shared/gigs";

/**
 * The office's view of sessions — the web's /admin/sessions: every session
 * its pupils have asked for or booked, without the meeting link; the switch
 * that lets its teachers offer free guidance (the admin's to turn); and the
 * power to cancel a seat with a reason the family is told.
 */
const KEY = ["gigs", "school"] as const;
type Job = { path: string; body: Record<string, unknown>; done: string };

export function OfficeSessions() {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const query = useQuery({ queryKey: KEY, queryFn: async () => gigSchoolSessionsSchema.parse(unwrap(await api().get("/api/v1/gigs/school"))) });
  const act = useMutation({
    mutationFn: async (job: Job) => {
      const result = await api().post(job.path, job.body);
      if (!result.ok) throw new Error(errorText(result, t("common.somethingWrong")));
      return job.done;
    },
    onSuccess: (said) => {
      setError(null);
      setDone(said);
      void qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (e) => {
      setDone(null);
      setError(e.message);
    },
  });
  const d = query.data;
  const when = (iso: string) => formatInstant(iso, locale, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }, d?.timeZone);

  return (
    <Screen title={t("gigs.officeTitle")} description={t("gigs.officeIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {error ? <Failed message={error} /> : null}
      {done ? (
        <Note tone="ok">
          <Text variant="sm" bold tone="ok" accessibilityLiveRegion="polite">
            {done}
          </Text>
        </Note>
      ) : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} planFrom={query.error} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <SwitchRow label={t("gigs.guidanceSwitch")} value={d.guidanceOn} disabled={!d.canSwitch || act.isPending} onChange={(on) => act.mutate({ path: "/api/v1/gigs/school/guidance", body: { on }, done: on ? t("gigs.guidanceOnNote") : t("gigs.guidanceOffNote") })} />
          <Card>
            {d.bookings.length === 0 ? (
              <Text variant="sm" tone="muted">
                {t("gigs.officeNone")}
              </Text>
            ) : (
              d.bookings.map((b) => (
                <View key={b.id} style={{ gap: th.space[2], paddingVertical: th.space[2], borderTopWidth: 1, borderTopColor: th.border }}>
                  <Text variant="base" bold>
                    {[b.pupilName, b.title].join(" · ")}
                  </Text>
                  <Text variant="xs" tone="muted">
                    {[t(SESSION_KIND[b.kind]), when(b.startsAt), [t("gigs.withProvider", { name: b.providerName }), `(${t(PROVIDER_KIND[b.providerKind])})`].join(" "), b.paid ? t("gigs.paidSeat") : null].filter(Boolean).join(" · ")}
                  </Text>
                  <Text variant="xs" tone="muted">
                    {b.purpose}
                  </Text>
                  <Pill label={t(BOOKING_STATUS[b.status].label)} tone={BOOKING_STATUS[b.status].tone} />
                  {b.canCancel ? <ReasonThen label={t("gigs.officeCancel")} about={[b.pupilName, b.title].join(", ")} busy={act.isPending && act.variables?.path === `/api/v1/gigs/sessions/${b.id}/cancel`} onSubmit={(reason) => act.mutate({ path: `/api/v1/gigs/sessions/${b.id}/cancel`, body: { reason }, done: t("gigs.officeCancelled") })} /> : null}
                </View>
              ))
            )}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
