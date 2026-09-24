import "server-only";
import path from "node:path";
import React from "react";
import { Document, Font, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { IssuedCertificateView } from "./certificate-types";
import { db } from "./db";
import { readStoredFile } from "./storage";
import { wordsFor } from "./certificate-rules";
import { dateKeyInZone } from "./dates";
import type { WordsLocale } from "./words";
import { dateInFigures } from "./words";

/**
 * A certificate as a PDF, in the language it was issued in, from the frozen
 * wording on the issued row. The same font as the report card (Mukta; see
 * report-card-pdf.tsx for why), Helvetica the fallback glyph by glyph.
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
  page: { paddingTop: 40, paddingBottom: 44, paddingHorizontal: 52, fontFamily: ["Mukta", "Helvetica"] as unknown as string, fontSize: 10.5, color: INK, lineHeight: 1.35 },
  header: { flexDirection: "row", alignItems: "center", gap: 14, borderBottomWidth: 2, paddingBottom: 12, marginBottom: 14 },
  logo: { width: 56, height: 56, objectFit: "contain" },
  schoolName: { fontSize: 19, fontWeight: 700, marginBottom: 4 },
  small: { fontSize: 8.5, color: MUTED },
  serialRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12, fontSize: 9, color: MUTED },
  title: { fontSize: 17, fontWeight: 700, textAlign: "center", marginVertical: 10, textDecoration: "underline" },
  para: { marginBottom: 10, textAlign: "justify" },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: LINE, paddingVertical: 2.5 },
  num: { width: 22, color: MUTED, fontSize: 9 },
  label: { flex: 5, color: MUTED },
  value: { flex: 6, fontWeight: 700 },
  signatures: { flexDirection: "row", justifyContent: "space-between", marginTop: 36, gap: 40 },
  signature: { flex: 1, borderTopWidth: 0.75, borderTopColor: INK, paddingTop: 4, fontSize: 9, color: MUTED, textAlign: "center" },
  footer: { position: "absolute", left: 52, right: 52, bottom: 24, fontSize: 7.5, color: MUTED, textAlign: "center" },
  revoked: { position: "absolute", top: 260, left: 52, right: 52, textAlign: "center", fontSize: 40, color: "#b03a2e", opacity: 0.35, fontWeight: 700 },
});

type Logo = { data: Buffer; format: "png" | "jpg" };

/**
 * "Issued on", as the body of the document says it: the frozen `issue.date`
 * the wording was filled from — the day of issue in the school's zone — never
 * the UTC slice of the instant, which is the day before for anything issued
 * before 05:30 in Kolkata. A row without the frozen value (none is issued
 * without one) falls back to the instant read in the school's zone.
 */
export async function issuedOnFor(cert: Pick<IssuedCertificateView, "id" | "issuedAt">): Promise<string> {
  const row = await db.issuedCertificate.findUnique({ where: { id: cert.id }, select: { dataJson: true, school: { select: { timezone: true } } } });
  try {
    const frozen = (JSON.parse(row?.dataJson ?? "{}") as Record<string, unknown>)["issue.date"];
    if (typeof frozen === "string" && frozen) return frozen;
  } catch {
    // an unreadable snapshot: the instant, below
  }
  return dateInFigures(dateKeyInZone(new Date(cert.issuedAt), row?.school.timezone ?? "UTC"));
}

function CertificatePage({ cert, logo, verifyUrl, issuedOn }: { cert: IssuedCertificateView; logo: Logo | null; verifyUrl: string; issuedOn: string }) {
  const locale = cert.locale as WordsLocale;
  const words = wordsFor(locale);
  const accent = cert.layout.useBrandColour && cert.school.brandPrimary ? cert.school.brandPrimary : INK;
  const address = [cert.school.addressLine, cert.school.city, cert.school.region, cert.school.postalCode].filter(Boolean).join(", ");
  const contact = [cert.school.contactPhone, cert.school.contactEmail].filter(Boolean).join(" · ");
  return (
    <Page size={cert.layout.paper === "LETTER" ? "LETTER" : "A4"} style={styles.page}>
      <View style={[styles.header, { borderBottomColor: accent }]}>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- the renderer's Image has no alt; the logo is decoration beside the school's name */}
        {cert.layout.showLogo && logo ? <Image src={logo} style={styles.logo} /> : null}
        <View style={{ flex: 1 }}>
          <Text style={[styles.schoolName, { color: accent }]}>{cert.school.name}</Text>
          {cert.layout.showAddress && address ? <Text style={styles.small}>{address}</Text> : null}
          {cert.layout.showAddress && contact ? <Text style={styles.small}>{contact}</Text> : null}
        </View>
      </View>
      <View style={styles.serialRow}>
        <Text>
          {words("certificates.serial")}: {cert.serial}
        </Text>
        <Text>{words("certificates.issuedOn", { date: issuedOn })}</Text>
      </View>
      <Text style={styles.title}>{cert.title}</Text>
      {cert.intro ? <Text style={styles.para}>{cert.intro}</Text> : null}
      {cert.rows.length > 0 ? (
        <View style={{ marginVertical: 8 }}>
          {cert.rows.map((r, i) => (
            <View key={i} style={styles.row}>
              <Text style={styles.num}>{i + 1}.</Text>
              <Text style={styles.label}>{r.label}</Text>
              <Text style={styles.value}>{r.value}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {cert.outro ? <Text style={[styles.para, { marginTop: 10 }]}>{cert.outro}</Text> : null}
      <View style={styles.signatures}>
        <Text style={styles.signature}>{cert.layout.signatureLeft}</Text>
        <Text style={styles.signature}>{cert.layout.signatureRight}</Text>
      </View>
      {cert.revokedAt ? <Text style={styles.revoked}>{words("certificates.revoke").toUpperCase()}</Text> : null}
      <Text style={styles.footer} fixed>
        {[cert.layout.footerNote, words("certificates.verifyLine", { url: verifyUrl, code: cert.code })].filter(Boolean).join("  ·  ")}
      </Text>
    </Page>
  );
}

export async function renderCertificatePdf(cert: IssuedCertificateView, verifyUrl: string): Promise<Buffer> {
  ensureFonts();
  const stored = cert.layout.showLogo && cert.school.logoPath ? await readStoredFile(cert.school.logoPath) : null;
  const format: Logo["format"] | null = stored?.mime === "image/png" ? "png" : stored?.mime === "image/jpeg" ? "jpg" : null;
  const logo: Logo | null = stored && format ? { data: stored.bytes, format } : null;
  const issuedOn = await issuedOnFor(cert);
  const doc = (
    <Document title={`${cert.title} · ${cert.serial}`} author={cert.school.name}>
      <CertificatePage cert={cert} logo={logo} verifyUrl={verifyUrl} issuedOn={issuedOn} />
    </Document>
  );
  return Buffer.from(await renderToBuffer(doc));
}
