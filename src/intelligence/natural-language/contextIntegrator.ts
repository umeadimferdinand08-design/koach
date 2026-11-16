
import type {
  InterpretationResult,
  ExtractedInformation,
} from "./types";

import type {
  PersonalContext,
} from "../personal-profile/types";

import {
  addFact,
  updateFact,
  confirmFact,
} from "../personal-profile/personalContext";

import {
  validateExtractedInformation,
} from "./factExtractor";

interface FactEvidence {
  originalMessage: string;
  supportingText: string;
  interpretationType: "explicit" | "inferred";
  recordedAt: string;
}

interface StoredFactValue {
  extractedValue: unknown;
  supportingText: string;
  originalMessage: string;
  interpretationType: "explicit" | "inferred";
  evidence: FactEvidence[];
}

function createStoredValue(
  information: ExtractedInformation,
  originalMessage: string
): StoredFactValue {
  const now = new Date().toISOString();

  return {
    extractedValue: information.value,
    supportingText: information.supportingText,
    originalMessage,
    interpretationType: information.interpretationType,
    evidence: [
      {
        originalMessage,
        supportingText: information.supportingText,
        interpretationType: information.interpretationType,
        recordedAt: now,
      },
    ],
  };
}

function updateStoredValue(
  existingValue: unknown,
  information: ExtractedInformation,
  originalMessage: string
): StoredFactValue {
  const previous = existingValue as Partial<StoredFactValue>;

  const previousEvidence = Array.isArray(previous.evidence)
    ? previous.evidence
    : previous.originalMessage && previous.supportingText
      ? [
          {
            originalMessage: previous.originalMessage,
            supportingText: previous.supportingText,
            interpretationType:
              previous.interpretationType ?? "explicit",
            recordedAt: new Date().toISOString(),
          },
        ]
      : [];

  const alreadyRecorded = previousEvidence.some(
    (evidence) =>
      evidence.originalMessage === originalMessage &&
      evidence.supportingText === information.supportingText
  );

  const evidence = alreadyRecorded
    ? previousEvidence
    : [
        ...previousEvidence,
        {
          originalMessage,
          supportingText: information.supportingText,
          interpretationType: information.interpretationType,
          recordedAt: new Date().toISOString(),
        },
      ];

  return {
    extractedValue: information.value,
    supportingText: information.supportingText,
    originalMessage,
    interpretationType: information.interpretationType,
    evidence,
  };
}

export function integrateInterpretation(
  context: PersonalContext,
  interpretation: InterpretationResult
): PersonalContext {
  if (!interpretation.originalMessage.trim()) {
    throw new Error(
      "Interpretation must contain the original user message."
    );
  }

  for (const information of interpretation.extractedInformation) {
    validateExtractedInformation(
      interpretation.originalMessage,
      information
    );
  }

  let updatedContext = context;

  for (const information of interpretation.extractedInformation) {
    const existingFact = updatedContext.facts.find(
      (fact) =>
        fact.category === information.category &&
        fact.key === information.key
    );

    if (!existingFact) {
      const newFact = {
        category: information.category,
        key: information.key,
        value: createStoredValue(
          information,
          interpretation.originalMessage
        ),
        status:
          information.interpretationType === "inferred"
            ? "uncertain" as const
            : information.status,
        source: "user_input" as const,
        confidence: information.confidence,
        permissionRequired: false,
      };

      updatedContext = addFact(updatedContext, newFact);
      continue;
    }

    const updatedValue = updateStoredValue(
      existingFact.value,
      information,
      interpretation.originalMessage
    );

    const shouldRemainConfirmed =
      existingFact.status === "confirmed" &&
      information.interpretationType === "inferred";

    const shouldConfirm =
      information.interpretationType === "explicit" &&
      information.status === "confirmed";

    updatedContext = updateFact(
      updatedContext,
      existingFact.id,
      {
        value: updatedValue,
        confidence: information.confidence,
        status: shouldRemainConfirmed
          ? "confirmed"
          : information.interpretationType === "inferred"
            ? "uncertain"
            : information.status,
      }
    );

    if (shouldConfirm) {
      updatedContext = confirmFact(
        updatedContext,
        existingFact.id
      );
    }
  }

  return updatedContext;
}
