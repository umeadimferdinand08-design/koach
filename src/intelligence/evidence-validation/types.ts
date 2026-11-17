
import type { InformationStatus } from "../personal-profile/types";

export type EvidenceDecision =
  | "sufficient"
  | "insufficient"
  | "rejected";

export type EvidenceSourceType =
  | "observation"
  | "personal_fact"
  | "detected_pattern"
  | "investigation"
  | "scientific_research";

export type EvidenceQuality =
  | "low"
  | "moderate"
  | "high";


export interface EvidenceItem {
  id: string;
  sourceType: EvidenceSourceType;
  sourceId: string;
  description: string;
  informationStatus?: InformationStatus;
  quality: EvidenceQuality;
  isValid: boolean;
  limitations: string[];
  scientificResearch?: ScientificResearchDetails;
}


export interface EvidenceAssessment {
  id: string;
  decision: EvidenceDecision;
  reasons: string[];
  supportingEvidenceIds: string[];
  excludedEvidenceIds: string[];
  limitations: string[];
  assessedAt: string;
}

export interface EvidenceAssessmentRequest {
  claim: string;
  purpose: string;
  evidence: EvidenceItem[];
  minimumQuality?: EvidenceQuality;
  requiredSourceTypes?: EvidenceSourceType[];
  knownConflicts?: string[];
}

export interface ResearchAppraisal {
  appraisedBy: string;
  appraisedAt: string;
  strengths: string[];
  weaknesses: string[];
  rationale: string;
}

export interface ScientificResearchDetails {
  title: string;
  authors: string[];
  publicationYear: number;
  publicationSource: string;
  doi?: string;
  url?: string;

  studyDesign: string;
  population: string;
  sampleSize?: number;

  findings: string;
  limitations: string[];

  peerReviewed?: boolean;
  appraisalStatus:
    | "not_reviewed"
    | "under_review"
    | "approved"
    | "rejected";
  appraisal?: ResearchAppraisal;
}

