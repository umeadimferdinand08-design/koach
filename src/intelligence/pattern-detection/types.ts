
import type { InformationStatus } from "../personal-profile/types";

export type PatternStatus =
  | "candidate"
  | "confirmed"
  | "dismissed";

export type PatternCategory =
  | "activity"
  | "sleep"
  | "routine"
  | "schedule"
  | "behaviour";

export type PatternConfidence =
  | "low"
  | "moderate"
  | "high";

export interface DetectedPattern {
  id: string;
  category: PatternCategory;
  title: string;
  description: string;
  status: PatternStatus;
  confidence: PatternConfidence;
  evidenceFactIds: string[];
  evidenceStatuses: InformationStatus[];
    evidenceObservationIds?: string[];
  
  explanation: string;
  detectedAt: string;
}
