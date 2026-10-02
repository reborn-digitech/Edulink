import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  SUBSCRIPTION_STATUSES,
  operatorPartnersSchema,
  operatorPlansSchema,
  operatorSchoolDetailSchema,
  operatorSchoolSupportSchema,
  type OperatorInviteAdminBody,
  type OperatorSchoolDetail,
  type OperatorSchoolSupport,
  type OperatorSchoolUpdateBody,
  type OperatorSubscriptionBody,
  type SubscriptionStatus,
} from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Stat, Text, useToast } from "@/components";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Chips, openWeb } from "../staff/shared";
import { Note, Pill, param, relativeTime } from "../family/shared";

/* ------------------------------------------------------------------------- */
/* The school form — creating and correcting are the same fields              */
/* ------------------------------------------------------------------------- */

/** The web's school form (root/school-form.tsx) as the phone holds it: every field a string. */
export type SchoolFormValues = {
  name: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  addressLine: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  gradeLow: string;
  gradeHigh: string;
  timezone: string;
};

/** A new school starts in India, the product's home, on India's clock — as on the web. */
export const BLANK_SCHOOL: SchoolFormValues = {
  name: "",
  contactEmail: "",
  contactPhone: "",
  website: "",
  addressLine: "",
  city: "",
  region: "",
  postalCode: "",
  country: "India",
  gradeLow: "",
  gradeHigh: "",
  timezone: "Asia/Kolkata",
};

export function schoolFormFrom(s: OperatorSchoolDetail["school"]): SchoolFormValues {
  return {
    name: s.name,
    contactEmail: s.contactEmail,
    contactPhone: s.contactPhone ?? "",
    website: s.website ?? "",
    addressLine: s.addressLine ?? "",
    city: s.city ?? "",
    region: s.region ?? "",
    postalCode: s.postalCode ?? "",
    country: s.country ?? "",
    gradeLow: s.gradeLow ?? "",
    gradeHigh: s.gradeHigh ?? "",
    timezone: s.timezone,
  };
}

/** Every field, trimmed: the create endpoint's body. An emptied optional field is stored as nothing. */
export function trimmedSchool(values: SchoolFormValues): SchoolFormValues {
  const out = { ...values };
  for (const key of Object.keys(out) as (keyof SchoolFormValues)[]) out[key] = out[key].trim();
  return out;
}

/** Only what changed: the update endpoint takes a partial, and only the fields sent change. */
export function changedFields(initial: SchoolFormValues, values: SchoolFormValues): OperatorSchoolUpdateBody {
  const out: OperatorSchoolUpdateBody = {};
  const next = trimmedSchool(values);
  for (const key of Object.keys(next) as (keyof SchoolFormValues)[]) if (next[key] !== initial[key].trim()) out[key] = next[key];
  return out;
}

/**
 * One form for both, because they are the same fields. The grade range has
 * its own explanation, as on the web: it is what the school's admin will be
 * offered when they create classes. The server is the gate for what a
 * sentence says better (a one-letter name, a range upside down); its refusal
 * stays above the button until the next try.
 */
export function SchoolForm({
  initial,
  submitLabel,
  busy,
  error,
  editing = false,
  onSubmit,
}: {
  initial: SchoolFormValues;
  submitLabel: string;
  busy: boolean;
  error: string | null;
  /** Correcting: the button waits for a change. */
  editing?: boolean;
  onSubmit: (values: SchoolFormValues) => void;
}) {
  const t = useT();
  const th = useTheme();
  const [form, setForm] = useState<SchoolFormValues>(initial);
  const set = (key: keyof SchoolFormValues) => (value: string) => setForm((f) => ({ ...f, [key]: value }));
  const missing = !form.name.trim() || !form.contactEmail.trim() || !form.timezone.trim();
  const unchanged = editing && Object.keys(changedFields(initial, form)).length === 0;
  return (
    <View style={{ gap: th.space[3] }}>
      <Text variant="sm" bold accessibilityRole="header">
        {t("root.theSchool")}
      </Text>
      <Field label={t("root.name")} hint={t("root.nameHint")} value={form.name} onChangeText={set("name")} maxLength={200} />
      <Field label={t("root.contactEmail")} value={form.contactEmail} onChangeText={set("contactEmail")} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" maxLength={320} />
      <Field label={t("root.phone")} value={form.contactPhone} onChangeText={set("contactPhone")} keyboardType="phone-pad" maxLength={40} />
      <Field label={t("root.website")} value={form.website} onChangeText={set("website")} keyboardType="url" autoCapitalize="none" autoCorrect={false} maxLength={300} />

      <Text variant="sm" bold accessibilityRole="header">
        {t("root.gradesTaught")}
      </Text>
      <Text variant="xs" tone="muted">
        {t("root.gradesExplainer")}
      </Text>
      <View style={{ flexDirection: "row", gap: th.space[3] }}>
        <View style={{ flex: 1 }}>
          <Field label={t("root.lowestGrade")} placeholder="3" value={form.gradeLow} onChangeText={set("gradeLow")} autoCapitalize="characters" maxLength={20} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label={t("root.highestGrade")} placeholder="10" value={form.gradeHigh} onChangeText={set("gradeHigh")} autoCapitalize="characters" maxLength={20} />
        </View>
      </View>

      <Text variant="sm" bold accessibilityRole="header">
        {t("root.whereItIs")}
      </Text>
      <Field label={t("root.address")} value={form.addressLine} onChangeText={set("addressLine")} maxLength={300} />
      <Field label={t("root.city")} value={form.city} onChangeText={set("city")} maxLength={120} />
      <Field label={t("root.stateRegion")} value={form.region} onChangeText={set("region")} maxLength={120} />
      <Field label={t("root.postalCode")} value={form.postalCode} onChangeText={set("postalCode")} keyboardType="number-pad" maxLength={20} />
      <Field label={t("root.country")} value={form.country} onChangeText={set("country")} maxLength={120} />
      <Field label={t("root.timezone")} hint={t("root.timezoneHint")} value={form.timezone} onChangeText={set("timezone")} autoCapitalize="none" autoCorrect={false} maxLength={64} />

      {/* The sentence is an alert a screen reader hears at once; no retry — the button below is the retry. */}
      {error ? <Failed message={error} /> : null}
      <Button label={submitLabel} busy={busy} disabled={missing || unchanged} onPress={() => onSubmit(form)} />
    </View>
  );
}

/* ------------------------------------------------------------------------- */
/* One school                                                                 */
/* ------------------------------------------------------------------------- */

const INVITE_STATUS: Record<string, { key: TranslationKey; tone: "ok" | "warn" | "muted" }> = {
  PENDING: { key: "invites.pending", tone: "warn" },
  ACCEPTED: { key: "invites.accepted", tone: "ok" },
  REVOKED: { key: "invites.withdrawn", tone: "muted" },
  EXPIRED: { key: "invites.expired", tone: "muted" },
};

/** A write's refusal as an Error carrying the server's sentence. */
async function send(call: Promise<{ ok: true } | { ok: false; error: string }>, fallback: string): Promise<void> {
  const result = await call;
  if (!result.ok) throw new Error(errorText(result, fallback));
}

/**
 * The web's /root/[schoolId] on a phone: whether the school has been checked
 * (the operator's mark, given or withdrawn here), who runs it (admin and
 * principal invitations, sent and withdrawn here), its details, every time
 * it has been opened, and removal behind the school's exact name, typed —
 * or, once removed, restore. Erasing a school entirely stays on the web on
 * purpose: nothing comes back from it, so it keeps its own page there.
 */
export function OperatorSchool() {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const qc = useQueryClient();
  const params = useLocalSearchParams<{ schoolId?: string | string[] }>();
  const schoolId = param(params.schoolId) ?? "";
  const query = useQuery({
    queryKey: ["operator", "school", schoolId],
    enabled: Boolean(schoolId),
    queryFn: async () => operatorSchoolDetailSchema.parse(unwrap(await api().get(`/api/v1/operator/schools/${schoolId}`))),
  });
  /** The school's office, its plan and this month's usage: a second read, so the page above is not held up by it. */
  const support = useQuery({
    queryKey: ["operator", "school", schoolId, "support"],
    enabled: Boolean(schoolId) && Boolean(query.data) && !query.data?.school.removedAt,
    queryFn: async () => operatorSchoolSupportSchema.parse(unwrap(await api().get(`/api/v1/operator/schools/${schoolId}/support`))),
  });
  /** A write here changes this page, the console's list and counts, and the server log. */
  const changed = () => {
    void qc.invalidateQueries({ queryKey: ["operator", "school", schoolId] });
    void qc.invalidateQueries({ queryKey: ["operator", "overview"] });
    void qc.invalidateQueries({ queryKey: ["operator", "audit"] });
  };
  const d = query.data;
  const school = d?.school;
  const description = school
    ? school.removedAt
      ? t("root.removedAgo", { when: relativeTime(school.removedAt, locale) })
      : `${t("root.joinCode")} ${school.code} · ${school.timezone}`
    : undefined;
  if (!schoolId) {
    return (
      <Screen title={t("root.schoolMeta")}>
        <Empty icon="buildings" title={t("root.noSuchSchool")} action={<Button label={t("root.allSchools")} variant="secondary" onPress={() => router.back()} />} />
      </Screen>
    );
  }
  return (
    <Screen title={school?.name ?? t("root.schoolMeta")} description={description} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d && school ? (
        school.removedAt ? (
          <>
            <Pill label={t("root.removedBadge")} tone="danger" />
            <Restore schoolId={schoolId} onDone={changed} />
            <Access access={d.access} />
          </>
        ) : (
          <>
            <Verification schoolId={schoolId} verifiedAt={school.verifiedAt} onDone={changed} />
            <Subscription schoolId={schoolId} d={d} onDone={changed} />
            <Contact schoolId={schoolId} contact={d.contact} onDone={changed} />
            <Invites schoolId={schoolId} invites={d.invites} onChanged={changed} />
            {support.isError ? <Failed message={support.error.message} onRetry={() => void support.refetch()} /> : null}
            {support.data ? (
              <>
                <Support schoolId={schoolId} data={support.data} pending={d.invites.filter((i) => i.status === "PENDING")} onDone={changed} />
                <Plan schoolId={schoolId} data={support.data} onDone={changed} />
                <Usage usage={support.data.usage} />
              </>
            ) : null}
            <Card title={t("root.details")}>
              <Text variant="xs" tone="muted">
                {t("root.detailsDescription")}
              </Text>
              <Details schoolId={schoolId} initial={schoolFormFrom(school)} onDone={changed} />
              <Text variant="xs" tone="subtle">
                {t("root.logoNote")}
              </Text>
            </Card>
            <Access access={d.access} />
            <Remove schoolId={schoolId} name={school.name} onDone={changed} />
            <Card title={t("root.deleteTitle")}>
              <Text variant="sm" tone="muted">
                {t("root.deleteExplainer")}
              </Text>
              <Text variant="xs" tone="subtle">
                {t("root.deleteOnWeb")}
              </Text>
              <Button label={t("root.deleteCta")} variant="secondary" onPress={() => openWeb(`/root/${schoolId}`)} />
            </Card>
          </>
        )
      ) : null}
    </Screen>
  );
}

/**
 * The operator's mark that the school has been checked, given or withdrawn
 * behind a plain confirm, as on the web: neither direction ends anything.
 * The mark is what lets a school bring over a pupil who already has an
 * account elsewhere, by student code or PEN.
 */
function Verification({ schoolId, verifiedAt, onDone }: { schoolId: string; verifiedAt: string | null; onDone: () => void }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const verified = verifiedAt !== null;
  const set = useMutation({
    mutationFn: (next: boolean) => send(api().post(`/api/v1/operator/schools/${schoolId}/verification`, { verified: next }), t("root.didNotWork")),
    onSuccess: (_data, next) => {
      setConfirming(false);
      toast.show(t(next ? "root.schoolVerifiedToast" : "root.schoolUnverifiedToast"));
      onDone();
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  return (
    <Card title={t("root.verifyTitle")}>
      <View style={{ flexDirection: "row" }}>
        {verifiedAt !== null ? <Pill label={t("root.verifiedAgo", { when: relativeTime(verifiedAt, locale) })} tone="ok" /> : <Pill label={t("root.stateUnverified")} tone="warn" />}
      </View>
      <Text variant="sm" tone="muted">
        {verified ? t("root.verifiedExplainer") : t("root.verifyExplainer")}
      </Text>
      {confirming ? (
        <Note tone={verified ? "danger" : "accent"}>
          <Text variant="sm" bold>
            {verified ? t("root.unverifyConfirm") : t("root.verifyConfirm")}
          </Text>
          <View style={{ flexDirection: "row", gap: th.space[2] }}>
            <Button label={t("common.confirm")} variant={verified ? "danger" : "primary"} busy={set.isPending} onPress={() => set.mutate(!verified)} style={{ flexGrow: 1 }} />
            <Button label={t("common.keep")} variant="secondary" onPress={() => setConfirming(false)} style={{ flexGrow: 1 }} />
          </View>
        </Note>
      ) : (
        <Button label={verified ? t("root.unverifyCta") : t("root.verifyCta")} variant={verified ? "secondary" : "primary"} onPress={() => setConfirming(true)} />
      )}
    </Card>
  );
}

function Details({ schoolId, initial, onDone }: { schoolId: string; initial: SchoolFormValues; onDone: () => void }) {
  const t = useT();
  const toast = useToast();
  const save = useMutation({
    mutationFn: (body: OperatorSchoolUpdateBody) => send(api().request("PATCH", `/api/v1/operator/schools/${schoolId}`, body), t("root.didNotWork")),
    onSuccess: () => {
      toast.show(t("competitions.saved"));
      onDone();
    },
  });
  return (
    <SchoolForm
      initial={initial}
      editing
      submitLabel={t("root.saveChanges")}
      busy={save.isPending}
      error={save.isError ? save.error.message : null}
      onSubmit={(values) => save.mutate(changedFields(initial, values))}
    />
  );
}

function Invites({ schoolId, invites, onChanged }: { schoolId: string; invites: OperatorSchoolDetail["invites"]; onChanged: () => void }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const toast = useToast();
  const [role, setRole] = useState<"ADMIN" | "PRINCIPAL">("ADMIN");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);
  const invite = useMutation({
    mutationFn: (body: OperatorInviteAdminBody) => send(api().post(`/api/v1/operator/schools/${schoolId}/invites`, body), t("root.didNotWork")),
    onSuccess: () => {
      setEmail("");
      setName("");
      toast.show(t("root.invitationSent"));
      onChanged();
    },
  });
  const revoke = useMutation({
    mutationFn: (inviteId: string) => send(api().post(`/api/v1/operator/invites/${inviteId}/revoke`), t("root.didNotWork")),
    onSuccess: () => {
      setConfirming(null);
      toast.show(t("root.invitationRevoked"));
      onChanged();
    },
    onError: (e) => toast.show(`${t("root.notRevoked")}: ${e.message}`, "danger"),
  });
  return (
    <Card title={t("root.whoRuns")}>
      <Text variant="xs" tone="muted">
        {t("root.inviteNotAccount")}
      </Text>
      <Chips
        label={t("root.inviteAs")}
        value={role}
        options={[
          { value: "ADMIN", label: t("root.administrator") },
          { value: "PRINCIPAL", label: t("role.principal") },
        ]}
        onChange={setRole}
      />
      <Text variant="xs" tone="muted">
        {role === "ADMIN" ? t("root.adminExplainer") : t("root.principalExplainer")}
      </Text>
      <Field
        label={t("root.email")}
        value={email}
        onChangeText={(v) => {
          setEmail(v);
          if (invite.isError) invite.reset();
        }}
        error={invite.isError ? invite.error.message : null}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        maxLength={320}
      />
      <Field label={t("root.nameOptional")} value={name} onChangeText={setName} maxLength={120} />
      <Button label={t("root.sendInvitation")} busy={invite.isPending} disabled={!email.trim()} onPress={() => invite.mutate({ email: email.trim(), name: name.trim() || undefined, role })} />
      {invites.map((inv) => {
        const status = INVITE_STATUS[inv.status];
        return (
          <View key={inv.id} style={{ gap: th.space[1], borderTopWidth: 1, borderTopColor: th.border, paddingTop: th.space[2] }}>
            <Row
              title={inv.email ?? "—"}
              caption={[inv.role === "PRINCIPAL" ? t("role.principal") : t("root.administrator"), inv.name, relativeTime(inv.createdAt, locale)].filter(Boolean).join(" · ")}
              right={<Pill label={status ? t(status.key) : inv.status} tone={status?.tone ?? "muted"} />}
            />
            {inv.status !== "PENDING" ? null : confirming === inv.id ? (
              <Note tone="danger">
                <Text variant="sm" bold tone="danger">
                  {t("root.revokeConfirm", { email: inv.email ?? "—" })}
                </Text>
                <View style={{ flexDirection: "row", gap: th.space[2] }}>
                  <Button label={t("common.confirm")} variant="danger" busy={revoke.isPending} onPress={() => revoke.mutate(inv.id)} style={{ flexGrow: 1 }} />
                  <Button label={t("common.keep")} variant="secondary" onPress={() => setConfirming(null)} style={{ flexGrow: 1 }} />
                </View>
              </Note>
            ) : (
              <Button label={t("root.revoke")} variant="ghost" onPress={() => setConfirming(inv.id)} accessibilityLabel={`${t("root.revoke")}: ${inv.email ?? "—"}`} />
            )}
          </View>
        );
      })}
    </Card>
  );
}

function Access({ access }: { access: OperatorSchoolDetail["access"] }) {
  const t = useT();
  const { locale } = useLocale();
  return (
    <Card title={t("root.everyTimeOpened")}>
      <Text variant="xs" tone="muted">
        {t("root.schoolSeesList")}
      </Text>
      {access.length === 0 ? (
        <Text variant="sm" tone="muted">
          {t("root.never")}
        </Text>
      ) : (
        access.map((a) => (
          <Row key={a.id} icon="eye" title={a.operatorName} caption={[a.reason, relativeTime(a.startedAt, locale)].filter(Boolean).join(" · ")} right={a.live ? <Pill label={t("root.openNow")} tone="accent" /> : null} />
        ))
      )}
    </Card>
  );
}

/**
 * Removal behind the school's exact name, typed — not "are you sure": it ends
 * every membership at once. The name travels with the request and the server
 * checks it too; the button waits until the two match.
 */
function Remove({ schoolId, name, onDone }: { schoolId: string; name: string; onDone: () => void }) {
  const t = useT();
  const toast = useToast();
  const [typed, setTyped] = useState("");
  const remove = useMutation({
    mutationFn: (confirmName: string) => send(api().post(`/api/v1/operator/schools/${schoolId}/remove`, { confirmName }), t("root.didNotWork")),
    onSuccess: () => {
      setTyped("");
      toast.show(t("root.schoolRemovedToast"));
      onDone();
    },
  });
  const matches = typed.trim() === name;
  return (
    <Card title={t("root.removeTitle")}>
      <Text variant="sm" tone="muted">
        {t("root.removeExplainer")}
      </Text>
      <Field
        label={t("root.removeConfirm", { name })}
        value={typed}
        onChangeText={(v) => {
          setTyped(v);
          if (remove.isError) remove.reset();
        }}
        error={remove.isError ? remove.error.message : typed.trim() && !matches ? t("root.removeMismatch") : null}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={200}
      />
      <Button label={t("root.removeCta")} variant="danger" busy={remove.isPending} disabled={!matches} onPress={() => remove.mutate(typed.trim())} />
    </Card>
  );
}

/** Restore is the safe direction, so a plain confirm, as on the web: a mistaken restore is undone by removing again. */
function Restore({ schoolId, onDone }: { schoolId: string; onDone: () => void }) {
  const t = useT();
  const th = useTheme();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const restore = useMutation({
    mutationFn: () => send(api().post(`/api/v1/operator/schools/${schoolId}/restore`), t("root.didNotWork")),
    onSuccess: () => {
      setConfirming(false);
      toast.show(t("root.schoolRestoredToast"));
      onDone();
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  return (
    <Card title={t("root.restoreCta")}>
      <Text variant="sm" tone="muted">
        {t("root.removeExplainer")}
      </Text>
      <Text variant="sm" tone="muted">
        {t("root.restoreExplainer")}
      </Text>
      {confirming ? (
        <Note tone="accent">
          <Text variant="sm" bold>
            {t("root.restoreConfirm")}
          </Text>
          <View style={{ flexDirection: "row", gap: th.space[2] }}>
            <Button label={t("common.confirm")} busy={restore.isPending} onPress={() => restore.mutate()} style={{ flexGrow: 1 }} />
            <Button label={t("common.keep")} variant="secondary" onPress={() => setConfirming(false)} style={{ flexGrow: 1 }} />
          </View>
        </Note>
      ) : (
        <Button label={t("root.restoreCta")} onPress={() => setConfirming(true)} />
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------------- */
/* Help for the office, the plan, and this month's usage (2026-10-01)         */
/* ------------------------------------------------------------------------- */

/**
 * The web's support card: a pending invitation sent again, an administrator
 * emailed a one-time sign-in link, an administrator signed out of every
 * device — each behind a confirm, each aimed at a person the school already
 * made its admin, and never a password. The office is told by the server.
 */
function Support({ schoolId, data, pending, onDone }: { schoolId: string; data: OperatorSchoolSupport; pending: OperatorSchoolDetail["invites"]; onDone: () => void }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const toast = useToast();
  const [confirming, setConfirming] = useState<{ kind: "link" | "out"; userId: string; name: string } | null>(null);
  const resend = useMutation({
    mutationFn: (inviteId: string) => send(api().post(`/api/v1/operator/schools/${schoolId}/support/resend-invite`, { inviteId }), t("root.didNotWork")),
    onSuccess: () => {
      toast.show(t("root.supportResendDone"));
      onDone();
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const link = useMutation({
    mutationFn: (userId: string) => send(api().post(`/api/v1/operator/schools/${schoolId}/support/sign-in-link`, { userId }), t("root.didNotWork")),
    onSuccess: () => {
      setConfirming(null);
      toast.show(t("root.supportSignInLinkDone"));
      onDone();
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const signOut = useMutation({
    mutationFn: async (userId: string) => {
      const result = await api().post<{ ok: true; sessionsEnded: number }>(`/api/v1/operator/schools/${schoolId}/support/sign-out`, { userId });
      if (!result.ok) throw new Error(errorText(result, t("root.didNotWork")));
      return result.data.sessionsEnded;
    },
    onSuccess: (ended) => {
      setConfirming(null);
      toast.show(ended === 1 ? t("root.supportSignOutDoneOne") : t("root.supportSignOutDoneMany", { count: ended }));
      onDone();
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const sessions = (n: number) => (n === 0 ? t("root.supportLiveSessionsNone") : n === 1 ? t("root.supportLiveSessionsOne") : t("root.supportLiveSessionsMany", { count: n }));
  return (
    <Card title={t("root.support")}>
      <Text variant="xs" tone="muted">
        {t("root.supportIntro")}
      </Text>
      {pending.map((inv) => (
        <Row
          key={inv.id}
          icon="envelope"
          title={inv.email ?? "—"}
          caption={inv.role === "PRINCIPAL" ? t("role.principal") : t("root.administrator")}
          right={<Button label={t("root.supportResend")} variant="secondary" busy={resend.isPending && resend.variables === inv.id} onPress={() => resend.mutate(inv.id)} accessibilityLabel={`${t("root.supportResend")}: ${inv.email ?? "—"}`} />}
        />
      ))}
      {data.admins.length === 0 ? (
        <Text variant="sm" tone="muted">
          {t("root.supportNoAdmins")}
        </Text>
      ) : (
        data.admins.map((a) => (
          <View key={a.userId} style={{ gap: th.space[2], borderTopWidth: 1, borderTopColor: th.border, paddingTop: th.space[2] }}>
            <Row
              icon="user"
              title={a.name}
              caption={[a.role === "PRINCIPAL" ? t("role.principal") : t("root.administrator"), a.email, a.lastSeenAt ? t("root.supportLastSeen", { when: relativeTime(a.lastSeenAt, locale) }) : null].filter(Boolean).join(" · ")}
              right={<Pill label={sessions(a.liveSessions)} tone={a.liveSessions > 0 ? "accent" : "muted"} />}
            />
            {confirming?.userId === a.userId ? (
              <Note tone={confirming.kind === "out" ? "danger" : "accent"}>
                <Text variant="sm" bold>
                  {confirming.kind === "out" ? t("root.supportSignOutConfirm", { name: a.name }) : t("root.supportSignInLinkConfirm", { name: a.name })}
                </Text>
                <View style={{ flexDirection: "row", gap: th.space[2] }}>
                  <Button
                    label={t("common.confirm")}
                    variant={confirming.kind === "out" ? "danger" : "primary"}
                    busy={link.isPending || signOut.isPending}
                    onPress={() => (confirming.kind === "out" ? signOut.mutate(a.userId) : link.mutate(a.userId))}
                    style={{ flexGrow: 1 }}
                  />
                  <Button label={t("common.keep")} variant="secondary" onPress={() => setConfirming(null)} style={{ flexGrow: 1 }} />
                </View>
              </Note>
            ) : (
              <View style={{ flexDirection: "row", gap: th.space[2], flexWrap: "wrap" }}>
                <Button label={t("root.supportSignInLink")} variant="secondary" onPress={() => setConfirming({ kind: "link", userId: a.userId, name: a.name })} accessibilityLabel={`${t("root.supportSignInLink")}: ${a.name}`} style={{ flexGrow: 1 }} />
                <Button label={t("root.supportSignOut")} variant="ghost" onPress={() => setConfirming({ kind: "out", userId: a.userId, name: a.name })} accessibilityLabel={`${t("root.supportSignOut")}: ${a.name}`} style={{ flexGrow: 1 }} />
              </View>
            )}
          </View>
        ))
      )}
    </Card>
  );
}

/** Which plan the school is on, changed from the list of plans; the server audits and tells the office. */
function Plan({ schoolId, data, onDone }: { schoolId: string; data: OperatorSchoolSupport; onDone: () => void }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const qc = useQueryClient();
  const toast = useToast();
  const current = data.plan?.id ?? "";
  const [chosen, setChosen] = useState<string>(current);
  const plans = useQuery({
    queryKey: ["operator", "plans"],
    queryFn: async () => operatorPlansSchema.parse(unwrap(await api().get("/api/v1/operator/plans"))),
  });
  const assign = useMutation({
    mutationFn: (planId: string | null) => send(api().post(`/api/v1/operator/schools/${schoolId}/plan`, { planId }), t("root.didNotWork")),
    onSuccess: () => {
      toast.show(t("root.planAssigned"));
      void qc.invalidateQueries({ queryKey: ["operator", "school", schoolId, "support"] });
      void qc.invalidateQueries({ queryKey: ["operator", "plans"] });
      onDone();
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const options = [{ value: "", label: t("root.planNone") }, ...(plans.data?.items ?? []).map((p) => ({ value: p.id, label: `${p.name} (${p.code})` }))];
  return (
    <Card title={t("root.planTitle")}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
        {data.plan ? <Pill label={data.plan.name} tone="accent" /> : <Pill label={t("root.planNone")} />}
        {data.planSince ? <Pill label={t("root.planSinceAgo", { when: relativeTime(data.planSince, locale) })} /> : null}
      </View>
      <Text variant="xs" tone="muted">
        {t("root.planExplainer")}
      </Text>
      {plans.isError ? <Failed message={plans.error.message} onRetry={() => void plans.refetch()} /> : null}
      {plans.data ? <Chips label={t("root.planTitle")} value={chosen} options={options} onChange={setChosen} /> : null}
      <Button label={t("root.planAssign")} busy={assign.isPending} disabled={chosen === current} onPress={() => assign.mutate(chosen || null)} />
      <Button label={t("root.planManage")} variant="ghost" onPress={() => openWeb("/root/plans")} />
    </Card>
  );
}

/** This month against the plan: four figures, each with its cap, over-cap in red. */
function Usage({ usage }: { usage: OperatorSchoolSupport["usage"] }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  if (!usage) return null;
  const c = usage.counts;
  const figure = (value: number | undefined, cap: number | null, unit = "") => (value === undefined ? "—" : cap === null ? `${value}${unit}` : t("root.usageOfCap", { used: `${value}${unit}`, cap: `${cap}${unit}` }));
  const over = usage.over.pupils || usage.over.messages || usage.over.storageMb;
  return (
    <Card title={`${t("root.usage")} · ${usage.month}`}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
        {c ? <Pill label={over ? t("root.usageOverCap") : t("root.usageWithinCap")} tone={over ? "danger" : "ok"} /> : null}
        {usage.computedAt ? <Pill label={t("root.usageComputedAgo", { when: relativeTime(usage.computedAt, locale) })} /> : null}
      </View>
      {c ? (
        <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
          <Stat label={t("root.usagePupils")} value={figure(c.pupils, usage.caps.pupils)} tone={usage.over.pupils ? "danger" : "fg"} />
          <Stat label={t("root.usageMessages")} value={figure(c.messages, usage.caps.messages)} tone={usage.over.messages ? "danger" : "fg"} />
          <Stat label={t("root.usageStorage")} value={figure(c.storageMb, usage.caps.storageMb, " MB")} tone={usage.over.storageMb ? "danger" : "fg"} />
          <Stat label={t("root.usageActive")} value={c.activeUsers} />
        </View>
      ) : (
        <Text variant="sm" tone="muted">
          {t("root.usageNotSampled")}
        </Text>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------------- */
/* The commercial record: the subscription and the point of contact (2026-10-02) */
/* ------------------------------------------------------------------------- */

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

type SubscriptionForm = { status: string; startsAt: string; dueAt: string; invoicedAt: string; invoiceRef: string; paidAt: string; paidRef: string; partnerId: string };

function subscriptionFormFrom(d: OperatorSchoolDetail): SubscriptionForm {
  const s = d.subscription;
  return { status: s.status ?? "", startsAt: s.startsAt ?? "", dueAt: s.dueAt ?? "", invoicedAt: s.invoicedAt ?? "", invoiceRef: s.invoiceRef ?? "", paidAt: s.paidAt ?? "", paidRef: s.paidRef ?? "", partnerId: d.commission?.partnerId ?? "" };
}

/** Only what changed, with the reason: the server keeps the rest and refuses a move the list does not allow. */
export function subscriptionBody(initial: SubscriptionForm, form: SubscriptionForm, reason: string): OperatorSubscriptionBody {
  const body: OperatorSubscriptionBody = { reason: reason.trim() };
  if (form.status !== initial.status && form.status) body.status = form.status as SubscriptionStatus;
  for (const key of ["startsAt", "dueAt", "invoicedAt", "paidAt"] as const) if (form[key].trim() !== initial[key]) body[key] = form[key].trim() || null;
  for (const key of ["invoiceRef", "paidRef"] as const) if (form[key].trim() !== initial[key]) body[key] = form[key].trim() || null;
  if (form.partnerId !== initial.partnerId) body.commissionPartnerId = form.partnerId || null;
  return body;
}

/**
 * The web's subscription card: where it stands, the dates, the invoice and
 * the payment as recorded dates with references, the partner — and a
 * reason, which every change must carry. Dates are typed as YYYY-MM-DD;
 * one that is not a day is refused before the send. Recorded, never
 * collected: nothing here moves money.
 */
function Subscription({ schoolId, d, onDone }: { schoolId: string; d: OperatorSchoolDetail; onDone: () => void }) {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const initial = subscriptionFormFrom(d);
  const [form, setForm] = useState<SubscriptionForm>(initial);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const set = (key: keyof SubscriptionForm) => (value: string) => setForm((f) => ({ ...f, [key]: value }));
  const partners = useQuery({
    queryKey: ["operator", "partners"],
    queryFn: async () => operatorPartnersSchema.parse(unwrap(await api().get("/api/v1/operator/partners"))),
  });
  const save = useMutation({
    mutationFn: (body: OperatorSubscriptionBody) => send(api().post(`/api/v1/operator/schools/${schoolId}/subscription`, body), t("root.didNotWork")),
    onSuccess: () => {
      toast.show(t("root.subscriptionSaved"));
      setReason("");
      setError(null);
      void qc.invalidateQueries({ queryKey: ["operator", "dashboard"] });
      void qc.invalidateQueries({ queryKey: ["operator", "partners"] });
      onDone();
    },
    onError: (e) => setError(e.message),
  });
  const body = subscriptionBody(initial, form, reason);
  const changed = Object.keys(body).length > 1;
  const badDate = (["startsAt", "dueAt", "invoicedAt", "paidAt"] as const).some((k) => form[k].trim() && !DAY_KEY.test(form[k].trim()));
  const days = d.subscription.daysToDue;
  const stopped = d.subscription.status === "ENDED" || d.subscription.status === "SUSPENDED";
  const dueLine = days === null || stopped ? null : days === 0 ? t("root.subscriptionDueToday") : days > 0 ? t("root.subscriptionDueIn", { days }) : t("root.subscriptionOverdue", { days: -days });
  const tone = days === null || stopped ? "muted" : days < 0 ? "danger" : days <= 30 ? "warn" : "ok";
  const statusOptions = [{ value: "", label: t("root.subscriptionNotRecorded") }, ...SUBSCRIPTION_STATUSES.map((status) => ({ value: status, label: t(`root.status${status}` as TranslationKey) }))];
  const partnerOptions = [{ value: "", label: t("root.commissionNoneOption") }, ...(partners.data?.items ?? []).map((p) => ({ value: p.id, label: `${p.name} · ${(p.percentTenths / 10).toLocaleString()}%` }))];
  return (
    <Card title={t("root.subscriptionTitle")}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
        <Pill label={d.subscription.status ? t(`root.status${d.subscription.status}` as TranslationKey) : t("root.subscriptionNone")} tone={tone} />
        {dueLine ? <Pill label={dueLine} tone={tone} /> : null}
        <Pill label={d.commission ? t("root.commissionLine", { partner: d.commission.partnerName, percent: (d.commission.percentTenths / 10).toLocaleString() }) : t("root.commissionNone")} tone="accent" />
      </View>
      <Text variant="xs" tone="muted">
        {t("root.subscriptionExplainer")}
      </Text>
      {error ? (
        <Text variant="sm" tone="danger" accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
      <Chips label={t("root.subscriptionStatus")} value={form.status} options={statusOptions} onChange={set("status")} />
      {partners.isError ? <Failed message={partners.error.message} onRetry={() => void partners.refetch()} /> : null}
      {partners.data ? <Chips label={t("root.commissionPartner")} value={form.partnerId} options={partnerOptions} onChange={set("partnerId")} /> : null}
      <View style={{ flexDirection: "row", gap: th.space[3] }}>
        <View style={{ flex: 1 }}>
          <Field label={t("root.subscriptionStarts")} hint="YYYY-MM-DD" value={form.startsAt} onChangeText={set("startsAt")} keyboardType="numbers-and-punctuation" autoCapitalize="none" maxLength={10} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label={t("root.subscriptionDue")} hint="YYYY-MM-DD" value={form.dueAt} onChangeText={set("dueAt")} keyboardType="numbers-and-punctuation" autoCapitalize="none" maxLength={10} />
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: th.space[3] }}>
        <View style={{ flex: 1 }}>
          <Field label={t("root.subscriptionInvoiced")} hint="YYYY-MM-DD" value={form.invoicedAt} onChangeText={set("invoicedAt")} keyboardType="numbers-and-punctuation" autoCapitalize="none" maxLength={10} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label={t("root.subscriptionInvoiceRef")} value={form.invoiceRef} onChangeText={set("invoiceRef")} autoCapitalize="characters" maxLength={120} />
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: th.space[3] }}>
        <View style={{ flex: 1 }}>
          <Field label={t("root.subscriptionPaid")} hint="YYYY-MM-DD" value={form.paidAt} onChangeText={set("paidAt")} keyboardType="numbers-and-punctuation" autoCapitalize="none" maxLength={10} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label={t("root.subscriptionPaidRef")} value={form.paidRef} onChangeText={set("paidRef")} autoCapitalize="characters" maxLength={120} />
        </View>
      </View>
      <Field label={t("root.subscriptionReason")} hint={t("root.subscriptionReasonHint")} value={reason} onChangeText={setReason} maxLength={500} error={badDate ? t("refusal.useRealDateForm") : null} />
      <Button label={t("root.subscriptionSave")} busy={save.isPending} disabled={!changed || !reason.trim() || badDate} onPress={() => save.mutate(body)} />
    </Card>
  );
}

/** The point of contact: four fields; the server keeps only what differs. */
function Contact({ schoolId, contact, onDone }: { schoolId: string; contact: OperatorSchoolDetail["contact"]; onDone: () => void }) {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const initial = { name: contact.name ?? "", role: contact.role ?? "", phone: contact.phone ?? "", email: contact.email ?? "" };
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const set = (key: keyof typeof initial) => (value: string) => setForm((f) => ({ ...f, [key]: value }));
  const unchanged = (Object.keys(initial) as (keyof typeof initial)[]).every((k) => form[k].trim() === initial[k]);
  const save = useMutation({
    mutationFn: () => send(api().post(`/api/v1/operator/schools/${schoolId}/contact`, { name: form.name.trim() || null, role: form.role.trim() || null, phone: form.phone.trim() || null, email: form.email.trim() || null }), t("root.didNotWork")),
    onSuccess: () => {
      toast.show(t("root.contactSaved"));
      setError(null);
      void qc.invalidateQueries({ queryKey: ["operator", "dashboard"] });
      onDone();
    },
    onError: (e) => setError(e.message),
  });
  return (
    <Card title={t("root.contactTitle")}>
      <Text variant="xs" tone="muted">
        {t("root.contactExplainer")}
      </Text>
      {error ? (
        <Text variant="sm" tone="danger" accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
      <View style={{ flexDirection: "row", gap: th.space[3] }}>
        <View style={{ flex: 1 }}>
          <Field label={t("root.contactName")} value={form.name} onChangeText={set("name")} maxLength={120} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label={t("root.contactRole")} value={form.role} onChangeText={set("role")} maxLength={80} />
        </View>
      </View>
      <Field label={t("root.contactPhone")} value={form.phone} onChangeText={set("phone")} keyboardType="phone-pad" maxLength={40} />
      <Field label={t("root.pocEmail")} value={form.email} onChangeText={set("email")} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} maxLength={320} />
      <Button label={t("root.contactSave")} busy={save.isPending} disabled={unchanged} onPress={() => save.mutate()} />
    </Card>
  );
}
