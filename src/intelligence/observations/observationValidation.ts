
import type { Observation } from "./types";

export function validateObservation(
  observation: Omit<Observation, "id" | "recordedAt">
): string[] {
  const errors: string[] = [];
    if (
    !Number.isFinite(
      new Date(observation.observedAt).getTime()
    )
  ) {
    errors.push("Observation timestamp must be a valid date.");
  }
    if (
    typeof observation.metric !== "string" ||
    observation.metric.trim().length === 0
  ) {
    errors.push("Observation metric must not be empty.");
  }
    const validConfidenceLevels = [
    "low",
    "moderate",
    "high",
  ];

  if (!validConfidenceLevels.includes(observation.confidence)) {
    errors.push("Observation confidence must be valid.");
  }

  // Demo data must always be clearly identified.
  if (observation.mode === "demo") {
    if (observation.source !== "simulated") {
      errors.push(
        "Demo observations must use the simulated source."
      );
    }

    if (observation.isSimulated !== true) {
      errors.push(
        "Demo observations must be marked as simulated."
      );
    }

    if (observation.permissionGranted !== false) {
      errors.push(
        "Demo observations must not claim real data permissions."
      );
    }
  }

  // Simulated data must never enter Live Mode.
  if (observation.mode === "live") {
    if (observation.source === "simulated") {
      errors.push(
        "Simulated observations cannot be recorded in Live Mode."
      );
    }

    if (observation.isSimulated !== false) {
      errors.push(
        "Live observations cannot be marked as simulated."
      );
    }
  }

  // Connected sources require permission.
  const permissionRequiredSources = [
    "wearable",
    "phone_sensor",
    "calendar",
    "location",
  ];

  if (
    observation.mode === "live" &&
    permissionRequiredSources.includes(observation.source) &&
    observation.permissionGranted !== true
  ) {
    errors.push(
      "This data source requires user permission."
    );
  }

  return errors;
}
