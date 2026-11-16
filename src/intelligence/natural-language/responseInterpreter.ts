
import type {
  InterpretationResult,
} from "./types";

import {
  validateExtractedInformation,
} from "./factExtractor";

// Any future AI model or interpretation service
// can implement this interface.
export type InterpretationProvider = (
  message: string
) => Promise<InterpretationResult>;

// Coordinates message interpretation and validates
// the information returned by the provider.
export async function interpretUserMessage(
  message: string,
  provider: InterpretationProvider
): Promise<InterpretationResult> {
  if (!message.trim()) {
    throw new Error("User message cannot be empty.");
  }

  const result = await provider(message);

  if (result.originalMessage !== message) {
    throw new Error(
      "Interpretation must preserve the original user message."
    );
  }

  if (!result.summary.trim()) {
    throw new Error("Interpretation summary cannot be empty.");
  }

  if (!Array.isArray(result.extractedInformation)) {
    throw new Error(
      "Extracted information must be an array."
    );
  }

  if (!Array.isArray(result.unresolvedQuestions)) {
    throw new Error(
      "Unresolved questions must be an array."
    );
  }

  for (const information of result.extractedInformation) {
    validateExtractedInformation(message, information);
  }

  return result;
}
