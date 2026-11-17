
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
  researchRelevanceAssessments?: ResearchClaimRelevanceAssessment[];
  minimumQuality?: EvidenceQuality;
  requiredSourceTypes?: EvidenceSourceType[];
  knownConflicts?: string[];
}

export type ResearchRelevanceDecision =
  | "relevant"
  | "needs_review"
  | "not_relevant";

export type ResearchAlignment =
  | "aligned"
  | "partially_aligned"
  | "not_aligned"
  | "unclear";

export interface ResearchClaimRelevanceAssessment {
  evidenceId: string;
  decision: ResearchRelevanceDecision;
  claimAlignment: ResearchAlignment;
  outcomeAlignment: ResearchAlignment;
  populationAlignment: ResearchAlignment;
  assessedBy: string;
  assessedAt: string;
  rationale: string;
}
export interface ResearchAppraisal {
  appraisedBy: string;
  appraisedAt: string;
  strengths: string[];
  weaknesses: string[];
  rationale: string;
}

export type ResearchScreeningDecision =
  | "pass"
  | "needs_review"
  | "reject";

export interface ResearchQualityScreening {
  decision: ResearchScreeningDecision;
  strengths: string[];
  concerns: string[];
  missingInformation: string[];
  assessedAt: string;
  screeningVersion: string;
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

