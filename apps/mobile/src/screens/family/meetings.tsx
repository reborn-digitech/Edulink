import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { familyParentMeetingsSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Text } from "@/components";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useRole } from "@/lib/session";
import { Chips, formatInstant, Note } from "./shared";

/**
 * Meet the teacher — the web's /parent/meetings: the open windows of the
 * teachers who actually teach this family's children, one tap to claim one,
 * and the family's own bookings with a way to step back. Times are in the
 * school's zone, because the meeting happens at the school.
 */
export function FamilyMeetings() {
  const role = useRole();
  const t = useT();
  const router = useRouter();
  if (role === "PARENT") return <ParentMeetings />;
  // A teacher's meeting windows are the app's own screen (the meetings route draws TeacherMeetings for a teacher); anyone else here goes to their messages.
  const door = role === "TEACHER" ? <Button label={t("nav.meetings")} variant="secondary" onPress={() => router.push("/(app)/meetings" as never)} /> : <Button label={t("nav.messages")} variant="secondary" onPress={() => router.push("/(app)/messages" as never)} />;
  return (
    <Screen title={t("meetings.parentTitle")}>
      {role === null ? <Loading /> : <Empty title={t("meetings.openEmptyTitle")} body={t("meetings.openEmptyBody")} action={door} />}
    </Screen>
  );
}

function ParentMeetings() {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const qc = useQueryClient();
  const router = useRouter();
  const [choice, setChoice] = useState<Record<string, string>>({});
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["family", "meetings"],
    queryFn: async () => familyParentMeetingsSchema.parse(unwrap(await api().get("/api/v1/family/meetings"))),
  });
  const book = useMutation({
    mutationFn: async (body: { slotId: string; studentMembershipId: string }) => {
      const result = await api().post("/api/v1/family/meetings", body);
      if (!result.ok) throw new Error(errorText(result, t("common.somethingWrong")));
      return result.data;
    },
    onSuccess: () => {
      setBooked(true);
      setError(null);
      void qc.invalidateQueries({ queryKey: ["family", "meetings"] });
    },
    onError: (e) => setError(e.message),
  });
  const cancel = useMutation({
    mutationFn: async (bookingId: string) => {
      const result = await api().post("/api/v1/family/meetings/cancel", { bookingId });
      if (!result.ok) throw new Error(errorText(result, t("common.somethingWrong")));
      return result.data;
    },
    onSuccess: () => {
      setBooked(false);
      setError(null);
      void qc.invalidateQueries({ queryKey: ["family", "meetings"] });
    },
    onError: (e) => setError(e.message),
  });
  const d = query.data;
  const when = (iso: string) => formatInstant(iso, locale, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }, d?.timezone);
  const until = (iso: string) => formatInstant(iso, locale, { hour: "numeric", minute: "2-digit" }, d?.timezone);
  return (
    <Screen title={t("meetings.parentTitle")} description={t("meetings.openHint")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {error ? <Failed message={error} /> : null}
      {booked ? (
        <Note tone="ok">
          <Text variant="sm" bold tone="ok">
            {t("meetings.bookedNote")}
          </Text>
        </Note>
      ) : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          {d.mine.length > 0 ? (
            <Card title={t("meetings.mineTitle")}>
              {d.mine.map((booking) => (
                <Row
                  key={booking.bookingId}
                  title={`${t("meetings.withTeacher", { teacher: booking.teacherName })} · ${t("meetings.aboutChild", { child: booking.childName })}`}
                  caption={[when(booking.startsAt), booking.location].filter(Boolean).join(" · ")}
                  right={<Button variant="ghost" label={t("common.cancel")} busy={cancel.isPending && cancel.variables === booking.bookingId} onPress={() => cancel.mutate(booking.bookingId)} />}
                />
              ))}
            </Card>
          ) : null}

          <Card title={t("meetings.openTitle")}>
            {d.open.length === 0 ? (
              <Empty title={t("meetings.openEmptyTitle")} body={t("meetings.openEmptyBody")} action={<Button label={t("nav.messages")} variant="secondary" onPress={() => router.push("/(app)/messages" as never)} />} />
            ) : (
              d.open.map((slot) => {
                // Only the children THIS teacher teaches; the server refuses any other.
                const eligible = d.children.filter((c) => slot.forStudentMembershipIds.includes(c.studentMembershipId));
                const chosen = choice[slot.id] ?? eligible[0]?.studentMembershipId ?? null;
                return (
                  <View key={slot.id} style={{ gap: th.space[2], paddingVertical: th.space[2], borderTopWidth: 1, borderTopColor: th.border }}>
                    <Text variant="base" bold>
                      {t("meetings.withTeacher", { teacher: slot.teacherName })}
                    </Text>
                    <Text variant="xs" tone="muted">
                      {[`${when(slot.startsAt)} – ${until(slot.endsAt)}`, slot.location, slot.note].filter(Boolean).join(" · ")}
                    </Text>
                    {eligible.length > 1 ? (
                      <Chips label={t("parent.chooseChild")} value={chosen ?? ""} onChange={(id) => setChoice((prev) => ({ ...prev, [slot.id]: id }))} options={eligible.map((c) => ({ value: c.studentMembershipId, label: c.name }))} />
                    ) : null}
                    <Button
                      label={t("meetings.book")}
                      disabled={!chosen}
                      busy={book.isPending && book.variables?.slotId === slot.id}
                      onPress={() => {
                        if (chosen) book.mutate({ slotId: slot.id, studentMembershipId: chosen });
                      }}
                    />
                  </View>
                );
              })
            )}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
