import "server-only";
import path from "node:path";
import React from "react";
import { Document, Font, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { dictionaryFor, translatorFor, type Locale, type TranslationKey } from "@edulink/i18n";
import type { PlacementRecord } from "@edulink/contracts";

/**
 * A student's resume as a PDF (the placement module, 4 October 2026), in the
 * certificate's and the payslip's manner — Mukta from the bundled files so
 * Devanagari draws, Helvetica the fallback glyph by glyph — rendered from
 * the record and the profile on every read: no file is kept. No address,
 * no phone and no email: the college is the channel between a company and
 * its students. A copy for a recruiter carries a watermark line on every
 * page naming who it was rendered for and when, and the render is audited
 * by the caller.
 */
const FONT_DIR = path.join(process.cwd(), "src", "lib", "pdf-fonts");
let registered = false;
function ensureFonts() {
  if (registered) return;
  Font.register({ family: "Mukta", fonts: [{ src: path.join(FONT_DIR, "Mukta-Regular.ttf") }, { src: path.join(FONT_DIR, "Mukta-Bold.ttf"), fontWeight: 700 }] });
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}

const INK = "#1b1f2a";
const MUTED = "#5b6472";
const LINE = "#d6dce6";

const styles = StyleSheet.create({
  page: { paddingTop: 44, paddingBottom: 52, paddingHorizontal: 52, fontFamily: ["Mukta", "Helvetica"] as unknown as string, fontSize: 10, color: INK, lineHeight: 1.4 },
  name: { fontSize: 20, fontWeight: 700, lineHeight: 1.25 },
  sub: { fontSize: 10, color: MUTED, marginBottom: 14 },
  heading: { fontSize: 11, fontWeight: 700, marginTop: 12, marginBottom: 4, paddingBottom: 2, borderBottomWidth: 0.5, borderBottomColor: LINE },
  facts: { flexDirection: "row", flexWrap: "wrap" },
  fact: { width: "50%", flexDirection: "row", paddingVertical: 1.5 },
  factLabel: { width: "48%", color: MUTED, fontSize: 9 },
  factValue: { width: "52%", fontWeight: 700, fontSize: 9.5 },
  item: { marginBottom: 3 },
  itemTitle: { fontWeight: 700 },
  itemNote: { color: MUTED, fontSize: 9 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  chip: { borderWidth: 0.5, borderColor: LINE, paddingVertical: 1, paddingHorizontal: 5, fontSize: 9 },
  watermark: { position: "absolute", top: 18, left: 52, right: 52, fontSize: 8, color: "#b42318", textAlign: "center" },
  footer: { position: "absolute", left: 52, right: 52, bottom: 26, fontSize: 7.5, color: MUTED, textAlign: "center" },
});

type T = (key: TranslationKey, vars?: Record<string, string | number>) => string;

export type ResumeDocument = {
  locale: Locale;
  name: string;
  collegeName: string;
  record: PlacementRecord;
  skills: string[];
  certifications: string[];
  projects: { title: string; note: string }[];
  internships: { companyName: string; from: string; to: string; hours: number }[];
  /** For a recruiter's copy: "Rendered for … on …". */
  watermark: string | null;
};

function ResumePage({ d }: { d: ResumeDocument }) {
  const t = translatorFor(dictionaryFor(d.locale)) as T;
  const r = d.record;
  const dash = "—";
  const facts: [string, string][] = [
    [t("placement.pdfProgramme"), r.programmeName ?? dash],
    [t("placement.pdfBatch"), r.batchYear ? String(r.batchYear) : dash],
    [t("placement.pdfCgpa"), r.cgpa === null ? dash : r.cgpa.toFixed(2)],
    [t("placement.pdfBacklogs"), r.liveBacklogs === null ? dash : String(r.liveBacklogs)],
    [t("placement.pdfAttendance"), r.attendancePct === null ? dash : `${Math.round(r.attendancePct)} %`],
  ];
  return (
    <Page size="A4" style={styles.page}>
      {d.watermark ? (
        <Text style={styles.watermark} fixed>
          {d.watermark}
        </Text>
      ) : null}
      <Text style={styles.name}>{d.name}</Text>
      <Text style={styles.sub}>{d.collegeName}</Text>
      <Text style={styles.heading}>{t("placement.pdfRecord")}</Text>
      <View style={styles.facts}>
        {facts.map(([label, value]) => (
          <View key={label} style={styles.fact}>
            <Text style={styles.factLabel}>{label}</Text>
            <Text style={styles.factValue}>{value}</Text>
          </View>
        ))}
      </View>
      {d.skills.length ? (
        <>
          <Text style={styles.heading}>{t("placement.pdfSkills")}</Text>
          <View style={styles.chips}>
            {d.skills.map((s) => (
              <Text key={s} style={styles.chip}>
                {s}
              </Text>
            ))}
          </View>
        </>
      ) : null}
      {d.projects.length ? (
        <>
          <Text style={styles.heading}>{t("placement.pdfProjects")}</Text>
          {d.projects.map((p, i) => (
            <View key={`${p.title}-${i}`} style={styles.item}>
              <Text style={styles.itemTitle}>{p.title}</Text>
              {p.note ? <Text style={styles.itemNote}>{p.note}</Text> : null}
            </View>
          ))}
        </>
      ) : null}
      {d.internships.length ? (
        <>
          <Text style={styles.heading}>{t("placement.pdfInternships")}</Text>
          {d.internships.map((x, i) => (
            <View key={`${x.companyName}-${i}`} style={styles.item}>
              <Text style={styles.itemTitle}>{x.companyName}</Text>
              <Text style={styles.itemNote}>{t("placement.pdfInternshipLine", { from: x.from, to: x.to, hours: x.hours })}</Text>
            </View>
          ))}
        </>
      ) : null}
      {d.certifications.length ? (
        <>
          <Text style={styles.heading}>{t("placement.pdfCertifications")}</Text>
          {d.certifications.map((c, i) => (
            <Text key={`${c}-${i}`} style={styles.item}>
              {c}
            </Text>
          ))}
        </>
      ) : null}
      <Text style={styles.footer} fixed>
        {t("placement.pdfFooter", { college: d.collegeName })}
      </Text>
    </Page>
  );
}

export async function renderResumePdf(d: ResumeDocument): Promise<Buffer> {
  ensureFonts();
  const doc = (
    <Document title={d.name} author={d.collegeName}>
      <ResumePage d={d} />
    </Document>
  );
  return Buffer.from(await renderToBuffer(doc));
}
