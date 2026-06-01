// University-facing Student Status Report PDF.
//
// STRATEGIC LABELING - explained for whoever reads this code later:
//   The internal DB has SELECTED + SHORTLISTED as distinct interview
//   decisions. In the public/university-facing report, both collapse
//   into "Shortlisted for Placement Consideration". The actual
//   placement offers don't begin until August when EWS's airport
//   partner contracts kick in. Publishing precise SELECTED counts
//   before then would create pressure for immediate offer letters.
//   Combining the buckets gives the university a strong pipeline
//   number ("87 students advanced") without committing to specific
//   offers.

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import React from "react";

const NAVY = "#1e3a8a";
const NAVY_DARK = "#172a5e";
const GREEN = "#22c55e";
const GREEN_DARK = "#15803d";
const AMBER = "#d97706";
const RED = "#b91c1c";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const SURFACE = "#ffffff";
const BG = "#f8fafc";
const TEXT = "#0f172a";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    paddingBottom: 60,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: TEXT,
  },
  // --- Cover header ---
  hero: {
    backgroundColor: NAVY,
    color: SURFACE,
    padding: 24,
    borderRadius: 6,
  },
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  brand: { fontSize: 9, letterSpacing: 1.8, color: GREEN, fontFamily: "Helvetica-Bold" },
  brandRight: { fontSize: 8, color: "#cbd5e1" },
  title: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    marginTop: 10,
    color: SURFACE,
  },
  subtitle: { fontSize: 11, color: "#cbd5e1", marginTop: 4 },
  accentBar: { height: 4, backgroundColor: GREEN, marginVertical: 14, borderRadius: 2 },

  // --- Meta grid ---
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
    marginBottom: 8,
  },
  metaCell: {
    width: "50%",
    paddingVertical: 6,
    paddingRight: 10,
  },
  metaLabel: {
    fontSize: 7.5,
    letterSpacing: 1.4,
    color: MUTED,
    fontFamily: "Helvetica-Bold",
  },
  metaValue: { fontSize: 11, color: TEXT, marginTop: 2 },

  // --- Section headers ---
  sectionLabel: {
    fontSize: 9,
    letterSpacing: 1.6,
    color: NAVY,
    fontFamily: "Helvetica-Bold",
    marginTop: 18,
    marginBottom: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: GREEN,
    paddingBottom: 4,
  },

  // --- Summary tiles ---
  tilesRow: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 },
  tile: {
    width: "33.33%",
    padding: 4,
  },
  tileInner: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 6,
    padding: 12,
    backgroundColor: SURFACE,
    minHeight: 70,
  },
  tileLabel: {
    fontSize: 7.5,
    letterSpacing: 1.2,
    color: MUTED,
    fontFamily: "Helvetica-Bold",
  },
  tileValue: { fontSize: 22, fontFamily: "Helvetica-Bold", marginTop: 4 },
  tileSub: { fontSize: 8, color: MUTED, marginTop: 2 },

  // --- Roster table ---
  tableHeader: {
    flexDirection: "row",
    backgroundColor: NAVY,
    color: SURFACE,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: SURFACE,
    letterSpacing: 0.8,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  tableRowAlt: { backgroundColor: BG },
  cellToken: { width: 40, fontFamily: "Helvetica-Bold", color: NAVY },
  cellRegId: { width: 88, fontSize: 8, color: MUTED },
  cellName: { flex: 1, paddingRight: 6 },
  cellPhone: { width: 75, fontSize: 9 },
  cellCourse: { width: 80, fontSize: 8, color: MUTED },

  // --- Category-grouped tables ---
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: BG,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: NAVY,
  },
  categoryLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: NAVY },
  categoryCount: { fontSize: 9, color: MUTED },

  // --- Footer ---
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: MUTED,
    borderTopWidth: 0.5,
    borderTopColor: BORDER,
    paddingTop: 6,
  },
  confidential: {
    marginTop: 18,
    padding: 10,
    backgroundColor: BG,
    borderLeftWidth: 3,
    borderLeftColor: AMBER,
    fontSize: 8,
    color: TEXT,
    lineHeight: 1.4,
  },
});

// ─── Public status mapping ────────────────────────────────────────────────
// Internal status -> public category (label + colour + sort order)
const CATEGORY = {
  ADVANCED: {
    label: "Shortlisted for Placement Consideration",
    blurb:
      "Candidates advanced for further evaluation. Placement decisions follow EWS partner-airport allocation, expected from August onward.",
    color: GREEN_DARK,
    order: 1,
  },
  UNDER_REVIEW: {
    label: "Under Continued Review",
    blurb:
      "Candidates whose profile requires additional evaluation or a follow-up interview.",
    color: AMBER,
    order: 2,
  },
  NOT_SHORTLISTED: {
    label: "Not Shortlisted in This Round",
    blurb:
      "Candidates not advancing in this drive. Eligible to apply in future EWS drives.",
    color: RED,
    order: 3,
  },
  PENDING: {
    label: "Interview Not Completed",
    blurb:
      "Candidates who registered but did not complete the interview (no-show or pending).",
    color: MUTED,
    order: 4,
  },
} as const;

type Status =
  | "SELECTED"
  | "SHORTLISTED"
  | "HOLD"
  | "RE_INTERVIEW"
  | "REJECTED"
  | "REGISTERED"
  | "NO_SHOW";

function statusToCategory(s: Status): keyof typeof CATEGORY {
  // SELECTED + SHORTLISTED collapse into a single public bucket - this
  // is the strategic merge the report exists to do.
  if (s === "SELECTED" || s === "SHORTLISTED") return "ADVANCED";
  if (s === "HOLD" || s === "RE_INTERVIEW") return "UNDER_REVIEW";
  if (s === "REJECTED") return "NOT_SHORTLISTED";
  return "PENDING";
}

// ─── Inputs / data types ──────────────────────────────────────────────────

export type StatusReportStudent = {
  tokenNumber: number | null;
  registrationId: string;
  fullName: string;
  phone: string;
  course: string;
  semester: string;
  status: Status;
};

export type StatusReportInput = {
  driveDate: string; // e.g. "03 June 2026"
  driveTitle: string; // e.g. "UU Aviation Recruitment Drive 2026"
  universityName: string; // e.g. "Uttaranchal University, Dehradun"
  generatedAt: string; // formatted IST timestamp
  generatedBy: string; // super admin email or name
  notes?: string; // optional free text from the form
  students: StatusReportStudent[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────

function groupBy<T, K extends string>(
  rows: T[],
  key: (r: T) => K
): Record<K, T[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const out: any = {};
  for (const r of rows) {
    const k = key(r);
    (out[k] ??= []).push(r);
  }
  return out;
}

// ─── PDF document ─────────────────────────────────────────────────────────

function StatusReportDoc({ input }: { input: StatusReportInput }) {
  const total = input.students.length;
  const grouped = groupBy(input.students, (s) => statusToCategory(s.status));

  const counts = {
    ADVANCED: (grouped.ADVANCED ?? []).length,
    UNDER_REVIEW: (grouped.UNDER_REVIEW ?? []).length,
    NOT_SHORTLISTED: (grouped.NOT_SHORTLISTED ?? []).length,
    PENDING: (grouped.PENDING ?? []).length,
  };

  const interviewed =
    counts.ADVANCED + counts.UNDER_REVIEW + counts.NOT_SHORTLISTED;
  const advancementRate = interviewed > 0
    ? Math.round((counts.ADVANCED / interviewed) * 100)
    : 0;

  // Order categories by their declared order
  const orderedKeys = (
    Object.keys(CATEGORY) as (keyof typeof CATEGORY)[]
  ).sort((a, b) => CATEGORY[a].order - CATEGORY[b].order);

  return (
    <Document
      title="Student Status Report"
      author="Elite World Services"
      subject={input.driveTitle}
    >
      {/* ─── PAGE 1 — EXECUTIVE SUMMARY ───────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <View style={styles.hero}>
          <View style={styles.brandRow}>
            <Text style={styles.brand}>ELITE WORLD SERVICES · AVIATION</Text>
            <Text style={styles.brandRight}>{input.driveDate}</Text>
          </View>
          <Text style={styles.title}>Student Status Report</Text>
          <Text style={styles.subtitle}>{input.driveTitle}</Text>
        </View>

        <View style={styles.accentBar} />

        {/* Meta grid */}
        <View style={styles.metaGrid}>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>HOST INSTITUTION</Text>
            <Text style={styles.metaValue}>{input.universityName}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>DRIVE DATE</Text>
            <Text style={styles.metaValue}>{input.driveDate}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>STUDENTS PARTICIPATED</Text>
            <Text style={styles.metaValue}>{total.toLocaleString()}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>INTERVIEWS COMPLETED</Text>
            <Text style={styles.metaValue}>{interviewed.toLocaleString()}</Text>
          </View>
        </View>

        {/* Summary tiles */}
        <Text style={styles.sectionLabel}>SUMMARY OF OUTCOMES</Text>
        <View style={styles.tilesRow}>
          <View style={styles.tile}>
            <View style={styles.tileInner}>
              <Text style={styles.tileLabel}>SHORTLISTED</Text>
              <Text style={[styles.tileValue, { color: GREEN_DARK }]}>
                {counts.ADVANCED}
              </Text>
              <Text style={styles.tileSub}>For placement consideration</Text>
            </View>
          </View>
          <View style={styles.tile}>
            <View style={styles.tileInner}>
              <Text style={styles.tileLabel}>UNDER REVIEW</Text>
              <Text style={[styles.tileValue, { color: AMBER }]}>
                {counts.UNDER_REVIEW}
              </Text>
              <Text style={styles.tileSub}>Held / re-interview</Text>
            </View>
          </View>
          <View style={styles.tile}>
            <View style={styles.tileInner}>
              <Text style={styles.tileLabel}>NOT SHORTLISTED</Text>
              <Text style={[styles.tileValue, { color: RED }]}>
                {counts.NOT_SHORTLISTED}
              </Text>
              <Text style={styles.tileSub}>This drive</Text>
            </View>
          </View>
          <View style={styles.tile}>
            <View style={styles.tileInner}>
              <Text style={styles.tileLabel}>ADVANCEMENT RATE</Text>
              <Text style={[styles.tileValue, { color: NAVY }]}>
                {advancementRate}%
              </Text>
              <Text style={styles.tileSub}>Of interviewed students</Text>
            </View>
          </View>
          <View style={styles.tile}>
            <View style={styles.tileInner}>
              <Text style={styles.tileLabel}>INTERVIEW COMPLETION</Text>
              <Text style={[styles.tileValue, { color: NAVY }]}>
                {total > 0 ? Math.round((interviewed / total) * 100) : 0}%
              </Text>
              <Text style={styles.tileSub}>Of registered students</Text>
            </View>
          </View>
          <View style={styles.tile}>
            <View style={styles.tileInner}>
              <Text style={styles.tileLabel}>NOT YET INTERVIEWED</Text>
              <Text style={[styles.tileValue, { color: MUTED }]}>
                {counts.PENDING}
              </Text>
              <Text style={styles.tileSub}>Pending or no-show</Text>
            </View>
          </View>
        </View>

        {/* Next steps */}
        <Text style={styles.sectionLabel}>NEXT STEPS</Text>
        <View>
          <Text style={{ fontSize: 10, lineHeight: 1.5, marginBottom: 4 }}>
            Shortlisted candidates will be evaluated against EWS partner-airport
            requirements. Allocation to specific airport locations and role
            categories begins from <Text style={{ fontFamily: "Helvetica-Bold" }}>August 2026</Text>,
            aligned with EWS&apos;s active contracts at 11 Indian airports and
            5 additional airports currently in onboarding.
          </Text>
          <Text style={{ fontSize: 10, lineHeight: 1.5 }}>
            Final placement letters will be issued in phased batches as airport
            slots become available. The university and shortlisted students
            will be kept updated through the EWS placement desk.
          </Text>
        </View>

        {input.notes ? (
          <>
            <Text style={styles.sectionLabel}>NOTES</Text>
            <Text style={{ fontSize: 10, lineHeight: 1.5 }}>{input.notes}</Text>
          </>
        ) : null}

        <View style={styles.confidential}>
          <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 3 }}>
            CONFIDENTIAL
          </Text>
          <Text>
            This document contains candidate evaluation information shared between
            Elite World Services and {input.universityName} for the sole purpose
            of recruitment coordination. Not for public distribution.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text>
            Elite World Services · aviation@ews.aero · careers.ews.aero
          </Text>
          <Text>
            Generated {input.generatedAt} by {input.generatedBy} · Page 1
          </Text>
        </View>
      </Page>

      {/* ─── PAGES 2+ — DETAILED ROSTER PER CATEGORY ──────────────────── */}
      <Page size="A4" style={styles.page}>
        <View style={styles.brandRow}>
          <Text style={[styles.brand, { color: NAVY }]}>
            STUDENT STATUS REPORT - DETAILED ROSTER
          </Text>
          <Text style={[styles.brandRight, { color: MUTED }]}>
            {input.driveTitle}
          </Text>
        </View>
        <View style={[styles.accentBar, { marginTop: 8 }]} />

        {orderedKeys.map((key) => {
          const rows = grouped[key] ?? [];
          if (rows.length === 0) return null;
          const cat = CATEGORY[key];
          return (
            <View key={key} wrap={true}>
              <View style={styles.categoryHeader}>
                <Text style={[styles.categoryLabel, { color: cat.color }]}>
                  {cat.label}
                </Text>
                <Text style={styles.categoryCount}>{rows.length} students</Text>
              </View>
              <Text
                style={{
                  fontSize: 8.5,
                  color: MUTED,
                  marginTop: 4,
                  marginBottom: 6,
                  lineHeight: 1.4,
                }}
              >
                {cat.blurb}
              </Text>

              {/* Roster table */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: 40 }]}>TOKEN</Text>
                <Text style={[styles.tableHeaderCell, { width: 88 }]}>
                  REG ID
                </Text>
                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>NAME</Text>
                <Text style={[styles.tableHeaderCell, { width: 75 }]}>
                  CONTACT
                </Text>
                <Text style={[styles.tableHeaderCell, { width: 80 }]}>
                  COURSE
                </Text>
              </View>
              {rows.map((s, i) => (
                <View
                  key={s.registrationId}
                  style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
                  wrap={false}
                >
                  <Text style={styles.cellToken}>
                    {s.tokenNumber ? `#${s.tokenNumber}` : "-"}
                  </Text>
                  <Text style={styles.cellRegId}>{s.registrationId}</Text>
                  <Text style={styles.cellName}>{s.fullName}</Text>
                  <Text style={styles.cellPhone}>{s.phone}</Text>
                  <Text style={styles.cellCourse}>
                    {s.course}
                    {s.semester ? ` · ${s.semester}` : ""}
                  </Text>
                </View>
              ))}
            </View>
          );
        })}

        <View style={styles.footer} fixed>
          <Text>
            Elite World Services · aviation@ews.aero · CONFIDENTIAL
          </Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

export async function renderStatusReportPdf(
  input: StatusReportInput
): Promise<Buffer> {
  return await renderToBuffer(<StatusReportDoc input={input} />);
}
