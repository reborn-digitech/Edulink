import "server-only";
import path from "node:path";
import React from "react";
import { Document, Font, Page, Path, StyleSheet, Svg, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { dictionaryFor, translatorFor, type Locale, type TranslationKey } from "@edulink/i18n";
import { encodeQr, qrSvgPath } from "./qr";

/**
 * The asset tag sheet: A4, three labels across and eight down, each with
 * the tag number large, the asset's name and place, and a QR code that
 * opens the asset's page on the office's phone (the app's own address, or
 * the tag itself when the server has none configured). Cut and stick; a
 * stock-take scans them. The QR is drawn by the app's own encoder (qr.ts).
 */
const FONT_DIR = path.join(process.cwd(), "src", "lib", "pdf-fonts");
let registered = false;
function ensureFonts() {
  if (registered) return;
  Font.register({ family: "Mukta", fonts: [{ src: path.join(FONT_DIR, "Mukta-Regular.ttf") }, { src: path.join(FONT_DIR, "Mukta-Bold.ttf"), fontWeight: 700 }] });
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}

const styles = StyleSheet.create({
  page: { paddingTop: 24, paddingBottom: 24, paddingHorizontal: 20, fontFamily: ["Mukta", "Helvetica"] as unknown as string, fontSize: 8, color: "#1b1f2a", flexDirection: "row", flexWrap: "wrap" },
  label: { width: "33.333%", height: 96, padding: 6, borderWidth: 0.5, borderColor: "#c7ced9", borderStyle: "dashed", flexDirection: "row", gap: 6 },
  text: { flex: 1, justifyContent: "center" },
  school: { fontSize: 6.5, color: "#5b6472" },
  tag: { fontSize: 13, fontWeight: 700, marginVertical: 2 },
  name: { fontSize: 8 },
  place: { fontSize: 7, color: "#5b6472" },
});

/** What a label's code says: the asset's page, so a scan opens it. */
export function tagTarget(tag: string, origin = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? ""): string {
  const base = origin.replace(/\/+$/, "");
  return base ? `${base}/admin/inventory/assets/${encodeURIComponent(tag)}` : `ASSET:${tag}`;
}

export async function renderTagSheetPdf(input: { schoolName: string; locale: Locale; assets: { tagNumber: string; name: string; location: string }[] }): Promise<Buffer> {
  ensureFonts();
  const t = translatorFor(dictionaryFor(input.locale)) as (key: TranslationKey, vars?: Record<string, string | number>) => string;
  const labels = input.assets.map((a) => {
    const qr = qrSvgPath(encodeQr(tagTarget(a.tagNumber)), 2);
    return { ...a, qr };
  });
  const doc = (
    <Document title={t("inventory.tagSheetTitle")} author={input.schoolName}>
      <Page size="A4" style={styles.page} wrap>
        {labels.map((a) => (
          <View key={a.tagNumber} style={styles.label} wrap={false}>
            <Svg width={78} height={78} viewBox={a.qr.viewBox}>
              <Path d={a.qr.d} fill="#000000" />
            </Svg>
            <View style={styles.text}>
              <Text style={styles.school}>{input.schoolName}</Text>
              <Text style={styles.tag}>{a.tagNumber}</Text>
              <Text style={styles.name}>{a.name}</Text>
              <Text style={styles.place}>{a.location}</Text>
            </View>
          </View>
        ))}
      </Page>
    </Document>
  );
  return Buffer.from(await renderToBuffer(doc));
}
