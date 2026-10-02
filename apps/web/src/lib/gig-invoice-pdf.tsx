import "server-only";
import path from "node:path";
import React from "react";
import { Document, Font, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { dictionaryFor, translatorFor, type Locale, type TranslationKey } from "@edulink/i18n";
import type { InvoiceView, ReceiptView } from "./gig-payments";
import { dateKeyInZone } from "./dates";
import { dateInFigures, numberToWords, type WordsLocale } from "./words";

/**
 * The company's GST tax invoice to an expert, and a family's receipt for a
 * seat the company collected for (decision 0004, second amendment of
 * 2 October 2026), as PDFs in the certificate's manner: Mukta from the
 * bundled files so Devanagari draws, Helvetica the fallback glyph by glyph,
 * every sentence from the dictionary in the document's own language.
 *
 * THE INVOICE shows what a GST invoice must: its number and date, the
 * seller's name, address, GSTIN and state, the buyer's name, GSTIN (or
 * "unregistered") and state, the place of supply, the SAC, one line per
 * seat with the gross collected and the commission charged, the taxable
 * value, the tax split (CGST+SGST in the seller's state, IGST elsewhere),
 * the total, the total in words, and the sentence that the amount was
 * deducted from the seat fees collected on the expert's behalf. Nothing on
 * it is computed afresh: every figure is the frozen row's. The SAC and the
 * wording are the accountant's to confirm (docs/decisions/0004).
 *
 * THE RECEIPT shows the gross alone — the split is the company's and the
 * expert's — with who paid, for whom, for what, when, the gateway's payment
 * id, "collected by the company on behalf of the expert", and the refund
 * when there was one.
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
const ZONE = "Asia/Kolkata";

const styles = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 44, paddingHorizontal: 52, fontFamily: ["Mukta", "Helvetica"] as unknown as string, fontSize: 10, color: INK, lineHeight: 1.35 },
  // Its own line height: the page's 1.35 is resolved at 10 pt and inherited as 13.5 pt, which an 18 pt line overran into the subtitle.
  title: { fontSize: 18, fontWeight: 700, lineHeight: 1.3, marginBottom: 2 },
  sub: { fontSize: 9, color: MUTED, marginBottom: 12 },
  parties: { flexDirection: "row", gap: 24, marginBottom: 12 },
  party: { flex: 1, borderWidth: 0.5, borderColor: LINE, padding: 8 },
  label: { fontSize: 8, color: MUTED, textTransform: "uppercase", letterSpacing: 0.4 },
  strong: { fontWeight: 700 },
  meta: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginBottom: 12, fontSize: 9 },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: LINE, paddingVertical: 3 },
  head: { backgroundColor: "#f1f4f8", fontSize: 8.5, color: MUTED },
  cTitle: { flex: 5 },
  cDate: { flex: 2 },
  cNum: { flex: 2, textAlign: "right" },
  totals: { marginTop: 10, alignSelf: "flex-end", width: 260 },
  tRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  tGrand: { borderTopWidth: 0.75, borderTopColor: INK, marginTop: 4, paddingTop: 4, fontWeight: 700, fontSize: 11 },
  words: { marginTop: 6, fontSize: 9, color: MUTED },
  note: { marginTop: 14, fontSize: 9.5 },
  footer: { position: "absolute", left: 52, right: 52, bottom: 24, fontSize: 7.5, color: MUTED, textAlign: "center" },
  stamp: { position: "absolute", top: 240, left: 52, right: 52, textAlign: "center", fontSize: 40, color: "#b03a2e", opacity: 0.3, fontWeight: 700 },
});

type T = (key: TranslationKey, vars?: Record<string, string | number>) => string;
const wordsOf = (locale: Locale): T => translatorFor(dictionaryFor(locale));

/** ₹1,250.00 — the invoice's figures carry paise, as a tax invoice must. */
function money(paise: number, locale: Locale): string {
  return `₹${new Intl.NumberFormat(locale === "en" ? "en-IN" : `${locale}-IN`, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(paise / 100)}`;
}

/** "Rupees one thousand two hundred and fifty and paise fifty only", within what words.ts can say; figures past it. */
function inWords(paise: number, locale: WordsLocale, t: T): string {
  const rupees = Math.floor(paise / 100);
  const p = paise % 100;
  if (rupees > 99_999) return t("gigs.invWordsFigures", { amount: money(paise, locale) });
  return p > 0 ? t("gigs.invWordsPaise", { rupees: numberToWords(rupees, locale), paise: numberToWords(p, locale) }) : t("gigs.invWords", { rupees: numberToWords(rupees, locale) });
}

const day = (iso: string) => dateInFigures(dateKeyInZone(new Date(iso), ZONE));

function InvoicePage({ inv }: { inv: InvoiceView }) {
  const locale = inv.locale;
  const t = wordsOf(locale);
  const gst = inv.cgstPaise + inv.sgstPaise + inv.igstPaise;
  const rate = inv.taxableValuePaise > 0 ? Math.round((gst / inv.taxableValuePaise) * 100) : 0;
  const half = rate / 2;
  const grossTotal = inv.lines.reduce((a, l) => a + l.grossPaise, 0);
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>{t("gigs.invTitle")}</Text>
      <Text style={styles.sub}>{t("gigs.invSubtitle")}</Text>
      <View style={styles.parties}>
        <View style={styles.party}>
          <Text style={styles.label}>{t("gigs.invSeller")}</Text>
          <Text style={styles.strong}>{inv.seller.name}</Text>
          {inv.seller.address ? <Text>{inv.seller.address}</Text> : null}
          <Text>{t("gigs.invGstinLine", { gstin: inv.seller.gstin ?? "—" })}</Text>
          <Text>{t("gigs.invStateLine", { code: inv.seller.stateCode ?? "—" })}</Text>
        </View>
        <View style={styles.party}>
          <Text style={styles.label}>{t("gigs.invBuyer")}</Text>
          <Text style={styles.strong}>{inv.buyer.name}</Text>
          <Text>{inv.buyer.gstin ? t("gigs.invGstinLine", { gstin: inv.buyer.gstin }) : t("gigs.invUnregistered")}</Text>
          <Text>{t("gigs.invStateLine", { code: inv.buyer.stateCode ?? "—" })}</Text>
        </View>
      </View>
      <View style={styles.meta}>
        <Text>
          <Text style={styles.label}>{t("gigs.invNumber")} </Text>
          {inv.number}
        </Text>
        <Text>
          <Text style={styles.label}>{t("gigs.invDate")} </Text>
          {day(inv.issuedAt)}
        </Text>
        <Text>
          <Text style={styles.label}>{t("gigs.invPlaceOfSupply")} </Text>
          {inv.buyer.stateCode ?? "—"}
        </Text>
        <Text>
          <Text style={styles.label}>{t("gigs.invSac")} </Text>
          {inv.sacCode}
        </Text>
        <Text>
          <Text style={styles.label}>{t("gigs.invSupply")} </Text>
          {inv.seller.stateCode && inv.buyer.stateCode === inv.seller.stateCode ? t("gigs.invIntraState") : t("gigs.invInterState")}
        </Text>
      </View>
      <View style={[styles.row, styles.head]}>
        <Text style={styles.cTitle}>{t("gigs.invColSeat")}</Text>
        <Text style={styles.cDate}>{t("gigs.invColDate")}</Text>
        <Text style={styles.cNum}>{t("gigs.invColGross")}</Text>
        <Text style={styles.cNum}>{t("gigs.invColCommission")}</Text>
      </View>
      {inv.lines.map((l) => (
        <View key={l.paymentId} style={styles.row}>
          <Text style={styles.cTitle}>{l.title}</Text>
          <Text style={styles.cDate}>{dateInFigures(l.date)}</Text>
          <Text style={styles.cNum}>{money(l.grossPaise, locale)}</Text>
          <Text style={styles.cNum}>{money(l.commissionPaise, locale)}</Text>
        </View>
      ))}
      <View style={styles.totals}>
        <View style={styles.tRow}>
          <Text>{t("gigs.invCollected")}</Text>
          <Text>{money(grossTotal, locale)}</Text>
        </View>
        <View style={styles.tRow}>
          <Text style={styles.strong}>{t("gigs.invTaxable")}</Text>
          <Text style={styles.strong}>{money(inv.taxableValuePaise, locale)}</Text>
        </View>
        {inv.igstPaise > 0 || (inv.cgstPaise === 0 && inv.sgstPaise === 0) ? (
          <View style={styles.tRow}>
            <Text>{t("gigs.invIgst", { rate })}</Text>
            <Text>{money(inv.igstPaise, locale)}</Text>
          </View>
        ) : (
          <>
            <View style={styles.tRow}>
              <Text>{t("gigs.invCgst", { rate: half })}</Text>
              <Text>{money(inv.cgstPaise, locale)}</Text>
            </View>
            <View style={styles.tRow}>
              <Text>{t("gigs.invSgst", { rate: half })}</Text>
              <Text>{money(inv.sgstPaise, locale)}</Text>
            </View>
          </>
        )}
        <View style={[styles.tRow, styles.tGrand]}>
          <Text>{t("gigs.invTotal")}</Text>
          <Text>{money(inv.totalPaise, locale)}</Text>
        </View>
        <Text style={styles.words}>{inWords(inv.totalPaise, locale, t)}</Text>
      </View>
      <Text style={styles.note}>{t("gigs.invDeducted", { total: money(inv.totalPaise, locale), net: money(inv.payout.netPaise, locale), count: inv.payout.paymentsCount })}</Text>
      {inv.payout.reference ? <Text style={styles.note}>{t("gigs.invPaidLine", { reference: inv.payout.reference, date: inv.payout.paidAt ? day(inv.payout.paidAt) : "—" })}</Text> : null}
      <Text style={styles.footer} fixed>
        {t("gigs.invFooter")}
      </Text>
    </Page>
  );
}

export async function renderInvoicePdf(inv: InvoiceView): Promise<Buffer> {
  ensureFonts();
  const doc = (
    <Document title={`${wordsOf(inv.locale)("gigs.invTitle")} · ${inv.number}`} author={inv.seller.name}>
      <InvoicePage inv={inv} />
    </Document>
  );
  return Buffer.from(await renderToBuffer(doc));
}

function ReceiptPage({ r, locale }: { r: ReceiptView; locale: Locale }) {
  const t = wordsOf(locale);
  const rows: [string, string][] = [
    [t("gigs.rcptNumber"), r.receiptNumber],
    [t("gigs.rcptDate"), day(r.paidAt)],
    [t("gigs.rcptFrom"), r.payerName],
    [t("gigs.rcptFor"), r.pupilName],
    [t("gigs.rcptSeat"), `${r.title} · ${day(r.startsAt)}`],
    [t("gigs.rcptExpert"), r.expertName],
    [t("gigs.rcptAmount"), money(r.amountPaise, locale)],
    [t("gigs.rcptGatewayRef"), r.gatewayPaymentId ?? "—"],
  ];
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>{t("gigs.rcptTitle")}</Text>
      <Text style={styles.sub}>{t("gigs.rcptCollectedBy", { company: r.collectedBy, expert: r.expertName })}</Text>
      <View style={{ marginVertical: 8 }}>
        {rows.map(([label, value]) => (
          <View key={label} style={styles.row}>
            <Text style={{ flex: 4, color: MUTED }}>{label}</Text>
            <Text style={{ flex: 7, fontWeight: 700 }}>{value}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.words}>{inWords(r.amountPaise, locale, t)}</Text>
      {r.refundedAt ? <Text style={styles.note}>{t("gigs.rcptRefundLine", { amount: money(r.refundedPaise, locale), date: day(r.refundedAt) })}</Text> : null}
      {r.status === "REFUNDED" ? <Text style={styles.stamp}>{t("gigs.paymentStatusREFUNDED").toUpperCase()}</Text> : null}
      <Text style={styles.footer} fixed>
        {t("gigs.rcptFooter")}
      </Text>
    </Page>
  );
}

export async function renderReceiptPdf(r: ReceiptView, locale: Locale): Promise<Buffer> {
  ensureFonts();
  const doc = (
    <Document title={`${wordsOf(locale)("gigs.rcptTitle")} · ${r.receiptNumber}`} author={r.collectedBy}>
      <ReceiptPage r={r} locale={locale} />
    </Document>
  );
  return Buffer.from(await renderToBuffer(doc));
}
