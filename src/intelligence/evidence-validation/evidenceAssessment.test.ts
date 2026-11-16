
import { describe, expect, it } from "vitest";
import { assessEvidence } from "./evidenceAssessment";
import type {
  EvidenceAssessmentRequest,
  EvidenceItem,
} from "./types";

const validEvidence: EvidenceItem = {
  id: "evidence-1",
  sourceType: "observation",
  sourceId: "observation-1",
  description: "User recorded daily step count.",
  quality: "high",
  isValid: true,
  limitations: [],
};

const createRequest = (
  overrides: Partial<EvidenceAssessmentRequest> = {}
): EvidenceAssessmentRequest => ({
  claim: "The user's recorded activity has declined.",
  purpose: "Determine whether activity has declined.",
  evidence: [validEvidence],
  ...overrides,
});

describe("assessEvidence", () => {
  it("returns sufficient when all configured evidence requirements pass", () => {
    const result = assessEvidence(createRequest());

    expect(result.decision).toBe("sufficient");
    expect(result.supportingEvidenceIds).toContain("evidence-1");
  });

  it("returns insufficient when no evidence is provided", () => {
    const result = assessEvidence(
      createRequest({ evidence: [] })
    );

    expect(result.decision).toBe("insufficient");
  });

  it("rejects evidence marked as invalid", () => {
    const invalidEvidence = {
      ...validEvidence,
      isValid: false,
    };

    const result = assessEvidence(
      createRequest({ evidence: [invalidEvidence] })
    );

    expect(result.decision).toBe("rejected");
    expect(result.excludedEvidenceIds).toContain("evidence-1");
  });

  it("returns insufficient when evidence does not meet minimum quality", () => {
    const lowQualityEvidence = {
      ...validEvidence,
      quality: "low" as const,
    };

    const result = assessEvidence(
      createRequest({
        evidence: [lowQualityEvidence],
        minimumQuality: "high",
      })
    );

    expect(result.decision).toBe("insufficient");
    expect(result.supportingEvidenceIds).toEqual([]);
  });

  it("returns insufficient when a required source type is missing", () => {
    const result = assessEvidence(
      createRequest({
        requiredSourceTypes: ["scientific_research"],
      })
    );

    expect(result.decision).toBe("insufficient");
    expect(result.reasons.some((reason) =>
      reason.includes("scientific_research")
    )).toBe(true);
  });

  it("returns insufficient when unresolved conflicts exist", () => {
    const result = assessEvidence(
      createRequest({
        knownConflicts: [
          "The recorded activity values conflict with another source.",
        ],
      })
    );

    expect(result.decision).toBe("insufficient");
  });

  it("excludes scientific research that has not completed appraisal", () => {
    const researchEvidence: EvidenceItem = {
      id: "research-1",
      sourceType: "scientific_research",
      sourceId: "research-source-1",
      description: "Research about physical activity.",
      quality: "high",
      isValid: true,
      limitations: [],
      scientificResearch: {
        title: "Physical Activity and Health",
        authors: ["Author One"],
        publicationYear: 2024,
        publicationSource: "Journal of Health Research",
        doi: "10.1234/example.2024",
        studyDesign: "Systematic review",
        population: "Adults",
        findings: "Physical activity supports general health.",
        limitations: [],
        appraisalStatus: "under_review",
      },
    };

    const result = assessEvidence(
      createRequest({ evidence: [researchEvidence] })
    );

    expect(result.decision).toBe("rejected");
    expect(result.excludedEvidenceIds).toContain("research-1");
  });
});
