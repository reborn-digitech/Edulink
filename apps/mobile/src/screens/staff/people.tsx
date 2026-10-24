import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminPeopleSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Icon, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useRole } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { StaffRoster } from "./staff";
import { Chips, formatDateKey, roleLabel } from "./shared";
import { useCollege } from "@/lib/institution";

type PeopleRole = "" | "TEACHER" | "STUDENT" | "ADMIN" | "PRINCIPAL";
type Status = "ACTIVE" | "SUSPENDED" | "LEFT";

export function peoplePath(q: string, role: PeopleRole, status: Status, page: number): string {
  const p = new URLSearchParams();
  if (q) p.set("q", q);
  if (role) p.set("role", role);
  p.set("status", status);
  p.set("page", String(page));
  return `/api/v1/admin/people?${p.toString()}`;
}

/**
 * People: the directory one page at a time, with the two ways in beside it —
 * inviting people (the invitations and the waiting list have their own
 * screen) and admitting pupils from a list. The directory is the office's;
 * the head's People tab is the staff roster, the page the API admits them to.
 */
export function People() {
  const role = useRole();
  const t = useT();
  if (role === "PRINCIPAL") return <StaffRoster />;
  if (role !== "ADMIN")
    return (
      <Screen title={t("nav.people")}>
        <Loading />
      </Screen>
    );
  return <Directory />;
}

function Directory() {
  const t = useT();
  // A college admits students (QA-69).
  const college = useCollege();
  const th = useTheme();
  const router = useRouter();
  const [typed, setTyped] = useState("");
  const [q, setQ] = useState("");
  const [role, setRole] = useState<PeopleRole>("");
  const [status, setStatus] = useState<Status>("ACTIVE");
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["admin", "people", q, role, status, page],
    placeholderData: keepPreviousData,
    queryFn: async () => adminPeopleSchema.parse(unwrap(await api().get(peoplePath(q, role, status, page)))),
  });
  const d = query.data;
  const filtered = Boolean(q || role || status !== "ACTIVE");
  const invite = () => router.push("/(app)/invites" as never);
  const clear = () => {
    setTyped("");
    setQ("");
    setRole("");
    setStatus("ACTIVE");
    setPage(1);
  };
  return (
    <Screen title={t("nav.people")} description={d ? d.roleCounts.map((r) => t("people.countOfRole", { count: r.count, role: roleLabel(t, r.role, r.count !== 1) })).join(" · ") : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <View style={{ flexDirection: "row", gap: th.space[2], flexWrap: "wrap" }}>
        <Button label={t("people.invitePeople")} icon={<Icon name="userPlus" size={20} color={th.accentFg} />} onPress={invite} style={{ flexGrow: 1 }} />
        <Button label={t(college ? "qaInterface.admitStudents" : "intake.fromPeople")} variant="secondary" onPress={() => router.push("/(app)/intake" as never)} style={{ flexGrow: 1 }} />
      </View>
      <Field label={t("people.searchLabel")} placeholder={t("people.searchPlaceholder")} value={typed} onChangeText={setTyped} onSubmitEditing={() => { setQ(typed.trim()); setPage(1); }} returnKeyType="search" autoCapitalize="none" />
      <Chips
        label={t("invites.roleFilter")}
        value={role}
        options={[
          { value: "", label: t("people.everyone") },
          { value: "TEACHER", label: t("role.teacherPlural") },
          { value: "STUDENT", label: t("role.studentPlural") },
          { value: "ADMIN", label: t("role.adminPlural") },
          { value: "PRINCIPAL", label: t("role.principalPlural") },
        ]}
        onChange={(next) => { setRole(next); setPage(1); }}
      />
      <Chips
        label={t("invites.filter")}
        value={status}
        options={[
          { value: "ACTIVE", label: t("people.inTheSchool") },
          { value: "SUSPENDED", label: t("people.pausedCount", { count: d?.suspendedCount ?? 0 }) },
          { value: "LEFT", label: t("people.leftCount", { count: d?.leftCount ?? 0 }) },
        ]}
        onChange={(next) => { setStatus(next); setPage(1); }}
      />
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        d.members.length === 0 ? (
          filtered ? (
            <Empty title={t("people.noMatches")} body={t("people.noMatchesBody")} action={<Button label={t("people.clearFilters")} variant="secondary" onPress={clear} />} />
          ) : (
            <Empty icon="users" title={t("people.nobodyHereYet")} body={t("people.nobodyHereBody")} action={<Button label={t("people.invitePeople")} variant="secondary" onPress={invite} />} />
          )
        ) : (
          <Card title={t("people.showingRange", { from: (d.page - 1) * d.pageSize + 1, to: (d.page - 1) * d.pageSize + d.members.length, total: d.total })}>
            {status === "SUSPENDED" ? <Text variant="xs" tone="muted">{t("people.suspendedNote")}</Text> : null}
            {status === "LEFT" ? <Text variant="xs" tone="muted">{t("people.leftNote")}</Text> : null}
            {/* Every row opens the person: a pupil's health card, record and leaving, a member of staff's record. */}
            {d.members.map((m) => (
              <Row
                key={m.membershipId}
                title={m.preferredName ? `${m.name} (${m.preferredName})` : m.name}
                caption={[roleLabel(t, m.role), m.email ?? t("people.noEmail"), [...m.enrolledIn, ...m.teaches].join(", ") || null, m.scheduledDeparture ? t("people.leavingOn", { date: formatDateKey(m.scheduledDeparture.leaveOnKey) }) : null].filter(Boolean).join(" · ")}
                right={m.studentCode ? <Text variant="xs" tone="subtle">{m.studentCode}</Text> : null}
                onPress={() => router.push({ pathname: "/(app)/person", params: { membershipId: m.membershipId, name: m.name, role: m.role, left: m.leftAt ? "1" : "", leavingOn: m.scheduledDeparture?.leaveOnKey ?? "", status: m.status, birthdate: m.birthdateKey ?? "", subjects: m.subjects.join(",") } } as never)}
              />
            ))}
            {d.pages > 1 ? (
              <View accessibilityLabel={t("people.pagination")} style={{ flexDirection: "row", alignItems: "center", gap: th.space[2] }}>
                <Button label={t("people.previous")} variant="secondary" disabled={d.page <= 1} onPress={() => setPage(d.page - 1)} />
                <Text variant="sm" tone="muted" style={{ flex: 1, textAlign: "center" }}>
                  {t("people.pageOf", { page: d.page, pages: d.pages })}
                </Text>
                <Button label={t("people.next")} variant="secondary" disabled={d.page >= d.pages} onPress={() => setPage(d.page + 1)} />
              </View>
            ) : null}
          </Card>
        )
      ) : null}
    </Screen>
  );
}
