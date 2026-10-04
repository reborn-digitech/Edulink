import "server-only";
import path from "node:path";
import React from "react";
import { Document, Font, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { FilingDocument } from "./iqac-filings";

/**
 * A NAAC or AICTE document as a PDF (the IQAC module, 4 October 2026), drawn
 * from the filing's frozen JSON (CollegeFiling.body) and nothing else: the
 * figures were cut from the rows when the filing was generated, so a second
 * download prints the same document. The words are the regulators' English
 * (contracts FILING_TEXT); Mukta from the bundled files so a Devanagari name
 * draws.
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

const s = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 48, paddingHorizontal: 44, fontFamily: ["Mukta", "Helvetica"] as unknown as string, fontSize: 9.5, color: INK, lineHeight: 1.35 },
  title: { fontSize: 16, fontWeight: 700 },
  sub: { fontSize: 9, color: MUTED, marginBottom: 10 },
  heading: { fontSize: 11.5, fontWeight: 700, marginTop: 12, marginBottom: 4 },
  kv: { flexDirection: "row", paddingVertical: 1.5, borderBottomWidth: 0.4, borderBottomColor: LINE },
  k: { width: "42%", color: MUTED },
  v: { width: "58%" },
  head: { flexDirection: "row", backgroundColor: "#f1f4f8", paddingVertical: 3, paddingHorizontal: 3, fontSize: 8, color: MUTED },
  row: { flexDirection: "row", borderBottomWidth: 0.4, borderBottomColor: LINE, paddingVertical: 2.5, paddingHorizontal: 3, fontSize: 8.5 },
  cell: { flex: 1, paddingRight: 4 },
  wide: { flex: 3, paddingRight: 4 },
  para: { marginTop: 4 },
  footer: { position: "absolute", left: 44, right: 44, bottom: 22, fontSize: 7, color: MUTED, textAlign: "center" },
});

export async function renderFilingPdf(doc: FilingDocument): Promise<Buffer> {
  ensureFonts();
  return renderToBuffer(
    <Document title={doc.title} author={doc.school} creator="Shalaghar">
      <Page size="A4" style={s.page}>
        <Text style={s.title}>{doc.title}</Text>
        <Text style={s.sub}>{doc.subtitle}</Text>
        {doc.sections.map((section, i) => (
          <View key={i} wrap>
            <Text style={s.heading}>{section.heading}</Text>
            {section.rows?.map(([k, v], j) => (
              <View key={j} style={s.kv}>
                <Text style={s.k}>{k}</Text>
                <Text style={s.v}>{v}</Text>
              </View>
            ))}
            {section.table ? (
              <View>
                <View style={s.head} fixed>
                  {section.table.head.map((h, j) => (
                    <Text key={j} style={j === section.table!.wide ? s.wide : s.cell}>
                      {h}
                    </Text>
                  ))}
                </View>
                {section.table.rows.map((r, j) => (
                  <View key={j} style={s.row} wrap={false}>
                    {r.map((c, k) => (
                      <Text key={k} style={k === section.table!.wide ? s.wide : s.cell}>
                        {String(c)}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            ) : null}
            {section.paragraphs?.map((p, j) => (
              <Text key={j} style={s.para}>
                {p}
              </Text>
            ))}
          </View>
        ))}
        <Text style={s.footer} fixed render={({ pageNumber, totalPages }) => `${doc.footer} · ${pageNumber}/${totalPages}`} />
      </Page>
    </Document>,
  );
}
