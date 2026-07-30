"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ClockIcon, ImageIcon, PaperPlaneTiltIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { submitPost } from "../actions";
import type { Role } from "@/lib/constants";

/**
 * Mirrors MAX_UPLOAD_BYTES in storage.ts. Duplicated rather than imported
 * because storage.ts is `server-only` and importing it here is a build error,
 * not a type error. The server is the one that enforces this; the copy exists
 * so a child is told before sending five megabytes, not after.
 */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function ComposeForm({
  classes,
  role,
  allowSchoolWide,
  className,
}: {
  classes: { id: string; name: string }[];
  role: Role;
  allowSchoolWide: boolean;
  className?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [scope, setScope] = useState<"CLASS" | "SCHOOL">(
    classes.length > 0 ? "CLASS" : "SCHOOL",
  );
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [picture, setPicture] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [alt, setAlt] = useState("");
  const pickerRef = useRef<HTMLInputElement>(null);

  // The preview is a blob URL held by the browser until it is revoked, so it
  // has to be released when the picture changes or the page goes away.
  useEffect(() => {
    if (!picture) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(picture);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [picture]);

  function choosePicture(file: File | undefined) {
    if (!file) return;
    // Both of these are re-checked on the server, which sniffs the actual bytes
    // rather than trusting `file.type`. Doing them here too just means a child
    // is told immediately instead of after a 5 MB upload. (§6)
    if (!file.type.startsWith("image/")) {
      setErrors((e) => ({ ...e, image: "Choose a picture." }));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setErrors((e) => ({ ...e, image: "That picture is bigger than 5 MB." }));
      return;
    }
    setErrors((e) => ({ ...e, image: "", alt: "" }));
    setPicture(file);
  }

  function removePicture() {
    setPicture(null);
    setAlt("");
    setErrors((e) => ({ ...e, image: "", alt: "" }));
    // Without this, picking the same file again fires no change event.
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
    if (title.trim().length < 2) next.title = "Give it a title.";
    if (scope === "CLASS" && !classId) next.classId = "Choose a class.";
    // A picture nobody can hear is a picture some children cannot read at all.
    if (picture && !alt.trim()) next.alt = "Describe the picture, so it makes sense read aloud.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    startTransition(async () => {
      // FormData, not an object: the file goes with the post in one request, and
      // the server mints the fileId. The client never names one. (§6)
      const payload = new FormData();
      payload.set("scope", scope);
      payload.set("classId", scope === "CLASS" ? classId : "");
      payload.set("title", title.trim());
      payload.set("body", body.trim());
      for (const tag of tags) payload.append("tags", tag);
      if (picture) {
        payload.set("image", picture);
        payload.set("alt", alt.trim());
      }

      const result = await submitPost(payload);

      if (!result.ok) {
        setErrors(result.errors);
        toast({
          tone: "danger",
          title: "Could not post that",
          description: result.errors._form ?? "Check the highlighted fields.",
        });
        return;
      }

      if (result.status === "PENDING") {
        toast({
          tone: "ok",
          title: "Sent to your teacher",
          description: "You will be told as soon as they have looked at it.",
          duration: 7000,
        });
        router.push("/bulletin?filter=mine");
      } else {
        toast({ tone: "ok", title: "Posted" });
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
          <legend className="text-sm font-medium text-fg">Who sees it</legend>
          <div
            role="radiogroup"
            aria-label="Who sees it"
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
                One class
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
                Whole school
              </button>
            )}
          </div>
        </fieldset>
      )}

      {scope === "CLASS" && classes.length > 0 && (
        <SelectField
          label="Class"
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

      <TextField
        label="Title"
        required
        autoFocus
        placeholder={role === "STUDENT" ? "My volcano model" : "Sports day is moving to Friday"}
        value={title}
        error={errors.title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={200}
      />

      <div>
        <label htmlFor="post-body" className="block text-sm font-medium text-fg">
          What do you want to say?
        </label>
        <textarea
          id="post-body"
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, 20_000))}
          rows={6}
          placeholder={
            role === "STUDENT"
              ? "I built it out of papier-mâché and it actually erupts…"
              : "Because of the weather forecast, sports day moves to Friday. Same times."
          }
          className="mt-1.5 w-full resize-y rounded-[--radius-md] border border-border bg-surface p-3.5 text-[0.9375rem] leading-relaxed outline-none focus:border-accent focus:ring-2 focus:ring-accent-ring/40"
        />
      </div>

      <div>
        <span className="block text-sm font-medium text-fg">Picture</span>

        {!picture ? (
          <>
            <label
              htmlFor="post-image"
              className="mt-1.5 flex min-h-24 cursor-pointer items-center justify-center gap-2 rounded-[--radius-md] border border-dashed border-border bg-surface p-4 text-sm font-medium text-fg-muted hover:border-accent hover:text-accent-strong focus-within:border-accent"
            >
              <ImageIcon weight="duotone" className="size-5" />
              Add a picture
            </label>
            <input
              ref={pickerRef}
              id="post-image"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="sr-only"
              onChange={(e) => choosePicture(e.target.files?.[0])}
            />
          </>
        ) : (
          <div className="mt-1.5 space-y-3 rounded-[--radius-md] border border-border bg-surface p-3">
            <div className="flex items-start gap-3">
              {/* Local blob preview — nothing has been uploaded yet. */}
              {preview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt=""
                  className="size-20 shrink-0 rounded-[--radius-sm] object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-fg">{picture.name}</p>
                <p className="text-xs text-fg-muted">
                  {(picture.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={removePicture}>
                Remove
              </Button>
            </div>

            <TextField
              label="Describe the picture"
              required
              value={alt}
              error={errors.alt}
              onChange={(e) => setAlt(e.target.value)}
              maxLength={300}
              placeholder="Our class relay team crossing the line"
              hint="Read out to anyone who cannot see it. Say what is happening, not who is in it."
            />
          </div>
        )}

        {errors.image && (
          <p role="alert" className="mt-1 text-xs font-medium text-danger">
            {errors.image}
          </p>
        )}
        <p className="mt-1 text-xs text-fg-muted">
          Optional. PNG, JPEG, WebP or GIF, up to 5 MB. Location information is removed
          from photos automatically.
        </p>
      </div>

      <div>
        <label htmlFor="post-tag" className="block text-sm font-medium text-fg">
          Tags
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
            placeholder="science"
            className="min-h-12 flex-1 rounded-[--radius-md] border border-border bg-surface px-3.5 text-[0.9375rem] outline-none focus:border-accent"
          />
          <Button type="button" variant="secondary" onClick={addTag}>
            Add
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
                    aria-label={`Remove ${tag}`}
                    className="grid size-6 place-items-center rounded-full hover:bg-surface/60"
                  >
                    <XIcon weight="bold" className="size-3" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-1 text-xs text-fg-muted">
          Optional. Tags let people find related posts.
        </p>
      </div>

      {/* The rule, restated right where they press the button. */}
      {role === "STUDENT" && (
        <p className="flex items-start gap-2 rounded-[--radius-md] bg-surface-muted p-3.5 text-xs leading-relaxed text-fg-muted">
          <ClockIcon weight="fill" className="mt-0.5 size-4 shrink-0 text-accent" />
          <span>
            A teacher checks this before anyone else sees it. Do not include other
            children&rsquo;s full names, or anything you would not say out loud in class.
          </span>
        </p>
      )}

      <Button
        type="submit"
        block
        size="lg"
        loading={pending}
        icon={<PaperPlaneTiltIcon weight="bold" />}
      >
        {pending ? "Sending…" : role === "STUDENT" ? "Send to my teacher" : "Post it"}
      </Button>
    </form>
  );
}
