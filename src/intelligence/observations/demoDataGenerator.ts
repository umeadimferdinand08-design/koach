
import type { Observation } from "./types";

import {
  createObservationStore,
  recordObservation,
} from "./observationEngine";

// Creates seven days of clearly labelled simulated observations.
export function generateDemoObservations(): Observation[] {
  let observations = createObservationStore();

  const dailyData = [
    { day: "2026-11-09", steps: 8200, bedtime: "22:45", wake: "06:30", exercise: true },
    { day: "2026-11-10", steps: 7600, bedtime: "23:00", wake: "06:35", exercise: true },
    { day: "2026-11-11", steps: 6900, bedtime: "23:20", wake: "06:40", exercise: false },
    { day: "2026-11-12", steps: 5100, bedtime: "23:50", wake: "06:45", exercise: false },
    { day: "2026-11-13", steps: 4300, bedtime: "00:15", wake: "07:00", exercise: false },
    { day: "2026-11-14", steps: 5800, bedtime: "23:55", wake: "07:30", exercise: true },
    { day: "2026-11-15", steps: 7200, bedtime: "23:10", wake: "07:15", exercise: true },
  ];

  for (const day of dailyData) {
    const observedAt = `${day.day}T20:00:00.000Z`;

    observations = recordObservation(observations, {
      mode: "demo",
      category: "activity",
      metric: "steps",
      value: day.steps,
      unit: "steps",
      source: "simulated",
      confidence: "high",
      observedAt,
      permissionGranted: false,
      isSimulated: true,
      notes: "Illustrative simulated daily step count.",
    });

    observations = recordObservation(observations, {
      mode: "demo",
      category: "sleep",
      metric: "bedtime",
      value: day.bedtime,
      source: "simulated",
      confidence: "high",
      observedAt: `${day.day}T23:00:00.000Z`,
      permissionGranted: false,
      isSimulated: true,
      notes: "Illustrative simulated bedtime.",
    });

    observations = recordObservation(observations, {
      mode: "demo",
      category: "sleep",
      metric: "wake_time",
      value: day.wake,
      source: "simulated",
      confidence: "high",
      observedAt: `${day.day}T07:00:00.000Z`,
      permissionGranted: false,
      isSimulated: true,
      notes: "Illustrative simulated wake time.",
    });

    observations = recordObservation(observations, {
      mode: "demo",
      category: "activity",
      metric: "exercise_session",
      value: day.exercise,
      source: "simulated",
      confidence: "high",
      observedAt,
      permissionGranted: false,
      isSimulated: true,
      notes: "Illustrative simulated exercise-session record.",
    });
  }

  return observations;
}
