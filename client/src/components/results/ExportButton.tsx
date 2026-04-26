import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from "@react-pdf/renderer";
import type { LearningPlan, SkillScore } from "@shared/types";

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 30,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 5,
  },
  section: {
    margin: 10,
    padding: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#3730a3",
  },
  text: {
    fontSize: 12,
    color: "#374151",
    lineHeight: 1.5,
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingBottom: 5,
  },
  bold: {
    fontWeight: "bold",
  },
  planCard: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
});

const LearningPlanPDF = ({ plan, scores, jobTitle }: { plan: LearningPlan; scores: SkillScore[]; jobTitle: string }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>SkillScout Assessment Results</Text>
        <Text style={styles.subtitle}>Role: {jobTitle}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Executive Summary</Text>
        <Text style={styles.text}>{plan.executiveSummary}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skill Scores</Text>
        {scores.map((s, i) => (
          <View key={i} style={styles.scoreRow}>
            <Text style={[styles.text, styles.bold]}>{s.skillName}</Text>
            <Text style={styles.text}>Required: {s.requiredLevel} | Assessed: {s.assessedLevel}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Priority Learning Paths</Text>
        {plan.prioritySkillPlans.map((sp, i) => (
          <View key={i} style={styles.planCard}>
            <Text style={[styles.text, styles.bold, { marginBottom: 5 }]}>{sp.skillName} (Target: {sp.targetLevel})</Text>
            <Text style={styles.text}>Time: {sp.estimatedWeeks} weeks</Text>
            {sp.learningPath.slice(0, 2).map((lp, j) => (
              <Text key={j} style={[styles.text, { marginTop: 5 }]}>- {lp.resourceTitle} ({lp.resourceType})</Text>
            ))}
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

export const ExportButton = ({ plan, scores, jobTitle, className }: { plan: LearningPlan; scores: SkillScore[]; jobTitle: string; className?: string }) => {
  return (
    <PDFDownloadLink
      document={<LearningPlanPDF plan={plan} scores={scores} jobTitle={jobTitle} />}
      fileName={`SkillScout_Plan_${jobTitle.replace(/\s+/g, "_")}.pdf`}
      className={className || "w-full"}
    >
      {({ loading }) =>
        loading ? "Generating document..." : "Download PDF Report"
      }
    </PDFDownloadLink>
  );
};
