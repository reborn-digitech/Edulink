import { Linking, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { circularReachSchema, circularRemindResultSchema, type CircularReach, type ReachState } from "@edulink/contracts";
import type { Translate, TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Loading, Screen, Stat, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { formatInstant, Pill } from "../family/shared";
import { must } from "./shared";

type Family = CircularReach["groups"][number]["outstanding"][number];

/** The audience a circular was written for, in the reader's words; the server's word itself if it is one the phone does not know. */
const AUDIENCE_KEY: Record<string, TranslationKey> = { ALL: "circulars.audienceAll", PARENTS: "circulars.audienceParents", TEACHERS: "circulars.audienceTeachers", STUDENTS: "circulars.audienceStudents" };
export function audienceLabel(t: Translate, audience: string): string {
  const key = AUDIENCE_KEY[audience];
  return key ? t(key) : audience;
}

const STATE: Record<ReachState, { key: TranslationKey; tone: "ok" | "accent" | "warn" | "danger" }> = {
  ACKED: { key: "circulars.stateAcked", tone: "ok" },
  SEEN: { key: "circulars.stateSeen", tone: "accent" },
  TOLD: { key: "circulars.stateTold", tone: "warn" },
  UNREACHED: { key: "circulars.stateUnreached", tone: "danger" },
};

/** Why the chase button is not there, when it is not; nothing for a reader the button was never for. */
const BLOCKED: Partial<Record<CircularReach["remindBlocked"], TranslationKey>> = { "too-soon": "circulars.tooSoon", "nothing-outstanding": "circulars.everyoneReached", "not-delivered": "circulars.notDelivered" };

/**
 * Who a circular has reached — the web's reach report: the four totals,
 * when the families were told and last chased, then class by class the
 * count acknowledged and the families still waiting, each guardian with
 * whether the app can reach them, whether a text went, and the number the
 * office may ring. The office and the head chase the rest from here, once
 * a day; a teacher reads their own classes and rings nobody, since the
 * server gives them no number.
 */
export function StaffCircularReach() {
  const { postId } = useLocalSearchParams<{ postId?: string }>();
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { locale } = useLocale();
  const id = encodeURIComponent(postId ?? "");
  const query = useQuery({
    queryKey: ["staff", "circular-reach", postId],
    queryFn: async () => circularReachSchema.parse(unwrap(await api().get(`/api/v1/shared/bulletin/${id}/reach`))),
    enabled: Boolean(postId),
  });
  const remind = useMutation({
    mutationFn: async () => circularRemindResultSchema.parse(must(await api().post(`/api/v1/shared/bulletin/${id}/remind`, {}), t("common.somethingWrong"))),
    onSuccess: (res) => {
      toast.show(t("circulars.remindDone", { reminded: res.reminded, texted: res.texted }));
      void query.refetch();
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const toBulletin = () => router.push("/(app)/bulletin" as never);
  if (!postId) {
    return (
      <Screen title={t("circulars.metaTitle")}>
        <Empty icon="megaphone" title={t("access.postNotFound")} action={<Button label={t("nav.bulletin")} variant="secondary" onPress={toBulletin} />} />
      </Screen>
    );
  }
  const d = query.data;
  const when = (iso: string) => formatInstant(iso, locale);
  const blocked = d && !d.canRemind ? BLOCKED[d.remindBlocked] : undefined;
  return (
    <Screen title={d?.title ?? t("circulars.metaTitle")} description={d ? `${audienceLabel(t, d.audience)} · ${t("circulars.published", { when: when(d.publishedAt) })}` : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <Card title={t("circulars.reachTitle")}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
              <Stat label={t("circulars.total")} value={d.totals.total} />
              <Stat label={t("circulars.told")} value={d.totals.told} />
              <Stat label={t("circulars.seen")} value={d.totals.seen} tone="accent" />
              <Stat label={t("circulars.acked")} value={d.totals.acked} tone="ok" />
            </View>
            <Text variant="sm" tone="muted">
              {d.deliveredAt ? t("circulars.delivered", { when: when(d.deliveredAt) }) : d.deliveryQueuedAt ? t("circulars.queued") : t("circulars.notDelivered")}
            </Text>
            {d.remindedAt ? (
              <Text variant="sm" tone="muted">
                {t("circulars.reminded", { when: when(d.remindedAt), count: d.remindCount })}
              </Text>
            ) : null}
            {d.canRemind ? (
              <>
                <Button label={t("circulars.remind")} busy={remind.isPending} onPress={() => remind.mutate()} />
                <Text variant="xs" tone="subtle">
                  {t("circulars.remindHint")}
                </Text>
              </>
            ) : blocked ? (
              <Text variant="sm" bold tone="muted">
                {t(blocked)}
              </Text>
            ) : null}
            <Text variant="xs" tone="subtle">
              {t("circulars.reachHint")}
            </Text>
          </Card>
          {d.groups.map((group) => (
            <Card key={group.classId ?? "staff"} title={group.className || t("circulars.audienceTeachers")}>
              <Text variant="sm" tone="muted">
                {t("circulars.ackedOf", { acked: group.acked, total: group.total })}
              </Text>
              {group.outstanding.length === 0 ? (
                <Text variant="sm" bold tone="ok">
                  {t("circulars.everyoneReached")}
                </Text>
              ) : (
                <>
                  <Text variant="xs" bold tone="subtle">
                    {t("circulars.outstandingCount", { count: group.outstanding.length })}
                  </Text>
                  {group.outstanding.map((family) => (
                    <FamilyRow key={family.studentMembershipId} family={family} />
                  ))}
                </>
              )}
            </Card>
          ))}
          <Button label={t("circulars.viewOnBulletin")} variant="ghost" onPress={() => router.push({ pathname: "/(app)/post", params: { postId } } as never)} />
        </>
      ) : null}
    </Screen>
  );
}

/** One family still waiting: the pupil, how far they got, and each guardian with the ways to reach them. */
function FamilyRow({ family }: { family: Family }) {
  const t = useT();
  const th = useTheme();
  const state = STATE[family.state];
  return (
    <View style={{ gap: th.space[2], paddingVertical: th.space[2], borderTopWidth: 1, borderTopColor: th.border }}>
      <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: th.space[2] }}>
        <Text variant="base" bold style={{ flex: 1 }}>
          {family.studentName}
        </Text>
        <Pill label={t(state.key)} tone={state.tone} />
      </View>
      {family.guardians.map((g) => (
        <View key={g.userId} style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: th.space[2], marginLeft: th.space[3] }}>
          <Text variant="sm" style={{ flex: 1 }}>
            {g.name}
          </Text>
          {!g.hasApp ? <Pill label={t("circulars.noApp")} tone="warn" /> : null}
          {g.texted ? <Pill label={t("circulars.texted")} tone="accent" /> : null}
          {g.phone ? <Button label={g.phone} variant="ghost" accessibilityLabel={`${t("circulars.columnPhone")}: ${g.name}`} onPress={() => void Linking.openURL(`tel:${g.phone}`)} /> : null}
        </View>
      ))}
    </View>
  );
}
