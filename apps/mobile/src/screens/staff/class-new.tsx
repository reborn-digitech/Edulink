import { useState } from "react";
import { Share, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminSettingsSchema, adminStaffSchema, classCreatedSchema, type AdminSettings } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Icon, Loading, Screen, Text, useToast } from "@/components";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Chips } from "./shared";

export type ClassCreateBody = { name: string; subject: string; gradeLevel: string; section: string; room: string; color: string };
type Created = { classId: string; joinCode: string; name: string; assigned: boolean };
type FieldName = "name" | "subject" | "gradeLevel" | "section" | "room";

/** The web's swatches, by name: a screen reader says "Teal", and the value is data the class carries, not a style. */
const COLOURS: { value: string; nameKey: TranslationKey }[] = [
  { value: "#f59e0b", nameKey: "classes.amber" },
  { value: "#10b981", nameKey: "classes.emerald" },
  { value: "#3b82f6", nameKey: "classes.blue" },
  { value: "#6366f1", nameKey: "classes.indigo" },
  { value: "#ec4899", nameKey: "classes.pink" },
  { value: "#8b5cf6", nameKey: "classes.violet" },
  { value: "#14b8a6", nameKey: "classes.teal" },
  { value: "#ef4444", nameKey: "classes.red" },
];

/** The grades a school with a numeric range teaches, low to high; none when the range is words ("LKG") — a guessed sequence is worse than a text box. */
export function gradesFor(low: string | null, high: string | null): string[] {
  const a = Number(low);
  const b = Number(high);
  if (!low || !high || !Number.isInteger(a) || !Number.isInteger(b) || a > b || b - a > 20) return [];
  return Array.from({ length: b - a + 1 }, (_, i) => String(a + i));
}

/** A refusal that names fields, so the sentence lands under the field it is about. */
class Refusal extends Error {
  constructor(
    message: string,
    readonly issues?: Record<string, string>,
  ) {
    super(message);
  }
}

/**
 * A new class — the web's /admin/classes/new: its name, then what helps
 * teachers find it (subject, grade, section, room, colour) and, optionally,
 * its class teacher. Assigning the teacher is a second, separately-authorised
 * write; if it fails the class still exists and says so. The join code comes
 * back at the end, big enough to read out, and goes to the share sheet.
 */
export function ClassNew() {
  const t = useT();
  const [formKey, setFormKey] = useState(0);
  const [created, setCreated] = useState<Created | null>(null);
  const settings = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: async () => adminSettingsSchema.parse(unwrap(await api().get("/api/v1/admin/settings"))),
  });
  const staff = useQuery({
    queryKey: ["admin", "staff", "", "TEACHER", ""],
    queryFn: async () => adminStaffSchema.parse(unwrap(await api().get("/api/v1/admin/staff?role=TEACHER"))),
  });
  return (
    <Screen
      title={t("meta.createClass")}
      description={t("classes.createSubtitle")}
      refreshing={settings.isRefetching}
      onRefresh={() => {
        void settings.refetch();
        void staff.refetch();
      }}
    >
      {settings.isPending ? <Loading /> : null}
      {settings.isError ? <Failed message={settings.error.message} onRetry={() => void settings.refetch()} /> : null}
      {created ? (
        <Ready
          created={created}
          onAnother={() => {
            setCreated(null);
            setFormKey((k) => k + 1);
          }}
        />
      ) : settings.data ? (
        <ClassForm key={formKey} school={settings.data.school} teachers={staff.data ? staff.data.staff.map((s) => ({ membershipId: s.membershipId, name: s.name })) : null} onCreated={setCreated} />
      ) : null}
    </Screen>
  );
}

function ClassForm({ school, teachers, onCreated }: { school: AdminSettings["school"]; teachers: { membershipId: string; name: string }[] | null; onCreated: (created: Created) => void }) {
  const t = useT();
  const toast = useToast();
  const qc = useQueryClient();
  const router = useRouter();
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");
  const [room, setRoom] = useState("");
  const [color, setColor] = useState(COLOURS[0]!.value);
  const [teacherId, setTeacherId] = useState("");
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const grades = gradesFor(school.gradeLow, school.gradeHigh);
  const range = school.gradeLow && school.gradeHigh ? `${school.gradeLow}–${school.gradeHigh}` : null;
  const create = useMutation({
    mutationFn: async (body: ClassCreateBody): Promise<Created> => {
      const result = await api().post("/api/v1/admin/classes", body);
      if (!result.ok) throw new Refusal(errorText(result, t("classes.didNotWork")), result.issues);
      const made = classCreatedSchema.parse(result.data);
      if (!teacherId) return { ...made, name: body.name, assigned: true };
      const lead = await api().post(`/api/v1/admin/classes/${made.classId}/teacher`, { teacherMembershipId: teacherId, assigned: true });
      return { ...made, name: body.name, assigned: lead.ok };
    },
    onSuccess: (r) => {
      toast.show(r.assigned ? t("classes.ready", { name: r.name }) : t("classes.createdNotAssigned"), r.assigned ? "ok" : "danger");
      for (const queryKey of [["admin", "classes"], ["admin", "overview"], ["admin", "timetable"], ["principal", "timetable"], ["principal", "classes"]]) void qc.invalidateQueries({ queryKey });
      onCreated(r);
    },
    onError: (e) => {
      if (e instanceof Refusal && e.issues && Object.keys(e.issues).length > 0) setErrors(e.issues as Partial<Record<FieldName, string>>);
      else toast.show(e.message, "danger");
    },
  });
  const edit = (field: FieldName, set: (v: string) => void) => (value: string) => {
    set(value);
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };
  function submit() {
    if (!name.trim()) {
      setErrors({ name: t("classes.needName") });
      return;
    }
    setErrors({});
    create.mutate({ name: name.trim(), subject: subject.trim(), gradeLevel: grade.trim(), section: section.trim(), room: room.trim(), color });
  }
  return (
    <>
      <Card>
        <Field label={t("classes.name")} value={name} onChangeText={edit("name", setName)} placeholder={t("classes.namePlaceholder")} hint={t("classes.nameHint")} error={errors.name} maxLength={100} />
        <Field label={t("classes.subject")} value={subject} onChangeText={edit("subject", setSubject)} placeholder={t("classes.subjectPlaceholder")} error={errors.subject} maxLength={80} />
        {grades.length > 0 ? (
          <>
            <Chips label={t("classes.gradeOrYear")} value={grade} options={[{ value: "", label: t("classes.notTiedToGrade") }, ...grades.map((g) => ({ value: g, label: g }))]} onChange={edit("gradeLevel", setGrade)} />
            {range ? (
              <Text variant="xs" tone="subtle">
                {t("classes.schoolTeaches", { range })}
              </Text>
            ) : null}
          </>
        ) : (
          <Field label={t("classes.gradeOrYear")} value={grade} onChangeText={edit("gradeLevel", setGrade)} hint={range ? t("classes.schoolTeaches", { range }) : t("classes.noGradeRange")} error={errors.gradeLevel} maxLength={24} />
        )}
        {errors.gradeLevel && grades.length > 0 ? (
          <Text variant="xs" tone="danger">
            {errors.gradeLevel}
          </Text>
        ) : null}
        <Field label={t("classes.sectionOptional")} value={section} onChangeText={edit("section", setSection)} hint={t("classes.sectionHint")} error={errors.section} maxLength={24} />
        <Field label={t("classes.roomLabel")} value={room} onChangeText={edit("room", setRoom)} error={errors.room} maxLength={40} />
        <Chips label={t("classes.colour")} value={color} options={COLOURS.map((c) => ({ value: c.value, label: t(c.nameKey) }))} onChange={setColor} />
        <Text variant="xs" tone="subtle">
          {t("classes.colourHint")}
        </Text>
      </Card>
      {teachers === null ? null : teachers.length === 0 ? (
        <Empty icon="chalkboard" title={t("admin.noTeachersYet")} body={t("classes.classTeacherHint")} action={<Button label={t("admin.inviteFirstTeacher")} variant="secondary" onPress={() => router.push({ pathname: "/(app)/invites", params: { role: "TEACHER" } } as never)} />} />
      ) : (
        <Card>
          <Chips label={t("classes.classTeacher")} value={teacherId} options={[{ value: "", label: t("classes.noTeacherAssigned") }, ...teachers.map((x) => ({ value: x.membershipId, label: x.name }))]} onChange={setTeacherId} />
          <Text variant="xs" tone="subtle">
            {t("classes.classTeacherHint")}
          </Text>
        </Card>
      )}
      <Button label={t("classes.createAction")} busy={create.isPending} disabled={!name.trim()} onPress={submit} />
    </>
  );
}

/** The class is made: its join code, to read out or share, and the way into it. */
function Ready({ created, onAnother }: { created: Created; onAnother: () => void }) {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  return (
    <Card title={t("classes.ready", { name: created.name })}>
      <Text variant="sm" tone="muted">
        {t("classes.readyBody")}
      </Text>
      <View accessible accessibilityLabel={`${t("classes.newClassCode")}: ${created.joinCode}`} style={{ borderWidth: 2, borderStyle: "dashed", borderColor: th.accent, backgroundColor: th.accentSoft, borderRadius: th.radius.md, padding: th.space[4], alignItems: "center" }}>
        <Text variant="2xl" bold tone="accent">
          {created.joinCode}
        </Text>
      </View>
      {created.assigned ? null : (
        <Text variant="sm" tone="warn">
          {t("classes.assignFromList")}
        </Text>
      )}
      <Button label={t("classes.shareCode")} variant="secondary" icon={<Icon name="share" size={20} color={th.fg} />} onPress={() => void Share.share({ message: `${created.name}: ${created.joinCode}` }).catch(() => {})} />
      <Button label={t("classes.done")} onPress={() => router.push({ pathname: "/(app)/classes/detail", params: { classId: created.classId } } as never)} />
      <Button label={t("classes.createAnother")} variant="ghost" onPress={onAnother} />
    </Card>
  );
}
