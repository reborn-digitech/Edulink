import { useState, type ReactNode } from "react";
import { View } from "react-native";
import { BLOOD_GROUPS, type HealthCardSave, type HealthCardView as HealthCard, type HealthContact } from "@edulink/contracts";
import type { Translate } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Row, ShowMore, Text } from "@/components";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { formatDateKey, formatInstant, Note } from "../family/shared";
import { Chips, type Refusal } from "../staff/shared";

/**
 * The pupil's health and emergency card, as both sides read and write it:
 * the guardian on /health for their own child, the office and the head on
 * /pupil-health for any pupil, the child's teacher there read-only. The card
 * is one short laminated thing — blood group, what the child reacts to, what
 * they take, who to call — so the view is a list of labelled lines and the
 * form is every field at once; the server keeps the whole card as sent, so a
 * cleared field stays cleared.
 */
export type BloodGroup = (typeof BLOOD_GROUPS)[number];
export type CardForm = {
  bloodGroup: BloodGroup | "";
  allergies: string;
  conditions: string;
  medications: string;
  dietary: string;
  notes: string;
  doctorName: string;
  doctorPhone: string;
  contacts: HealthContact[];
};

const BLANK_CONTACT: HealthContact = { name: "", relation: "", phone: "" };

/** The form's starting state: the card as stored, or every line empty for a card nobody has written. */
export function formFrom(card: HealthCard["card"]): CardForm {
  return {
    bloodGroup: card?.bloodGroup ?? "",
    allergies: card?.allergies ?? "",
    conditions: card?.conditions ?? "",
    medications: card?.medications ?? "",
    dietary: card?.dietary ?? "",
    notes: card?.notes ?? "",
    doctorName: card?.doctorName ?? "",
    doctorPhone: card?.doctorPhone ?? "",
    contacts: (card?.contacts ?? []).map((c) => ({ ...c })),
  };
}

/** What the server is sent: trimmed, "Not known" as null, and a person left wholly blank dropped rather than refused. */
export function bodyFrom(form: CardForm): HealthCardSave {
  return {
    bloodGroup: form.bloodGroup || null,
    allergies: form.allergies.trim(),
    conditions: form.conditions.trim(),
    medications: form.medications.trim(),
    dietary: form.dietary.trim(),
    notes: form.notes.trim(),
    doctorName: form.doctorName.trim(),
    doctorPhone: form.doctorPhone.trim(),
    contacts: form.contacts
      .map((c) => ({ name: c.name.trim(), relation: c.relation.trim(), phone: c.phone.trim() }))
      .filter((c) => c.name || c.phone),
  };
}

/** A person with a name but no number (or the other way round) cannot be called: said under the field before anything is sent. */
export function contactProblems(t: Translate, contacts: HealthContact[]): Record<number, { name?: string; phone?: string }> {
  const out: Record<number, { name?: string; phone?: string }> = {};
  contacts.forEach((c, i) => {
    const name = c.name.trim();
    const phone = c.phone.trim();
    if (!name && !phone) return;
    if (!name) out[i] = { ...out[i], name: t("refusal.required") };
    if (!phone) out[i] = { ...out[i], phone: t("refusal.required") };
    else if (phone.length < 6) out[i] = { ...out[i], phone: t("refusal.notValid") };
  });
  return out;
}

/** Today as a YYYY-MM-DD key in the phone's own zone: a check-up is dated the day it is done. */
export function todayKey(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** "29.5" → 29500 grams; blank → null; anything that is not kilograms to one decimal → "bad". */
export function kgToGrams(text: string): number | null | "bad" {
  const s = text.trim();
  if (!s) return null;
  const m = /^(\d{1,3})(?:[.,](\d))?$/.exec(s);
  if (!m) return "bad";
  return Number(m[1]) * 1000 + (m[2] ? Number(m[2]) * 100 : 0);
}

/** "132" → 132 cm; blank → null; a fraction or a word → "bad". */
export function cmToInt(text: string): number | null | "bad" {
  const s = text.trim();
  if (!s) return null;
  return /^\d{1,3}$/.test(s) ? Number(s) : "bad";
}

/** Grams as the card prints them: 29500 → "29.5", 30000 → "30". */
export function formatKg(grams: number): string {
  const whole = Math.floor(grams / 1000);
  const tenth = Math.round((grams % 1000) / 100);
  return tenth === 0 ? String(whole) : `${whole}.${tenth}`;
}

function Line({ label, value, hint }: { label: string; value: string; hint?: string }) {
  const t = useT();
  const th = useTheme();
  const empty = !value.trim();
  return (
    <View accessible accessibilityLabel={`${label}: ${empty ? t("health.none") : value}`} style={{ gap: 2, paddingVertical: th.space[1] }}>
      <Text variant="xs" bold tone="subtle" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </Text>
      <Text variant="base" tone={empty ? "subtle" : "fg"}>
        {empty ? t("health.none") : value}
      </Text>
      {hint && empty ? (
        <Text variant="xs" tone="subtle">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * The card, read-only. With no card yet, an empty state whose sentence
 * depends on who is reading: the guardian is told to write it, a teacher
 * that the office or the family does. `onEdit` puts the edit button on the
 * card's title (the office, the head, the guardian) and in the empty state.
 */
export function HealthCardView({ view, onEdit }: { view: HealthCard; onEdit?: () => void }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const card = view.card;
  const edit = onEdit ? <Button label={t("health.edit")} variant="secondary" onPress={onEdit} /> : undefined;
  if (!card) {
    return (
      <Card title={t("health.title")}>
        <Empty icon="heart" title={t("health.noCardYet")} body={onEdit ? t("health.noCardYetBody", { name: view.studentName }) : t("health.noCardStaffBody")} action={edit} />
      </Card>
    );
  }
  const by = card.updatedByName ? t("health.byName", { name: card.updatedByName }) : "";
  return (
    <Card title={t("health.title")} action={edit}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: th.space[3] }}>
        <View accessible accessibilityLabel={`${t("health.bloodGroup")}: ${card.bloodGroup ?? t("health.bloodGroupUnknown")}`} style={{ minWidth: 64, paddingVertical: th.space[2], paddingHorizontal: th.space[3], borderRadius: th.radius.md, backgroundColor: card.bloodGroup ? th.dangerSoft : th.surfaceMuted, alignItems: "center" }}>
          <Text variant="xs" tone="subtle">
            {t("health.bloodGroup")}
          </Text>
          <Text variant="2xl" bold tone={card.bloodGroup ? "danger" : "subtle"}>
            {card.bloodGroup ?? "—"}
          </Text>
        </View>
        {!card.bloodGroup ? (
          <Text variant="sm" tone="muted" style={{ flex: 1 }}>
            {t("health.bloodGroupUnknown")}
          </Text>
        ) : null}
      </View>
      <Line label={t("health.allergies")} value={card.allergies} />
      <Line label={t("health.conditions")} value={card.conditions} />
      <Line label={t("health.medications")} value={card.medications} />
      <Line label={t("health.dietary")} value={card.dietary} />
      <Line label={t("health.notes")} value={card.notes} />
      <View style={{ gap: th.space[1], paddingTop: th.space[2], borderTopWidth: 1, borderTopColor: th.border }}>
        <Text variant="base" bold accessibilityRole="header">
          {t("health.doctor")}
        </Text>
        {card.doctorName || card.doctorPhone ? (
          <Row title={card.doctorName || t("health.doctor")} caption={card.doctorPhone || undefined} />
        ) : (
          <Text variant="sm" tone="subtle">
            {t("health.none")}
          </Text>
        )}
      </View>
      <View style={{ gap: th.space[1], paddingTop: th.space[2], borderTopWidth: 1, borderTopColor: th.border }}>
        <Text variant="base" bold accessibilityRole="header">
          {t("health.contacts")}
        </Text>
        {card.contacts.length === 0 ? (
          <Text variant="sm" tone="subtle">
            {t("health.none")}
          </Text>
        ) : (
          card.contacts.map((c, i) => (
            <Row
              key={`${i}-${c.phone}`}
              title={`${i + 1}. ${c.name}`}
              caption={c.relation || undefined}
              right={
                <Text variant="sm" bold selectable style={{ fontVariant: ["tabular-nums"] }}>
                  {c.phone}
                </Text>
              }
            />
          ))
        )}
      </View>
      <Text variant="xs" tone="subtle">
        {t("health.lastUpdated", { when: formatInstant(card.updatedAt, locale, { day: "numeric", month: "short", year: "numeric" }), by })}
      </Text>
    </Card>
  );
}

/**
 * The whole card as one form. Blood group is a row of pills with "Not
 * known" first; the six lines are multiline fields with the web's hints;
 * up to three people to call, each removable by name. Nothing is sent until
 * Save, and the parent screen owns the request so it can put the server's
 * sentence above the button and refresh its own copy.
 */
export function HealthCardForm({ initial, busy, refusal, onSave, onCancel }: { initial: HealthCard["card"]; busy: boolean; refusal: Refusal | null; onSave: (body: HealthCardSave) => void; onCancel: () => void }) {
  const t = useT();
  const th = useTheme();
  const [form, setForm] = useState<CardForm>(() => formFrom(initial));
  const [tried, setTried] = useState(false);
  const set = <K extends keyof CardForm>(key: K, value: CardForm[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setContact = (i: number, patch: Partial<HealthContact>) => setForm((f) => ({ ...f, contacts: f.contacts.map((c, j) => (j === i ? { ...c, ...patch } : c)) }));
  const problems = contactProblems(t, form.contacts);
  const blocked = Object.keys(problems).length > 0;
  const issue = (key: string) => refusal?.issues[key];
  return (
    <Card title={t("health.edit")}>
      {refusal ? <Failed message={refusal.message} /> : null}
      <Chips<BloodGroup | "">
        label={t("health.bloodGroup")}
        value={form.bloodGroup}
        options={[{ value: "", label: t("health.bloodGroupUnknown") }, ...BLOOD_GROUPS.map((g) => ({ value: g, label: g }))]}
        onChange={(g) => set("bloodGroup", g)}
        disabled={busy}
      />
      <Field label={t("health.allergies")} hint={t("health.allergiesHint")} value={form.allergies} onChangeText={(v) => set("allergies", v)} multiline maxLength={500} error={issue("allergies")} />
      <Field label={t("health.conditions")} hint={t("health.conditionsHint")} value={form.conditions} onChangeText={(v) => set("conditions", v)} multiline maxLength={500} error={issue("conditions")} />
      <Field label={t("health.medications")} hint={t("health.medicationsHint")} value={form.medications} onChangeText={(v) => set("medications", v)} multiline maxLength={500} error={issue("medications")} />
      <Field label={t("health.dietary")} hint={t("health.dietaryHint")} value={form.dietary} onChangeText={(v) => set("dietary", v)} multiline maxLength={500} error={issue("dietary")} />
      <Field label={t("health.notes")} hint={t("health.notesHint")} value={form.notes} onChangeText={(v) => set("notes", v)} multiline maxLength={500} error={issue("notes")} />

      <View style={{ gap: th.space[2], paddingTop: th.space[2], borderTopWidth: 1, borderTopColor: th.border }}>
        <Text variant="base" bold accessibilityRole="header">
          {t("health.doctor")}
        </Text>
        <Field label={t("health.doctorName")} value={form.doctorName} onChangeText={(v) => set("doctorName", v)} maxLength={80} error={issue("doctorName")} />
        <Field label={t("health.doctorPhone")} value={form.doctorPhone} onChangeText={(v) => set("doctorPhone", v)} keyboardType="phone-pad" maxLength={20} error={issue("doctorPhone")} />
      </View>

      <View style={{ gap: th.space[2], paddingTop: th.space[2], borderTopWidth: 1, borderTopColor: th.border }}>
        <Text variant="base" bold accessibilityRole="header">
          {t("health.contacts")}
        </Text>
        <Text variant="xs" tone="muted">
          {t("health.contactsHint")}
        </Text>
        {form.contacts.map((c, i) => {
          const who = c.name.trim() || String(i + 1);
          return (
            <View key={i} style={{ gap: th.space[2], padding: th.space[3], borderRadius: th.radius.md, backgroundColor: th.surfaceMuted }}>
              <Field label={`${t("health.contactName")} ${i + 1}`} value={c.name} onChangeText={(name) => setContact(i, { name })} maxLength={80} error={tried ? problems[i]?.name : undefined} />
              <Field label={`${t("health.contactRelation")} ${i + 1}`} value={c.relation} onChangeText={(relation) => setContact(i, { relation })} maxLength={40} />
              <Field label={`${t("health.contactPhone")} ${i + 1}`} value={c.phone} onChangeText={(phone) => setContact(i, { phone })} keyboardType="phone-pad" maxLength={20} error={tried ? problems[i]?.phone : undefined} />
              <Button label={t("common.remove")} accessibilityLabel={t("health.removeContact", { name: who })} variant="ghost" disabled={busy} onPress={() => setForm((f) => ({ ...f, contacts: f.contacts.filter((_, j) => j !== i) }))} />
            </View>
          );
        })}
        {form.contacts.length < 3 ? <Button label={t("health.addContact")} variant="secondary" disabled={busy} onPress={() => setForm((f) => ({ ...f, contacts: [...f.contacts, { ...BLANK_CONTACT }] }))} /> : null}
        {issue("contacts") ? (
          <Text variant="xs" tone="danger" accessibilityLiveRegion="polite">
            {issue("contacts")}
          </Text>
        ) : null}
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
        <Button
          label={t("health.save")}
          busy={busy}
          onPress={() => {
            setTried(true);
            if (!blocked) onSave(bodyFrom(form));
          }}
        />
        <Button label={t("health.cancel")} variant="secondary" disabled={busy} onPress={onCancel} />
      </View>
    </Card>
  );
}

/** "Health card saved." said once, in the soft green box the settings use. */
export function SavedNote({ text }: { text: string }) {
  return (
    <Note tone="ok">
      <Text variant="sm" bold tone="ok" accessibilityLiveRegion="polite">
        {text}
      </Text>
    </Note>
  );
}

/** The school's own measurements, newest first, read-only on both sides; `action` is the office's "Record a check-up". */
export function HealthChecks({ checks, action }: { checks: HealthCard["checks"]; action?: ReactNode }) {
  const t = useT();
  const { locale } = useLocale();
  const sorted = [...checks].sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));
  return (
    <Card title={t("health.checks")} action={action}>
      <Text variant="xs" tone="muted">
        {t("health.checksHint")}
      </Text>
      {sorted.length === 0 ? (
        <Text variant="sm" tone="subtle">
          {t("health.noChecks")}
        </Text>
      ) : (
        <ShowMore items={sorted}>
          {(shown) => shown.map((c) => (
          <Row
            key={c.id}
            title={formatDateKey(c.dateKey, locale)}
            caption={
              [
                c.heightCm !== null ? `${t("health.height")} ${c.heightCm} cm` : null,
                c.weightGrams !== null ? `${t("health.weight")} ${formatKg(c.weightGrams)} kg` : null,
                c.visionLeft || c.visionRight ? `${t("health.vision")} ${c.visionLeft || "—"} / ${c.visionRight || "—"}` : null,
                c.notes || null,
              ]
                .filter(Boolean)
                .join(" · ") || t("health.none")
            }
          />
          ))}
        </ShowMore>
      )}
    </Card>
  );
}
