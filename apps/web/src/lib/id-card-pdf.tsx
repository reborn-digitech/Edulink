import "server-only";
import path from "node:path";
import React from "react";
import { Document, Font, Image, Page, Path, StyleSheet, Svg, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { Translate } from "./i18n/dictionary";
import { encodeQr, qrSvgPath } from "./qr";
import { formatDateKey } from "./dates";
import { readStoredFile } from "./storage";
import type { IdCard } from "./id-card";

/**
 * The identity card as a PDF (5 Oct 2026, id-card.ts): one card the size of a
 * bank card (CR80, 85.6 × 54 mm), in the certificate's manner — Mukta from
 * the bundled files so Devanagari draws, every label from the dictionary in
 * the reader's language, the school's own colour on the band. Drawn on every
 * read, never stored.
 */
const FONT_DIR = path.join(process.cwd(), "src", "lib", "pdf-fonts");
let registered = false;
function ensureFonts() {
  if (registered) return;
  Font.register({ family: "Mukta", fonts: [{ src: path.join(FONT_DIR, "Mukta-Regular.ttf") }, { src: path.join(FONT_DIR, "Mukta-Bold.ttf"), fontWeight: 700 }] });
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}

const MM = 72 / 25.4;
const INK = "#1b1f2a";
const MUTED = "#5b6472";
const styles = StyleSheet.create({
  page: { width: 85.6 * MM, height: 54 * MM, fontFamily: ["Mukta", "Helvetica"] as unknown as string, fontSize: 6.5, color: INK, lineHeight: 1.25 },
  band: { paddingHorizontal: 8, paddingVertical: 4 },
  school: { fontSize: 8, fontWeight: 700, color: "#ffffff" },
  kind: { fontSize: 6, color: "#ffffff" },
  body: { flexDirection: "row", paddingHorizontal: 8, paddingTop: 5, gap: 6 },
  photo: { width: 44, height: 55, borderWidth: 0.5, borderColor: "#d6dce6", alignItems: "center", justifyContent: "center" },
  name: { fontSize: 8.5, fontWeight: 700, marginBottom: 2 },
  label: { color: MUTED, fontSize: 5.5 },
  value: { fontWeight: 700, fontSize: 6.5, marginBottom: 1.5 },
  foot: { position: "absolute", left: 8, right: 8, bottom: 4, fontSize: 5, color: MUTED },
});

export async function renderIdCardPdf(card: IdCard, t: Translate, origin: string, locale: string): Promise<Buffer> {
  ensureFonts();
  let photo: { data: Buffer; format: "png" | "jpg" } | null = null;
  if (card.photoFileId) {
    const file = await readStoredFile(card.photoFileId).catch(() => null);
    if (file && (file.mime === "image/png" || file.mime === "image/jpeg")) photo = { data: file.bytes, format: file.mime === "image/png" ? "png" : "jpg" };
  }
  const qr = card.checkPath ? qrSvgPath(encodeQr(`${origin}${card.checkPath}`), 2) : null;
  const band = /^#[0-9a-fA-F]{6}$/.test(card.school.brandPrimary ?? "") ? card.school.brandPrimary! : "#334155";
  const line = (label: string, value: string | null) =>
    value ? (
      <View>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    ) : null;
  const doc = (
    <Document title={t("collegeDesks.idCardTitle")}>
      <Page size={[85.6 * MM, 54 * MM]} style={styles.page}>
        <View style={[styles.band, { backgroundColor: band }]}>
          <Text style={styles.school}>{card.school.name}</Text>
          <Text style={styles.kind}>{t("collegeDesks.idCardTitle")}</Text>
        </View>
        <View style={styles.body}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- a PDF's Image takes no alt; the box is labelled as the photo */}
          <View style={styles.photo}>{photo ? <Image src={photo} style={{ width: 44, height: 55, objectFit: "cover" }} /> : <Text style={{ fontSize: 5, color: MUTED, textAlign: "center" }}>{t("collegeDesks.idCardAffixPhoto")}</Text>}</View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{card.name}</Text>
            {line(card.school.college ? t("collegeDesks.idCardProgramme") : t("collegeDesks.idCardClass"), card.group)}
            {line(t("collegeDesks.idCardCode"), card.studentCode)}
            {line(t("collegeDesks.idCardPrn"), card.prn)}
          </View>
          {qr ? (
            <Svg width={50} height={50} viewBox={qr.viewBox}>
              <Path d={qr.d} fill="#000000" />
            </Svg>
          ) : null}
        </View>
        <Text style={styles.foot}>
          {card.validUntil ? t("collegeDesks.idCardValid", { year: card.year ?? "", until: formatDateKey(card.validUntil, { day: "numeric", month: "short", year: "numeric" }, locale) }) : t("collegeDesks.idCardNoYear")}
        </Text>
      </Page>
    </Document>
  );
  return renderToBuffer(doc);
}
