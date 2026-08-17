"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ClockIcon, ImageIcon, PaperPlaneTiltIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { submitPost } from "../actions";
import { useT } from "@/lib/i18n";
import { POST_CATEGORIES, type PostCategory, type Role } from "@/lib/constants";
import { CATEGORY_KEYS } from "../categories";

/**
 * Mirror MAX_UPLOAD_BYTES / MAX_VIDEO_BYTES in storage.ts. Duplicated rather
 * than imported because storage.ts is `server-only` and importing it here is a
 * build error, not a type error. The server is the one that enforces these; the
 * copies exist so a child is told before sending a hundred megabytes, not after.
 */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

/** Matches the `.max(10)` on `postSchema.media`, which is what actually enforces it. */
const MAX_PICTURES = 10;

export function ComposeForm({
  classes,
  grades,
  role,
  allowSchoolWide,
  className,
}: {
  classes: { id: string; name: string }[];
  grades: string[];
  role: Role;
  allowSchoolWide: boolean;
  className?: string;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [scope, setScope] = useState<"CLASS" | "SCHOOL">(
    classes.length > 0 ? "CLASS" : "SCHOOL",
  );
  // Deliberately unset until chosen — every post carries one of the five, and
  // an unnoticed default would put half the school's life under "Updates".
  const [category, setCategory] = useState<PostCategory | "">("");
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [audience, setAudience] = useState<"ALL" | "PARENTS" | "TEACHERS" | "STUDENTS">("ALL");
  const [audienceGrade, setAudienceGrade] = useState("");
  const [requiresAck, setRequiresAck] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * One entry per picture, each carrying its own alt text and its own preview.
   *
   * Alt text is per-image because it describes THAT image; a single shared
   * caption read out for four photographs tells a child who cannot see them
   * nothing about any of them. Validation has always required one per item.
   *
   * The preview is a blob URL the browser holds until it is revoked, so it is
   * created when the picture is added and released when it goes.
   */
  const [pictures, setPictures] = useState<
    { file: File; alt: string; preview: string }[]
  >([]);
  const pickerRef = useRef<HTMLInputElement>(null);

  // A ref so the unmount cleanup below sees the CURRENT list rather than the
  // empty one it closed over on first render. Written from an effect, not
  // during render: a render React throws away must not move the ref.
  const picturesRef = useRef(pictures);
  useEffect(() => {
    picturesRef.current = pictures;
  }, [pictures]);

  // Release every outstanding preview when the form goes away. Removal revokes
  // its own; this catches navigating away mid-compose.
  useEffect(() => {
    return () => {
      for (const picture of picturesRef.current) URL.revokeObjectURL(picture.preview);
    };
  }, []);

  function choosePictures(chosen: FileList | null) {
    if (!chosen) return;
    const incoming = Array.from(chosen);

    const room = MAX_PICTURES - pictures.length;
    if (incoming.length > room) {
      setErrors((e) => ({
        ...e,
        image:
          room === 0
            ? t("bulletin.alreadyMax", { max: MAX_PICTURES })
            : room === 1
              ? t("bulletin.roomForOne")
              : t("bulletin.roomForMany", { count: room }),
      }));
      return;
    }

    // All checks are re-done on the server, which sniffs the actual bytes
    // rather than trusting `file.type`. Doing them here too just means a child
    // is told immediately instead of after a 100 MB upload. (§6)
    const wrongType = incoming.find(
      (f) => !f.type.startsWith("image/") && !f.type.startsWith("video/"),
    );
    if (wrongType) {
      setErrors((e) => ({ ...e, image: t("bulletin.notMedia", { name: wrongType.name }) }));
      return;
    }
    const tooBig = incoming.find((f) =>
      f.type.startsWith("video/") ? f.size > MAX_VIDEO_BYTES : f.size > MAX_IMAGE_BYTES,
    );
    if (tooBig) {
      setErrors((e) => ({
        ...e,
        image: tooBig.type.startsWith("video/")
          ? t("bulletin.videoTooBig", { name: tooBig.name })
          : t("bulletin.pictureTooBig", { name: tooBig.name }),
      }));
      return;
    }

    setErrors((e) => ({ ...e, image: "" }));
    setPictures((current) => [
      ...current,
      ...incoming.map((file) => ({ file, alt: "", preview: URL.createObjectURL(file) })),
    ]);
    // Without this, picking the same file again fires no change event at all.
    if (pickerRef.current) pickerRef.current.value = "";
  }

  function describePicture(index: number, alt: string) {
    setPictures((current) => current.map((p, i) => (i === index ? { ...p, alt } : p)));
  }

  function removePicture(index: number) {
    setPictures((current) => {
      const going = current[index];
      if (going) URL.revokeObjectURL(going.preview);
      return current.filter((_, i) => i !== index);
    });
    setErrors((e) => ({ ...e, image: "", alt: "" }));
    if (pickerRef.current) pickerRef.current.value = "";
  }

  function addTag() {
    const value = tagDraft.trim().replace(/^#/, "").slice(0, 30);
    if (!value) return;
    if (tags.some((t) => t.toLowerCase() === value.toLowerCase())) {
      setTagDraft("");
      return;
    }
    if (tags.length >= 8) return;
    setTags((current) => [...current, value]);
    setTagDraft("");
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (title.trim().length < 2) next.title = t("bulletin.giveTitle");
    if (!category) next.category = t("bulletin.chooseCategory");
    if (scope === "CLASS" && !classId) next.classId = t("bulletin.chooseClass");
    // A picture nobody can hear is a picture some children cannot read at all.
    // Reported per picture, so it is obvious WHICH one is missing its words.
    pictures.forEach((picture, index) => {
      if (!picture.alt.trim()) {
        next[`alt-${index}`] = t("bulletin.describeThisPicture");
      }
    });
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    startTransition(async () => {
      // FormData, not an object: the file goes with the post in one request, and
      // the server mints the fileId. The client never names one. (§6)
      const payload = new FormData();
      payload.set("scope", scope);
      payload.set("category", category);
      payload.set("classId", scope === "CLASS" ? classId : "");
      payload.set("audience", scope === "SCHOOL" ? audience : "ALL");
      payload.set("audienceGrade", scope === "SCHOOL" && audience !== "TEACHERS" ? audienceGrade : "");
      payload.set("requiresAck", requiresAck ? "on" : "");
      payload.set("title", title.trim());
      payload.set("body", body.trim());
      for (const tag of tags) payload.append("tags", tag);
      // Files and their alt text go in as two lists in the SAME order, and the
      // server zips them back together. FormData keeps insertion order per key,
      // so appending them in lockstep here is what keeps the pairing true.
      for (const picture of pictures) {
        payload.append("images", picture.file);
        payload.append("alts", picture.alt.trim());
      }

      const result = await submitPost(payload);

      if (!result.ok) {
        setErrors(result.errors);
        toast({
          tone: "danger",
          title: t("bulletin.couldNotPost"),
          description: result.errors._form ?? t("bulletin.checkHighlighted"),
        });
        return;
      }

      if (result.status === "PENDING") {
        toast({
          tone: "ok",
          title: t("bulletin.sentToTeacher"),
          description: t("bulletin.toldWhenChecked"),
          duration: 7000,
        });
        router.push("/bulletin?filter=mine");
      } else {
        toast({ tone: "ok", title: t("bulletin.posted") });
        router.push("/bulletin");
      }
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className={cn("space-y-5", className)} noValidate>
      {errors._form && (
        <p
          role="alert"
          className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
        >
          {errors._form}
        </p>
      )}

      {(classes.length > 0 || allowSchoolWide) && (
        <fieldset>
          <legend className="text-sm font-medium text-fg">{t("bulletin.whoSees")}</legend>
          <div
            role="radiogroup"
            aria-label={t("bulletin.whoSees")}
            className="mt-2 flex gap-1 rounded-[--radius-md] bg-surface-muted p-1"
          >
            {classes.length > 0 && (
              <button
                type="button"
                role="radio"
                aria-checked={scope === "CLASS"}
                onClick={() => setScope("CLASS")}
                className={cn(
                  "min-h-11 flex-1 rounded-[--radius-sm] px-3 text-sm font-medium",
                  scope === "CLASS" ? "bg-surface text-fg shadow-sm" : "text-fg-muted",
                )}
              >
                {t("bulletin.oneClass")}
              </button>
            )}
            {allowSchoolWide && (
              <button
                type="button"
                role="radio"
                aria-checked={scope === "SCHOOL"}
                onClick={() => setScope("SCHOOL")}
                className={cn(
                  "min-h-11 flex-1 rounded-[--radius-sm] px-3 text-sm font-medium",
                  scope === "SCHOOL" ? "bg-surface text-fg shadow-sm" : "text-fg-muted",
                )}
              >
                {t("bulletin.wholeSchool")}
              </button>
            )}
          </div>
        </fieldset>
      )}

      <SelectField
        label={t("bulletin.categoryLabel")}
        required
        value={category}
        error={errors.category}
        onChange={(e) => setCategory(e.target.value as PostCategory | "")}
        hint={category ? t(CATEGORY_KEYS[category].hint) : t("bulletin.categoryIntro")}
      >
        <option value="" disabled>
          {t("bulletin.chooseCategory")}
        </option>
        {POST_CATEGORIES.map((key) => (
          <option key={key} value={key}>
            {t(CATEGORY_KEYS[key].name)}
          </option>
        ))}
      </SelectField>

      {scope === "CLASS" && classes.length > 0 && (
        <SelectField
          label={t("bulletin.classField")}
          required
          value={classId}
          error={errors.classId}
          onChange={(e) => setClassId(e.target.value)}
        >
          {classes.map((klass) => (
            <option key={klass.id} value={klass.id}>
              {klass.name}
            </option>
          ))}
        </SelectField>
      )}

      {/* A school-wide notice can be aimed: "Grade 5 parents" instead of
          everyone-or-nothing. Staff only — a student post is for everyone. */}
      {role !== "STUDENT" && scope === "SCHOOL" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label={t("bulletin.audienceLabel")}
            value={audience}
            onChange={(e) => setAudience(e.target.value as typeof audience)}
          >
            <option value="ALL">{t("bulletin.audienceAll")}</option>
            <option value="PARENTS">{t("bulletin.audienceParents")}</option>
            <option value="STUDENTS">{t("bulletin.audienceStudents")}</option>
            <option value="TEACHERS">{t("bulletin.audienceTeachers")}</option>
          </SelectField>
          {audience !== "TEACHERS" && grades.length > 0 && (
            <SelectField
              label={t("bulletin.audienceGradeLabel")}
              value={audienceGrade}
              onChange={(e) => setAudienceGrade(e.target.value)}
            >
              <option value="">{t("bulletin.audienceGradeAny")}</option>
              {grades.map((grade) => (
                <option key={grade} value={grade}>
                  {t("practice.classN", { n: grade })}
                </option>
              ))}
            </SelectField>
          )}
        </div>
      )}

      {role !== "STUDENT" && (
        <label className="flex items-start gap-3 rounded-[--radius-md] border border-border bg-surface p-3.5">
          <input
            type="checkbox"
            checked={requiresAck}
            onChange={(e) => setRequiresAck(e.target.checked)}
            className="mt-0.5 size-4 accent-[--color-accent]"
          />
          <span className="min-w-0">
            <span className="block text-sm font-medium text-fg">{t("bulletin.requireAckLabel")}</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-fg-muted">
              {t("bulletin.requireAckHint")}
            </span>
          </span>
        </label>
      )}

      <TextField
        label={t("bulletin.titleField")}
        required
        autoFocus
        placeholder={
          role === "STUDENT"
            ? t("bulletin.titlePlaceholderStudent")
            : t("bulletin.titlePlaceholderStaff")
        }
        value={title}
        error={errors.title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={200}
      />

      <div>
        <label htmlFor="post-body" className="block text-sm font-medium text-fg">
          {t("bulletin.bodyLabel")}
        </label>
        <textarea
          id="post-body"
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, 20_000))}
          rows={6}
          placeholder={
            role === "STUDENT"
              ? t("bulletin.bodyPlaceholderStudent")
              : t("bulletin.bodyPlaceholderStaff")
          }
          className="mt-1.5 w-full resize-y rounded-[--radius-md] border border-border bg-surface p-3.5 text-[0.9375rem] leading-relaxed outline-none focus:border-accent focus:ring-2 focus:ring-accent-ring/40"
        />
      </div>

      <div>
        <span className="block text-sm font-medium text-fg">{t("bulletin.pictures")}</span>

        {pictures.length > 0 && (
          <ul className="mt-1.5 space-y-3">
            {pictures.map((picture, index) => (
              <li
                key={picture.preview}
                className="space-y-3 rounded-[--radius-md] border border-border bg-surface p-3"
              >
                <div className="flex items-start gap-3">
                  {/* Local blob preview — nothing has been uploaded yet. */}
                  {picture.file.type.startsWith("video/") ? (
                    <video
                      src={picture.preview}
                      muted
                      playsInline
                      preload="metadata"
                      className="size-20 shrink-0 rounded-[--radius-sm] bg-black object-cover"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={picture.preview}
                      alt=""
                      className="size-20 shrink-0 rounded-[--radius-sm] object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">{picture.file.name}</p>
                    <p className="text-xs text-fg-muted">
                      {(picture.file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removePicture(index)}
                  >
                    {t("common.remove")}
                  </Button>
                </div>

                <TextField
                  label={
                    pictures.length === 1
                      ? t("bulletin.describeOne")
                      : t("bulletin.describeN", { n: index + 1 })
                  }
                  required
                  value={picture.alt}
                  error={errors[`alt-${index}`]}
                  onChange={(e) => describePicture(index, e.target.value)}
                  maxLength={300}
                  placeholder={t("bulletin.altPlaceholder")}
                  hint={t("bulletin.altHint")}
                />
              </li>
            ))}
          </ul>
        )}

        {pictures.length < MAX_PICTURES && (
          <>
            <label
              htmlFor="post-image"
              className="mt-1.5 flex min-h-24 cursor-pointer items-center justify-center gap-2 rounded-[--radius-md] border border-dashed border-border bg-surface p-4 text-sm font-medium text-fg-muted hover:border-accent hover:text-accent-strong focus-within:border-accent"
            >
              <ImageIcon weight="duotone" className="size-5" />
              {pictures.length === 0 ? t("bulletin.addPicture") : t("bulletin.addAnother")}
            </label>
            <input
              ref={pickerRef}
              id="post-image"
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
              className="sr-only"
              onChange={(e) => choosePictures(e.target.files)}
            />
          </>
        )}

        {errors.image && (
          <p role="alert" className="mt-1 text-xs font-medium text-danger">
            {errors.image}
          </p>
        )}
        <p className="mt-1 text-xs text-fg-muted">
          {t("bulletin.picturesHint", { max: MAX_PICTURES })}
        </p>
      </div>

      <div>
        <label htmlFor="post-tag" className="block text-sm font-medium text-fg">
          {t("bulletin.tags")}
        </label>
        <div className="mt-1.5 flex gap-2">
          <input
            id="post-tag"
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder={t("bulletin.tagPlaceholder")}
            className="min-h-12 flex-1 rounded-[--radius-md] border border-border bg-surface px-3.5 text-[0.9375rem] outline-none focus:border-accent"
          />
          <Button type="button" variant="secondary" onClick={addTag}>
            {t("common.add")}
          </Button>
        </div>
        {tags.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <li key={tag}>
                <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft py-1 pl-3 pr-1 text-xs font-semibold text-accent-strong">
                  #{tag}
                  <button
                    type="button"
                    onClick={() => setTags((c) => c.filter((t) => t !== tag))}
                    aria-label={t("bulletin.removeTag", { tag })}
                    className="grid size-6 place-items-center rounded-full hover:bg-surface/60"
                  >
                    <XIcon weight="bold" className="size-3" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-1 text-xs text-fg-muted">{t("bulletin.tagsHint")}</p>
      </div>

      {/* The rule, restated right where they press the button. */}
      {role === "STUDENT" && (
        <p className="flex items-start gap-2 rounded-[--radius-md] bg-surface-muted p-3.5 text-xs leading-relaxed text-fg-muted">
          <ClockIcon weight="fill" className="mt-0.5 size-4 shrink-0 text-accent" />
          <span>{t("bulletin.studentRule")}</span>
        </p>
      )}

      <Button
        type="submit"
        block
        size="lg"
        loading={pending}
        icon={<PaperPlaneTiltIcon weight="bold" />}
      >
        {pending ? t("common.sending") : role === "STUDENT" ? t("bulletin.sendToTeacher") : t("bulletin.postIt")}
      </Button>
    </form>
  );
}
