import { useState } from "react";
import { useRouter } from "expo-router";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { inboxConversationOpenedSchema, inboxPeopleSchema } from "@edulink/contracts";
import type { z } from "zod";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Icon, Loading, Row, Screen } from "@/components";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useRole } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { Chips, openWeb, roleLabel } from "../staff/shared";

type People = z.infer<typeof inboxPeopleSchema>;
type Person = People["people"][number];
type Group = "" | "staff" | "pupils" | "parents";

const GROUP_KEY: Record<Exclude<Group, "">, TranslationKey> = { staff: "convo.staffGroup", pupils: "convo.pupilsGroup", parents: "convo.parentsGroup" };
const GROUPS: Exclude<Group, "">[] = ["staff", "pupils", "parents"];

function groupOf(person: Person): Exclude<Group, ""> {
  if (person.role === "STUDENT") return "pupils";
  if (person.role === "PARENT") return "parents";
  return "staff";
}

/** `?school=&q=` — the web's people picker reads both from its URL; nothing at all for the first school and everyone. */
export function peopleQuery(schoolId: string | null, q: string): string {
  const parts: string[] = [];
  if (schoolId) parts.push(`school=${encodeURIComponent(schoolId)}`);
  if (q) parts.push(`q=${encodeURIComponent(q)}`);
  return parts.length ? `?${parts.join("&")}` : "";
}

/**
 * Who to write to — the web's /remarks/people: everyone this person may
 * reach at the school, by name, grouped by what they are. The list IS the
 * rule (a pupil sees staff and nothing else), so no row needs a greyed-out
 * button. Pressing a name is the whole gesture, as on the web: the room with
 * that person is found or made, and the first message is written in it.
 */
export function Directory() {
  const t = useT();
  const th = useTheme();
  const role = useRole();
  const router = useRouter();
  const [typed, setTyped] = useState("");
  const [q, setQ] = useState("");
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [group, setGroup] = useState<Group>("");
  const [error, setError] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["shared", "people", schoolId, q],
    placeholderData: keepPreviousData,
    queryFn: async () => inboxPeopleSchema.parse(unwrap(await api().get(`/api/v1/shared/people${peopleQuery(schoolId, q)}`))),
  });
  const open = useMutation({
    mutationFn: async (body: { schoolId: string; userId: string }) => {
      const result = await api().post("/api/v1/shared/conversations", body);
      if (!result.ok) throw new Error(errorText(result, t("common.somethingWrong")));
      return inboxConversationOpenedSchema.parse(result.data);
    },
    onSuccess: (opened) => {
      setError(null);
      router.push({ pathname: "/(app)/messages/room", params: { conversationId: opened.conversationId } } as never);
    },
    onError: (e) => setError(e.message),
  });
  const d = query.data;
  const groups = GROUPS.map((key) => ({ key, people: d?.people.filter((p) => groupOf(p) === key) ?? [] })).filter((g) => g.people.length > 0 && (!group || g.key === group));
  const narrowed = Boolean(q || group);
  const clear = () => {
    setTyped("");
    setQ("");
    setGroup("");
  };
  const canWriteAboutPupil = role === "TEACHER" || role === "STUDENT" || role === "PARENT";
  return (
    <Screen title={t("convo.pickPerson")} description={t("convo.rule")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {error ? <Failed message={error} /> : null}
      {canWriteAboutPupil ? (
        <Card>
          <Row title={t("convo.writeAboutPupil")} caption={t("convo.writeAboutPupilHint")} right={<Icon name="caretRight" size={18} color={th.fgSubtle} />} onPress={() => openWeb("/remarks/new")} />
        </Card>
      ) : null}
      {d && d.schools.length > 1 ? <Chips label={t("convo.chooseSchool")} value={schoolId ?? d.schoolId} options={d.schools.map((s) => ({ value: s.id, label: s.name }))} onChange={setSchoolId} /> : null}
      <Field label={t("convo.searchPeople")} placeholder={t("convo.searchPeople")} value={typed} onChangeText={setTyped} onSubmitEditing={() => setQ(typed.trim())} returnKeyType="search" autoCapitalize="none" />
      <Chips label={t("staff.roleFilter")} value={group} options={[{ value: "" as Group, label: t("vacancies.filterAll") }, ...GROUPS.map((g) => ({ value: g as Group, label: t(GROUP_KEY[g]) }))]} onChange={setGroup} />
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        groups.length === 0 ? (
          narrowed ? (
            <Empty title={q ? t("convo.nothingMatches", { query: q }) : t("common.noResultsTitle")} body={t("common.noResultsBody")} action={<Button label={t("people.clearFilters")} variant="secondary" onPress={clear} />} />
          ) : (
            <Empty title={t("convo.emptyPeople")} body={t("convo.rule")} action={<Button label={t("nav.messages")} variant="secondary" onPress={() => router.push("/(app)/messages" as never)} />} />
          )
        ) : (
          groups.map((g) => (
            <Card key={g.key} title={`${t(GROUP_KEY[g.key])} · ${g.people.length}`}>
              {g.people.map((person) => (
                <Row
                  key={person.userId}
                  title={person.name}
                  caption={[roleLabel(t, person.role), person.detail].filter(Boolean).join(" · ")}
                  right={<Icon name="paperPlane" size={18} color={open.isPending && open.variables?.userId === person.userId ? th.fgSubtle : th.accentStrong} />}
                  onPress={() => {
                    if (!open.isPending) open.mutate({ schoolId: d.schoolId, userId: person.userId });
                  }}
                />
              ))}
            </Card>
          ))
        )
      ) : null}
    </Screen>
  );
}
