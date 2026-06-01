// University-facing Student Status Report PDF (v2).
//
// STRATEGIC LABELING - explained for whoever reads this code later:
//   The internal DB has SELECTED + SHORTLISTED as distinct interview
//   decisions. In the public/university-facing report, both collapse
//   into "Shortlisted for Placement Consideration". The actual
//   placement offers don't begin until August when EWS's airport
//   partner contracts kick in. Publishing precise SELECTED counts
//   before then would create pressure for immediate offer letters.
//
// TWO-TRACK SPLIT (v2):
//   Within the Shortlisted pool we further split:
//     Category A - BBA Aviation students -> Paid Internship-cum-Placement
//                  Programme -> placement at suggested airport
//     Category B - All other courses -> Second-round interview with
//                  partner companies -> salary discussion + airport
//                  allocation
//   Both tracks lead to the same August allocation window. Cat A is
//   structured/internship-led; Cat B is direct second-round.
//
// REJECTED STUDENT NAMES ARE HIDDEN (v2): only an aggregate count is
//   shown in the report to preserve dignity and reduce legal exposure.

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

  metaGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 6, marginBottom: 8 },
  metaCell: { width: "50%", paddingVertical: 6, paddingRight: 10 },
  metaLabel: {
    fontSize: 7.5,
    letterSpacing: 1.4,
    color: MUTED,
    fontFamily: "Helvetica-Bold",
  },
  metaValue: { fontSize: 11, color: TEXT, marginTop: 2 },

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

  body: { fontSize: 10, lineHeight: 1.5, marginBottom: 8 },

  tilesRow: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 },
  tile: { width: "33.33%", padding: 4 },
  tileInner: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 6,
    padding: 12,
    backgroundColor: SURFACE,
    minHeight: 70,
  },
  tileLabel: { fontSize: 7.5, letterSpacing: 1.2, color: MUTED, fontFamily: "Helvetica-Bold" },
  tileValue: { fontSize: 22, fontFamily: "Helvetica-Bold", marginTop: 4 },
  tileSub: { fontSize: 8, color: MUTED, marginTop: 2 },

  // Two-track callout
  trackBox: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 6,
    padding: 14,
    marginBottom: 10,
    backgroundColor: SURFACE,
  },
  trackTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: NAVY, marginBottom: 6 },
  trackTag: {
    fontSize: 8,
    letterSpacing: 1.2,
    color: GREEN_DARK,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  trackText: { fontSize: 9.5, lineHeight: 1.5 },

  // CTA box for internship application
  ctaBox: {
    borderWidth: 1.5,
    borderColor: GREEN,
    backgroundColor: "#f0fdf4",
    borderRadius: 6,
    padding: 14,
    marginTop: 6,
  },
  ctaTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: GREEN_DARK, marginBottom: 4 },

  // Disclaimer block
  disclaimer: {
    marginTop: 14,
    padding: 12,
    backgroundColor: BG,
    borderLeftWidth: 3,
    borderLeftColor: AMBER,
    fontSize: 8.5,
    color: TEXT,
    lineHeight: 1.45,
  },
  disclaimerTitle: { fontFamily: "Helvetica-Bold", marginBottom: 4 },

  // Sign-off
  signBlock: {
    marginTop: 24,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signLeft: { fontSize: 9 },
  signLeftLabel: { fontSize: 7.5, letterSpacing: 1.2, color: MUTED, fontFamily: "Helvetica-Bold" },
  signLeftValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: NAVY, marginTop: 4 },
  signLeftSub: { fontSize: 8.5, color: MUTED, marginTop: 2 },

  // Roster
  tableHeader: {
    flexDirection: "row",
    backgroundColor: NAVY,
    color: SURFACE,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderCell: { fontSize: 8, fontFamily: "Helvetica-Bold", color: SURFACE, letterSpacing: 0.8 },
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

  subCategoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 8,
    backgroundColor: "#eff6ff",
    borderLeftWidth: 2,
    borderLeftColor: NAVY,
  },
  subCategoryLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", color: NAVY },
  subCategoryCount: { fontSize: 8.5, color: MUTED },

  countSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: BG,
    padding: 10,
    borderRadius: 4,
    marginTop: 6,
    borderLeftWidth: 3,
    borderLeftColor: MUTED,
  },

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
});

// ─── Public status mapping ────────────────────────────────────────────────
const CATEGORY = {
  ADVANCED: {
    label: "Shortlisted for Placement Consideration",
    color: GREEN_DARK,
    order: 1,
  },
  UNDER_REVIEW: {
    label: "Under Continued Review",
    blurb:
      "Candidates whose profile requires additional evaluation or a follow-up interview before a decision is taken.",
    color: AMBER,
    order: 2,
  },
  NOT_SHORTLISTED: {
    label: "Not Shortlisted in This Round",
    blurb:
      "Candidates whose evaluation in this drive did not progress further. Individual names are not published in this report. Eligible to apply in future EWS drives.",
    color: RED,
    order: 3,
  },
  PENDING: {
    label: "Interview Not Completed",
    blurb:
      "Candidates who registered but did not complete the interview during the drive window.",
    color: MUTED,
    order: 4,
  },
} as const;

type Status =
  | "PENDING"
  | "SHORTLISTED"
  | "REJECTED"
  | "HOLD"
  | "RE_INTERVIEW"
  | "SELECTED";

function statusToCategory(s: Status): keyof typeof CATEGORY {
  if (s === "SELECTED" || s === "SHORTLISTED") return "ADVANCED";
  if (s === "HOLD" || s === "RE_INTERVIEW") return "UNDER_REVIEW";
  if (s === "REJECTED") return "NOT_SHORTLISTED";
  return "PENDING";
}

// Cat A vs Cat B split inside the Shortlisted pool.
// Rule: course string contains "BBA Aviation" (case-insensitive) -> Cat A.
// Everything else falls into Cat B regardless of degree (MBA, B-Tech,
// B.Sc, Aeronautical, etc.).
function isCategoryA(course: string): boolean {
  const c = course.toLowerCase();
  return c.includes("bba") && c.includes("aviation");
}

// ─── Inputs ──────────────────────────────────────────────────────────────

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
  driveDate: string;
  driveTitle: string;
  universityName: string;
  generatedAt: string;
  generatedBy: string;
  notes?: string;
  /** Optional auto-computed window like "09:14 to 17:32 IST" */
  driveWindow?: string;
  students: StatusReportStudent[];
};

function groupBy<T, K extends string>(rows: T[], key: (r: T) => K): Record<K, T[]> {
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

  const advanced = grouped.ADVANCED ?? [];
  const advancedCatA = advanced.filter((s) => isCategoryA(s.course));
  const advancedCatB = advanced.filter((s) => !isCategoryA(s.course));

  const counts = {
    ADVANCED: advanced.length,
    ADVANCED_A: advancedCatA.length,
    ADVANCED_B: advancedCatB.length,
    UNDER_REVIEW: (grouped.UNDER_REVIEW ?? []).length,
    NOT_SHORTLISTED: (grouped.NOT_SHORTLISTED ?? []).length,
    PENDING: (grouped.PENDING ?? []).length,
  };

  const interviewed =
    counts.ADVANCED + counts.UNDER_REVIEW + counts.NOT_SHORTLISTED;
  const advancementRate =
    interviewed > 0 ? Math.round((counts.ADVANCED / interviewed) * 100) : 0;

  return (
    <Document
      title="Student Status Report"
      author="Elite World Services"
      subject={input.driveTitle}
    >
      {/* ─── PAGE 1 — Cover + Summary ────────────────────────────────── */}
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

        {/* Meta */}
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
          {input.driveWindow && (
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>DRIVE WINDOW</Text>
              <Text style={styles.metaValue}>{input.driveWindow}</Text>
            </View>
          )}
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>REPORT REFERENCE</Text>
            <Text style={styles.metaValue}>
              EWS/SR/{new Date().toISOString().slice(0, 10)}
            </Text>
          </View>
        </View>

        {/* About EWS */}
        <Text style={styles.sectionLabel}>ABOUT ELITE WORLD SERVICES</Text>
        <Text style={styles.body}>
          Elite World Services (EWS) is an India-based aviation ground-services
          aggregator working alongside established airport-services operators
          to staff customer-facing roles across the Indian airport network. EWS
          conducts structured campus recruitment drives in partnership with
          universities offering aviation, hospitality and engineering
          programmes, and channels shortlisted candidates into role-specific
          intake pipelines aligned with partner-airport operational calendars.
        </Text>

        {/* Summary tiles */}
        <Text style={styles.sectionLabel}>SUMMARY OF OUTCOMES</Text>
        <View style={styles.tilesRow}>
          <View style={styles.tile}>
            <View style={styles.tileInner}>
              <Text style={styles.tileLabel}>SHORTLISTED</Text>
              <Text style={[styles.tileValue, { color: GREEN_DARK }]}>
                {counts.ADVANCED}
              </Text>
              <Text style={styles.tileSub}>
                Cat A: {counts.ADVANCED_A} · Cat B: {counts.ADVANCED_B}
              </Text>
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
              <Text style={styles.tileSub}>Pending or did not attend</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>
            Elite World Services · aviation@ews.aero · careers.ews.aero
          </Text>
          <Text>
            Generated {input.generatedAt} · {input.generatedBy} · Page 1
          </Text>
        </View>
      </Page>

      {/* ─── PAGE 2 — Programme structure + Internship CTA + Next steps ── */}
      <Page size="A4" style={styles.page}>
        <View style={styles.brandRow}>
          <Text style={[styles.brand, { color: NAVY }]}>
            PROGRAMME STRUCTURE & NEXT STEPS
          </Text>
          <Text style={[styles.brandRight, { color: MUTED }]}>
            {input.driveTitle}
          </Text>
        </View>
        <View style={[styles.accentBar, { marginTop: 8 }]} />

        <Text style={[styles.body, { marginBottom: 12 }]}>
          Shortlisted candidates progress through one of two structured tracks
          based on academic background. Both tracks lead to potential
          placement at partner airport locations, with allocation timing
          aligned to EWS&apos;s commercial intake windows starting from{" "}
          <Text style={{ fontFamily: "Helvetica-Bold" }}>August 2026</Text>.
        </Text>

        {/* Category A track */}
        <View style={styles.trackBox}>
          <Text style={styles.trackTag}>CATEGORY A</Text>
          <Text style={styles.trackTitle}>
            BBA Aviation students — Paid Internship-cum-Placement Programme
          </Text>
          <Text style={styles.trackText}>
            Shortlisted BBA Aviation candidates will be invited to participate
            in a structured Paid Internship-cum-Placement Programme designed by
            EWS and its partner airport-services operators. The programme
            combines on-the-job learning at a partner airport with role-specific
            training and a structured stipend. Confirmation of placement at a
            specific airport location at the conclusion of the internship is
            subject to satisfactory performance during the programme, candidate
            eligibility (documents, medical, background verification), and
            availability of operational slots at partner airports during the
            relevant intake period.
          </Text>
        </View>

        {/* Category B track */}
        <View style={styles.trackBox}>
          <Text style={styles.trackTag}>CATEGORY B</Text>
          <Text style={styles.trackTitle}>
            All other courses — Second-Round Evaluation
          </Text>
          <Text style={styles.trackText}>
            Shortlisted candidates from MBA Aviation, B.Sc Aviation, B-Tech,
            M-Tech, Aeronautical and other streams will be invited to a
            second-round evaluation with the relevant partner-airport operator.
            The second round will include a role-fit interview, an orientation
            on prospective airport locations, and a remuneration discussion
            aligned to the role and location. Final confirmation of role,
            airport location and remuneration will be made at the conclusion
            of the second round, subject to candidate eligibility and partner
            airport intake confirmation.
          </Text>
        </View>

        {/* Internship CTA - for anyone shortlisted */}
        <View style={styles.ctaBox}>
          <Text style={styles.ctaTitle}>
            ↳ Apply to the Paid Internship-cum-Placement Programme
          </Text>
          <Text style={[styles.trackText, { marginTop: 2 }]}>
            Any shortlisted candidate (from any course, not only BBA Aviation)
            who wishes to be considered for the Paid Internship-cum-Placement
            Programme may write to{" "}
            <Text style={{ fontFamily: "Helvetica-Bold" }}>aviation@ews.aero</Text>{" "}
            with the following details:
          </Text>
          <Text style={[styles.trackText, { marginTop: 6, marginLeft: 12 }]}>
            · Full name as registered{"\n"}
            · Registration ID (UU-AV-2026-XXXX){"\n"}
            · Mobile number + alternate contact{"\n"}
            · Course and semester{"\n"}
            · Preferred airport region (if any) — purely indicative, not a guarantee
          </Text>
          <Text style={[styles.trackText, { marginTop: 6, fontSize: 8.5, color: MUTED }]}>
            Inclusion in the internship programme intake remains at EWS&apos;s
            discretion, subject to programme intake limits and partner airport
            requirements for the relevant intake period.
          </Text>
        </View>

        {/* Next steps */}
        <Text style={styles.sectionLabel}>NEXT STEPS</Text>
        <Text style={styles.body}>
          1. EWS will coordinate with the university placement cell to schedule
          the second round (Category B) and internship intake briefings (Category A).
        </Text>
        <Text style={styles.body}>
          2. Allocation to specific airport locations and role categories begins
          progressively from August 2026, aligned with EWS&apos;s active
          contracts across <Text style={{ fontFamily: "Helvetica-Bold" }}>67 Indian airports</Text>{" "}
          and 5 additional airports currently in onboarding.
        </Text>
        <Text style={styles.body}>
          3. Placement letters will be issued in phased batches as operational
          slots become available at partner airports. Shortlisted candidates and
          the university placement cell will be kept updated through the
          aviation@ews.aero placement desk.
        </Text>
        <Text style={styles.body}>
          4. Candidates under continued review will receive a follow-up
          communication after the secondary evaluation is concluded.
        </Text>

        {input.notes ? (
          <>
            <Text style={styles.sectionLabel}>ADDITIONAL NOTES</Text>
            <Text style={styles.body}>{input.notes}</Text>
          </>
        ) : null}

        <View style={styles.footer}>
          <Text>Elite World Services · aviation@ews.aero · CONFIDENTIAL</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>

      {/* ─── PAGE 3 — Disclaimer + sign-off ─────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <View style={styles.brandRow}>
          <Text style={[styles.brand, { color: NAVY }]}>
            TERMS, DISCLAIMERS & CONFIDENTIALITY
          </Text>
          <Text style={[styles.brandRight, { color: MUTED }]}>
            {input.driveTitle}
          </Text>
        </View>
        <View style={[styles.accentBar, { marginTop: 8 }]} />

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerTitle}>
            1. NOT AN OFFER OF EMPLOYMENT OR INTERNSHIP
          </Text>
          <Text>
            Nothing in this report constitutes an offer of employment,
            internship, traineeship, stipend, placement or any other contractual
            commitment by Elite World Services or its partner-airport
            operators. Inclusion of a candidate in the &quot;Shortlisted for
            Placement Consideration&quot; section indicates only that the
            candidate is being progressed to the next stage of evaluation.
          </Text>
        </View>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerTitle}>
            2. PROVISIONAL & SUBJECT TO VERIFICATION
          </Text>
          <Text>
            All outcomes are provisional as of the report date and remain
            subject to (a) successful completion of the relevant next-stage
            evaluation (Category A internship programme or Category B
            second-round interview), (b) verification of academic, identity,
            address and background documents, (c) medical fitness assessment
            where applicable to the role, and (d) confirmation of operational
            slot availability at a partner airport within the relevant intake
            window.
          </Text>
        </View>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerTitle}>
            3. PLACEMENT TIMING & DISCRETION
          </Text>
          <Text>
            Placement timing, airport location, role designation and
            remuneration are determined by partner-airport operational
            requirements and remain at the sole discretion of EWS and the
            relevant partner-airport operator. EWS does not guarantee any
            specific timeline, airport location or remuneration. Information
            shared in this report reflects intent at the time of the drive and
            is not a commitment.
          </Text>
        </View>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerTitle}>
            4. CONFIDENTIALITY
          </Text>
          <Text>
            This report contains candidate evaluation information shared in
            confidence between Elite World Services and {input.universityName}{" "}
            for the sole purpose of recruitment coordination. The university
            placement cell is requested to use this information only for
            internal placement-coordination purposes and not to reproduce,
            republish, or share with third parties without prior written
            consent from EWS. Individual candidate evaluation outcomes for
            non-shortlisted candidates are aggregated and not published by
            name in this report to preserve candidate dignity.
          </Text>
        </View>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerTitle}>
            5. CORRECTIONS & GRIEVANCES
          </Text>
          <Text>
            Any candidate or institutional representative who believes that
            their evaluation status as recorded in this report is incorrect
            may write to aviation@ews.aero within fourteen (14) calendar days
            of the report date with their registration ID and the basis for
            the request. EWS will review and respond.
          </Text>
        </View>

        {/* Sign-off */}
        <View style={styles.signBlock}>
          <View style={styles.signLeft}>
            <Text style={styles.signLeftLabel}>ISSUED BY</Text>
            <Text style={styles.signLeftValue}>For Elite World Services</Text>
            <Text style={styles.signLeftSub}>Aviation Recruitment Team</Text>
            <Text style={styles.signLeftSub}>aviation@ews.aero</Text>
          </View>
          <View style={styles.signLeft}>
            <Text style={styles.signLeftLabel}>DATE & PLACE</Text>
            <Text style={styles.signLeftValue}>{input.driveDate}</Text>
            <Text style={styles.signLeftSub}>Issued in respect of</Text>
            <Text style={styles.signLeftSub}>{input.universityName}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Elite World Services · aviation@ews.aero · CONFIDENTIAL</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>

      {/* ─── PAGES 4+ — Detailed roster (named) + aggregated count ─── */}
      <Page size="A4" style={styles.page}>
        <View style={styles.brandRow}>
          <Text style={[styles.brand, { color: NAVY }]}>
            DETAILED ROSTER
          </Text>
          <Text style={[styles.brandRight, { color: MUTED }]}>
            {input.driveTitle}
          </Text>
        </View>
        <View style={[styles.accentBar, { marginTop: 8 }]} />

        {/* SHORTLISTED — split into Cat A + Cat B */}
        {counts.ADVANCED > 0 && (
          <View wrap={true}>
            <View style={styles.categoryHeader}>
              <Text style={[styles.categoryLabel, { color: GREEN_DARK }]}>
                Shortlisted for Placement Consideration
              </Text>
              <Text style={styles.categoryCount}>
                {counts.ADVANCED} students ({counts.ADVANCED_A} Cat A · {counts.ADVANCED_B} Cat B)
              </Text>
            </View>

            {/* Category A subsection */}
            {advancedCatA.length > 0 && (
              <View wrap={true}>
                <View style={styles.subCategoryHeader}>
                  <Text style={styles.subCategoryLabel}>
                    Category A · BBA Aviation · Paid Internship-cum-Placement Programme
                  </Text>
                  <Text style={styles.subCategoryCount}>
                    {advancedCatA.length} students
                  </Text>
                </View>
                <RosterTable students={advancedCatA} />
              </View>
            )}

            {/* Category B subsection */}
            {advancedCatB.length > 0 && (
              <View wrap={true}>
                <View style={styles.subCategoryHeader}>
                  <Text style={styles.subCategoryLabel}>
                    Category B · Other Courses · Second-Round Evaluation
                  </Text>
                  <Text style={styles.subCategoryCount}>
                    {advancedCatB.length} students
                  </Text>
                </View>
                <RosterTable students={advancedCatB} />
              </View>
            )}
          </View>
        )}

        {/* UNDER REVIEW */}
        {(grouped.UNDER_REVIEW ?? []).length > 0 && (
          <View wrap={true}>
            <View style={styles.categoryHeader}>
              <Text style={[styles.categoryLabel, { color: AMBER }]}>
                {CATEGORY.UNDER_REVIEW.label}
              </Text>
              <Text style={styles.categoryCount}>
                {(grouped.UNDER_REVIEW ?? []).length} students
              </Text>
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
              {CATEGORY.UNDER_REVIEW.blurb}
            </Text>
            <RosterTable students={grouped.UNDER_REVIEW ?? []} />
          </View>
        )}

        {/* NOT SHORTLISTED — count only, names withheld */}
        {counts.NOT_SHORTLISTED > 0 && (
          <View wrap={false}>
            <View style={styles.categoryHeader}>
              <Text style={[styles.categoryLabel, { color: RED }]}>
                {CATEGORY.NOT_SHORTLISTED.label}
              </Text>
              <Text style={styles.categoryCount}>
                {counts.NOT_SHORTLISTED} students
              </Text>
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
              {CATEGORY.NOT_SHORTLISTED.blurb}
            </Text>
            <View style={styles.countSummary}>
              <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: TEXT }}>
                Individual names withheld
              </Text>
              <Text style={{ fontSize: 9, color: MUTED }}>
                {counts.NOT_SHORTLISTED} candidates not progressed in this drive
              </Text>
            </View>
          </View>
        )}

        {/* PENDING */}
        {(grouped.PENDING ?? []).length > 0 && (
          <View wrap={true}>
            <View style={styles.categoryHeader}>
              <Text style={[styles.categoryLabel, { color: MUTED }]}>
                {CATEGORY.PENDING.label}
              </Text>
              <Text style={styles.categoryCount}>
                {(grouped.PENDING ?? []).length} students
              </Text>
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
              {CATEGORY.PENDING.blurb}
            </Text>
            <RosterTable students={grouped.PENDING ?? []} />
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text>Elite World Services · aviation@ews.aero · CONFIDENTIAL</Text>
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

function RosterTable({ students }: { students: StatusReportStudent[] }) {
  return (
    <View wrap={true}>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, { width: 40 }]}>TOKEN</Text>
        <Text style={[styles.tableHeaderCell, { width: 88 }]}>REG ID</Text>
        <Text style={[styles.tableHeaderCell, { flex: 1 }]}>NAME</Text>
        <Text style={[styles.tableHeaderCell, { width: 75 }]}>CONTACT</Text>
        <Text style={[styles.tableHeaderCell, { width: 80 }]}>COURSE</Text>
      </View>
      {students.map((s, i) => (
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
}

export async function renderStatusReportPdf(
  input: StatusReportInput
): Promise<Buffer> {
  return await renderToBuffer(<StatusReportDoc input={input} />);
}
