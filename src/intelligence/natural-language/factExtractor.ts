
import type {
  ExtractedInformation,
} from "./types";

// Validates information extracted from a user's message
// before it can be considered for Personal Context.
export function validateExtractedInformation(
  originalMessage: string,
  information: ExtractedInformation
): void {
  if (!originalMessage.trim()) {
    throw new Error("Original message cannot be empty.");
  }

  if (!information.key.trim()) {
    throw new Error("Extracted information must have a key.");
  }

  if (!information.supportingText.trim()) {
    throw new Error("Supporting text cannot be empty.");
  }

  if (!originalMessage.includes(information.supportingText)) {
    throw new Error(
      "Supporting text must exist in the original user message."
    );
  }

  if (
    !Number.isFinite(information.confidence) ||
    information.confidence < 0 ||
    information.confidence > 1
  ) {
    throw new Error(
      "Confidence must be a number between 0 and 1."
    );
  }

  if (information.interpretationType === "inferred") {
    if (!information.requiresConfirmation) {
      throw new Error(
        "Inferred information must require user confirmation."
      );
    }

    if (information.status === "confirmed") {
      throw new Error(
        "Inferred information cannot be marked as confirmed."
      );
    }
  }
}
