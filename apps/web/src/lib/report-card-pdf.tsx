import "server-only";
import path from "node:path";
import React from "react";
import { Document, Font, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { gradingHintKey, type Card } from "./report-cards";
import { pdfFamilyFor } from "./pdf-font-registry";
import { paperImages } from "./signatures";
import { readStoredFile } from "./storage";
import { formatMilli } from "./validation";
import { nameCarriesSection } from "./codes";
import type { Translate } from "./i18n/dictionary";
import { reportCardDefaultLabel } from "./certificate-names";

/**
 * A report card as a PDF, one card per page, many cards in one file.
 *
 * WHY A RENDERER AND NOT THE BROWSER'S PRINT: a class teacher issuing thirty
 * cards had thirty page loads and thirty print dialogs, and a parent on the
 * phone had no document at all, only a share of the card's text. The file is
 * built on the server from the same frozen snapshot the page shows, so the
 * two never disagree.
 *
 * THE FONT IS MUKTA (Ek Type, OFL), shipped with the app, because a Marathi
 * remark or a Hindi subject name must shape correctly — conjuncts and matras
 * — and the renderer does that only with a font that carries the script.
 * Noto Sans Devanagari was tried first and its long-I vowel (ई) came out as
 * a short I with a stray reph through this renderer's shaper; Mukta shapes
 * every string the fixtures and tests throw at it and carries Latin, the
 * rupee sign and the en-dash itself, with Helvetica still listed as the
 * fallback. The files are traced into the standalone build by next.config.ts.
 */
const FONT_DIR = path.join(process.cwd(), "src", "lib", "pdf-fonts");
let registered = false;
function ensureFonts() {
  if (registered) return;
  Font.register({
    family: "Mukta",
    fonts: [
      { src: path.join(FONT_DIR, "Mukta-Regular.ttf") },
      { src: path.join(FONT_DIR, "Mukta-Bold.ttf"), fontWeight: 700 },
    ],
  });
  // No hyphenation: a pupil's name or a subject split across lines is wrong on a document.
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}

const INK = "#1b1f2a";
const MUTED = "#5b6472";
const LINE = "#d6dce6";

const styles = StyleSheet.create({
  page: { paddingTop: 36, paddingBottom: 40, paddingHorizontal: 40, fontFamily: ["Mukta", "Helvetica"] as unknown as string, fontSize: 10, color: INK },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 12, borderBottomWidth: 2, paddingBottom: 10, marginBottom: 12 },
  logo: { width: 52, height: 52, objectFit: "contain" },
  schoolName: { fontSize: 18, fontWeight: 700 },
  small: { fontSize: 8.5, color: MUTED },
  title: { fontSize: 13, fontWeight: 700, marginTop: 2 },
  pupilRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10 },
  pupil: { fontSize: 15, fontWeight: 700 },
  figures: { flexDirection: "row", gap: 10, marginBottom: 12 },
  figure: { flex: 1, borderWidth: 1, borderColor: LINE, borderRadius: 4, padding: 8 },
  figureLabel: { fontSize: 8, color: MUTED },
  figureValue: { fontSize: 18, fontWeight: 700, marginTop: 1 },
  section: { fontSize: 10.5, fontWeight: 700, marginTop: 10, marginBottom: 4 },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: LINE, paddingVertical: 3.5 },
  head: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: INK, paddingVertical: 3, fontSize: 8, color: MUTED },
  cellSubject: { flex: 3 },
  cellPart: { flex: 3, color: MUTED, fontSize: 8.5 },
  cellNum: { flex: 1.2, textAlign: "right" },
  cellGrade: { flex: 1, textAlign: "right", fontWeight: 700 },
  remark: { marginTop: 3, lineHeight: 1.4 },
  signatures: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 20, gap: 24 },
  signatureLine: { borderTopWidth: 0.75, borderTopColor: INK, paddingTop: 4, fontSize: 8.5, color: MUTED, textAlign: "center" },
  signature: { flex: 1, borderTopWidth: 0.75, borderTopColor: INK, paddingTop: 4, fontSize: 8.5, color: MUTED, textAlign: "center" },
  footer: { position: "absolute", left: 40, right: 40, bottom: 22, fontSize: 7.5, color: MUTED, textAlign: "center" },
  scale: { marginTop: 8, fontSize: 7.5, color: MUTED },
});

/* A subject's or the overall's percent arrives already rounded to the one
   decimal the letter beside it was read from; toFixed here only fixes the width. */
const pct = (n: number | null, digits = 1) => (n === null ? "—" : `${n.toFixed(digits)}%`);

function Row({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

type Logo = { data: Buffer; format: "png" | "jpg" };

type Pictures = Partial<Record<"LEFT" | "RIGHT" | "SEAL", Uint8Array>>;
function CardPage({ card, logo, t, locale, pictures }: { card: Card; logo: Logo | null; t: Translate; locale: string; pictures: Pictures }) {
  const layout = card.layout;
  const accent = layout.useBrandColour && card.school.brandPrimary ? card.school.brandPrimary : INK;
  const address = [card.school.addressLine, card.school.city, card.school.region, card.school.postalCode].filter(Boolean).join(", ");
  const contact = [card.school.contactPhone, card.school.contactEmail, card.school.website].filter(Boolean).join(" · ");
  const date = (key: string) => new Date(`${key}T00:00:00Z`).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const subjects = card.subjects;
  const showPoints = layout.showGradePoints && subjects.some((s) => s.points !== null);
  const hasLetters = card.scale.bands.length > 0;
  // Marks over maximum: the rows show the marks they contributed, and the overall is their sum.
  const showMarks = card.gradingMethod === "exams" && subjects.some((s) => s.pointsMilli);

  return (
    <Page size={layout.paper === "LETTER" ? "LETTER" : "A4"} style={[styles.page, { fontFamily: pdfFamilyFor(layout.font) as unknown as string }]}>
      <View style={[styles.header, { borderBottomColor: accent }]}>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- the renderer's Image has no alt; the logo is decoration beside the school's name */}
        {logo ? <Image src={logo} style={styles.logo} /> : null}
        <View style={{ flex: 1 }}>
          <Text style={[styles.schoolName, { color: accent }]}>{card.school.name}</Text>
          {layout.headerNote ? <Text style={styles.small}>{layout.headerNote}</Text> : null}
          {layout.showAddress && address ? <Text style={styles.small}>{address}</Text> : null}
          {layout.showAddress && contact ? <Text style={styles.small}>{contact}</Text> : null}
          <Text style={styles.title}>
            {card.title} · {card.className}
            {card.classSection && !nameCarriesSection(card.className, card.classSection) ? ` ${card.classSection}` : ""}
          </Text>
        </View>
      </View>

      <View style={styles.pupilRow}>
        <Text style={styles.pupil}>{card.studentName}</Text>
        <Text style={styles.small}>
          {date(card.fromDateKey)} – {date(card.toDateKey)}
        </Text>
      </View>

      <View style={styles.figures}>
        <View style={styles.figure}>
          <Text style={styles.figureLabel}>{t("reportView.overall")}</Text>
          <Text style={styles.figureValue}>
            {pct(card.overallPercent)}
            {card.overallLetter ? `  ${card.overallLetter}` : ""}
          </Text>
          <Text style={styles.figureLabel}>{t(gradingHintKey(card))}</Text>
        </View>
        {showPoints && card.gradePoints !== null ? (
          <View style={styles.figure}>
            <Text style={styles.figureLabel}>{t("reportView.gradePoints")}</Text>
            <Text style={styles.figureValue}>{card.gradePoints.toFixed(2)}</Text>
            <Text style={styles.figureLabel}>{t("reportView.gradePointsHint")}</Text>
          </View>
        ) : null}
        {layout.showAttendance ? (
          <View style={styles.figure}>
            <Text style={styles.figureLabel}>{t("reportView.attendance")}</Text>
            <Text style={styles.figureValue}>{card.attendancePercent === null ? "—" : `${card.attendancePercent}%`}</Text>
            <Text style={styles.figureLabel}>{card.attendanceTotal === 0 ? t("reportView.noRegisterWindow") : t("reportView.daysOf", { present: card.attendancePresent, total: card.attendanceTotal })}</Text>
          </View>
        ) : null}
      </View>

      {subjects.length > 0 ? (
        <View>
          <Text style={styles.section}>{t("reportView.scholastic")}</Text>
          <View style={styles.head}>
            <Text style={styles.cellSubject}>{t("reportView.subject")}</Text>
            <Text style={styles.cellPart}>{card.scope === "YEAR" ? t("reportView.terms") : t("reportView.papers")}</Text>
            {showMarks ? <Text style={styles.cellNum}>{t("reportView.mark")}</Text> : null}
            <Text style={styles.cellNum}>{t("reportView.percent")}</Text>
            {hasLetters ? <Text style={styles.cellGrade}>{t("reportView.grade")}</Text> : null}
            {showPoints ? <Text style={styles.cellGrade}>{t("reportView.points")}</Text> : null}
          </View>
          {subjects.map((s) => (
            <Row key={s.subject}>
              <Text style={styles.cellSubject}>{s.subject}</Text>
              <Text style={styles.cellPart}>
                {s.parts
                  .map((p) => {
                    const mark = p.scoreMilli !== null && p.pointsMilli ? `${formatMilli(p.scoreMilli)}/${formatMilli(p.pointsMilli)}` : p.percent !== null ? pct(p.percent, 0) : "—";
                    return `${p.label} ${mark}${p.weight !== null ? ` (${Math.round(p.weight)}%)` : ""}`;
                  })
                  .join(" · ")}
              </Text>
              {showMarks ? <Text style={styles.cellNum}>{s.scoreMilli !== null && s.scoreMilli !== undefined && s.pointsMilli ? `${formatMilli(s.scoreMilli)}/${formatMilli(s.pointsMilli)}` : "—"}</Text> : null}
              <Text style={styles.cellNum}>{pct(s.percent)}</Text>
              {hasLetters ? <Text style={styles.cellGrade}>{s.letter ?? "—"}</Text> : null}
              {showPoints ? <Text style={styles.cellGrade}>{s.points === null ? "—" : String(s.points)}</Text> : null}
            </Row>
          ))}
        </View>
      ) : (
        <View>
          <Text style={styles.section}>{t("reportView.whatThisCovers")}</Text>
          {card.items.map((item, i) => (
            <Row key={i}>
              <Text style={styles.cellSubject}>{item.title}</Text>
              <Text style={styles.cellNum}>{item.scoreMilli === null ? "—" : `${formatMilli(item.scoreMilli)}${item.pointsMilli ? ` / ${formatMilli(item.pointsMilli)}` : ""}`}</Text>
              {hasLetters ? <Text style={styles.cellGrade}>{item.letter ?? "—"}</Text> : null}
            </Row>
          ))}
        </View>
      )}

      {layout.showCoScholastic && card.coScholastic.length > 0 ? (
        <View>
          <Text style={styles.section}>{t("reportView.coScholastic")}</Text>
          {card.coScholastic.map((c) => (
            <Row key={c.area}>
              <Text style={styles.cellSubject}>{reportCardDefaultLabel(c.area, t)}</Text>
              <Text style={styles.cellPart}>{c.note ?? ""}</Text>
              <Text style={styles.cellGrade}>{c.grade ?? "—"}</Text>
            </Row>
          ))}
        </View>
      ) : null}

      {layout.showPractice && card.practice ? (
        <View>
          <Text style={styles.section}>{t("reportView.practiceTitle")}</Text>
          {card.practice.map((row, i) => (
            <Row key={i}>
              <Text style={styles.cellSubject}>{row.name}</Text>
              <Text style={styles.cellPart}>{row.subject}</Text>
              <Text style={styles.cellNum}>L{row.level}/6</Text>
              <Text style={styles.cellGrade}>{row.tiers}/6</Text>
            </Row>
          ))}
        </View>
      ) : null}

      {layout.showRemark && card.remark ? (
        <View>
          <Text style={styles.section}>{t("reportView.fromClassTeacher")}</Text>
          <Text style={styles.remark}>{card.remark}</Text>
        </View>
      ) : null}

      {hasLetters ? (
        <Text style={styles.scale}>
          {t("reportView.scaleLine")}: {card.scale.bands.map((b) => `${b.label} ${b.minPercent}%${b.descriptor ? ` ${reportCardDefaultLabel(b.descriptor, t)}` : ""}`).join(" · ")}
        </Text>
      ) : null}

      {layout.showSignatures ? (
        <View style={styles.signatures} wrap={false}>
          {/* The set's own copy of each signature above its line; the seal stands over the parent's, which is signed by hand. */}
          {/* eslint-disable jsx-a11y/alt-text -- a PDF's Image takes no alt; the line under it names the signer's office */}
          {(["LEFT", "PARENT", "RIGHT"] as const).map((slot) => {
            const image = slot === "PARENT" ? pictures.SEAL : pictures[slot];
            return (
              <View key={slot} style={{ flex: 1 }}>
                <View style={{ height: 38, alignItems: "center", justifyContent: "flex-end" }}>{image ? <Image src={{ data: Buffer.from(image), format: "png" }} style={{ maxHeight: 36, maxWidth: 130, objectFit: "contain" }} /> : null}</View>
                <Text style={styles.signatureLine}>{slot === "LEFT" ? layout.signatureLeft : slot === "RIGHT" ? layout.signatureRight : t("reportView.signatureParent")}</Text>
              </View>
            );
          })}
          {/* eslint-enable jsx-a11y/alt-text */}
        </View>
      ) : null}

      <Text style={styles.footer} fixed>
        {[
          layout.footerNote,
          card.authorName ? t("reportView.writtenBy", { name: card.authorName }) : null,
          // The publish day in the SCHOOL'S zone — a card published at 20:00 UTC
          // on the 3rd was issued on the 4th in Kolkata, and says so.
          card.issuedDateKey ? t("reportView.issuedOn", { date: date(card.issuedDateKey) }) : t("reportView.notYetIssued"),
        ]
          .filter(Boolean)
          .join("  ·  ")}
      </Text>
    </Page>
  );
}

/** Every card in the list, one page each, in one file. The logo is read once. */
export async function renderReportCardsPdf(cards: Card[], t: Translate, locale = "en"): Promise<Buffer> {
  ensureFonts();
  const logoPath = cards.find((c) => c.school.logoPath)?.school.logoPath ?? null;
  const stored = logoPath ? await readStoredFile(logoPath) : null;
  // The renderer decodes PNG and JPEG only; any other logo is left off rather than failing the file.
  const format: Logo["format"] | null = stored?.mime === "image/png" ? "png" : stored?.mime === "image/jpeg" ? "jpg" : null;
  const logo: Logo | null = stored && format ? { data: stored.bytes, format } : null;
  // The pictures of each card's set, read once per set: every card of a set shares them.
  const pictures = new Map<string, Pictures>();
  for (const card of cards) {
    const key = [card.seal, ...card.signatures.map((s) => s.image)].join("|");
    if (!pictures.has(key)) pictures.set(key, await paperImages(card));
  }
  const doc = (
    <Document title={cards[0] ? `${cards[0].title} · ${cards[0].className}` : "Report cards"} author={cards[0]?.school.name}>
      {cards.map((card) => (
        <CardPage key={card.id} card={card} logo={logo} t={t} locale={locale} pictures={pictures.get([card.seal, ...card.signatures.map((s) => s.image)].join("|")) ?? {}} />
      ))}
    </Document>
  );
  return Buffer.from(await renderToBuffer(doc));
}
