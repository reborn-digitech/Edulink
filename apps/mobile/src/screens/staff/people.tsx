import { useState } from "react";
import { View } from "react-native";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminInvitesSchema, adminPeopleSchema, inviteCreatedSchema, okSchema, type AdminInvites } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useRole } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { StaffRoster } from "./staff";
import { Chips, formatDateKey, Notice, openWeb, roleLabel } from "./shared";

type PeopleRole = "" | "TEACHER" | "STUDENT" | "ADMIN" | "PRINCIPAL";
type Status = "ACTIVE" | "SUSPENDED" | "LEFT";
type InviteRole = "TEACHER" | "STUDENT" | "ADMIN" | "PRINCIPAL";

export function peoplePath(q: string, role: PeopleRole, status: Status, page: number): string {
  const p = new URLSearchParams();
  if (q) p.set("q", q);
  if (role) p.set("role", role);
  p.set("status", status);
  p.set("page", String(page));
  return `/api/v1/admin/people?${p.toString()}`;
}

/**
 * People: the directory one page at a time, and the invitations — send a
 * pasted list, withdraw one that is waiting. The directory is the office's;
 * the head's People tab is the staff roster, the page the API admits them to.
 * Intake (admitting pupils from a CSV) stays on the web.
 */
export function People() {
  const role = useRole();
  const t = useT();
  const [tab, setTab] = useState<"directory" | "invites">("directory");
  if (role === "PRINCIPAL") return <StaffRoster />;
  if (role !== "ADMIN")
    return (
      <Screen title={t("nav.people")}>
        <Loading />
      </Screen>
    );
  return tab === "directory" ? <Directory onTab={setTab} /> : <Invites onTab={setTab} />;
}

function Tabs({ tab, onTab }: { tab: "directory" | "invites"; onTab: (next: "directory" | "invites") => void }) {
  const t = useT();
  return (
    <Chips
      label={t("nav.people")}
      value={tab}
      options={[
        { value: "directory", label: t("people.tabDirectory") },
        { value: "invites", label: t("people.tabInvites") },
      ]}
      onChange={onTab}
    />
  );
}

function Directory({ onTab }: { onTab: (next: "directory" | "invites") => void }) {
  const t = useT();
  const th = useTheme();
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
  const clear = () => {
    setTyped("");
    setQ("");
    setRole("");
    setStatus("ACTIVE");
    setPage(1);
  };
  return (
    <Screen title={t("nav.people")} description={d ? d.roleCounts.map((r) => t("people.countOfRole", { count: r.count, role: roleLabel(t, r.role, r.count !== 1) })).join(" · ") : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Tabs tab="directory" onTab={onTab} />
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
      <Button label={t("intake.fromPeople")} variant="secondary" onPress={() => openWeb("/admin/intake")} />
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        d.members.length === 0 ? (
          filtered ? (
            <Empty title={t("people.noMatches")} body={t("people.noMatchesBody")} action={<Button label={t("people.clearFilters")} variant="secondary" onPress={clear} />} />
          ) : (
            <Empty title={t("people.nobodyHereYet")} body={t("people.nobodyHereBody")} action={<Button label={t("people.invitePeople")} onPress={() => onTab("invites")} />} />
          )
        ) : (
          <Card title={t("people.showingRange", { from: (d.page - 1) * d.pageSize + 1, to: (d.page - 1) * d.pageSize + d.members.length, total: d.total })}>
            {status === "SUSPENDED" ? <Text variant="xs" tone="muted">{t("people.suspendedNote")}</Text> : null}
            {status === "LEFT" ? <Text variant="xs" tone="muted">{t("people.leftNote")}</Text> : null}
            {d.members.map((m) => (
              <Row
                key={m.membershipId}
                title={m.preferredName ? `${m.name} (${m.preferredName})` : m.name}
                caption={[roleLabel(t, m.role), m.email ?? t("people.noEmail"), [...m.enrolledIn, ...m.teaches].join(", ") || null, m.scheduledDeparture ? t("people.leavingOn", { date: formatDateKey(m.scheduledDeparture.leaveOnKey) }) : null].filter(Boolean).join(" · ")}
                right={m.studentCode ? <Text variant="xs" tone="subtle">{m.studentCode}</Text> : null}
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

function Invites({ onTab }: { onTab: (next: "directory" | "invites") => void }) {
  const t = useT();
  const qc = useQueryClient();
  const { locale } = useLocale();
  const [role, setRole] = useState<InviteRole>("TEACHER");
  const [csv, setCsv] = useState("");
  const [notice, setNotice] = useState<{ text: string; tone: "ok" | "danger" } | null>(null);
  const query = useQuery({
    queryKey: ["admin", "invites"],
    queryFn: async () => adminInvitesSchema.parse(unwrap(await api().get("/api/v1/admin/people/invites"))),
  });
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin", "invites"] });
    void qc.invalidateQueries({ queryKey: ["admin", "overview"] });
  };
  const send = useMutation({
    mutationFn: async () => inviteCreatedSchema.parse(unwrap(await api().post("/api/v1/admin/people/invites", { role, csv }))),
    onSuccess: (r) => {
      const failed = r.outcomes.filter((o) => o.status !== "sent").length + r.problems.length;
      setNotice({ tone: failed > 0 && r.sent === 0 ? "danger" : "ok", text: [r.sent === 1 ? t("invites.sentOne") : t("invites.sentMany", { count: r.sent }), failed > 0 ? t("invites.notSent", { count: failed }) : null].filter(Boolean).join(" · ") });
      setCsv("");
      refresh();
    },
    onError: (e) => setNotice({ tone: "danger", text: e.message }),
  });
  const revoke = useMutation({
    mutationFn: async (inviteId: string) => okSchema.parse(unwrap(await api().post(`/api/v1/admin/people/invites/${inviteId}/revoke`))),
    onSuccess: () => {
      setNotice({ tone: "ok", text: t("invites.withdrawnToast") });
      refresh();
    },
    onError: (e) => setNotice({ tone: "danger", text: `${t("invites.couldNotWithdraw")}: ${e.message}` }),
  });
  const d = query.data;
  return (
    <Screen title={t("nav.people")} description={d ? t("invites.waitingCount", { count: d.counts.PENDING }) : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Tabs tab="invites" onTab={onTab} />
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      <Card title={t("invites.invitePeople")}>
        <Chips label={t("invites.inviteAs")} value={role} options={(["TEACHER", "STUDENT", "ADMIN", "PRINCIPAL"] as InviteRole[]).map((r) => ({ value: r, label: roleLabel(t, r) }))} onChange={setRole} />
        <Field label={t("invites.emails")} hint={t("invites.headerOptional")} value={csv} onChangeText={setCsv} multiline autoCapitalize="none" autoCorrect={false} keyboardType="email-address" style={{ minHeight: 96 }} />
        <Button label={t("invites.sendInvitations")} disabled={!csv.trim()} busy={send.isPending} onPress={() => send.mutate()} />
      </Card>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? d.invites.length === 0 ? <Empty title={t("invites.nonePending")} body={t("invites.nonePendingBody")} action={<Button label={t("people.tabDirectory")} variant="secondary" onPress={() => onTab("directory")} />} /> : <PendingInvites invites={d.invites} busyId={revoke.isPending ? revoke.variables : null} onRevoke={(id) => revoke.mutate(id)} locale={locale} /> : null}
    </Screen>
  );
}

function PendingInvites({ invites, busyId, onRevoke, locale }: { invites: AdminInvites["invites"]; busyId: string | null; onRevoke: (id: string) => void; locale: string }) {
  const t = useT();
  return (
    <Card title={t("invites.pending")}>
      {invites.map((i) => (
        <Row
          key={i.id}
          title={i.name ?? i.email ?? t("invites.thisInvitation")}
          caption={[roleLabel(t, i.role), i.name && i.email ? i.email : null, i.expired ? t("invites.expired") : t("invites.expiresIn", { when: formatDateKey(i.expiresAt.slice(0, 10), locale) })].filter(Boolean).join(" · ")}
          right={<Button label={t("invites.withdraw")} variant="danger" busy={busyId === i.id} onPress={() => onRevoke(i.id)} accessibilityLabel={t("invites.withdrawFor", { name: i.name ?? i.email ?? t("invites.thisInvitation") })} />}
        />
      ))}
    </Card>
  );
}
