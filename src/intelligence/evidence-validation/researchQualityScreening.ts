
import type {
  EvidenceItem,
  ResearchScreeningDecision,
  ResearchQualityScreening,
} from "./types";

const SCREENING_VERSION = "1.0.0";

const SYSTEMATIC_REVIEW_DESIGNS = [
  "systematic review",
  "meta-analysis",
];

const EXPERIMENTAL_DESIGNS = [
  "randomized controlled trial",
  "randomised controlled trial",
  "rct",
];

const OBSERVATIONAL_DESIGNS = [
  "cohort study",
  "prospective cohort study",
  "retrospective cohort study",
  "case-control study",
  "cross-sectional study",
  "longitudinal study",
];

export function screenResearchQuality(
  evidence: EvidenceItem
): ResearchQualityScreening {
  const strengths: string[] = [];
  const concerns: string[] = [];
  const missingInformation: string[] = [];

  const research = evidence.scientificResearch;

  if (!research) {
    return {
      decision: "reject",
      strengths,
      concerns: [
        "Scientific research details are missing.",
      ],
      missingInformation: [
        "Research metadata",
        "Study design",
        "Research findings",
      ],
      assessedAt: new Date().toISOString(),
      screeningVersion: SCREENING_VERSION,
    };
  }

  // Publication information
  if (research.publicationSource.trim()) {
    strengths.push("Publication source is identified.");
  } else {
    missingInformation.push("Publication source");
  }

  if (research.peerReviewed === true) {
    strengths.push(
      "Research is declared to be peer-reviewed."
    );
  } else if (research.peerReviewed === false) {
    concerns.push(
      "Research is declared not to be peer-reviewed."
    );
  } else {
    missingInformation.push("Peer-review status");
  }

  // Study design
  const design = research.studyDesign
    .trim()
    .toLowerCase();

  if (
    SYSTEMATIC_REVIEW_DESIGNS.some((item) =>
      design.includes(item)
    )
  ) {
    strengths.push(
      "Study design is identified as a systematic review or meta-analysis."
    );
  } else if (
    EXPERIMENTAL_DESIGNS.some((item) =>
      design.includes(item)
    )
  ) {
    strengths.push(
      "Study design is identified as an experimental trial."
    );
  } else if (
    OBSERVATIONAL_DESIGNS.some((item) =>
      design.includes(item)
    )
  ) {
    strengths.push(
      "Study design is identified as an observational study."
    );

    concerns.push(
      "Observational findings should not automatically be interpreted as proof of causation."
    );
  } else if (design) {
    concerns.push(
      "Study design requires further methodological review."
    );
  } else {
    missingInformation.push("Study design");
  }

  // Population
  if (research.population.trim()) {
    strengths.push("Study population is described.");
  } else {
    missingInformation.push("Study population");
  }

  // Sample size
  if (
    research.sampleSize !== undefined &&
    Number.isInteger(research.sampleSize) &&
    research.sampleSize > 0
  ) {
    strengths.push("Sample size is reported.");
  } else {
    concerns.push(
      "Sample size is not reported or could not be assessed."
    );
  }

  // Findings and limitations
  if (research.findings.trim()) {
    strengths.push("Research findings are documented.");
  } else {
    missingInformation.push("Research findings");
  }

  if (research.limitations.length > 0) {
    strengths.push(
      "Research limitations have been documented."
    );
  } else {
    concerns.push(
      "No research limitations have been documented."
    );
  }

  // Human appraisal
  if (
    research.appraisalStatus === "approved" &&
    research.appraisal
  ) {
    strengths.push(
      "A documented human appraisal is available."
    );

    if (research.appraisal.weaknesses.length > 0) {
      strengths.push(
        "Identified methodological weaknesses are documented in the human appraisal."
      );
    }
  } else if (
    research.appraisalStatus === "rejected"
  ) {
    concerns.push(
      "The research has been rejected during human appraisal."
    );
  } else {
    missingInformation.push(
      "Approved documented human appraisal"
    );
  }

  // Screening decision
  let decision: ResearchScreeningDecision = "pass";

  if (
    research.appraisalStatus === "rejected"
  ) {
    decision = "reject";
  } else if (
    missingInformation.length > 0 ||
    concerns.length > 0
  ) {
    decision = "needs_review";
  }

  return {
    decision,
    strengths,
    concerns,
    missingInformation,
    assessedAt: new Date().toISOString(),
    screeningVersion: SCREENING_VERSION,
  };
}
