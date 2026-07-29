"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ClockIcon, PaperPlaneTiltIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { submitPost } from "../actions";
import type { Role } from "@/lib/constants";

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
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    startTransition(async () => {
      const result = await submitPost({
        scope,
        classId: scope === "CLASS" ? classId : "",
        title: title.trim(),
        body: body.trim(),
        tags,
        // Media needs the upload pipeline wired (storage.ts is written but not
        // yet used by any screen), so posts are text-only for now.
        media: [],
      });

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
