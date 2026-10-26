import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { CvContent } from "./types";

const INK = "#14161a";
const MUTED = "#5f6570";
const ACCENT = "#0f7b5f";

const s = StyleSheet.create({
  page: { paddingVertical: 44, paddingHorizontal: 48, fontSize: 10, fontFamily: "Helvetica", color: INK, lineHeight: 1.4 },
  name: { fontSize: 22, fontFamily: "Helvetica-Bold", letterSpacing: -0.3, lineHeight: 1.15 },
  sub: { marginTop: 6, color: MUTED, fontSize: 10.5 },
  rule: { marginTop: 14, height: 2, width: 36, backgroundColor: ACCENT },
  section: { marginTop: 18 },
  h2: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: MUTED,
    borderBottomWidth: 0.75,
    borderBottomColor: "#d9d9d4",
    paddingBottom: 3,
    marginBottom: 7,
  },
  role: { marginBottom: 11 },
  roleHead: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  roleTitle: { fontFamily: "Helvetica-Bold", fontSize: 10.5 },
  company: { color: MUTED, fontFamily: "Helvetica" },
  dates: { color: MUTED, fontSize: 9.5 },
  bullet: { flexDirection: "row", marginBottom: 2.5 },
  dot: { width: 10, color: ACCENT },
  bulletText: { flex: 1 },
});

export function CvPdf({ cv }: { cv: CvContent }) {
  return (
    <Document title={`${cv.name} — CV`} author={cv.name}>
      <Page size="A4" style={s.page}>
        <Text style={s.name}>{cv.name}</Text>
        <Text style={s.sub}>{[cv.headline, cv.location].filter(Boolean).join("  ·  ")}</Text>
        <View style={s.rule} />

        {cv.summary ? (
          <View style={s.section}>
            <Text style={s.h2}>Professional summary</Text>
            <Text>{cv.summary}</Text>
          </View>
        ) : null}

        {cv.experience.length > 0 && (
          <View style={s.section}>
            <Text style={s.h2}>Experience</Text>
            {cv.experience.map((e, i) => (
              <View key={i} style={s.role} wrap={false}>
                <View style={s.roleHead}>
                  <Text style={s.roleTitle}>
                    {e.title}
                    <Text style={s.company}>{`  ·  ${e.company}`}</Text>
                  </Text>
                  <Text style={s.dates}>{e.dates}</Text>
                </View>
                {e.bullets.map((b, j) => (
                  <View key={j} style={s.bullet}>
                    <Text style={s.dot}>•</Text>
                    <Text style={s.bulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {cv.highlights.length > 0 && (
          <View style={s.section}>
            <Text style={s.h2}>Recognition</Text>
            <Text>{cv.highlights.join("   ·   ")}</Text>
          </View>
        )}

        {cv.skills.length > 0 && (
          <View style={s.section}>
            <Text style={s.h2}>Methodologies & tools</Text>
            <Text>{cv.skills.join("   ·   ")}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
