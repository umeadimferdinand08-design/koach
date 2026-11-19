
import type { ObservationMode } from "../observations/types";

export type RecommendationCategory =
  | "physical_activity"
  | "sleep";

export type RecommendationConfidence =
  | "low"
  | "moderate"
  | "high";

export type RecommendationDecision =
  | "recommended"
  | "needs_more_information"
  | "no_recommendation";

export type RecommendationStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "modified";

export interface Recommendation {
  id: string;
  category: RecommendationCategory;
  title: string;
  action: string;
  durationMinutes?: number;
  timing: string;

  confidence: RecommendationConfidence;

  explanation: string;

  supportingPatternIds: string[];
  supportingFactIds: string[];

  mode: ObservationMode;

  status: RecommendationStatus;
  createdAt: string;
}

export interface RecommendationEngineResult {
  decision: RecommendationDecision;

  recommendation: Recommendation | null;

  reasons: string[];

  missingInformation: string[];

  generatedAt: string;
}

export interface RecommendationEngineInput {
  mode: ObservationMode;

  patterns: import("../pattern-detection/types").DetectedPattern[];

  facts: import("../personal-profile/types").PersonalFact[];
}

