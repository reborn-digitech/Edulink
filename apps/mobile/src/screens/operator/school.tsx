import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { operatorSchoolDetailSchema, type OperatorInviteAdminBody, type OperatorSchoolDetail, type OperatorSchoolUpdateBody } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Text, useToast } from "@/components";
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
 * The web's /root/[schoolId] on a phone: who runs the school (admin and
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
            <Invites schoolId={schoolId} invites={d.invites} onChanged={changed} />
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
