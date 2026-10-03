import "server-only";
import path from "node:path";
import React from "react";
import { Document, Font, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { dictionaryFor, translatorFor, type Locale, type TranslationKey } from "@edulink/i18n";
import type { PayslipLine } from "@edulink/contracts";
import type { PayslipDocument } from "./payroll";
import { CODE_LABEL_KEY } from "./payroll-rules";
import { formatDateKey } from "./dates";
import { numberToWords } from "./words";

/**
 * A payslip as a PDF, in the certificate's manner (Mukta from the bundled
 * files so Devanagari draws, Helvetica the fallback glyph by glyph), every
 * sentence from the dictionary in THE LANGUAGE OF THE PERSON IT BELONGS TO —
 * the office downloading a Marathi-speaking driver's slip gets it in
 * Marathi, as the driver would. Every figure is the locked slip's; nothing
 * is worked out here. The bank account appears as its last four only.
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
  page: { paddingTop: 40, paddingBottom: 44, paddingHorizontal: 48, fontFamily: ["Mukta", "Helvetica"] as unknown as string, fontSize: 10, color: INK, lineHeight: 1.35 },
  title: { fontSize: 17, fontWeight: 700, lineHeight: 1.3 },
  sub: { fontSize: 9, color: MUTED, marginBottom: 12 },
  facts: { flexDirection: "row", flexWrap: "wrap", borderWidth: 0.5, borderColor: LINE, padding: 8, marginBottom: 12 },
  fact: { width: "50%", flexDirection: "row", paddingVertical: 1.5 },
  factLabel: { width: "45%", color: MUTED, fontSize: 9 },
  factValue: { width: "55%", fontWeight: 700, fontSize: 9.5 },
  columns: { flexDirection: "row", gap: 16 },
  column: { flex: 1 },
  head: { flexDirection: "row", backgroundColor: "#f1f4f8", paddingVertical: 3, paddingHorizontal: 4, fontSize: 8.5, color: MUTED },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: LINE, paddingVertical: 3, paddingHorizontal: 4 },
  name: { flex: 3 },
  num: { flex: 2, textAlign: "right" },
  total: { flexDirection: "row", paddingVertical: 4, paddingHorizontal: 4, fontWeight: 700, borderTopWidth: 0.75, borderTopColor: INK },
  net: { marginTop: 14, padding: 10, borderWidth: 0.75, borderColor: INK, flexDirection: "row", justifyContent: "space-between", fontSize: 12, fontWeight: 700 },
  words: { marginTop: 4, fontSize: 9, color: MUTED },
  note: { marginTop: 10, fontSize: 9 },
  footer: { position: "absolute", left: 48, right: 48, bottom: 24, fontSize: 7.5, color: MUTED, textAlign: "center" },
});

type T = (key: TranslationKey, vars?: Record<string, string | number>) => string;

function money(paise: number, locale: Locale): string {
  return `₹${new Intl.NumberFormat(locale === "en" ? "en-IN" : `${locale}-IN`, { minimumFractionDigits: 2, maximumFractionDigits: 2, numberingSystem: "latn" } as Intl.NumberFormatOptions).format(paise / 100)}`;
}

const labelOf = (l: PayslipLine, t: T) => l.label || t(CODE_LABEL_KEY[l.code] as TranslationKey);

function Table({ title, lines, total, t, locale, showFull }: { title: string; lines: PayslipLine[]; total: number; t: T; locale: Locale; showFull: boolean }) {
  return (
    <View style={styles.column}>
      <View style={styles.head}>
        <Text style={styles.name}>{title}</Text>
        {showFull ? <Text style={styles.num}>{t("payroll.pdfFull")}</Text> : null}
        <Text style={styles.num}>{t("payroll.pdfThisMonth")}</Text>
      </View>
      {lines.map((l, i) => (
        <View key={`${l.code}-${i}`} style={styles.row}>
          <Text style={styles.name}>{labelOf(l, t)}</Text>
          {showFull ? <Text style={styles.num}>{money(l.fullPaise, locale)}</Text> : null}
          <Text style={styles.num}>{money(l.paise, locale)}</Text>
        </View>
      ))}
      <View style={styles.total}>
        <Text style={styles.name}>{t("payroll.pdfTotal")}</Text>
        {showFull ? <Text style={styles.num} /> : null}
        <Text style={styles.num}>{money(total, locale)}</Text>
      </View>
    </View>
  );
}

function SlipPage({ d }: { d: PayslipDocument }) {
  const t = translatorFor(dictionaryFor(d.locale)) as T;
  const s = d.slip;
  const monthLabel = formatDateKey(`${d.month}-01`, { month: "long", year: "numeric" }, d.locale);
  const earnings = s.lines.filter((l) => l.kind === "EARNING");
  const deductions = s.lines.filter((l) => l.kind === "DEDUCTION");
  const employer = s.lines.filter((l) => l.kind === "EMPLOYER_CONTRIBUTION");
  const facts: [string, string][] = [
    [t("payroll.pdfEmployee"), s.name],
    [t("payroll.pdfDesignation"), s.designation ?? "—"],
    [t("payroll.pdfDaysInMonth"), String(s.daysInMonth)],
    [t("payroll.pdfPaidDays"), String(s.paidDays)],
    [t("payroll.pdfLopDays"), String(s.lopDays)],
    [t("payroll.pdfPaymentMode"), t(`payroll.mode${s.paymentMode}` as TranslationKey)],
    [t("payroll.pdfBank"), s.bankLast4 ? `•••• ${s.bankLast4}` : "—"],
    [t("payroll.pdfPan"), d.panLast4 ? `•••• ${d.panLast4}` : "—"],
    [t("payroll.pdfUan"), d.pfUan ?? "—"],
    [t("payroll.pdfEsi"), d.esiNumber ?? "—"],
  ];
  const rupees = Math.floor(Math.max(0, s.netPaise) / 100);
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>{d.employerName}</Text>
      <Text style={styles.sub}>
        {t("payroll.pdfTitle", { month: monthLabel })}
        {d.pfEstablishmentCode ? ` · ${t("payroll.pdfPfCode", { code: d.pfEstablishmentCode })}` : ""}
        {d.esiEmployerCode ? ` · ${t("payroll.pdfEsiCode", { code: d.esiEmployerCode })}` : ""}
      </Text>
      <View style={styles.facts}>
        {facts.map(([label, value]) => (
          <View key={label} style={styles.fact}>
            <Text style={styles.factLabel}>{label}</Text>
            <Text style={styles.factValue}>{value}</Text>
          </View>
        ))}
      </View>
      <View style={styles.columns}>
        <Table title={t("payroll.pdfEarnings")} lines={earnings} total={s.grossPaise} t={t} locale={d.locale} showFull />
        <Table title={t("payroll.pdfDeductions")} lines={deductions} total={s.deductionsPaise} t={t} locale={d.locale} showFull={false} />
      </View>
      <View style={styles.net}>
        <Text>{t("payroll.pdfNet")}</Text>
        <Text>{money(s.netPaise, d.locale)}</Text>
      </View>
      {rupees <= 99_999_999 ? <Text style={styles.words}>{t("payroll.pdfNetWords", { words: numberToWords(rupees, d.locale) })}</Text> : null}
      {employer.length ? (
        <View style={{ marginTop: 12 }}>
          <Table title={t("payroll.pdfEmployer")} lines={employer} total={s.employerPaise} t={t} locale={d.locale} showFull={false} />
        </View>
      ) : null}
      {s.notes ? <Text style={styles.note}>{t("payroll.pdfNotes", { notes: s.notes })}</Text> : null}
      <Text style={styles.footer} fixed>
        {t("payroll.pdfFooter", { school: d.schoolName })}
      </Text>
    </Page>
  );
}

export async function renderPayslipPdf(d: PayslipDocument): Promise<Buffer> {
  ensureFonts();
  const t = translatorFor(dictionaryFor(d.locale)) as T;
  const doc = (
    <Document title={`${t("payroll.pdfTitle", { month: d.month })} · ${d.slip.name}`} author={d.employerName}>
      <SlipPage d={d} />
    </Document>
  );
  return Buffer.from(await renderToBuffer(doc));
}
