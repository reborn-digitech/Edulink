import { useRef, useState } from "react";
import { TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminClassesSchema, adminInvitesSchema, inviteCreatedSchema, officeInvitePreviewSchema, okSchema, type AdminInvites, type OfficeInvitePreview } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Icon, Loading, Row, Screen, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Pill } from "../family/shared";
import { Chips, formatDateKey, problemLine, roleLabel } from "./shared";
import { useSession } from "@/lib/session";
import { isCollegeKind } from "@edulink/contracts";

// The module roles' staff too (3 Oct 2026), and a college's six staff roles (4 Oct 2026); never the alumnus, whom only a departure makes, nor the recruiter, who registers.
type InviteRole = "TEACHER" | "STUDENT" | "ADMIN" | "PRINCIPAL" | "DRIVER" | "LIBRARIAN" | "WARDEN" | "FACULTY" | "HOD" | "EXAM_CONTROLLER" | "IQAC" | "TPO" | "ACCOUNTS";
type Created = ReturnType<typeof inviteCreatedSchema.parse>;
export type InviteBody = { role: InviteRole; csv: string; classId?: string };

const SCHOOL_INVITES: InviteRole[] = ["TEACHER", "STUDENT", "ADMIN", "PRINCIPAL", "DRIVER", "LIBRARIAN", "WARDEN"];
/** A college invites its six staff roles and no TEACHER, as the web's invitableRolesFor (4 Oct 2026). */
const COLLEGE_INVITES: InviteRole[] = ["FACULTY", "HOD", "STUDENT", "ADMIN", "PRINCIPAL", "EXAM_CONTROLLER", "IQAC", "TPO", "ACCOUNTS", "DRIVER", "LIBRARIAN", "WARDEN"];
/** A class is offered to the roles that have one: a teacher, a college's faculty or HOD, a pupil, the office. */
const takesClass = (role: InviteRole) => ["TEACHER", "FACULTY", "HOD", "STUDENT", "ADMIN", "PRINCIPAL"].includes(role);
const EXAMPLE = "name,email,subjects\nPriya Raman,priya@school.org,Maths;Science\nTom Fielding,tom@school.org,English";

/**
 * Inviting people — the web's /admin/invites/new and /admin/invites on one
 * screen. Who they are (the role, and a class where it helps), then the
 * pasted list checked by the server's own parser before anything is sent,
 * then the send; below, the invitations still waiting, each with a resend
 * and a withdraw that asks first. An invitation is a link sent by email, as
 * on the web: the server has no other way to deliver one.
 */
export function InvitePeople() {
  const t = useT();
  const th = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const { locale } = useLocale();
  const params = useLocalSearchParams<{ role?: string; classId?: string }>();
  const listRef = useRef<TextInput>(null);
  const session = useSession();
  const ROLES = isCollegeKind(session.status === "signed-in" ? session.me.institutionKind : null) ? COLLEGE_INVITES : SCHOOL_INVITES;
  const [chosen, setRole] = useState<InviteRole>(ROLES.includes(params.role as InviteRole) ? (params.role as InviteRole) : ROLES[0]!);
  // The kind arrives with /api/v1/me: a choice the institution does not offer reads as its first role.
  const role = ROLES.includes(chosen) ? chosen : ROLES[0]!;
  const [classId, setClassId] = useState(typeof params.classId === "string" ? params.classId : "");
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<{ csv: string; data: OfficeInvitePreview } | null>(null);
  const [result, setResult] = useState<Created | null>(null);
  const invites = useQuery({
    queryKey: ["admin", "invites"],
    queryFn: async () => adminInvitesSchema.parse(unwrap(await api().get("/api/v1/admin/people/invites"))),
  });
  const classes = useQuery({
    queryKey: ["admin", "classes", ""],
    queryFn: async () => adminClassesSchema.parse(unwrap(await api().get("/api/v1/admin/classes"))),
  });
  const refresh = () => {
    for (const queryKey of [["admin", "invites"], ["admin", "overview"], ["admin", "people"]]) void qc.invalidateQueries({ queryKey });
  };
  const check = useMutation({
    mutationFn: async (text: string) => ({ csv: text, data: officeInvitePreviewSchema.parse(unwrap(await api().post("/api/v1/office/invites/preview", { csv: text }))) }),
    onSuccess: (next) => setPreview(next),
    onError: (e) => toast.show(e.message, "danger"),
  });
  const send = useMutation({
    mutationFn: async (body: InviteBody) => inviteCreatedSchema.parse(unwrap(await api().post("/api/v1/admin/people/invites", body))),
    onSuccess: (r) => {
      setResult(r);
      setCsv("");
      setPreview(null);
      if (r.sent > 0) toast.show(r.sent === 1 ? t("invites.sentOne") : t("invites.sentMany", { count: r.sent }));
      refresh();
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const resend = useMutation({
    mutationFn: async (inviteId: string) => okSchema.parse(unwrap(await api().post(`/api/v1/office/invites/${inviteId}/resend`))),
    onSuccess: () => {
      toast.show(t("invites.resent"));
      refresh();
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const withdraw = useMutation({
    mutationFn: async (inviteId: string) => okSchema.parse(unwrap(await api().post(`/api/v1/admin/people/invites/${inviteId}/revoke`))),
    onSuccess: () => {
      toast.show(t("invites.withdrawnToast"));
      refresh();
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  // A preview belongs to the words it was made from; typing again asks for a fresh one.
  const fresh = preview && preview.csv === csv ? preview.data : null;
  const classOptions = (classes.data?.classes ?? []).filter((k) => !k.archivedAt).map((k) => ({ value: k.id, label: k.name }));
  const d = invites.data;
  return (
    <Screen
      title={t("invites.invitePeople")}
      description={t("invites.newSubtitle")}
      refreshing={invites.isRefetching}
      onRefresh={() => {
        void invites.refetch();
        void classes.refetch();
      }}
    >
      {result ? (
        <SentCard result={result} onMore={() => setResult(null)} />
      ) : (
        <Card>
          <Chips label={t("invites.inviteAs")} value={role} options={ROLES.map((r) => ({ value: r, label: roleLabel(t, r) }))} onChange={setRole} />
          {classOptions.length > 0 && takesClass(role) ? (
            <>
              <Chips label={role === "STUDENT" ? t("invites.addToClass") : t("invites.assignToClass")} value={classId} options={[{ value: "", label: t("invites.noClass") }, ...classOptions]} onChange={setClassId} />
              <Text variant="xs" tone="subtle">
                {t("invites.classHint")}
              </Text>
            </>
          ) : null}
          <Field
            ref={listRef}
            label={t("invites.emails")}
            hint={t("invites.headerOptional")}
            value={csv}
            onChangeText={setCsv}
            placeholder={EXAMPLE}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            style={{ minHeight: 120, textAlignVertical: "top" }}
          />
          {fresh ? <ListPreview preview={fresh} /> : null}
          {fresh && fresh.valid.length > 0 ? (
            <Button
              label={fresh.valid.length === 1 ? t("invites.sendOne") : t("invites.sendMany", { count: fresh.valid.length })}
              icon={<Icon name="paperPlane" size={20} color={th.accentFg} />}
              busy={send.isPending}
              onPress={() => send.mutate({ role, csv, ...(classId && takesClass(role) ? { classId } : {}) })}
            />
          ) : fresh ? null : (
            <Button label={t("invites.checkList")} disabled={!csv.trim()} busy={check.isPending} onPress={() => check.mutate(csv)} />
          )}
        </Card>
      )}
      {invites.isPending ? <Loading /> : null}
      {invites.isError ? <Failed message={invites.error.message} onRetry={() => void invites.refetch()} /> : null}
      {d ? (
        d.invites.length === 0 ? (
          <Empty
            icon="envelope"
            title={t("invites.nonePending")}
            body={t("invites.nonePendingBody")}
            action={
              <Button
                label={t("invites.invitePeople")}
                variant="secondary"
                onPress={() => {
                  setResult(null);
                  listRef.current?.focus();
                }}
              />
            }
          />
        ) : (
          <Card title={t("invites.tabCount", { label: t("invites.pending"), count: d.counts.PENDING })}>
            {d.invites.map((i) => (
              <PendingInvite
                key={i.id}
                invite={i}
                locale={locale}
                resending={resend.isPending && resend.variables === i.id}
                withdrawing={withdraw.isPending && withdraw.variables === i.id}
                onResend={() => resend.mutate(i.id)}
                onWithdraw={() => withdraw.mutate(i.id)}
              />
            ))}
          </Card>
        )
      ) : null}
    </Screen>
  );
}

/** What the server's parser made of the list: how many are ready, and each row that needs a look, with why. */
function ListPreview({ preview }: { preview: OfficeInvitePreview }) {
  const t = useT();
  const th = useTheme();
  const names = preview.valid.slice(0, 8).map((r) => r.name || r.email);
  return (
    <View accessibilityLiveRegion="polite" style={{ backgroundColor: th.surfaceMuted, borderRadius: th.radius.md, padding: th.space[3], gap: th.space[2] }}>
      <Text variant="sm" bold>
        {[t("invites.readyToInvite", { count: preview.valid.length }), preview.problems.length > 0 ? t("invites.needALook", { count: preview.problems.length }) : null].filter(Boolean).join(" · ")}
      </Text>
      {names.length > 0 ? (
        <Text variant="xs" tone="muted">
          {[...names, preview.valid.length > 8 ? t("invites.andMore", { count: preview.valid.length - 8 }) : null].filter(Boolean).join(", ")}
        </Text>
      ) : null}
      {preview.problems.slice(0, 5).map((p) => {
        const line = problemLine(t, p);
        return <Row key={`${p.line}:${p.value}`} title={line.title} caption={line.caption} />;
      })}
      {preview.problems.length > 5 ? (
        <Text variant="xs" tone="muted">
          {t("invites.andMore", { count: preview.problems.length - 5 })}
        </Text>
      ) : null}
    </View>
  );
}

/** After a send: how many are on their way, and — stated plainly — every row that did not go, with why. */
function SentCard({ result, onMore }: { result: Created; onMore: () => void }) {
  const t = useT();
  const sent = result.outcomes.filter((o) => o.status === "sent").length;
  const missed = [
    ...result.problems.map((p) => ({ key: `p${p.line}`, ...problemLine(t, p) })),
    ...result.outcomes.filter((o) => o.status !== "sent").map((o) => ({ key: `o${o.email}`, title: o.email, caption: o.reasonKey ? t(o.reasonKey as TranslationKey) : "" })),
  ];
  return (
    <Card title={sent === 1 ? t("invites.onTheWayOne") : t("invites.onTheWayMany", { count: sent })}>
      <Text variant="sm" tone="muted">
        {t("invites.onTheWayBody")}
      </Text>
      {missed.length > 0 ? (
        <>
          <Text variant="sm" bold tone="warn">
            {t("invites.notSent", { count: missed.length })}
          </Text>
          {missed.map((m) => (
            <Row key={m.key} title={m.title} caption={m.caption || undefined} />
          ))}
        </>
      ) : null}
      <Button label={t("invites.inviteMore")} variant="secondary" onPress={onMore} />
    </Card>
  );
}

/** One invitation still waiting: resend a fresh link, or withdraw it — which asks first, because somebody may be about to press the old one. */
function PendingInvite({ invite: i, locale, resending, withdrawing, onResend, onWithdraw }: { invite: AdminInvites["invites"][number]; locale: string; resending: boolean; withdrawing: boolean; onResend: () => void; onWithdraw: () => void }) {
  const t = useT();
  const th = useTheme();
  const [confirming, setConfirming] = useState(false);
  const label = i.name ?? i.email ?? t("invites.thisInvitation");
  const caption = [roleLabel(t, i.role), i.name && i.email ? i.email : null, i.expired ? null : t("invites.expiresIn", { when: formatDateKey(i.expiresAt.slice(0, 10), locale) })].filter(Boolean).join(" · ");
  return (
    <View style={{ gap: th.space[2] }}>
      <Row icon="envelope" title={label} caption={caption} right={i.expired ? <Pill label={t("invites.expired")} tone="warn" /> : null} />
      <View style={{ flexDirection: "row", gap: th.space[2], flexWrap: "wrap" }}>
        {i.email ? <Button label={t("invites.resend")} variant="secondary" busy={resending} onPress={onResend} accessibilityLabel={t("invites.resendTo", { name: label })} /> : null}
        {confirming ? (
          <>
            <Button label={t("invites.withdrawConfirm")} variant="danger" busy={withdrawing} onPress={onWithdraw} accessibilityLabel={`${t("invites.withdrawConfirm")} ${label}`} />
            <Button label={t("common.cancel")} variant="ghost" onPress={() => setConfirming(false)} />
          </>
        ) : (
          <Button label={t("invites.withdraw")} variant="ghost" onPress={() => setConfirming(true)} accessibilityLabel={t("invites.withdrawFor", { name: label })} />
        )}
      </View>
    </View>
  );
}
