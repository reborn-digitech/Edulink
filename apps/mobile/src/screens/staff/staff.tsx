import { useState } from "react";
import { useRouter } from "expo-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminStaffSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useRole } from "@/lib/session";
import { Chips, formatDateKey, roleLabel } from "./shared";

type StaffRole = "" | "TEACHER" | "PRINCIPAL" | "ADMIN";

export function staffPath(q: string, role: StaffRole, subject: string): string {
  const p = new URLSearchParams();
  if (q) p.set("q", q);
  if (role) p.set("role", role);
  if (subject) p.set("subject", subject);
  const s = p.toString();
  return `/api/v1/admin/staff${s ? `?${s}` : ""}`;
}

/** The staff roster: everyone on the staff, the record the office keeps, and their leave this year. Read-only here; the office edits in the directory. */
export function StaffRoster() {
  const t = useT();
  const role = useRole();
  const router = useRouter();
  const { locale } = useLocale();
  const [typed, setTyped] = useState("");
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<StaffRole>("");
  const [subject, setSubject] = useState("");
  const query = useQuery({
    queryKey: ["admin", "staff", q, roleFilter, subject],
    placeholderData: keepPreviousData,
    queryFn: async () => adminStaffSchema.parse(unwrap(await api().get(staffPath(q, roleFilter, subject)))),
  });
  const d = query.data;
  const filtered = Boolean(q || roleFilter || subject);
  const clear = () => {
    setTyped("");
    setQ("");
    setRoleFilter("");
    setSubject("");
  };
  return (
    <Screen title={t("staff.rosterTitle")} description={t("staff.rosterSubtitle")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Field label={t("common.searchLabel")} placeholder={t("staff.searchPlaceholder")} value={typed} onChangeText={setTyped} onSubmitEditing={() => setQ(typed.trim())} returnKeyType="search" autoCapitalize="none" />
      <Chips
        label={t("staff.roleFilter")}
        value={roleFilter}
        options={[
          { value: "", label: t("vacancies.filterAll") },
          { value: "TEACHER", label: t("role.teacherPlural") },
          { value: "PRINCIPAL", label: t("role.principalPlural") },
          { value: "ADMIN", label: t("role.adminPlural") },
        ]}
        onChange={setRoleFilter}
      />
      {d && d.subjectOptions.length > 0 ? <Chips label={t("staff.subjectFilter")} value={subject} options={[{ value: "", label: t("staff.allSubjects") }, ...d.subjectOptions.map((s) => ({ value: s.subject, label: `${s.subject} (${s.count})` }))]} onChange={setSubject} /> : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        d.staff.length === 0 ? (
          filtered ? (
            <Empty title={t("common.noResultsTitle")} body={t("common.noResultsBody")} action={<Button label={t("common.clearAll")} variant="secondary" onPress={clear} />} />
          ) : (
            <Empty
              title={t("staff.rosterEmpty")}
              body={t("staff.rosterEmptyBody")}
              action={
                role === "ADMIN" ? (
                  <Button label={t("people.invitePeople")} variant="secondary" onPress={() => router.push("/(app)/invites" as never)} />
                ) : (
                  <Button label={t("nav.messages")} variant="secondary" onPress={() => router.push("/(app)/messages" as never)} />
                )
              }
            />
          )
        ) : (
          <Card title={d.roleCounts.map((r) => `${r.count} ${roleLabel(t, r.role, r.count !== 1)}`).join(" · ")}>
            {d.staff.map((s) => {
              const record = s.staffRecord;
              const caption = [
                record?.designation ?? roleLabel(t, s.role),
                s.subjects.join(", ") || null,
                s.leadClasses.length > 0 ? t("staff.leadOf", { classes: s.leadClasses.join(", ") }) : null,
                record?.joinedOnKey ? t("staff.joined", { date: formatDateKey(record.joinedOnKey, locale) }) : null,
                record?.serviceJoinedOnKey ? `${t("staff.serviceJoinedOn")} ${formatDateKey(record.serviceJoinedOnKey, locale)}` : null,
                record?.birthdateKey ? `${t("staff.birthdate")}: ${formatDateKey(record.birthdateKey, locale)}` : null,
                s.balance ? (s.balance.entitlement === null ? t("staff.noEntitlement", { used: s.balance.used }) : t("staff.balance", { used: s.balance.used, entitlement: s.balance.entitlement, remaining: s.balance.remaining ?? 0 })) : null,
                s.balance && s.balance.pending > 0 ? t("staff.balancePending", { pending: s.balance.pending }) : null,
              ]
                .filter(Boolean)
                .join(" · ");
              return (
                <Row
                  key={s.membershipId}
                  title={s.preferredName ? `${s.name} (${s.preferredName})` : s.name}
                  caption={caption}
                  right={record?.staffNumber ? <Text variant="xs" tone="subtle">{record.staffNumber}</Text> : null}
                  onPress={() => router.push({ pathname: "/(app)/staff-record", params: { membershipId: s.membershipId } } as never)}
                />
              );
            })}
          </Card>
        )
      ) : null}
      {role === "ADMIN" ? null : (
        <Text variant="xs" tone="subtle">
          {t("staff.rosterReadOnly")}
        </Text>
      )}
      {role === "ADMIN" ? <Button label={t("staff.rosterEditLink")} variant="secondary" onPress={() => router.push("/(app)/people" as never)} /> : null}
    </Screen>
  );
}
