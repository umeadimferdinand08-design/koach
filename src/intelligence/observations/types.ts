
export type ObservationMode = "demo" | "live";

export type ObservationCategory =
  | "activity"
  | "sleep"
  | "routine"
  | "schedule"
  | "environment";

export type ObservationSource =
  | "simulated"
  | "user_input"
  | "wearable"
  | "phone_sensor"
  | "calendar"
  | "location";

export type ObservationConfidence =
  | "low"
  | "moderate"
  | "high";

export interface Observation {
  id: string;
  mode: ObservationMode;
  category: ObservationCategory;
  metric: string;
  value: unknown;
  unit?: string;
  source: ObservationSource;
  confidence: ObservationConfidence;
  observedAt: string;
  recordedAt: string;
  permissionGranted: boolean;
  isSimulated: boolean;
  notes?: string;
}
