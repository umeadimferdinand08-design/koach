
export type InformationStatus =
  | "confirmed"
  | "observed"
  | "uncertain"
  | "unknown";

export type ContextCategory =
  | "identity"
  | "goals"
  | "health"
  | "preferences"
  | "routines"
  | "schedule"
  | "environment"
  | "behaviour"
  | "intervention_responses";

export type InformationSource =
  | "user_input"
  | "investigation"
  | "permitted_sensor"
  | "calendar"
  | "system_observation"
  | "derived"
  | "simulated";

export interface PersonalFact {
  id: string;
  category: ContextCategory;
  key: string;
  value: unknown;

  status: InformationStatus;
  source: InformationSource;

  confidence?: number;

  recordedAt: string;
  lastUpdatedAt: string;
  lastConfirmedAt?: string;

  permissionRequired: boolean;
}

export interface PersonalContext {
  id: string;
  schemaVersion: "1.0";
  facts: PersonalFact[];
  createdAt: string;
  updatedAt: string;
}
