import "server-only";
import path from "node:path";
import React from "react";
import { Document, Font, Image, Page, Path, StyleSheet, Svg, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { Translate } from "./i18n/dictionary";
import { encodeQr, qrSvgPath } from "./qr";
import { formatInZone } from "./dates";
import { readStoredFile } from "./storage";
import type { attendanceSheetData, documentForPdf, hallTicketForPdf } from "./exam-cell-after";

/**
 * The exam cell's papers as PDFs (module EXAMS, 4 October 2026), in the
 * certificate's manner: Mukta from the bundled files so Devanagari draws,
 * every sentence from the dictionary in the reader's language, nothing
 * worked out here. Drawn on every read from the rows, never stored: a hall
 * ticket (with the photo the student uploaded, if any, and a QR to the
 * public check), a hall's attendance sheet, and a grade card, transcript or
 * degree certificate with the signature and seal the paper was issued with.
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
  page: { paddingTop: 36, paddingBottom: 44, paddingHorizontal: 44, fontFamily: ["Mukta", "Helvetica"] as unknown as string, fontSize: 10, color: INK, lineHeight: 1.35 },
  college: { fontSize: 15, fontWeight: 700, textAlign: "center" },
  university: { fontSize: 9, color: MUTED, textAlign: "center" },
  title: { fontSize: 13, fontWeight: 700, textAlign: "center", marginTop: 8, marginBottom: 10 },
  facts: { flexDirection: "row", flexWrap: "wrap", borderWidth: 0.5, borderColor: LINE, padding: 8, marginBottom: 10 },
  fact: { width: "50%", flexDirection: "row", paddingVertical: 1.5 },
  factLabel: { width: "42%", color: MUTED, fontSize: 9 },
  factValue: { width: "58%", fontWeight: 700, fontSize: 9.5 },
  head: { flexDirection: "row", backgroundColor: "#f1f4f8", paddingVertical: 3, paddingHorizontal: 4, fontSize: 8.5, color: MUTED },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: LINE, paddingVertical: 4, paddingHorizontal: 4 },
  cell: { flex: 2 },
  wide: { flex: 5 },
  num: { flex: 1.5, textAlign: "right" },
  section: { fontSize: 11, fontWeight: 700, marginTop: 10, marginBottom: 4 },
  summary: { marginTop: 6, flexDirection: "row", justifyContent: "space-between", fontWeight: 700 },
  signatures: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 28 },
  signatureLine: { borderTopWidth: 0.75, borderTopColor: INK, paddingTop: 4, fontSize: 9, color: MUTED, textAlign: "center", width: 170 },
  footer: { position: "absolute", left: 44, right: 44, bottom: 22, fontSize: 7.5, color: MUTED, textAlign: "center" },
  photo: { width: 72, height: 90, borderWidth: 0.75, borderColor: LINE, alignItems: "center", justifyContent: "center" },
  degreeBody: { marginTop: 30, fontSize: 13, textAlign: "center", lineHeight: 1.7 },
});

function Fact({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value || "—"}</Text>
    </View>
  );
}

function Qr({ text, size }: { text: string; size: number }) {
  const qr = qrSvgPath(encodeQr(text), 2);
  return (
    <Svg width={size} height={size} viewBox={qr.viewBox}>
      <Path d={qr.d} fill="#000000" />
    </Svg>
  );
}

/** The public check's address for a paper: the college's id travels with the code (exam-cell-after.ts `checkExamDocument`). */
export const checkUrl = (origin: string, schoolId: string, code: string) => `${origin}/certificates/exam?school=${encodeURIComponent(schoolId)}&code=${encodeURIComponent(code)}`;

const when = (at: Date | null, timeZone: string) => (at ? formatInZone(at, timeZone, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—");

export async function renderHallTicketPdf(doc: Awaited<ReturnType<typeof hallTicketForPdf>>, t: Translate, origin: string): Promise<Buffer> {
  ensureFonts();
  const { ticket, school, papers } = doc;
  let photo: { data: Buffer; format: "png" | "jpg" } | null = null;
  if (doc.photoFileId) {
    const file = await readStoredFile(doc.photoFileId).catch(() => null);
    if (file && (file.mime === "image/png" || file.mime === "image/jpeg")) photo = { data: file.bytes, format: file.mime === "image/png" ? "png" : "jpg" };
  }
  const page = (
    <Document title={t("examCell.ticketTitle")}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.college}>{school.name}</Text>
        {school.affiliatingUniversity ? <Text style={styles.university}>{school.affiliatingUniversity}</Text> : null}
        <Text style={styles.title}>{t("examCell.ticketTitle")} · {ticket.session.name}</Text>
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 10 }}>
          <View style={[styles.facts, { flex: 1, marginBottom: 0 }]}>
            <Fact label={t("examCell.pdfTicketNumber")} value={ticket.number} />
            <Fact label={t("examCell.pdfName")} value={ticket.student.user.name} />
            <Fact label={t("examCell.pdfRoll")} value={ticket.student.studentCode} />
            <Fact label={t("examCell.pdfPrn")} value={doc.prn} />
            <Fact label={t("examCell.pdfProgramme")} value={doc.programme} />
          </View>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- a PDF's Image takes no alt; the box is labelled as the photo */}
          <View style={styles.photo}>{photo ? <Image src={photo} style={{ width: 70, height: 88, objectFit: "cover" }} /> : <Text style={{ fontSize: 7, color: MUTED, textAlign: "center" }}>{t("examCell.pdfAffixPhoto")}</Text>}</View>
        </View>
        <View style={styles.head}>
          <Text style={styles.cell}>{t("examCell.pdfCourse")}</Text>
          <Text style={styles.wide}>{t("examCell.pdfCourseName")}</Text>
          <Text style={styles.cell}>{t("examCell.pdfWhen")}</Text>
          <Text style={styles.cell}>{t("examCell.pdfHall")}</Text>
          <Text style={styles.num}>{t("examCell.pdfSeat")}</Text>
        </View>
        {papers.map((p) => (
          <View key={p.code} style={styles.row}>
            <Text style={styles.cell}>
              {p.code}
              {p.kind === "BACKLOG" ? ` (${t("examCell.backlogShort")})` : ""}
            </Text>
            <Text style={styles.wide}>{p.name}</Text>
            <Text style={styles.cell}>{when(p.at, school.timezone)}</Text>
            <Text style={styles.cell}>{p.room ?? "—"}</Text>
            <Text style={styles.num}>{p.seatNo ?? "—"}</Text>
          </View>
        ))}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 18 }}>
          <View style={{ alignItems: "center" }}>
            <Qr text={checkUrl(origin, ticket.schoolId, ticket.code)} size={80} />
            <Text style={{ fontSize: 7.5, color: MUTED, marginTop: 2 }}>{t("examCell.pdfCheckCode", { code: ticket.code })}</Text>
          </View>
          <Text style={styles.signatureLine}>{t("examCell.pdfControllerSign")}</Text>
        </View>
        <Text style={styles.footer} fixed>
          {t("examCell.pdfTicketFooter")}
        </Text>
      </Page>
    </Document>
  );
  return renderToBuffer(page);
}

export async function renderAttendanceSheetPdf(sheet: Awaited<ReturnType<typeof attendanceSheetData>>, t: Translate): Promise<Buffer> {
  ensureFonts();
  const { room, school } = sheet;
  const page = (
    <Document title={t("examCell.sheetTitle")}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.college}>{school.name}</Text>
        <Text style={styles.title}>{t("examCell.sheetTitle")} · {room.session.name}</Text>
        <View style={styles.facts}>
          <Fact label={t("examCell.pdfCourse")} value={`${room.schedule.courseCode} ${room.schedule.courseName}`} />
          <Fact label={t("examCell.pdfWhen")} value={when(room.schedule.at, school.timezone)} />
          <Fact label={t("examCell.pdfHall")} value={room.name} />
          <Fact label={t("examCell.pdfInvigilators")} value={room.invigilation.map((i) => i.staff.user.name).join(", ")} />
        </View>
        <View style={styles.head}>
          <Text style={styles.num}>{t("examCell.pdfSeat")}</Text>
          <Text style={styles.cell}>{t("examCell.pdfTicketNumber")}</Text>
          <Text style={styles.wide}>{t("examCell.pdfName")}</Text>
          <Text style={styles.cell}>{t("examCell.pdfAnswerBook")}</Text>
          <Text style={styles.cell}>{t("examCell.pdfSignature")}</Text>
        </View>
        {room.seats.map((s) => (
          <View key={s.id} style={[styles.row, { minHeight: 22 }]} wrap={false}>
            <Text style={styles.num}>{s.seatNo}</Text>
            <Text style={styles.cell}>{s.form.ticket?.number ?? "—"}</Text>
            <Text style={styles.wide}>{s.student.user.name}</Text>
            <Text style={styles.cell}> </Text>
            <Text style={styles.cell}> </Text>
          </View>
        ))}
        <View style={styles.summary}>
          <Text>{t("examCell.pdfSeated", { count: room.seats.length })}</Text>
          <Text>{t("examCell.pdfPresentAbsent")}</Text>
        </View>
        <View style={styles.signatures}>
          <Text style={styles.signatureLine}>{t("examCell.pdfInvigilatorSign")}</Text>
          <Text style={styles.signatureLine}>{t("examCell.pdfControllerSign")}</Text>
        </View>
      </Page>
    </Document>
  );
  return renderToBuffer(page);
}

const KIND_TITLE = { GRADE_CARD: "examCell.docGradeCard", TRANSCRIPT: "examCell.docTranscript", DEGREE: "examCell.docDegree" } as const;
const CLASS_KEY = { DISTINCTION: "examCell.classDISTINCTION", FIRST: "examCell.classFIRST", HIGHER_SECOND: "examCell.classHIGHER_SECOND", SECOND: "examCell.classSECOND", PASS: "examCell.classPASS" } as const;
const clsText = (cls: string | null, t: Translate) => (cls && cls in CLASS_KEY ? t(CLASS_KEY[cls as keyof typeof CLASS_KEY]) : "—");

export async function renderExamDocumentPdf(paper: Awaited<ReturnType<typeof documentForPdf>>, t: Translate, origin: string): Promise<Buffer> {
  ensureFonts();
  const { row, data } = paper;
  const signatures = (
    <View style={styles.signatures} wrap={false}>
      <View style={{ alignItems: "center" }}>
        <Qr text={checkUrl(origin, row.schoolId, row.code)} size={70} />
        <Text style={{ fontSize: 7.5, color: MUTED, marginTop: 2 }}>{t("examCell.pdfCheckCode", { code: row.code })}</Text>
      </View>
      {/* eslint-disable-next-line jsx-a11y/alt-text -- a PDF's Image takes no alt */}
      <View style={{ width: 64, alignItems: "center" }}>{row.sealPng && row.sealPng.length > 0 ? <Image src={{ data: Buffer.from(row.sealPng), format: "png" }} style={{ width: 60, height: 60, objectFit: "contain" }} /> : null}</View>
      <View style={{ alignItems: "center" }}>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- a PDF's Image takes no alt */}
        <View style={{ height: 40, justifyContent: "flex-end" }}>{row.signaturePng && row.signaturePng.length > 0 ? <Image src={{ data: Buffer.from(row.signaturePng), format: "png" }} style={{ maxHeight: 38, maxWidth: 150, objectFit: "contain" }} /> : null}</View>
        <Text style={styles.signatureLine}>{t("examCell.pdfControllerSign")}</Text>
      </View>
    </View>
  );
  const header = (
    <>
      <Text style={styles.college}>{data.college.name}</Text>
      {data.college.university ? <Text style={styles.university}>{data.college.autonomous ? t("examCell.pdfAutonomousUnder", { university: data.college.university }) : data.college.university}</Text> : null}
      <Text style={styles.title}>{t(KIND_TITLE[data.kind])}</Text>
      <View style={styles.facts}>
        <Fact label={t("examCell.pdfSerial")} value={row.serial} />
        <Fact label={t("examCell.pdfName")} value={data.student.name} />
        <Fact label={t("examCell.pdfRoll")} value={data.student.code} />
        <Fact label={t("examCell.pdfPrn")} value={data.student.prn} />
        <Fact label={t("examCell.pdfProgramme")} value={data.student.programme} />
        <Fact label={t("examCell.pdfIssued")} value={formatInZone(row.issuedAt, "Asia/Kolkata", { day: "numeric", month: "short", year: "numeric" })} />
      </View>
    </>
  );
  const body =
    data.kind === "DEGREE" ? (
      <Text style={styles.degreeBody}>{t("examCell.degreeText", { name: data.student.name, programme: data.student.programme ?? "—", year: data.yearOfPassing ?? "—", cgpa: data.cgpa?.toFixed(2) ?? "—", cls: clsText(data.cls, t) })}</Text>
    ) : (
      <>
        {data.terms.map((term, i) => (
          <View key={`${term.sessionName}-${i}`} wrap={false}>
            <Text style={styles.section}>{term.sessionName}</Text>
            <View style={styles.head}>
              <Text style={styles.cell}>{t("examCell.pdfCourse")}</Text>
              <Text style={styles.wide}>{t("examCell.pdfCourseName")}</Text>
              <Text style={styles.num}>{t("examCell.pdfCredits")}</Text>
              <Text style={styles.num}>{t("examCell.pdfGrade")}</Text>
              <Text style={styles.num}>{t("examCell.pdfPoints")}</Text>
            </View>
            {term.courses.map((c) => (
              <View key={c.code} style={styles.row}>
                <Text style={styles.cell}>{c.code}</Text>
                <Text style={styles.wide}>{c.name}</Text>
                <Text style={styles.num}>{c.credits}</Text>
                <Text style={styles.num}>{c.grade}</Text>
                <Text style={styles.num}>{c.points}</Text>
              </View>
            ))}
            <View style={styles.summary}>
              <Text>{t("examCell.pdfSgpa", { sgpa: term.sgpa?.toFixed(2) ?? "—" })}</Text>
              <Text>{t("examCell.pdfCreditsEarned", { credits: term.credits })}</Text>
              <Text>{clsText(term.cls, t)}</Text>
            </View>
          </View>
        ))}
        <View style={[styles.summary, { marginTop: 14, borderTopWidth: 0.75, borderTopColor: INK, paddingTop: 6 }]}>
          <Text>{t("examCell.pdfCgpa", { cgpa: data.cgpa?.toFixed(2) ?? "—" })}</Text>
          <Text>{t("examCell.pdfCreditsEarned", { credits: data.creditsEarned })}</Text>
        </View>
      </>
    );
  const page = (
    <Document title={t(KIND_TITLE[data.kind])}>
      <Page size="A4" style={styles.page}>
        {header}
        {body}
        {signatures}
        <Text style={styles.footer} fixed>
          {t("examCell.pdfDocFooter")}
        </Text>
      </Page>
    </Document>
  );
  return renderToBuffer(page);
}
