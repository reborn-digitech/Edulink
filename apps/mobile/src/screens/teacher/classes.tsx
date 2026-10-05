import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { staffClassesSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Icon, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { CelebrationsCard } from "../shared/celebrations";

/** My classes, the web's /teacher/classes: one row per class, with today's register state. */
export function TeacherClasses() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const query = useQuery({
    queryKey: ["staff", "classes"],
    queryFn: async () => staffClassesSchema.parse(unwrap(await api().get("/api/v1/staff/classes"))),
  });
  const data = query.data;
  return (
    <Screen title={t("teacher.myClasses")} description={data ? (data.students === 1 ? t("teacher.studentsCountOne") : t("teacher.studentsCount", { count: data.students })) : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {data ? (
        data.classes.length === 0 ? (
          <Empty title={t("teacher.noClassesAssigned")} body={t("teacher.noClassesAssignedBody")} action={<Button label={t("nav.messages")} variant="secondary" onPress={() => router.push("/(app)/messages" as never)} />} />
        ) : (
          <Card>
            {data.classes.map((c) => (
              <Row
                key={c.id}
                title={c.name}
                caption={[c.subject, c.room, c.students === 1 ? t("teacher.studentsCountOne") : t("teacher.studentsCount", { count: c.students })].filter(Boolean).join(" · ")}
                right={
                  <>
                    <Text variant="xs" bold tone={c.registerTaken ? "ok" : "accent"}>
                      {c.registerTaken ? t("teacher.registerDone") : t("teacher.registerToDo")}
                    </Text>
                    <Icon name="caretRight" color={th.fgSubtle} size={16} />
                  </>
                }
                onPress={() => router.push({ pathname: "/(app)/classes/detail", params: { classId: c.id } } as never)}
              />
            ))}
          </Card>
        )
      ) : null}
      {/* Birthdays and anniversaries (A3-inventory-14), as on the web's /teacher/classes. */}
      {data ? <CelebrationsCard /> : null}
    </Screen>
  );
}
