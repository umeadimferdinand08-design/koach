
import type {
  ContextCategory,
  InformationStatus,
} from "../personal-profile/types";

// Describes how a piece of information was expressed.
export type InterpretationType =
  | "explicit"
  | "inferred";

// Represents information extracted from a user's message.
export interface ExtractedInformation {
  category: ContextCategory;
  key: string;
  value: unknown;

  // The exact part of the user's message supporting this information.
  supportingText: string;

  // Whether the user stated it directly or Koach inferred it.
  interpretationType: InterpretationType;

  // How certain Koach is about its interpretation.
  confidence: number;

  // Whether the user should be asked to confirm this interpretation.
  requiresConfirmation: boolean;

  // Status of the information in Personal Context.
  status: InformationStatus;
}

// Represents the result of interpreting a user message.
export interface InterpretationResult {
  originalMessage: string;

  // A concise summary of what Koach understood.
  summary: string;

  // Information identified in the message.
  extractedInformation: ExtractedInformation[];

  // Information that remains unclear and may need follow-up.
  unresolvedQuestions: string[];

  // Whether the message needs further investigation.
  requiresFollowUp: boolean;

  interpretedAt: string;
}
