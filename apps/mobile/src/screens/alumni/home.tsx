import { View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { alumniHomeSchema, inboxConversationOpenedSchema } from "@edulink/contracts";
import { Button, Card, Failed, Loading, Row, Screen, Text } from "@/components";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { formatInstant, openWeb } from "@/screens/family/shared";
import { ModuleRoleHome } from "@/screens/modules/role-home";
import { roleLabel } from "@/screens/staff/shared";

/**
 * A former pupil's home (the alumni module, 3 Oct 2026) — the web's /alumni:
 * the old school's feed, its staff to write to with their former teachers
 * first (pressing one opens the room, found or made), the notes the school
 * sent, the directory, and the leaving record on the web. While the school
 * has the module off, the module role's home says so.
 */
export function AlumniHome() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const { locale } = useLocale();
  const session = useSession();
  const on = session.status === "signed-in" && (session.me.modules ?? []).includes("ALUMNI");
  const query = useQuery({
    queryKey: ["alumni", "home"],
    enabled: on,
    queryFn: async () => alumniHomeSchema.parse(unwrap(await api().get("/api/v1/alumni/home"))),
  });
  const open = useMutation({
    mutationFn: async (body: { schoolId: string; userId: string }) => {
      const result = await api().post("/api/v1/shared/conversations", body);
      if (!result.ok) throw new Error(errorText(result, t("common.somethingWrong")));
      return inboxConversationOpenedSchema.parse(result.data);
    },
    onSuccess: (opened) => router.push({ pathname: "/(app)/messages/room", params: { conversationId: opened.conversationId } } as never),
  });
  if (!on) return <ModuleRoleHome role="ALUMNUS" />;
  const d = query.data;
  return (
    <Screen title={t("modules.alumniName")} description={d ? t("modules.alumniWelcome", { school: d.schoolName }) : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <Text variant="sm" tone="muted">
            {(d.lastClass ? t("alumni.batchLineClass", { class: d.lastClass, year: d.batchYear }) : t("alumni.batchLine", { year: d.batchYear })) + " · " + t(`alumni.feed${d.feedMode}`)}
          </Text>
          {d.muted ? (
            <Text variant="sm" tone="warn">
              {t("alumni.mutedBanner")}
            </Text>
          ) : null}
          <View style={{ gap: th.space[2] }}>
            <Button label={t("modules.alumniFeed")} onPress={() => router.push("/(app)/bulletin" as never)} />
            <Button label={t("modules.alumniMessages")} variant="secondary" onPress={() => router.push("/(app)/messages" as never)} />
            {d.feedMode === "POST" && !d.muted ? <Button label={t("alumni.homeShare")} variant="secondary" onPress={() => openWeb("/alumni/share")} /> : null}
            <Button label={t("alumni.directoryOpen")} variant="secondary" onPress={() => router.push("/(app)/alumni-directory" as never)} />
            <Button label={t("modules.alumniRecord")} variant="secondary" onPress={() => openWeb("/record")} />
          </View>
          {open.isError ? <Failed message={open.error.message} /> : null}
          <Card title={t("alumni.formerTeachersTitle")}>
            {d.formerTeachers.length === 0 ? (
              <Text variant="sm" tone="muted">
                {t("alumni.formerTeachersEmpty")}
              </Text>
            ) : (
              d.formerTeachers.map((p) => (
                <Row
                  key={p.userId}
                  title={p.name}
                  caption={[roleLabel(t, p.role), p.detail].filter(Boolean).join(" · ")}
                  onPress={d.muted ? undefined : () => open.mutate({ schoolId: d.schoolId, userId: p.userId })}
                />
              ))
            )}
          </Card>
          <Card title={t("alumni.notesTitle")}>
            {d.notes.length === 0 ? (
              <Text variant="sm" tone="muted">
                {t("alumni.notesEmpty")}
              </Text>
            ) : (
              d.notes.map((n) => (
                <Row key={n.id} title={n.title} caption={[n.batchYear ? t("alumni.noteForBatch", { year: n.batchYear }) : t("alumni.noteForAll"), formatInstant(n.createdAt, locale), n.body].join(" · ")} />
              ))
            )}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
