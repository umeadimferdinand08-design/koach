
import type {
  EvidenceAssessment,
  EvidenceAssessmentRequest,
  EvidenceItem,
} from "./types";

import { validateEvidenceItem } from "./evidenceValidation";

import { screenResearchQuality } from "./researchQualityScreening";

const QUALITY_RANK = {
  low: 1,
  moderate: 2,
  high: 3,
};

export function assessEvidence(
  request: EvidenceAssessmentRequest
): EvidenceAssessment {
  const reasons: string[] = [];
  const blockingReasons: string[] = [];
  const limitations: string[] = [];
  const supportingEvidenceIds: string[] = [];
  const excludedEvidenceIds: string[] = [];

  const assessmentId = crypto.randomUUID();
  const assessedAt = new Date().toISOString();

  if (!request.claim.trim()) {
    blockingReasons.push("An evidence claim must be provided.");
  }

  if (!request.purpose.trim()) {
    blockingReasons.push("An assessment purpose must be provided.");
  }

  if (!Array.isArray(request.evidence)) {
    blockingReasons.push("Evidence must be provided as an array.");
  }

  if (blockingReasons.length > 0) {
    return {
      id: assessmentId,
      decision: "insufficient",
      reasons: blockingReasons,
      supportingEvidenceIds,
      excludedEvidenceIds,
      limitations,
      assessedAt,
    };
  }

  const evidenceItems: EvidenceItem[] = request.evidence;

  let requiresResearchReview = false;

  const usableEvidence = evidenceItems.filter((evidence) => {
    const validationErrors = validateEvidenceItem(evidence);

    if (validationErrors.length > 0 || !evidence.isValid) {
      excludedEvidenceIds.push(evidence.id);
      reasons.push(
        `Evidence ${evidence.id} was excluded because it is invalid or incomplete.`
      );
      return false;
    }

    if (
      evidence.sourceType === "scientific_research" &&
      evidence.scientificResearch?.appraisalStatus !== "approved"
    ) {
      excludedEvidenceIds.push(evidence.id);
      reasons.push(
        `Scientific research ${evidence.id} has not completed appraisal.`
      );
      return false;
    }

    if (evidence.sourceType === "scientific_research") {
  const screening = screenResearchQuality(evidence);

  if (screening.decision !== "pass") {
    excludedEvidenceIds.push(evidence.id);

    if (screening.decision === "needs_review") {
      requiresResearchReview = true;
      reasons.push(
        `Scientific research ${evidence.id} requires further quality review.`
      );
    } else {
      reasons.push(
        `Scientific research ${evidence.id} failed quality screening.`
      );
    }

    limitations.push(...screening.concerns);
    limitations.push(...screening.missingInformation);

    return false;
  }
}

    return true;
  });

  const minimumQuality =
    request.minimumQuality ?? "moderate";

  const qualityRank = QUALITY_RANK[minimumQuality];

  const qualityApprovedEvidence = usableEvidence.filter(
    (evidence) =>
      QUALITY_RANK[evidence.quality] >= qualityRank
  );

  for (const evidence of usableEvidence) {
    limitations.push(...evidence.limitations);

    if (evidence.scientificResearch) {
      limitations.push(
        ...evidence.scientificResearch.limitations
      );
    }

    if (!qualityApprovedEvidence.includes(evidence)) {
      excludedEvidenceIds.push(evidence.id);
      reasons.push(
        `Evidence ${evidence.id} does not meet the minimum quality requirement.`
      );
    }
  }

  supportingEvidenceIds.push(
    ...qualityApprovedEvidence.map((evidence) => evidence.id)
  );

  const requiredSourceTypes =
    request.requiredSourceTypes ?? [];

  for (const sourceType of requiredSourceTypes) {
    const sourceAvailable = qualityApprovedEvidence.some(
      (evidence) => evidence.sourceType === sourceType
    );

    if (!sourceAvailable) {
      blockingReasons.push(
        `Required evidence source type is missing: ${sourceType}.`
      );
    }
  }

  const conflicts = (request.knownConflicts ?? [])
    .filter(
      (conflict) =>
        typeof conflict === "string" && conflict.trim().length > 0
    );

  if (conflicts.length > 0) {
    blockingReasons.push(
      "Unresolved conflicts prevent a sufficient evidence assessment."
    );

    limitations.push(...conflicts);
  }

  if (qualityApprovedEvidence.length === 0) {
    blockingReasons.push(
      "No usable evidence meets the assessment requirements."
    );
  }

  const decision =
  blockingReasons.length === 0
    ? "sufficient"
    : evidenceItems.length > 0 &&
        usableEvidence.length === 0 &&
        !requiresResearchReview
      ? "rejected"
      : "insufficient";

  return {
    id: assessmentId,
    decision,
    reasons: [
      ...reasons,
      ...blockingReasons,
    ],
    supportingEvidenceIds,
    excludedEvidenceIds: [...new Set(excludedEvidenceIds)],
    limitations: [...new Set(limitations)],
    assessedAt,
  };
}
