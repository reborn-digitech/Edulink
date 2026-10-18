"use client";

import { useEffect, useState, useTransition } from "react";
import { ClipboardTextIcon, PlayIcon, StopIcon } from "@phosphor-icons/react";
import { QUIZ_GEN_ACTIVE_STATES, VIDURA_EVAL_SETS, type ViduraEvalJob, type ViduraEvals, type ViduraEvalSet } from "@edulink/contracts";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckboxField, TextField } from "@/components/ui/field";
import { TableScroll } from "@/components/ui/table-scroll";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { formatInZone } from "@/lib/dates";
import { evalsStateAction, startEvalAction, stopEvalAction } from "./actions";

const POLL_ACTIVE_MS = 3_000;
const POLL_IDLE_MS = 20_000;
const isActive = (job: ViduraEvalJob | null) => !!job && (QUIZ_GEN_ACTIVE_STATES as readonly string[]).includes(job.state);

/**
 * EVALUATION RUNS FROM THE PANEL (Vidura pass 3, 18 Oct 2026): the harness's nine sets (or some) started and stopped
 * like a generation run, the live line read again every three seconds while one runs, the scores kept per run, the
 * model servers' state. The rules — one run at a time, none while a generation run or a crawl holds the model, the
 * servers a run brought up go down with it — are the library's (src/lib/eval-jobs.ts); this card only asks.
 */
export function EvalsCard({ initial }: { initial: ViduraEvals }) {
  const t = useT();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<ViduraEvals>(initial);
  const [sets, setSets] = useState<ViduraEvalSet[]>([...VIDURA_EVAL_SETS]);
  const [limit, setLimit] = useState("");
  const job = state.current;
  const active = isActive(job);

  useEffect(() => {
    const id = window.setInterval(() => {
      void evalsStateAction().then((result) => {
        if (result.ok) setState(result.state);
      });
    }, active ? POLL_ACTIVE_MS : POLL_IDLE_MS);
    return () => window.clearInterval(id);
  }, [active]);

  const toggle = (set: ViduraEvalSet, on: boolean) => setSets((xs) => (on ? VIDURA_EVAL_SETS.filter((s) => s === set || xs.includes(s)) : xs.filter((s) => s !== set)));

  const start = () => {
    if (!sets.length) {
      toast({ tone: "danger", title: t("viduraOps.evalPickSet") });
      return;
    }
    const n = Number(limit.trim());
    startTransition(async () => {
      const result = await startEvalAction({ sets, ...(limit.trim() && Number.isInteger(n) && n > 0 ? { limit: n } : {}) });
      if (!result.ok) {
        toast({ tone: "danger", title: result.error });
        return;
      }
      toast({ tone: "ok", title: t("viduraOps.evalStarted") });
      setState(result.state);
    });
  };

  const stop = () => {
    if (!job) return;
    startTransition(async () => {
      const result = await stopEvalAction(job.id);
      if (!result.ok) {
        toast({ tone: "danger", title: result.error });
        return;
      }
      toast({ tone: "ok", title: t("viduraOps.evalStopAsked") });
      setState(result.state);
    });
  };

  return (
    <div className="space-y-5">
      <Card aria-busy={pending || undefined}>
        <CardHeader icon={<ClipboardTextIcon weight="duotone" className="size-5" />} title={t("viduraOps.evalTitle")} description={t("viduraOps.evalIntro")} />
        <CardBody className="space-y-4">
          {job ? <LiveLine job={job} active={active} onStop={stop} pending={pending} /> : <p className="text-sm text-fg-muted">{t("viduraOps.evalNone")}</p>}

          {!active ? (
            <section className="space-y-3 border-t border-border pt-4" aria-label={t("viduraOps.evalStartTitle")}>
              <h3 className="text-sm font-semibold">{t("viduraOps.evalStartTitle")}</h3>
              {state.modelBusy ? <p className="text-sm text-warn">{t("viduraOps.modelBusy")}</p> : null}
              <fieldset className="grid gap-1 sm:grid-cols-3">
                <legend className="sr-only">{t("viduraOps.evalSets")}</legend>
                {VIDURA_EVAL_SETS.map((s) => (
                  <CheckboxField key={s} label={t(`viduraOps.set.${s}`)} checked={sets.includes(s)} onChange={(e) => toggle(s, e.target.checked)} />
                ))}
              </fieldset>
              <TextField label={t("viduraOps.evalLimit")} hint={t("viduraOps.evalLimitHint")} inputMode="numeric" value={limit} onChange={(e) => setLimit(e.target.value.replace(/\D+/g, ""))} />
              <Button onClick={start} loading={pending} disabled={state.modelBusy} icon={<PlayIcon weight="bold" aria-hidden="true" />}>
                {t("viduraOps.evalStart")}
              </Button>
            </section>
          ) : null}

          <section className="space-y-2 border-t border-border pt-4" aria-label={t("quizJobs.serversTitle")}>
            <h3 className="text-sm font-semibold">{t("quizJobs.serversTitle")}</h3>
            <ul className="space-y-1">
              {state.servers.map((s) => (
                <li key={s.server} className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="min-w-40 font-medium text-fg">{t(`quizJobs.server${s.server}`)}</span>
                  <Badge tone={s.state === "RUNNING" ? "ok" : s.state === "STARTING" ? "warn" : "neutral"}>{t(`quizJobs.server${s.state}`)}</Badge>
                  <span className="text-xs text-fg-muted">{t("quizJobs.serverLine", { model: s.model, port: s.port ?? "—" })}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-fg-muted">{t("viduraOps.serversNote")}</p>
          </section>
        </CardBody>
      </Card>

      <section className="space-y-3" aria-labelledby="vidura-eval-runs">
        <h2 id="vidura-eval-runs" className="text-base font-semibold">
          {t("viduraOps.evalRuns")}
        </h2>
        {state.recent.length === 0 ? <p className="text-sm text-fg-muted">{t("viduraOps.evalNone")}</p> : null}
        <ul className="space-y-3">
          {state.recent.map((r) => (
            <li key={r.id}>
              <RunScores job={r} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function LiveLine({ job, active, onStop, pending }: { job: ViduraEvalJob; active: boolean; onStop: () => void; pending: boolean }) {
  const t = useT();
  const p = job.progress;
  const tone = job.state === "FAILED" ? "danger" : job.state === "FINISHED" ? "ok" : job.state === "STOPPED" ? "neutral" : "accent";
  return (
    <section className="space-y-2" aria-live="polite">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={tone}>{t(`quizJobs.state${job.state}`)}</Badge>
        {active && p ? <span className="text-sm text-fg">{job.state === "STOPPING" ? t("viduraOps.phaseHALTING") : t(`viduraOps.phase${p.phase}`)}</span> : null}
        {active ? (
          <Button size="sm" variant="danger" onClick={onStop} disabled={pending || job.state === "STOPPING"} icon={<StopIcon weight="bold" aria-hidden="true" />} className="ml-auto">
            {t("viduraOps.evalStop")}
          </Button>
        ) : null}
      </div>
      {active && p?.set ? (
        <p className="text-sm text-fg-muted">
          {t("viduraOps.liveLine", { set: t(`viduraOps.set.${p.set}`), index: p.setIndex, sets: p.setsTotal, done: p.done, total: p.total ?? "—", passed: p.passed, cases: p.casesDone, minutes: Math.floor(p.seconds / 60) })}
        </p>
      ) : null}
      {p?.contended ? <p className="text-sm text-warn">{t("viduraOps.contended")}</p> : null}
      {job.error ? <p className="text-sm text-danger">{t("quizJobs.errorLine", { error: job.error })}</p> : null}
    </section>
  );
}

function RunScores({ job }: { job: ViduraEvalJob }) {
  const t = useT();
  const when = (iso: string | null) => (iso ? formatInZone(new Date(iso), "Asia/Kolkata") : "—");
  const tone = job.state === "FAILED" ? "danger" : job.state === "FINISHED" ? "ok" : "neutral";
  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
          <Badge tone={tone} size="sm">{t(`quizJobs.state${job.state}`)}</Badge>
          {job.gate === true ? <Badge tone="ok" size="sm">{t("viduraOps.gateHolds")}</Badge> : job.gate === false ? <Badge tone="danger" size="sm">{t("viduraOps.gateFails")}</Badge> : null}
          <span>{t("viduraOps.runLine", { name: job.startedBy, when: when(job.createdAt), sets: job.request.sets.map((s) => t(`viduraOps.set.${s}`)).join(", ") })}</span>
          {job.request.limit ? <span>{t("viduraOps.runLimit", { limit: job.request.limit })}</span> : null}
        </div>
        {job.scores?.length ? (
          <TableScroll label={t("viduraOps.scoresTable")}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-fg-muted">
                  <th className="py-1 pr-3">{t("viduraOps.colSet")}</th>
                  <th className="py-1 pr-3 text-right">{t("viduraOps.colPassed")}</th>
                  <th className="py-1">{t("viduraOps.colDetail")}</th>
                </tr>
              </thead>
              <tbody>
                {job.scores.map((s) => (
                  <tr key={s.set} className="border-t border-border align-top">
                    <td className="py-1.5 pr-3 font-medium">{t(`viduraOps.set.${s.set}`)}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{t("viduraOps.passedOf", { pass: s.pass, cases: s.cases })}</td>
                    <td className="py-1.5">
                      {/* The harness's own printed lines, English, kept for the record. */}
                      <details>
                        <summary className="min-h-11 cursor-pointer py-2 text-xs text-fg-muted">{t("viduraOps.harnessLines")}</summary>
                        <ul className="space-y-0.5 text-xs text-fg-muted" lang="en">
                          {s.lines.map((l, i) => (
                            <li key={i} className="break-words">
                              {l}
                            </li>
                          ))}
                        </ul>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        ) : isActive(job) ? null : (
          // Only once the run has ended: while it runs, the live line above says how far it is (loose ends, 18 Oct 2026).
          <p className="text-sm text-fg-muted">{t("viduraOps.noScores")}</p>
        )}
      </CardBody>
    </Card>
  );
}
