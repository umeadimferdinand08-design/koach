
import type {
  DetectedPattern,
} from "../pattern-detection/types";

export type InvestigationStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "dismissed";

export type InvestigationQuestionType =
  | "single_choice"
  | "multiple_choice"
  | "free_text"
  | "yes_no";

export interface InvestigationOption {
  id: string;
  label: string;
}

export interface InvestigationQuestion {
  id: string;
  patternId: string;
  text: string;
  type: InvestigationQuestionType;
  options?: InvestigationOption[];
  required: boolean;
  purpose: string;
}

export interface InvestigationAnswer {
  questionId: string;
  value: string | string[] | boolean;
  answeredAt: string;
}

export interface Investigation {
  id: string;
  patternId: string;
  pattern: DetectedPattern;
  status: InvestigationStatus;
  questions: InvestigationQuestion[];
  answers: InvestigationAnswer[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}
