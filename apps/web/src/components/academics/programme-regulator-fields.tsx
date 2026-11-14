"use client";

import { useState } from "react";
import { REGULATORS, STREAM_PRESETS, defaultAttendanceThreshold, regulatorChoiceNeeded, type Regulator, type StreamCode } from "@edulink/contracts";
import { SelectField, TextField } from "@/components/ui/field";
import { useT } from "@/lib/i18n";

/**
 * THE REGULATOR AND THE THRESHOLD THAT FOLLOWS (the owner's decision on TA-538, 14 Nov 2026). Where the
 * chosen stream lists more than one council there is no default regulator: the select starts on "Choose the
 * council" and is required. The attendance threshold the regulator gives is said under the fields before
 * saving, and the threshold field is filled with it whenever the regulator changes (the office may type its own).
 *
 * `streams` given: the new programme's form, with the stream select. `stream` given and no `streams`: an
 * existing programme's correction, whose stream is kept and whose current regulator and threshold start the form.
 */
export function ProgrammeRegulatorFields({
  streams,
  streamLabels,
  stream: fixedStream,
  initialRegulator,
  initialThreshold,
}: {
  streams?: readonly StreamCode[];
  streamLabels?: Partial<Record<StreamCode, string>>;
  stream?: StreamCode | null;
  initialRegulator?: Regulator | null;
  initialThreshold?: number | null;
}) {
  const t = useT();
  const correcting = streams === undefined;
  const hasStreams = streams === undefined ? Boolean(fixedStream) : streams.length > 0;
  const [stream, setStream] = useState<StreamCode | "">(streams === undefined ? (fixedStream ?? "") : streams.length === 1 ? streams[0]! : "");
  const [regulator, setRegulator] = useState<Regulator | "">(initialRegulator ?? (hasStreams ? "" : "UGC"));
  const several = stream !== "" && regulatorChoiceNeeded(stream);
  // "As the stream says" stands only for a stream of one council; otherwise the registrar names it.
  const effectiveOf = (st: StreamCode | "", reg: Regulator | ""): Regulator | null => reg || (st !== "" && !regulatorChoiceNeeded(st) ? STREAM_PRESETS[st].regulators[0]! : null);
  const effective = effectiveOf(stream, regulator);
  const [threshold, setThreshold] = useState<string>(initialThreshold != null ? String(initialThreshold) : effective ? String(defaultAttendanceThreshold(effective)) : "");
  const follow = (st: StreamCode | "", reg: Regulator | "") => {
    const next = effectiveOf(st, reg);
    setThreshold(next ? String(defaultAttendanceThreshold(next)) : "");
  };
  return (
    <>
      {streams && streams.length ? (
        <SelectField
          label={t("streams.programmeField")}
          name="stream"
          value={stream}
          onChange={(e) => {
            const st = e.target.value as StreamCode | "";
            // A stream of several councils never keeps "As the stream says".
            setStream(st);
            follow(st, regulator);
          }}
          hint={t("streams.programmeFieldHint")}
        >
          <option value="">{t("academics.none")}</option>
          {streams.map((st) => <option key={st} value={st}>{`${streamLabels?.[st] ?? st} · ${STREAM_PRESETS[st].regulators.join(" / ")}`}</option>)}
        </SelectField>
      ) : null}
      <SelectField
        label={t("academics.fieldRegulator")}
        name="regulator"
        value={regulator}
        required={several || correcting}
        hint={several ? t("streams.regulatorChooseHint") : undefined}
        onChange={(e) => {
          const reg = e.target.value as Regulator | "";
          setRegulator(reg);
          follow(stream, reg);
        }}
      >
        {several ? (
          <option value="" disabled>{t("streams.regulatorChoose")}</option>
        ) : hasStreams && !correcting ? (
          <option value="">{t("streams.regulatorFromStream")}</option>
        ) : null}
        {REGULATORS.map((r) => <option key={r} value={r}>{r}</option>)}
      </SelectField>
      <TextField label={t("academics.fieldThreshold")} name="attendanceThreshold" type="number" min={1} max={100} value={threshold} onChange={(e) => setThreshold(e.target.value)} hint={t("academics.fieldThresholdHint")} />
      <p className="text-sm text-fg-muted sm:col-span-full" aria-live="polite">
        {effective ? t("streams.thresholdFollows", { regulator: effective, threshold: defaultAttendanceThreshold(effective) }) : t("streams.thresholdChooseFirst")}
      </p>
    </>
  );
}
