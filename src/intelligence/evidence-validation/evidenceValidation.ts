
import type { EvidenceItem } from "./types";

const VALID_SOURCE_TYPES = [
  "observation",
  "personal_fact",
  "detected_pattern",
  "investigation",
  "scientific_research",
];

const VALID_QUALITY_LEVELS = [
  "low",
  "moderate",
  "high",
];

export function validateEvidenceItem(
  evidence: EvidenceItem
): string[] {
  const errors: string[] = [];

  if (!evidence || typeof evidence !== "object") {
    return ["Evidence must be a valid object."];
  }

  if (
    typeof evidence.id !== "string" ||
    !evidence.id.trim()
  ) {
    errors.push("Evidence ID must be a non-empty string.");
  }

  if (
    typeof evidence.sourceId !== "string" ||
    !evidence.sourceId.trim()
  ) {
    errors.push("Evidence source ID must be a non-empty string.");
  }

  if (
    typeof evidence.description !== "string" ||
    !evidence.description.trim()
  ) {
    errors.push("Evidence description must be a non-empty string.");
  }

  if (!VALID_SOURCE_TYPES.includes(evidence.sourceType)) {
    errors.push("Evidence source type is invalid.");
  }

  
  if (
    evidence.sourceType === "scientific_research" &&
    !evidence.scientificResearch
  ) {
    errors.push(
      "Scientific research evidence must include research details."
    );
  }

  if (evidence.scientificResearch) {
    const research = evidence.scientificResearch;

    if (
      typeof research.title !== "string" ||
      !research.title.trim()
    ) {
      errors.push("Research title must be a non-empty string.");
    }

    if (
      !Array.isArray(research.authors) ||
      !research.authors.every(
        (author) =>
          typeof author === "string" && author.trim().length > 0
      )
    ) {
      errors.push("Research authors must be an array of non-empty strings.");
    }

    if (
      !Number.isInteger(research.publicationYear) ||
      research.publicationYear < 1800 ||
      research.publicationYear > new Date().getFullYear() + 1
    ) {
      errors.push("Research publication year is invalid.");
    }

    if (
      typeof research.publicationSource !== "string" ||
      !research.publicationSource.trim()
    ) {
      errors.push("Research publication source is required.");
    }

    if (
  (!research.doi || !research.doi.trim()) &&
  (!research.url || !research.url.trim())
) {
  errors.push(
    "Research must include a DOI or a source URL."
  );
}

if (
  research.url !== undefined &&
  (typeof research.url !== "string" ||
    !/^https?:\/\/\S+$/i.test(research.url))
) {
  errors.push("Research URL must be a valid HTTP or HTTPS URL.");
}

    if (
      typeof research.studyDesign !== "string" ||
      !research.studyDesign.trim()
    ) {
      errors.push("Research study design is required.");
    }

    if (
      typeof research.population !== "string" ||
      !research.population.trim()
    ) {
      errors.push("Research population is required.");
    }

    if (
      research.sampleSize !== undefined &&
      (!Number.isInteger(research.sampleSize) ||
        research.sampleSize <= 0)
    ) {
      errors.push("Research sample size must be a positive integer.");
    }

    if (
      typeof research.findings !== "string" ||
      !research.findings.trim()
    ) {
      errors.push("Research findings are required.");
    }

    if (
      !Array.isArray(research.limitations) ||
      !research.limitations.every(
        (limitation) => typeof limitation === "string"
      )
    ) {
      errors.push("Research limitations must be an array of strings.");
    }

    if (
      ![
        "not_reviewed",
        "under_review",
        "approved",
        "rejected",
      ].includes(research.appraisalStatus)
    ) {
      errors.push("Research appraisal status is invalid.");
    }

    if (
      research.peerReviewed !== undefined &&
      typeof research.peerReviewed !== "boolean"
    ) {
      errors.push("Peer review status must be a boolean.");
    }
        if (
      research.appraisalStatus === "approved" &&
      !research.appraisal
    ) {
      errors.push(
        "Approved research must include a documented appraisal."
      );
    }

        if (research.appraisal) {
      const appraisal = research.appraisal;

      if (
        typeof appraisal.appraisedBy !== "string" ||
        !appraisal.appraisedBy.trim()
      ) {
        errors.push("Research appraiser must be identified.");
      }

      if (
        typeof appraisal.appraisedAt !== "string" ||
        Number.isNaN(Date.parse(appraisal.appraisedAt))
      ) {
        errors.push("Research appraisal date must be valid.");
      }

      if (
        !Array.isArray(appraisal.strengths) ||
        !appraisal.strengths.every(
          (item) => typeof item === "string" && item.trim().length > 0
        )
      ) {
        errors.push("Research appraisal strengths must be non-empty strings.");
      }

      if (
        !Array.isArray(appraisal.weaknesses) ||
        !appraisal.weaknesses.every(
          (item) => typeof item === "string" && item.trim().length > 0
        )
      ) {
        errors.push("Research appraisal weaknesses must be non-empty strings.");
      }

      if (
        typeof appraisal.rationale !== "string" ||
        !appraisal.rationale.trim()
      ) {
        errors.push("Research appraisal rationale is required.");
      }
    }
  }


  if (!VALID_QUALITY_LEVELS.includes(evidence.quality)) {
    errors.push("Evidence quality is invalid.");
  }

  if (typeof evidence.isValid !== "boolean") {
    errors.push("Evidence validity must be a boolean.");
  }

  if (
    !Array.isArray(evidence.limitations) ||
    !evidence.limitations.every(
      (limitation) => typeof limitation === "string"
    )
  ) {
    errors.push(
      "Evidence limitations must be an array of strings."
    );
  }

  return errors;
}
