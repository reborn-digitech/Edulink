import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import { accountPostOptionsSchema, bulletinPostCreatedSchema, type bulletinCategorySchema } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Icon, Loading, Screen, Text, useToast } from "@/components";
import { api, API_BASE, errorText } from "@/lib/api";
import { pickAndUpload } from "@/lib/pick-file";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { SwitchRow } from "../shared/account";
import { CATEGORY, Media } from "./bulletin";
import { Chips, Note, Pill, useAuthHeaders } from "./shared";

type Options = z.infer<typeof accountPostOptionsSchema>;
type Category = z.infer<typeof bulletinCategorySchema>;
type Audience = "ALL" | "PARENTS" | "STUDENTS" | "TEACHERS";
type Picture = { fileId: string; name: string; kind: "image" | "video"; alt: string };

const CATEGORIES: Category[] = ["PEOPLE", "CAMPUS", "EVENTS", "LEARNING", "UPDATES"];
const CATEGORY_HINT: Record<Category, TranslationKey> = { PEOPLE: "bulletin.catPeopleHint", CAMPUS: "bulletin.catCampusHint", EVENTS: "bulletin.catEventsHint", LEARNING: "bulletin.catLearningHint", UPDATES: "bulletin.catUpdatesHint" };
const AUDIENCES: { value: Audience; label: TranslationKey }[] = [
  { value: "ALL", label: "bulletin.audienceAll" },
  { value: "PARENTS", label: "bulletin.audienceParents" },
  { value: "STUDENTS", label: "bulletin.audienceStudents" },
  { value: "TEACHERS", label: "bulletin.audienceTeachers" },
];
/** The contract's `.max(10)` on media, which is what the server enforces. */
const MAX_PICTURES = 10;

/**
 * A new Social Media post — the web's /bulletin/new: who sees it (one class,
 * or the whole school for staff, who may aim it at parents, pupils or staff
 * and at one grade), the category, a title and the words, pictures or a
 * video each with the words a screen reader says for it, a preview, and one
 * button. What the composer may offer comes from the server; a pupil's post
 * is read by a teacher before anyone else sees it, and the screen says so
 * before and after they press send.
 */
export function PostCompose() {
  const t = useT();
  const router = useRouter();
  const query = useQuery({
    queryKey: ["account", "post-options"],
    queryFn: async () => accountPostOptionsSchema.parse(unwrap(await api().get("/api/v1/account/post-options"))),
  });
  const d = query.data;
  return (
    <Screen
      title={d?.reviewedFirst ? t("bulletin.shareSomething") : t("bulletin.newPost")}
      description={d ? (d.reviewedFirst ? t("bulletin.studentIntro") : t("bulletin.staffIntro")) : undefined}
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
    >
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        d.classes.length === 0 && !d.allowSchoolWide ? (
          <Empty icon="megaphone" title={t("bulletin.notInClassTitle")} body={t("bulletin.notInClassBody")} action={<Button label={t("bulletin.title")} variant="secondary" onPress={() => router.push("/(app)/bulletin" as never)} />} />
        ) : (
          <Composer options={d} />
        )
      ) : null}
    </Screen>
  );
}

function Composer({ options }: { options: Options }) {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const headers = useAuthHeaders();
  const pupil = options.reviewedFirst;
  const [scope, setScope] = useState<"CLASS" | "SCHOOL">(options.classes.length > 0 ? "CLASS" : "SCHOOL");
  // Unset until chosen, as on the web: an unnoticed default would file half the school's life under one heading.
  const [category, setCategory] = useState<Category | "">("");
  const [classId, setClassId] = useState(options.classes[0]?.id ?? "");
  const [audience, setAudience] = useState<Audience>("ALL");
  const [grade, setGrade] = useState("");
  const [requiresAck, setRequiresAck] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pictures, setPictures] = useState<Picture[]>([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const aimed = !pupil && scope === "SCHOOL";

  const addPicture = async () => {
    setUploading(true);
    try {
      const picked = await pickAndUpload("media", t("bulletin.couldNotPost"));
      if (picked) setPictures((current) => [...current, { fileId: picked.fileId, name: picked.name, kind: picked.mime.startsWith("video/") ? "video" : "image", alt: "" }]);
    } catch (error) {
      toast.show(error instanceof Error ? error.message : t("bulletin.couldNotPost"), "danger");
    } finally {
      setUploading(false);
    }
  };
  const describe = (index: number, alt: string) => {
    setPictures((current) => current.map((p, i) => (i === index ? { ...p, alt } : p)));
    setErrors((e) => ({ ...e, [`alt-${index}`]: "" }));
  };
  const removePicture = (index: number) => {
    setPictures((current) => current.filter((_, i) => i !== index));
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([key]) => !key.startsWith("alt-"))));
  };

  const submit = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => api().post("/api/v1/shared/bulletin", payload),
    onSuccess: (result) => {
      if (!result.ok) {
        const next: Record<string, string> = {};
        for (const [key, message] of Object.entries(result.issues ?? {})) {
          const alt = /^media\.(\d+)\.alt$/.exec(key);
          next[alt ? `alt-${alt[1]}` : key] = message;
        }
        setErrors(next);
        toast.show(errorText(result, t("bulletin.couldNotPost")), "danger");
        return;
      }
      const created = bulletinPostCreatedSchema.parse(result.data);
      // A pupil's post waits for a teacher: said in the toast, and on the post it opens onto.
      toast.show(created.status === "PENDING" ? `${t("bulletin.sentToTeacher")}\n${t("bulletin.toldWhenChecked")}` : t("bulletin.posted"));
      void qc.invalidateQueries({ queryKey: ["bulletin"] });
      router.replace({ pathname: "/(app)/post", params: { postId: created.postId } } as never);
    },
    onError: (e) => toast.show(e.message, "danger"),
  });

  const send = () => {
    const next: Record<string, string> = {};
    if (title.trim().length < 2) next.title = t("bulletin.giveTitle");
    if (!category) next.category = t("bulletin.chooseCategory");
    if (scope === "CLASS" && !classId) next.classId = t("bulletin.chooseClass");
    // A picture nobody can hear is a picture some children cannot read at all — said per picture.
    pictures.forEach((p, i) => {
      if (!p.alt.trim()) next[`alt-${i}`] = t("bulletin.describeThisPicture");
    });
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    submit.mutate({
      scope,
      category,
      ...(scope === "CLASS" ? { classId } : {}),
      title: title.trim(),
      body: body.trim(),
      media: pictures.map((p) => ({ fileId: p.fileId, kind: p.kind, alt: p.alt.trim() })),
      audience: aimed ? audience : "ALL",
      ...(aimed && audience !== "TEACHERS" && grade ? { audienceGrade: grade } : {}),
      requiresAck: pupil ? false : requiresAck,
    });
  };

  return (
    <>
      {options.classes.length > 0 && options.allowSchoolWide ? (
        <View style={{ gap: th.space[1] }}>
          <Text variant="sm" bold>
            {t("bulletin.whoSees")}
          </Text>
          <Chips
            label={t("bulletin.whoSees")}
            value={scope}
            onChange={setScope}
            options={[
              { value: "CLASS", label: t("bulletin.oneClass") },
              { value: "SCHOOL", label: t("bulletin.wholeSchool") },
            ]}
          />
        </View>
      ) : null}

      {scope === "CLASS" && options.classes.length > 0 ? (
        <View style={{ gap: th.space[1] }}>
          <Text variant="sm" bold>
            {t("bulletin.classField")}
          </Text>
          <Chips label={t("bulletin.classField")} value={classId} onChange={setClassId} options={options.classes.map((c) => ({ value: c.id, label: c.name }))} />
          {errors.classId ? (
            <Text variant="xs" tone="danger">
              {errors.classId}
            </Text>
          ) : null}
        </View>
      ) : null}

      {aimed ? (
        <View style={{ gap: th.space[1] }}>
          <Text variant="sm" bold>
            {t("bulletin.audienceLabel")}
          </Text>
          <Chips label={t("bulletin.audienceLabel")} value={audience} onChange={setAudience} options={AUDIENCES.map((a) => ({ value: a.value, label: t(a.label) }))} />
          {audience !== "TEACHERS" && options.grades.length > 0 ? (
            <>
              <Text variant="sm" bold>
                {t("bulletin.audienceGradeLabel")}
              </Text>
              <Chips label={t("bulletin.audienceGradeLabel")} value={grade} onChange={setGrade} options={[{ value: "", label: t("bulletin.audienceGradeAny") }, ...options.grades.map((g) => ({ value: g, label: t("practice.classN", { n: g }) }))]} />
            </>
          ) : null}
        </View>
      ) : null}

      <View style={{ gap: th.space[1] }}>
        <Text variant="sm" bold>
          {t("bulletin.categoryLabel")}
        </Text>
        <Chips<Category | ""> label={t("bulletin.categoryLabel")} value={category} onChange={(next) => { setCategory(next); setErrors((e) => ({ ...e, category: "" })); }} options={CATEGORIES.map((c) => ({ value: c, label: t(CATEGORY[c]) }))} />
        <Text variant="xs" tone={errors.category ? "danger" : "subtle"} accessibilityLiveRegion="polite">
          {errors.category || (category ? t(CATEGORY_HINT[category]) : t("bulletin.categoryIntro"))}
        </Text>
      </View>

      {pupil ? null : <SwitchRow label={t("bulletin.requireAckLabel")} hint={t("bulletin.requireAckHint")} value={requiresAck} onChange={setRequiresAck} />}

      <Field label={t("bulletin.titleField")} value={title} onChangeText={(next) => { setTitle(next); setErrors((e) => ({ ...e, title: "" })); }} placeholder={pupil ? t("bulletin.titlePlaceholderStudent") : t("bulletin.titlePlaceholderStaff")} maxLength={200} error={errors.title || null} />
      <Field label={t("bulletin.bodyLabel")} value={body} onChangeText={setBody} placeholder={pupil ? t("bulletin.bodyPlaceholderStudent") : t("bulletin.bodyPlaceholderStaff")} multiline maxLength={20000} style={{ minHeight: th.space[12] * 3, textAlignVertical: "top", paddingTop: th.space[3] }} />

      <Card title={t("bulletin.pictures")}>
        {pictures.map((picture, index) => (
          <View key={picture.fileId} style={{ gap: th.space[2], paddingBottom: th.space[3], borderBottomWidth: 1, borderColor: th.border }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: th.space[3] }}>
              {picture.kind === "image" && headers ? (
                <Image source={{ uri: `${API_BASE}/api/files/${encodeURIComponent(picture.fileId)}?w=320`, headers }} accessible={false} contentFit="cover" style={{ width: th.tap * 2, height: th.tap * 2, borderRadius: th.radius.sm, backgroundColor: th.surfaceMuted }} />
              ) : (
                <View style={{ width: th.tap * 2, height: th.tap * 2, borderRadius: th.radius.sm, backgroundColor: th.surfaceMuted, alignItems: "center", justifyContent: "center" }}>
                  <Icon name="play" size={24} color={th.fgMuted} />
                </View>
              )}
              <Text variant="sm" bold style={{ flex: 1 }} numberOfLines={2}>
                {picture.name}
              </Text>
              <Button label={t("common.remove")} variant="ghost" accessibilityLabel={`${t("common.remove")}: ${picture.name}`} onPress={() => removePicture(index)} />
            </View>
            <Field
              label={pictures.length === 1 ? t("bulletin.describeOne") : t("bulletin.describeN", { n: index + 1 })}
              value={picture.alt}
              onChangeText={(next) => describe(index, next)}
              placeholder={t("bulletin.altPlaceholder")}
              hint={t("bulletin.altHint")}
              maxLength={300}
              error={errors[`alt-${index}`] || null}
            />
          </View>
        ))}
        {pictures.length < MAX_PICTURES ? (
          <Button label={pictures.length === 0 ? t("bulletin.addPicture") : t("bulletin.addAnother")} variant="secondary" icon={<Icon name="camera" size={18} color={th.fg} />} busy={uploading} onPress={() => void addPicture()} />
        ) : null}
        <Text variant="xs" tone="subtle">
          {t("bulletin.picturesHint", { max: MAX_PICTURES })}
        </Text>
      </Card>

      {title.trim() ? (
        <Card title={t("bulletin.preview")}>
          <Text variant="lg" bold>
            {title.trim()}
          </Text>
          {category ? <Pill tone="accent" label={t(CATEGORY[category])} /> : null}
          {body.trim() ? (
            <Text variant="sm" tone="muted">
              {body.trim()}
            </Text>
          ) : null}
          <Media media={pictures.map((p) => ({ fileId: p.fileId, kind: p.kind, alt: p.alt.trim() || p.name }))} headers={headers} />
        </Card>
      ) : null}

      {pupil ? (
        <Note tone="accent">
          <Text variant="sm">{t("bulletin.studentRule")}</Text>
        </Note>
      ) : null}
      <Button label={pupil ? t("bulletin.sendToTeacher") : t("bulletin.postIt")} icon={<Icon name="paperPlane" size={18} color={th.accentFg} weight="bold" />} busy={submit.isPending} disabled={uploading} onPress={send} />
    </>
  );
}
