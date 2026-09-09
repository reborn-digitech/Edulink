import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import type { z } from "zod";
import { enquiriesPageSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useRole } from "@/lib/session";
import { Chips, openWeb } from "../staff/shared";
import { Pill, relativeTime } from "../family/shared";

type Status = "" | "open" | "closed";
type Kind = "" | "ADMISSION" | "VACANCY";
type Enquiry = z.infer<typeof enquiriesPageSchema>["sent"][number];

/**
 * The enquiries desk, the web's /enquiries, both directions: what you asked
 * a school, and what your school was asked. Opening a new one starts from a
 * school's page in Explore, on the web, as the web's own empty state says.
 */
export function Enquiries() {
  const t = useT();
  const th = useTheme();
  const role = useRole();
  const router = useRouter();
  const { locale } = useLocale();
  const [status, setStatus] = useState<Status>("");
  const [kind, setKind] = useState<Kind>("");
  const query = useQuery({
    queryKey: ["shared", "enquiries"],
    queryFn: async () => enquiriesPageSchema.parse(unwrap(await api().get("/api/v1/shared/enquiries"))),
  });
  const data = query.data;
  const everything = data ? [...data.sent, ...data.inbox] : [];
  const keep = (e: Enquiry) => (!status || e.status === (status === "open" ? "OPEN" : "CLOSED")) && (!kind || e.kind === kind);
  const sent = data?.sent.filter(keep) ?? [];
  const inbox = data?.inbox.filter(keep) ?? [];
  const narrowed = Boolean(status || kind);
  const isStaff = role === "ADMIN" || role === "PRINCIPAL" || role === "TEACHER";
  const open = (enquiryId: string) => router.push({ pathname: "/(app)/enquiries/detail", params: { enquiryId } } as never);

  const row = (e: Enquiry, showFrom: boolean) => {
    const title = showFrom ? (e.subject ? `${e.fromName} — ${e.subject}` : e.fromName) : e.subject ? t("enquiries.threadTitleVacancy", { subject: e.subject, school: e.schoolName }) : t("enquiries.threadTitleAdmission", { school: e.schoolName });
    const tag = e.kind === "ADMISSION" ? t("enquiries.admissionTag") : t("enquiries.vacancyTag");
    return (
      <Row
        key={e.id}
        title={title}
        caption={[`${tag} · ${relativeTime(e.lastMessageAt, locale)}`, e.lastMessagePreview].filter(Boolean).join("\n")}
        right={
          <View style={{ alignItems: "flex-end", gap: th.space[1] }}>
            {e.status === "CLOSED" ? <Pill label={t("enquiries.closedBadge")} /> : null}
            {e.unread && e.status === "OPEN" ? <Pill tone="accent" label={t("enquiries.newBadge")} /> : null}
          </View>
        }
        onPress={() => open(e.id)}
      />
    );
  };

  return (
    <Screen title={t("enquiries.title")} description={t("enquiries.intro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {!isStaff ? <Button label={t("nav.explore")} variant="secondary" onPress={() => openWeb("/explore")} /> : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {data ? (
        <>
          {everything.length > 2 || narrowed ? (
            <>
              <Chips
                label={t("enquiries.statusFilter")}
                value={status}
                options={[
                  { value: "", label: t("vacancies.filterAll") },
                  { value: "open", label: t("enquiries.statusOpen") },
                  { value: "closed", label: t("enquiries.closedBadge") },
                ]}
                onChange={setStatus}
              />
              <Chips
                label={t("enquiries.kindFilter")}
                value={kind}
                options={[
                  { value: "", label: t("vacancies.filterAll") },
                  { value: "ADMISSION", label: t("enquiries.admissionTag") },
                  { value: "VACANCY", label: t("enquiries.vacancyTag") },
                ]}
                onChange={setKind}
              />
            </>
          ) : null}
          {everything.length === 0 ? (
            <Empty
              title={t("enquiries.emptyTitle")}
              body={isStaff ? t("enquiries.emptyBodyStaff") : t("enquiries.emptyBodyParent")}
              action={isStaff ? <Button label={t("nav.messages")} variant="secondary" onPress={() => router.push("/(app)/messages" as never)} /> : <Button label={t("nav.explore")} variant="secondary" onPress={() => openWeb("/explore")} />}
            />
          ) : sent.length === 0 && inbox.length === 0 ? (
            <Empty
              title={t("common.noResultsTitle")}
              body={t("common.noResultsBody")}
              action={
                <Button
                  label={t("common.clearAll")}
                  variant="secondary"
                  onPress={() => {
                    setStatus("");
                    setKind("");
                  }}
                />
              }
            />
          ) : (
            <>
              {inbox.length > 0 ? (
                <Card title={t("enquiries.inboxTitle")}>
                  {inbox.map((e) => row(e, true))}
                </Card>
              ) : null}
              {sent.length > 0 ? (
                <Card title={t("enquiries.sentTitle")}>
                  {sent.map((e) => row(e, false))}
                </Card>
              ) : null}
            </>
          )}
        </>
      ) : null}
    </Screen>
  );
}
