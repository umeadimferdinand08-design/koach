
import { describe, expect, it } from "vitest";
import { validateEvidenceItem } from "./evidenceValidation";
import type { EvidenceItem } from "./types";

const validEvidence: EvidenceItem = {
  id: "evidence-1",
  sourceType: "observation",
  sourceId: "observation-1",
  description: "User recorded daily step count.",
  quality: "high",
  isValid: true,
  limitations: [],
};

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
      "Includes a clearly described adult population."
    ],
    weaknesses: [
      "Limited population diversity."
    ],
    rationale:
      "Approved for prototype use following documented methodological review, subject to the stated limitations."
  }
},
};

describe("validateEvidenceItem", () => {
  it("accepts a structurally valid evidence item", () => {
    expect(validateEvidenceItem(validEvidence)).toEqual([]);
  });

  it("rejects an invalid evidence object", () => {
    expect(
      validateEvidenceItem(null as unknown as EvidenceItem)
    ).toContain("Evidence must be a valid object.");
  });

  it("rejects an empty evidence ID", () => {
    const evidence = { ...validEvidence, id: " " };

    expect(validateEvidenceItem(evidence)).toContain(
      "Evidence ID must be a non-empty string."
    );
  });

  it("rejects an empty source ID", () => {
    const evidence = { ...validEvidence, sourceId: "" };

    expect(validateEvidenceItem(evidence)).toContain(
      "Evidence source ID must be a non-empty string."
    );
  });

  it("rejects an empty description", () => {
    const evidence = { ...validEvidence, description: " " };

    expect(validateEvidenceItem(evidence)).toContain(
      "Evidence description must be a non-empty string."
    );
  });

  it("rejects an invalid source type", () => {
    const evidence = {
      ...validEvidence,
      sourceType: "unknown",
    } as unknown as EvidenceItem;

    expect(validateEvidenceItem(evidence)).toContain(
      "Evidence source type is invalid."
    );
  });

  it("rejects an invalid quality value", () => {
    const evidence = {
      ...validEvidence,
      quality: "excellent",
    } as unknown as EvidenceItem;

    expect(validateEvidenceItem(evidence)).toContain(
      "Evidence quality is invalid."
    );
  });

  it("rejects a non-boolean validity value", () => {
    const evidence = {
      ...validEvidence,
      isValid: "yes",
    } as unknown as EvidenceItem;

    expect(validateEvidenceItem(evidence)).toContain(
      "Evidence validity must be a boolean."
    );
  });

  it("rejects non-array limitations", () => {
    const evidence = {
      ...validEvidence,
      limitations: "none",
    } as unknown as EvidenceItem;

    expect(validateEvidenceItem(evidence)).toContain(
      "Evidence limitations must be an array of strings."
    );
  });

  it("rejects limitations containing non-string values", () => {
    const evidence = {
      ...validEvidence,
      limitations: [123, null],
    } as unknown as EvidenceItem;

    expect(validateEvidenceItem(evidence)).toContain(
      "Evidence limitations must be an array of strings."
    );
  });

  it("accepts valid scientific research evidence", () => {
    expect(validateEvidenceItem(validResearchEvidence)).toEqual([]);
  });

  it("rejects approved scientific research without an appraisal", () => {
  const evidence = structuredClone(validResearchEvidence);

  evidence.scientificResearch!.appraisal = undefined;

  expect(validateEvidenceItem(evidence)).toContain(
    "Approved research must include a documented appraisal."
  );
});

  it("rejects scientific research without research details", () => {
    const evidence = {
      ...validEvidence,
      sourceType: "scientific_research",
    } as EvidenceItem;

    expect(validateEvidenceItem(evidence)).toContain(
      "Scientific research evidence must include research details."
    );
  });

  it("rejects scientific research without a DOI or URL", () => {
    const evidence = {
      ...validResearchEvidence,
      scientificResearch: {
        ...validResearchEvidence.scientificResearch!,
        doi: undefined,
      },
    };

    expect(validateEvidenceItem(evidence)).toContain(
      "Research must include a DOI or a source URL."
    );
  });

  it("rejects an invalid scientific research URL", () => {
    const evidence = {
      ...validResearchEvidence,
      scientificResearch: {
        ...validResearchEvidence.scientificResearch!,
        doi: undefined,
        url: "not-a-valid-url",
      },
    };

    expect(validateEvidenceItem(evidence)).toContain(
      "Research URL must be a valid HTTP or HTTPS URL."
    );
  });
});
