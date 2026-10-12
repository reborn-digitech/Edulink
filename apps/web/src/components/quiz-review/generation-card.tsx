"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CpuIcon, PlayIcon, SparkleIcon, StopIcon } from "@phosphor-icons/react";
import { QUIZ_BOARDS, QUIZ_GEN_ACTIVE_STATES, QUIZ_GEN_STAGES, QUIZ_GEN_SUBJECTS, type ModelServer, type ModelServerStatus, type QuizBoard, type QuizGenJob, type QuizGenProgress, type QuizGenRequest, type QuizGenSubject, type QuizJobsState } from "@edulink/contracts";
import type { CollegeSyllabi, StreamCode } from "@edulink/contracts"; // college-content (12 Oct 2026)
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { formatInZone } from "@/lib/dates";
import { quizBoardKey } from "@/lib/quiz-board";
import { jobsStateAction, serverAction, startJobAction, stopJobAction } from "@/app/appadmin/quiz-review/actions";

const POLL_ACTIVE_MS = 3_000;
const POLL_IDLE_MS = 20_000;

const isActive = (job: QuizGenJob | null) => !!job && (QUIZ_GEN_ACTIVE_STATES as readonly string[]).includes(job.state);

function percent(rate: number | null): string | null {
  return rate === null ? null : `${Math.round(rate * 100)}%`;
}

/**
 * GENERATION STARTED AND STOPPED FROM THE DESK (the owner, 11 October 2026): what to generate (a board's
 * class, subject and chapter range, or everything not yet generated in the plan's order), Start and Stop,
 * the live line the runner rewrites after every item (read again every three seconds while a run is
 * active), and the two model servers with their own Start and Stop. The rules — one run at a time, the
 * servers a run brought up go down with it, a server cannot be stopped under a run — are the library's
 * (src/lib/quiz-jobs.ts); this card only asks.
 */
export function GenerationCard({ initial, subjectLabels, college }: { initial: QuizJobsState; subjectLabels: Record<string, string>; /** college-content (12 Oct 2026): the syllabus corpus by stream, for the College scope. */ college?: CollegeSyllabi }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<QuizJobsState>(initial);
  const [scope, setScope] = useState<QuizGenRequest["scope"]>("CHAPTERS");
  const [board, setBoard] = useState<QuizBoard | "">("");
  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState<QuizGenSubject | "">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [limit, setLimit] = useState("");
  // college-content (12 Oct 2026): the College scope's stream, programme, syllabus and unit range.
  const [stream, setStream] = useState<StreamCode | "">("");
  const [programme, setProgramme] = useState("");
  const [syllabus, setSyllabus] = useState("");
  const [unitFrom, setUnitFrom] = useState("");
  const [unitTo, setUnitTo] = useState("");
  const streamRow = college?.streams.find((s) => s.stream === stream) ?? null;
  const programmeRow = streamRow?.programmes.find((p) => p.programme === programme) ?? null;
  const streamName = (s: string) => t(`streams.${s}.name` as never);

  const job = state.current;
  const active = isActive(job);

  useEffect(() => {
    const id = window.setInterval(() => {
      void jobsStateAction().then((result) => {
        if (!result.ok) return;
        setState(result.state);
        // A run that just ended has loaded chapters: the desk's counts move.
        if (active && !isActive(result.state.current)) router.refresh();
      });
    }, active ? POLL_ACTIVE_MS : POLL_IDLE_MS);
    return () => window.clearInterval(id);
  }, [active, router]);

  const start = () => {
    const n = (v: string) => (v.trim() ? Number(v) : undefined);
    if (scope === "COLLEGE" && (!stream || !programme)) {
      toast({ tone: "danger", title: t("collegeGen.needStream") });
      return;
    }
    const request: QuizGenRequest =
      scope === "EVERYTHING"
        ? { scope, ...(n(limit) ? { limit: n(limit) } : {}) }
        : scope === "COLLEGE"
          ? {
              scope,
              ...(stream ? { stream } : {}),
              ...(programme ? { programme } : {}),
              ...(syllabus ? { document: syllabus } : {}),
              ...(n(unitFrom) ? { unitFrom: n(unitFrom) } : {}),
              ...(n(unitTo) ? { unitTo: n(unitTo) } : {}),
              ...(n(limit) ? { limit: n(limit) } : {}),
            }
          : {
            scope,
            ...(board ? { board } : {}),
            ...(n(grade) ? { grade: n(grade) } : {}),
            ...(subject ? { subject } : {}),
            ...(n(from) ? { chapterFrom: n(from) } : {}),
            ...(n(to) ? { chapterTo: n(to) } : {}),
            ...(n(limit) ? { limit: n(limit) } : {}),
          };
    if (scope === "CHAPTERS" && (!board || !grade || !subject)) {
      toast({ tone: "danger", title: t("quizJobs.needBoard") });
      return;
    }
    startTransition(async () => {
      const result = await startJobAction(request);
      if (!result.ok) {
        toast({ tone: "danger", title: result.error });
        return;
      }
      toast({ tone: "ok", title: t("quizJobs.started") });
      setState(result.state);
    });
  };

  const stop = () => {
    if (!job) return;
    startTransition(async () => {
      const result = await stopJobAction(job.id);
      if (!result.ok) {
        toast({ tone: "danger", title: result.error });
        return;
      }
      toast({ tone: "ok", title: t("quizJobs.stopAsked") });
      setState(result.state);
    });
  };

  const server = (which: ModelServer, on: boolean) => {
    startTransition(async () => {
      const result = await serverAction(which, on);
      if (!result.ok) {
        toast({ tone: "danger", title: result.error });
        return;
      }
      toast({ tone: "ok", title: t(on ? "quizJobs.serverStarted" : "quizJobs.serverStopped") });
      setState((s) => ({ ...s, servers: result.servers }));
    });
  };

  const boardName = (b: string) => (quizBoardKey(b) ? t(quizBoardKey(b)!) : b);
  const chapterLabel = (c: NonNullable<QuizGenProgress["chapter"]>) =>
    // college-content: a college unit is named by its stream and programme.
    c.stream
      ? t("collegeGen.unitLine", { stream: streamName(c.stream), programme: c.programme ?? "—", number: c.number, name: c.name || "—" })
      : t("quizJobs.chapterLine", { board: boardName(c.board), grade: c.grade, subject: subjectLabels[c.subject] ?? c.subject, number: c.number, name: c.name || "—" });

  return (
    <Card aria-busy={pending || undefined}>
      <CardHeader icon={<SparkleIcon weight="duotone" className="size-5" />} title={t("quizJobs.title")} description={t("quizJobs.intro")} />
      <CardBody className="space-y-5">
        {/* What to generate */}
        {!active && (
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              start();
            }}
          >
            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold">{t("quizJobs.scopeLabel")}</legend>
              <div className="flex flex-wrap gap-2">
                {(college ? (["CHAPTERS", "EVERYTHING", "COLLEGE"] as const) : (["CHAPTERS", "EVERYTHING"] as const)).map((s) => (
                  <Button key={s} size="sm" variant={scope === s ? "soft" : "secondary"} aria-pressed={scope === s} onClick={() => setScope(s)} className="h-auto min-h-11 whitespace-normal py-2 text-left">
                    {t(s === "CHAPTERS" ? "quizJobs.scopeCHAPTERS" : s === "EVERYTHING" ? "quizJobs.scopeEVERYTHING" : "collegeGen.scopeCOLLEGE")}
                  </Button>
                ))}
              </div>
            </fieldset>
            {scope === "EVERYTHING" ? (
              <p className="text-sm text-fg-muted">{t("quizJobs.everythingHint")}</p>
            ) : scope === "COLLEGE" && college ? (
              <>
                <p className="text-sm text-fg-muted">{t("collegeGen.withCorpus", { list: college.streams.map((s) => `${streamName(s.stream)} (${s.boards.join(", ")})`).join("; ") || "—" })}</p>
                {college.without.length > 0 && <p className="text-sm text-warn">{t("collegeGen.withoutCorpus", { list: college.without.map(streamName).join(", ") })}</p>}
                <div className="grid gap-3 sm:grid-cols-3">
                  <SelectField
                    label={t("collegeGen.streamLabel")}
                    value={stream}
                    onChange={(e) => {
                      setStream(e.target.value as StreamCode | "");
                      setProgramme("");
                      setSyllabus("");
                    }}
                    required
                  >
                    <option value="">{t("quizJobs.choose")}</option>
                    {college.streams.map((s) => (
                      <option key={s.stream} value={s.stream}>
                        {streamName(s.stream)}
                      </option>
                    ))}
                  </SelectField>
                  <SelectField
                    label={t("collegeGen.programmeLabel")}
                    value={programme}
                    onChange={(e) => {
                      setProgramme(e.target.value);
                      setSyllabus("");
                    }}
                    required
                    disabled={!streamRow}
                  >
                    <option value="">{t("quizJobs.choose")}</option>
                    {(streamRow?.programmes ?? []).map((p) => (
                      <option key={p.programme} value={p.programme}>
                        {p.programme}
                      </option>
                    ))}
                  </SelectField>
                  <SelectField label={t("collegeGen.documentLabel")} value={syllabus} onChange={(e) => setSyllabus(e.target.value)} disabled={!programmeRow}>
                    <option value="">{t("collegeGen.allDocuments")}</option>
                    {(programmeRow?.documents ?? []).map((d) => (
                      <option key={d.path} value={d.path}>
                        {t("collegeGen.documentOption", { title: d.title, n: d.units.length })}
                      </option>
                    ))}
                  </SelectField>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField label={t("collegeGen.unitFrom")} inputMode="numeric" type="number" min={1} max={200} value={unitFrom} onChange={(e) => setUnitFrom(e.target.value)} hint={t("collegeGen.unitRangeHint")} />
                  <TextField label={t("collegeGen.unitTo")} inputMode="numeric" type="number" min={1} max={200} value={unitTo} onChange={(e) => setUnitTo(e.target.value)} />
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <SelectField label={t("quizJobs.boardLabel")} value={board} onChange={(e) => setBoard(e.target.value as QuizBoard | "")} required>
                    <option value="">{t("quizJobs.choose")}</option>
                    {QUIZ_BOARDS.map((b) => (
                      <option key={b} value={b}>
                        {boardName(b)}
                      </option>
                    ))}
                  </SelectField>
                  <SelectField label={t("quizJobs.gradeLabel")} value={grade} onChange={(e) => setGrade(e.target.value)} required>
                    <option value="">{t("quizJobs.choose")}</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                      <option key={g} value={g}>
                        {t("quizReview.gradeOption", { grade: g })}
                      </option>
                    ))}
                  </SelectField>
                  <SelectField label={t("quizJobs.subjectLabel")} value={subject} onChange={(e) => setSubject(e.target.value as QuizGenSubject | "")} required>
                    <option value="">{t("quizJobs.choose")}</option>
                    {QUIZ_GEN_SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {subjectLabels[s] ?? s}
                      </option>
                    ))}
                  </SelectField>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField label={t("quizJobs.chapterFrom")} inputMode="numeric" type="number" min={1} max={40} value={from} onChange={(e) => setFrom(e.target.value)} hint={t("quizJobs.chapterRangeHint")} />
                  <TextField label={t("quizJobs.chapterTo")} inputMode="numeric" type="number" min={1} max={40} value={to} onChange={(e) => setTo(e.target.value)} />
                </div>
              </>
            )}
            <TextField label={t("quizJobs.limitLabel")} inputMode="numeric" type="number" min={1} max={60} value={limit} onChange={(e) => setLimit(e.target.value)} hint={t("quizJobs.limitHint")} className="sm:max-w-xs" />
            <Button type="submit" size="sm" disabled={pending} icon={<PlayIcon weight="bold" aria-hidden="true" />}>
              {t("quizJobs.start")}
            </Button>
          </form>
        )}

        {/* The live line */}
        {job ? <LiveLine job={job} active={active} chapterLabel={chapterLabel} onStop={stop} pending={pending} /> : <p className="text-sm text-fg-muted">{t("quizJobs.noRun")}</p>}

        {/* The model servers */}
        <section className="space-y-2 border-t border-border pt-4" aria-label={t("quizJobs.serversTitle")}>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <CpuIcon aria-hidden="true" className="size-4" />
            {t("quizJobs.serversTitle")}
          </h3>
          <ul className="space-y-2">
            {state.servers.map((s) => (
              <ServerRow key={s.server} status={s} pending={pending} active={active} onStart={() => server(s.server, true)} onStop={() => server(s.server, false)} />
            ))}
          </ul>
          <p className="text-xs text-fg-muted">{t("quizJobs.serversNote")}</p>
        </section>

        {state.recent.filter((r) => r.id !== job?.id).length > 0 && (
          <section className="space-y-1 border-t border-border pt-4">
            <h3 className="text-sm font-semibold">{t("quizJobs.recent")}</h3>
            <ul className="space-y-0.5 text-sm text-fg-muted">
              {state.recent
                .filter((r) => r.id !== job?.id)
                .map((r) => (
                  <li key={r.id}>
                    {t("quizJobs.recentLine", { state: t(`quizJobs.state${r.state}`), when: formatInZone(new Date(r.createdAt), "Asia/Kolkata"), kept: r.progress?.kept ?? 0, loaded: r.progress?.loaded ?? 0 })}
                  </li>
                ))}
            </ul>
          </section>
        )}
      </CardBody>
    </Card>
  );
}

function LiveLine({ job, active, chapterLabel, onStop, pending }: { job: QuizGenJob; active: boolean; chapterLabel: (c: NonNullable<QuizGenProgress["chapter"]>) => string; onStop: () => void; pending: boolean }) {
  const t = useT();
  const p = job.progress;
  const tone = job.state === "FAILED" ? "danger" : job.state === "FINISHED" ? "ok" : job.state === "STOPPED" ? "neutral" : "accent";
  const rejects = (r: Record<string, number>) => Object.fromEntries(QUIZ_GEN_STAGES.map((s) => [s, r[s] ?? 0]));
  return (
    <section className="space-y-2" aria-live="polite">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={tone}>{t(`quizJobs.state${job.state}`)}</Badge>
        {active && p && <span className="text-sm text-fg">{job.state === "STOPPING" ? t("quizJobs.phaseHALTING") : t(`quizJobs.phase${p.phase}`)}</span>}
        {active && (
          <Button size="sm" variant="danger" onClick={onStop} disabled={pending || job.state === "STOPPING"} icon={<StopIcon weight="bold" aria-hidden="true" />} className="ml-auto">
            {t("quizJobs.stop")}
          </Button>
        )}
      </div>
      {p?.chapter && (
        <div className="space-y-1 rounded-[var(--radius-md)] border border-border p-3 text-sm">
          <p className="font-medium text-fg">{chapterLabel(p.chapter)}</p>
          <p className="text-fg-muted">
            {t("quizJobs.liveLine", { drafted: p.chapter.drafted, kept: p.chapter.kept, rate: percent(p.chapter.keepRate) ?? t("quizJobs.notMeasured"), seconds: p.chapter.secondsPerKept ?? t("quizJobs.notMeasured") })}
          </p>
          <p className="text-fg-muted">{t("quizJobs.rejectsLine", rejects(p.chapter.rejects))}</p>
        </div>
      )}
      {p?.last && (
        <p className="text-sm text-fg-muted">
          {t("quizJobs.lastLine", { chapter: chapterLabel(p.last), kept: p.last.kept, drafted: p.last.drafted, minutes: Math.max(1, Math.round(p.last.seconds / 60)), loaded: p.last.loaded })}
        </p>
      )}
      {p && (p.chaptersDone > 0 || p.chaptersSkipped > 0) && (
        <p className="text-sm text-fg-muted">{t("quizJobs.runTotals", { done: p.chaptersDone, skipped: p.chaptersSkipped, kept: p.kept, loaded: p.loaded })}</p>
      )}
      {p && p.chaptersFailed.length > 0 && <p className="text-sm text-warn">{t("quizJobs.failedChapters", { list: p.chaptersFailed.map((f) => `${f.label} (${f.reason})`).join("; ") })}</p>}
      {job.error && <p className="text-sm text-danger">{t("quizJobs.errorLine", { error: job.error })}</p>}
      <p className="text-xs text-fg-muted">
        {t("quizJobs.startedBy", { name: job.startedBy, role: t(job.startedByRole === "OPERATOR" ? "quizReview.roleOPERATOR" : "quizReview.roleAPP_ADMIN"), when: formatInZone(new Date(job.createdAt), "Asia/Kolkata") })}
      </p>
    </section>
  );
}

function ServerRow({ status, pending, active, onStart, onStop }: { status: ModelServerStatus; pending: boolean; active: boolean; onStart: () => void; onStop: () => void }) {
  const t = useT();
  const tone = status.state === "RUNNING" ? "ok" : status.state === "STARTING" ? "warn" : "neutral";
  return (
    <li className="flex flex-wrap items-center gap-2">
      <span className="min-w-40 text-sm font-medium text-fg">{t(`quizJobs.server${status.server}`)}</span>
      <Badge tone={tone}>{t(`quizJobs.server${status.state}`)}</Badge>
      <span className="text-xs text-fg-muted">{t("quizJobs.serverLine", { model: status.model, port: status.port ?? "—" })}</span>
      <span className="ml-auto flex gap-2">
        {status.state === "STOPPED" ? (
          <Button size="sm" variant="secondary" onClick={onStart} disabled={pending}>
            {t("quizJobs.serverStart")}
          </Button>
        ) : (
          // Refused while a run is active (the library says so too): stop the run first.
          <Button size="sm" variant="ghost" onClick={onStop} disabled={pending || active} title={active ? t("quizJobs.stopRunFirst") : undefined}>
            {t("quizJobs.serverStop")}
          </Button>
        )}
      </span>
    </li>
  );
}
