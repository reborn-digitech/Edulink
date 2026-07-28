"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircleIcon, CopyIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { createClass, setClassTeacher } from "../actions";

const COLORS = [
  { value: "#f59e0b", name: "Amber" },
  { value: "#10b981", name: "Emerald" },
  { value: "#3b82f6", name: "Blue" },
  { value: "#6366f1", name: "Indigo" },
  { value: "#ec4899", name: "Pink" },
  { value: "#8b5cf6", name: "Violet" },
  { value: "#14b8a6", name: "Teal" },
  { value: "#ef4444", name: "Red" },
];

type Teacher = { membershipId: string; name: string; avatarKey: string | null };

export function ClassForm({ teachers, className }: { teachers: Teacher[]; className?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [room, setRoom] = useState("");
  const [color, setColor] = useState(COLORS[0]!.value);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<{ classId: string; joinCode: string } | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});

    if (name.trim().length < 1) {
      setErrors({ name: "Give the class a name." });
      return;
    }

    startTransition(async () => {
      const result = await createClass({
        name: name.trim(),
        subject: subject.trim(),
        gradeLevel: gradeLevel.trim(),
        room: room.trim(),
        color,
      });

      if (!result.ok) {
        setErrors(result.errors);
        return;
      }

      // Assigning the teacher is a separate, individually-authorised step; a
      // failure here must not make the class itself look like it failed.
      if (teacherId && result.classId) {
        const assigned = await setClassTeacher(result.classId, teacherId, true);
        if (!assigned.ok) {
          toast({
            tone: "warn",
            title: "Class created, but the teacher was not assigned",
            description: assigned.error ?? "You can assign them from the class list.",
          });
        }
      }

      setCreated({ classId: result.classId!, joinCode: result.joinCode! });
      router.refresh();
    });
  }

  if (created) {
    return (
      <div className={cn("rounded-[--radius-lg] border border-border bg-surface p-6 text-center", className)}>
        <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-ok-soft text-ok animate-confetti">
          <CheckCircleIcon weight="fill" className="size-10" />
        </div>
        <h2 className="text-xl font-bold text-fg">{name} is ready</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-fg-muted">
          Students join by entering this class code. Write it on the board, or share it in
          your next newsletter.
        </p>

        <div className="mx-auto mt-5 flex max-w-xs items-center gap-2">
          <code className="flex-1 rounded-[--radius-md] border-2 border-dashed border-accent bg-accent-soft px-4 py-3.5 text-xl font-bold tracking-[0.15em] text-accent-strong">
            {created.joinCode}
          </code>
          <Button
            variant="secondary"
            size="icon"
            aria-label="Copy class code"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(created.joinCode);
                toast({ tone: "ok", title: "Class code copied" });
              } catch {
                toast({ tone: "warn", title: "Could not copy", description: "Select the code to copy it." });
              }
            }}
          >
            <CopyIcon weight="bold" className="size-5" />
          </Button>
        </div>

        <div className="mt-7 flex flex-col gap-2 sm:flex-row">
          <Button
            block
            variant="secondary"
            onClick={() => {
              setCreated(null);
              setName("");
              setSubject("");
              setRoom("");
            }}
          >
            Create another
          </Button>
          <Button block onClick={() => router.push("/admin/classes")}>
            Done
          </Button>
        </div>
      </div>
    );
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

      <TextField
        label="Class name"
        required
        autoFocus
        placeholder="Grade 5 · Sunflower"
        value={name}
        error={errors.name}
        onChange={(e) => setName(e.target.value)}
        hint="Whatever your school actually calls it."
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Subject"
          placeholder="Mathematics"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <TextField
          label="Grade or year"
          placeholder="5"
          value={gradeLevel}
          onChange={(e) => setGradeLevel(e.target.value)}
        />
      </div>

      <TextField
        label="Room"
        placeholder="B12"
        value={room}
        onChange={(e) => setRoom(e.target.value)}
      />

      <fieldset>
        <legend className="text-sm font-medium text-fg">Colour</legend>
        <p className="mt-0.5 text-xs text-fg-muted">
          Helps teachers spot the right class at a glance.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {COLORS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setColor(option.value)}
              aria-pressed={color === option.value}
              aria-label={option.name}
              className={cn(
                "grid size-11 place-items-center rounded-full transition-transform active:scale-90",
                color === option.value && "ring-2 ring-accent ring-offset-2 ring-offset-[--surface]",
              )}
            >
              <span className="size-7 rounded-full" style={{ backgroundColor: option.value }} />
              {color === option.value && (
                <CheckCircleIcon
                  weight="fill"
                  className="absolute size-4 text-white mix-blend-difference"
                  aria-hidden="true"
                />
              )}
            </button>
          ))}
        </div>
      </fieldset>

      {teachers.length > 0 && (
        <fieldset>
          <legend className="text-sm font-medium text-fg">Class teacher</legend>
          <p className="mt-0.5 text-xs text-fg-muted">
            Only assigned teachers can take this register. You can change it later.
          </p>
          <div className="mt-2 space-y-1.5">
            {teachers.map((teacher) => (
              <button
                key={teacher.membershipId}
                type="button"
                onClick={() =>
                  setTeacherId((current) =>
                    current === teacher.membershipId ? null : teacher.membershipId,
                  )
                }
                aria-pressed={teacherId === teacher.membershipId}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[--radius-md] border p-2.5 text-left transition-colors",
                  teacherId === teacher.membershipId
                    ? "border-accent bg-accent-soft"
                    : "border-border hover:bg-surface-muted",
                )}
              >
                <Avatar avatarKey={teacher.avatarKey} name={teacher.name} size="sm" />
                <span className="flex-1 text-sm font-medium text-fg">{teacher.name}</span>
                {teacherId === teacher.membershipId && (
                  <CheckCircleIcon weight="fill" className="size-5 text-accent-strong" />
                )}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <Button type="submit" block size="lg" loading={pending}>
        {pending ? "Creating…" : "Create class"}
      </Button>
    </form>
  );
}
