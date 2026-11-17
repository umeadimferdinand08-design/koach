
import { describe, expect, it } from "vitest";
import { screenResearchQuality } from "./researchQualityScreening";
import type { EvidenceItem } from "./types";

const validResearchEvidence: EvidenceItem = {
  id: "research-1",
  sourceType: "scientific_research",
  sourceId: "research-source-1",
  description: "Research supporting physical activity recommendations.",
  quality: "high",
  isValid: true,
  limitations: [],
  scientificResearch: {
    title: "Physical Activity and Health",
    authors: ["Author One", "Author Two"],
    publicationYear: 2024,
    publicationSource: "Journal of Health Research",
    doi: "10.1234/example.2024",
    studyDesign: "Systematic review",
    population: "Adults",
    sampleSize: 1000,
    findings: "Physical activity supports general health.",
    limitations: ["Limited population diversity."],
    peerReviewed: true,
    appraisalStatus: "approved",
    appraisal: {
      appraisedBy: "Koach evidence reviewer",
      appraisedAt: "2026-11-16T10:00:00.000Z",
      strengths: [
        "Uses a systematic review study design.",
        "Includes a clearly described adult population.",
      ],
      weaknesses: [
        "Limited population diversity.",
      ],
      rationale:
        "Approved for prototype use following documented methodological review, subject to the stated limitations.",
    },
  },
};

describe("screenResearchQuality", () => {
  it("passes research that meets the initial screening requirements", () => {
    const result = screenResearchQuality(validResearchEvidence);

    expect(result.decision).toBe("pass");
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.missingInformation).toEqual([]);
  });

  it("flags research with unknown peer-review status", () => {
    const evidence = structuredClone(validResearchEvidence);
    evidence.scientificResearch!.peerReviewed = undefined;

    const result = screenResearchQuality(evidence);

    expect(result.decision).toBe("needs_review");
    expect(result.missingInformation).toContain(
      "Peer-review status"
    );
  });

  it("flags observational studies for possible causal overinterpretation", () => {
    const evidence = structuredClone(validResearchEvidence);
    evidence.scientificResearch!.studyDesign = "Cohort study";

    const result = screenResearchQuality(evidence);

    expect(result.decision).toBe("needs_review");
    expect(result.concerns).toContain(
      "Observational findings should not automatically be interpreted as proof of causation."
    );
  });

  it("flags research without documented limitations", () => {
    const evidence = structuredClone(validResearchEvidence);
    evidence.scientificResearch!.limitations = [];

    const result = screenResearchQuality(evidence);

    expect(result.decision).toBe("needs_review");
    expect(result.concerns).toContain(
      "No research limitations have been documented."
    );
  });

  it("rejects research rejected during human appraisal", () => {
    const evidence = structuredClone(validResearchEvidence);
    evidence.scientificResearch!.appraisalStatus = "rejected";

    const result = screenResearchQuality(evidence);

    expect(result.decision).toBe("reject");
  });

  it("flags research with missing population information", () => {
    const evidence = structuredClone(validResearchEvidence);
    evidence.scientificResearch!.population = "";

    const result = screenResearchQuality(evidence);

    expect(result.decision).toBe("needs_review");
    expect(result.missingInformation).toContain(
      "Study population"
    );
  });

  it("rejects evidence without scientific research details", () => {
    const evidence: EvidenceItem = {
      id: "research-2",
      sourceType: "scientific_research",
      sourceId: "research-source-2",
      description: "Research without details.",
      quality: "high",
      isValid: true,
      limitations: [],
    };

    const result = screenResearchQuality(evidence);

    expect(result.decision).toBe("reject");
  });
});
