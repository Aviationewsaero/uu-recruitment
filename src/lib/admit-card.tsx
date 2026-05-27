// Server-only PDF generation. Uses @react-pdf/renderer.
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import React from "react";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 11, fontFamily: "Helvetica", color: "#0f172a" },
  hero: { backgroundColor: "#1e3a8a", color: "#ffffff", padding: 20, borderRadius: 6 },
  brandTag: { fontSize: 9, letterSpacing: 1.5, color: "#cbd5e1", marginBottom: 4 },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 11, color: "#cbd5e1", marginTop: 2 },
  accentBar: { height: 4, backgroundColor: "#22c55e", marginBottom: 18, borderRadius: 2 },
  tokenBox: {
    marginTop: 16,
    padding: 24,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tokenLabel: { fontSize: 9, color: "#64748b", letterSpacing: 1.5, textTransform: "uppercase" },
  tokenNumber: { fontSize: 48, color: "#22c55e", fontFamily: "Helvetica-Bold", marginTop: 4 },
  regIdLabel: { fontSize: 9, color: "#64748b", letterSpacing: 1.5, textTransform: "uppercase" },
  regIdValue: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#1e3a8a", marginTop: 4 },
  detailGrid: { marginTop: 18, flexDirection: "row", flexWrap: "wrap" },
  detailItem: { width: "50%", marginBottom: 12, paddingRight: 8 },
  detailLabel: { fontSize: 8, color: "#64748b", letterSpacing: 1, textTransform: "uppercase" },
  detailValue: { fontSize: 12, marginTop: 2, color: "#0f172a" },
  instructions: {
    marginTop: 18,
    padding: 14,
    backgroundColor: "#fef3c7",
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#f59e0b",
  },
  instTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  instItem: { fontSize: 10, marginBottom: 3 },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 36,
    right: 36,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: "#e2e8f0",
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#94a3b8",
  },
});

type AdmitCardData = {
  registrationId: string;
  fullName: string;
  tokenNumber: number;
  course: string;
  semester: string;
  email: string;
  phone: string;
};

function AdmitCard({ data }: { data: AdmitCardData }) {
  return (
    <Document
      title={`Admit Card – ${data.registrationId}`}
      author="Elite World Services"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.hero}>
          <Text style={styles.brandTag}>ELITE WORLD SERVICES</Text>
          <Text style={styles.title}>Aviation Recruitment Drive — Admit Card</Text>
          <Text style={styles.subtitle}>Uttaranchal University · 2026</Text>
        </View>
        <View style={styles.accentBar} />

        <View style={styles.tokenBox}>
          <View>
            <Text style={styles.tokenLabel}>Your Token</Text>
            <Text style={styles.tokenNumber}>#{data.tokenNumber}</Text>
          </View>
          <View>
            <Text style={styles.regIdLabel}>Registration ID</Text>
            <Text style={styles.regIdValue}>{data.registrationId}</Text>
          </View>
        </View>

        <View style={styles.detailGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Candidate</Text>
            <Text style={styles.detailValue}>{data.fullName}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Course</Text>
            <Text style={styles.detailValue}>{data.course}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Semester</Text>
            <Text style={styles.detailValue}>{data.semester}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Email</Text>
            <Text style={styles.detailValue}>{data.email}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Phone</Text>
            <Text style={styles.detailValue}>{data.phone}</Text>
          </View>
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instTitle}>Bring on drive day:</Text>
          <Text style={styles.instItem}>• Printed copy of this admit card (or on your phone)</Text>
          <Text style={styles.instItem}>• A government photo ID (Aadhaar / Passport / Driver License)</Text>
          <Text style={styles.instItem}>• Two extra passport-size photographs</Text>
          <Text style={styles.instItem}>• Originals of 10th, 12th, and graduation mark sheets</Text>
          <Text style={styles.instItem}>• Arrive 30 minutes before your token is called — watch the live display board</Text>
        </View>

        <View style={styles.footer}>
          <Text>aviation@ews.aero · www.ews.aero</Text>
          <Text>Issued: {new Date().toLocaleDateString("en-IN")}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderAdmitCardPdf(data: AdmitCardData): Promise<Buffer> {
  return renderToBuffer(<AdmitCard data={data} />);
}
