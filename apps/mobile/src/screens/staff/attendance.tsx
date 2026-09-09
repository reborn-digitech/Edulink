import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminAttendanceSchema, type AdminAttendance as AdminAttendanceData } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Icon, Loading, Row, Screen, Stat, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Chips, openWeb, pct } from "./shared";

type Window = "30" | "60" | "90";
type Sort = "percent" | "run" | "name";

/**
 * The office's attendance landing — the web's /admin/attendance, read for the
 * child rather than the day: eight weeks of the whole school, the children
 * quietly slipping over the chosen window, and the classes whose register
 * the office may take itself. Telling a family and the statutory exports are
 * the web's: one audited tap per child, and files a phone has nowhere to put.
 */
export function AdminAttendance({ onOpenRegister, onOpenHistory }: { onOpenRegister?: (classId: string) => void; onOpenHistory?: () => void }) {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const [window, setWindow] = useState<Window>("30");
  const [sort, setSort] = useState<Sort>("percent");
  const query = useQuery({
    queryKey: ["admin", "attendance", window, sort],
    placeholderData: keepPreviousData,
    queryFn: async () => adminAttendanceSchema.parse(unwrap(await api().get(`/api/v1/admin/attendance?window=${window}&sort=${sort}`))),
  });
  const d = query.data;
  const history = onOpenHistory ?? (() => router.push("/(app)/attendance/history" as never));
  const latest = d ? [...d.trend].reverse().find((p) => p.percent !== null) : undefined;
  return (
    <Screen title={t("attendanceIntel.title")} description={t("attendanceIntel.intro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Button label={t("attendanceHistory.link")} variant="secondary" onPress={history} />
      <Chips
        label={t("attendanceIntel.windowLabel")}
        value={window}
        options={[
          { value: "30", label: t("attendanceIntel.days30") },
          { value: "60", label: t("attendanceIntel.days60") },
          { value: "90", label: t("attendanceIntel.days90") },
        ]}
        onChange={setWindow}
      />
      <Chips
        label={t("common.sortBy")}
        value={sort}
        options={[
          { value: "percent", label: t("attendanceIntel.sortLowest") },
          { value: "run", label: t("attendanceIntel.sortRun") },
          { value: "name", label: t("common.byName") },
        ]}
        onChange={setSort}
      />
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
            <Stat label={t("principal.attendance")} value={pct(latest?.percent)} tone={latest?.percent !== undefined && latest.percent !== null && latest.percent < 75 ? "danger" : "fg"} />
            <Stat label={t("attendanceIntel.flagsTitle")} value={d.flags.length} tone={d.flags.length > 0 ? "warn" : "ok"} />
          </View>
          <Card title={t("attendanceIntel.trendTitle")}>
            <Text variant="xs" tone="subtle">
              {t("attendanceIntel.trendHint")}
            </Text>
            {d.trend.map((point, i) => (
              <Row
                key={`${point.label}:${i}`}
                title={point.label}
                caption={t("attendanceIntel.marksCount", { n: point.marks })}
                right={
                  <Text variant="base" bold tone={point.percent === null ? "subtle" : "fg"}>
                    {pct(point.percent)}
                  </Text>
                }
              />
            ))}
          </Card>
          <Card title={t("attendanceIntel.flagsTitle")}>
            <Text variant="xs" tone="subtle">
              {t("attendanceIntel.flagsHint")}
            </Text>
            {d.flags.length === 0 ? (
              <Empty title={t("attendanceIntel.flagsEmpty")} action={<Button label={t("attendanceHistory.link")} variant="secondary" onPress={history} />} />
            ) : (
              d.flags.map((flag) => <FlagRow key={flag.studentMembershipId} flag={flag} />)
            )}
          </Card>
          <Card title={t("principal.classes")}>
            {d.classes.length === 0 ? (
              <Empty title={t("principal.noClasses")} body={t("principal.noClassesBody")} action={<Button label={t("nav.classes")} variant="secondary" onPress={() => router.push("/(app)/classes" as never)} />} />
            ) : (
              d.classes.map((c) => (
                <Row key={c.id} title={c.name} caption={t("teacher.takeRegister")} right={onOpenRegister ? <Icon name="caretRight" color={th.fgSubtle} size={20} /> : null} onPress={onOpenRegister ? () => onOpenRegister(c.id) : undefined} />
              ))
            )}
          </Card>
          <Card title={t("attendanceIntel.exportsTitle")}>
            <Text variant="xs" tone="subtle">
              {t("attendanceIntel.exportsHint")}
            </Text>
            <Button label={t("attendanceIntel.exportRegister")} variant="secondary" onPress={() => openWeb("/admin/attendance")} />
            <Button label={t("attendanceIntel.exportEnrolment")} variant="secondary" onPress={() => openWeb("/admin/attendance")} />
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

/** One child worth a conversation: the chips the web shows, and the audited "tell the family", which is the web's. */
function FlagRow({ flag }: { flag: AdminAttendanceData["flags"][number] }) {
  const t = useT();
  const caption = [flag.className, flag.chronic ? t("attendanceIntel.chronicChip", { percent: flag.percent }) : null, flag.consecutive ? t("attendanceIntel.runChip", { n: flag.currentRun }) : null, t("attendanceIntel.marksCount", { n: flag.marks })].filter(Boolean).join(" · ");
  return (
    <Row
      title={flag.name}
      caption={caption}
      right={
        <Button
          label={flag.guardianCount === 0 ? t("attendanceIntel.noGuardians") : t("attendanceIntel.notify")}
          variant="secondary"
          disabled={flag.guardianCount === 0}
          accessibilityLabel={`${flag.guardianCount === 0 ? t("attendanceIntel.noGuardians") : t("attendanceIntel.notify")}: ${flag.name}`}
          onPress={() => openWeb("/admin/attendance")}
        />
      }
    />
  );
}
