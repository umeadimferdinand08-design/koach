
import type {
  Observation,
  ObservationMode,
} from "./types";

import { validateObservation } from "./observationValidation";

function createId(): string {
  return crypto.randomUUID();
}

function getTimestamp(): string {
  return new Date().toISOString();
}

// Create an empty observation collection.
export function createObservationStore(): Observation[] {
  return [];
}

// Record a new observation.
export function recordObservation(
  observations: Observation[],
  observation: Omit<Observation, "id" | "recordedAt">
): Observation[] {
  const errors = validateObservation(observation);

  if (errors.length > 0) {
    throw new Error(errors.join(" "));
  }

  const newObservation: Observation = {
    ...observation,
    id: createId(),
    recordedAt: getTimestamp(),
  };

  return [...observations, newObservation];
}

// Retrieve observations belonging to a specific mode.
export function getObservationsByMode(
  observations: Observation[],
  mode: ObservationMode
): Observation[] {
  return observations.filter(
    (observation) => observation.mode === mode
  );
}

// Retrieve observations belonging to a category.
export function getObservationsByCategory(
  observations: Observation[],
  category: Observation["category"]
): Observation[] {
  return observations.filter(
    (observation) => observation.category === category
  );
}

// Retrieve observations within a date range.
export function getObservationsByDateRange(
  observations: Observation[],
  startDate: string,
  endDate: string
): Observation[] {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  return observations.filter((observation) => {
    const observedTime = new Date(
      observation.observedAt
    ).getTime();

    return observedTime >= start && observedTime <= end;
  });
}

// Retrieve only genuine, non-simulated observations.
export function getLiveObservations(
  observations: Observation[]
): Observation[] {
  return observations.filter(
    (observation) =>
      observation.mode === "live" &&
      observation.isSimulated === false &&
      observation.source !== "simulated"
  );
}

// Retrieve only simulated observations.
export function getDemoObservations(
  observations: Observation[]
): Observation[] {
  return observations.filter(
    (observation) =>
      observation.mode === "demo" &&
      observation.isSimulated === true &&
      observation.source === "simulated"
  );
}
