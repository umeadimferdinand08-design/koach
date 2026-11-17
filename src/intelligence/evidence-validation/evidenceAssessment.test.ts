
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
  it("flags research relevance assessments referencing unknown evidence IDs", () => {
  const result = assessEvidence(
    createRequest({
      researchRelevanceAssessments: [
        {
          evidenceId: "nonexistent-research-999",
          decision: "relevant",
          claimAlignment: "aligned",
          outcomeAlignment: "aligned",
          populationAlignment: "aligned",
          assessedBy: "Research Reviewer",
          assessedAt: "2026-11-16T10:00:00.000Z",
          rationale: "The research supports the assessed claim.",
        },
      ],
    })
  );

  expect(result.decision).toBe("insufficient");
  expect(result.reasons).toContain(
    "Some research relevance assessments reference evidence that does not exist in this request."
  );
  expect(result.reasons).toContain(
    "Research relevance assessment references unknown evidence ID: nonexistent-research-999."
  );
});

it("handles malformed research relevance assessment input safely", () => {
  const request = createRequest();

  request.researchRelevanceAssessments = {} as never;

  const result = assessEvidence(request);

  expect(result.decision).toBe("insufficient");
  expect(result.reasons).toContain(
    "The research relevance assessments field contains an invalid format."
  );
});

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
    it("does not accept approved research that still needs quality review", () => {
    const researchEvidence: EvidenceItem = {
      id: "research-review-needed",
      sourceType: "scientific_research",
      sourceId: "research-source-2",
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
        sampleSize: 1000,
        findings: "Physical activity supports general health.",
        limitations: ["Limited population coverage."],
        appraisalStatus: "approved",
        appraisal: {
          appraisedBy: "Research Reviewer",
          appraisedAt: "2026-11-16T10:00:00.000Z",
          strengths: ["Clear research methodology."],
          weaknesses: [],
          rationale: "The research was reviewed.",
        },
      },
    };

    const result = assessEvidence(
      createRequest({ evidence: [researchEvidence] })
    );

    expect(result.decision).toBe("insufficient");
    expect(result.supportingEvidenceIds).not.toContain(
      "research-review-needed"
    );
    expect(result.excludedEvidenceIds).toContain(
      "research-review-needed"
    );
  });

  it("does not accept research without a claim relevance assessment", () => {
  const researchEvidence: EvidenceItem = {
    id: "research-no-relevance",
    sourceType: "scientific_research",
    sourceId: "research-source-4",
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
      sampleSize: 1000,
      findings: "Physical activity supports general health.",
      limitations: [],
      peerReviewed: true,
      appraisalStatus: "approved",
      appraisal: {
        appraisedBy: "Research Reviewer",
        appraisedAt: "2026-11-16T10:00:00.000Z",
        strengths: ["Clear research methodology."],
        weaknesses: [],
        rationale: "The research was reviewed.",
      },
    },
  };

  const result = assessEvidence(
    createRequest({ evidence: [researchEvidence] })
  );

  expect(result.decision).toBe("insufficient");
  expect(result.supportingEvidenceIds).not.toContain(
    "research-no-relevance"
  );
  expect(result.excludedEvidenceIds).toContain(
    "research-no-relevance"
  );
});

it("does not accept research explicitly marked as not relevant", () => {
  const researchEvidence: EvidenceItem = {
    id: "research-not-relevant",
    sourceType: "scientific_research",
    sourceId: "research-source-6",
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
      sampleSize: 1000,
      findings: "Physical activity supports general health.",
      limitations: ["Limited population coverage."],
      peerReviewed: true,
      appraisalStatus: "approved",
      appraisal: {
        appraisedBy: "Research Reviewer",
        appraisedAt: "2026-11-16T10:00:00.000Z",
        strengths: ["Clear research methodology."],
        weaknesses: [],
        rationale: "The research was reviewed.",
      },
    },
  };

  const result = assessEvidence(
    createRequest({
      evidence: [researchEvidence],
      researchRelevanceAssessments: [
        {
          evidenceId: "research-not-relevant",
          decision: "not_relevant",
          claimAlignment: "aligned",
          outcomeAlignment: "aligned",
          populationAlignment: "aligned",
          assessedBy: "Research Reviewer",
          assessedAt: "2026-11-16T10:00:00.000Z",
          rationale: "The research does not support the specific claim being assessed.",
        },
      ],
    })
  );

  expect(result.decision).toBe("insufficient");
  expect(result.supportingEvidenceIds).not.toContain(
    "research-not-relevant"
  );
  expect(result.excludedEvidenceIds).toContain(
    "research-not-relevant"
  );
});

it("does not accept research when claim relevance requires review", () => {
  const researchEvidence: EvidenceItem = {
    id: "research-relevance-review",
    sourceType: "scientific_research",
    sourceId: "research-source-5",
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
      sampleSize: 1000,
      findings: "Physical activity supports general health.",
      limitations: ["Limited population coverage."],
      peerReviewed: true,
      appraisalStatus: "approved",
      appraisal: {
        appraisedBy: "Research Reviewer",
        appraisedAt: "2026-11-16T10:00:00.000Z",
        strengths: ["Clear research methodology."],
        weaknesses: [],
        rationale: "The research was reviewed.",
      },
    },
  };

  const result = assessEvidence(
    createRequest({
      evidence: [researchEvidence],
      researchRelevanceAssessments: [
        {
          evidenceId: "research-relevance-review",
          decision: "needs_review",
          claimAlignment: "partially_aligned",
          outcomeAlignment: "unclear",
          populationAlignment: "aligned",
          assessedBy: "Research Reviewer",
          assessedAt: "2026-11-16T10:00:00.000Z",
          rationale: "The relationship with the claimed outcome needs further review.",
        },
      ],
    })
  );

  expect(result.decision).toBe("insufficient");
  expect(result.supportingEvidenceIds).not.toContain(
    "research-relevance-review"
  );
  expect(result.excludedEvidenceIds).toContain(
    "research-relevance-review"
  );
});

it("does not accept research marked relevant when an alignment dimension is unclear", () => {
  const researchEvidence: EvidenceItem = {
    id: "research-unclear-alignment",
    sourceType: "scientific_research",
    sourceId: "research-source-9",
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
      sampleSize: 1000,
      findings: "Physical activity supports general health.",
      limitations: [],
      peerReviewed: true,
      appraisalStatus: "approved",
      appraisal: {
        appraisedBy: "Research Reviewer",
        appraisedAt: "2026-11-16T10:00:00.000Z",
        strengths: ["Clear research methodology."],
        weaknesses: [],
        rationale: "The research was reviewed.",
      },
    },
  };

  const result = assessEvidence(
    createRequest({
      evidence: [researchEvidence],
      researchRelevanceAssessments: [
        {
          evidenceId: "research-unclear-alignment",
          decision: "relevant",
          claimAlignment: "aligned",
          outcomeAlignment: "unclear",
          populationAlignment: "aligned",
          assessedBy: "Research Reviewer",
          assessedAt: "2026-11-16T10:00:00.000Z",
          rationale: "The outcome relationship remains unclear.",
        },
      ],
    })
  );

  expect(result.decision).toBe("insufficient");
  expect(result.supportingEvidenceIds).not.toContain(
    "research-unclear-alignment"
  );
  expect(result.excludedEvidenceIds).toContain(
    "research-unclear-alignment"
  );
});

it("rejects duplicate research relevance assessments for the same evidence", () => {
  const researchEvidence: EvidenceItem = {
    id: "research-duplicate-relevance",
    sourceType: "scientific_research",
    sourceId: "research-source-8",
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
      sampleSize: 1000,
      findings: "Physical activity supports general health.",
      limitations: ["Limited population coverage."],
      peerReviewed: true,
      appraisalStatus: "approved",
      appraisal: {
        appraisedBy: "Research Reviewer",
        appraisedAt: "2026-11-16T10:00:00.000Z",
        strengths: ["Clear research methodology."],
        weaknesses: [],
        rationale: "The research was reviewed.",
      },
    },
  };

  const relevanceAssessment = {
    evidenceId: "research-duplicate-relevance",
    decision: "relevant" as const,
    claimAlignment: "aligned" as const,
    outcomeAlignment: "aligned" as const,
    populationAlignment: "aligned" as const,
    assessedBy: "Research Reviewer",
    assessedAt: "2026-11-16T10:00:00.000Z",
    rationale: "The research supports the assessed claim.",
  };

  const result = assessEvidence(
    createRequest({
      evidence: [researchEvidence],
      researchRelevanceAssessments: [
        relevanceAssessment,
        { ...relevanceAssessment },
      ],
    })
  );

  expect(result.decision).toBe("insufficient");
  expect(result.supportingEvidenceIds).not.toContain(
    "research-duplicate-relevance"
  );
  expect(result.excludedEvidenceIds).toContain(
    "research-duplicate-relevance"
  );
});


it("rejects research relevance assessments with invalid timestamps", () => {
  const researchEvidence: EvidenceItem = {
    id: "research-invalid-relevance-date",
    sourceType: "scientific_research",
    sourceId: "research-source-7",
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
      sampleSize: 1000,
      findings: "Physical activity supports general health.",
      limitations: ["Limited population coverage."],
      peerReviewed: true,
      appraisalStatus: "approved",
      appraisal: {
        appraisedBy: "Research Reviewer",
        appraisedAt: "2026-11-16T10:00:00.000Z",
        strengths: ["Clear research methodology."],
        weaknesses: [],
        rationale: "The research was reviewed.",
      },
    },
  };

  const result = assessEvidence(
    createRequest({
      evidence: [researchEvidence],
      researchRelevanceAssessments: [
        {
          evidenceId: "research-invalid-relevance-date",
          decision: "relevant",
          claimAlignment: "aligned",
          outcomeAlignment: "aligned",
          populationAlignment: "aligned",
          assessedBy: "Research Reviewer",
          assessedAt: "not-a-valid-date",
          rationale: "The research supports the assessed claim.",
        },
      ],
    })
  );

  expect(result.decision).toBe("insufficient");
  expect(result.supportingEvidenceIds).not.toContain(
    "research-invalid-relevance-date"
  );
  expect(result.excludedEvidenceIds).toContain(
    "research-invalid-relevance-date"
  );
});

it("accepts research that passes quality screening and claim relevance assessment", () => {
    const researchEvidence: EvidenceItem = {
      id: "research-screening-pass",
      sourceType: "scientific_research",
      sourceId: "research-source-3",
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
        sampleSize: 1000,
        findings: "Physical activity supports general health.",
        limitations: ["Limited population coverage."],
        peerReviewed: true,
        appraisalStatus: "approved",
        appraisal: {
          appraisedBy: "Research Reviewer",
          appraisedAt: "2026-11-16T10:00:00.000Z",
          strengths: ["Clear research methodology."],
          weaknesses: [],
          rationale: "The research was reviewed.",
        },
      },
    };

    const result = assessEvidence(
      createRequest({
        evidence: [researchEvidence],
        researchRelevanceAssessments: [
          {
            evidenceId: "research-screening-pass",
            decision: "relevant",
            claimAlignment: "aligned",
            outcomeAlignment: "aligned",
            populationAlignment: "aligned",
            assessedBy: "Research Reviewer",
            assessedAt: "2026-11-16T10:00:00.000Z",
            rationale:
              "The research findings directly support the assessed claim.",
          },
        ],
      })
    );

    expect(result.decision).toBe("sufficient");
    expect(result.supportingEvidenceIds).toContain(
      "research-screening-pass"
    );
  });
});
