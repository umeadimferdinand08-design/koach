
import type {
  PersonalContext,
  PersonalFact,
} from "../personal-profile/types";

import type {
  DetectedPattern,
  PatternCategory,
} from "./types";

import type {
  Observation,
  ObservationMode,
} from "../observations/types";

function findFact(
  context: PersonalContext,
  key: string
): PersonalFact | undefined {
  return context.facts.find((fact) => fact.key === key);
}

function createPattern(
  id: string,
  category: PatternCategory,
  title: string,
  description: string,
  evidence: PersonalFact[],
  explanation: string
): DetectedPattern {
  return {
    id,
    category,
    title,
    description,
    status: "candidate",
    confidence: "low",
    evidenceFactIds: evidence.map((fact) => fact.id),
    evidenceStatuses: evidence.map((fact) => fact.status),
    explanation,
    detectedAt: new Date().toISOString(),
  };
}

export function detectCandidatePatterns(
  context: PersonalContext
): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];

  // Activity routine signal
  const activityLevel = findFact(
    context,
    "current_activity_level"
  );

  const exerciseDays = findFact(
    context,
    "weekly_exercise_days"
  );

  if (activityLevel && exerciseDays) {
    patterns.push(
      createPattern(
        "activity-routine-baseline",
        "activity",
        "Your current activity baseline",
        `You describe your current activity level as ${String(
          activityLevel.value
        )} and report exercising ${String(
          exerciseDays.value
        )} days per week.`,
        [activityLevel, exerciseDays],
        "This is a starting picture of your reported activity habits. More observations are needed to identify a recurring behavioural pattern."
      )
    );
  }

  // Sleep routine signal
  const bedtime = findFact(
    context,
    "usual_bedtime"
  );

  const wakeTime = findFact(
    context,
    "usual_wake_time"
  );

  if (bedtime && wakeTime) {
    patterns.push(
      createPattern(
        "sleep-routine-baseline",
        "sleep",
        "Your reported sleep schedule",
        `You report usually going to bed at ${String(
          bedtime.value
        )} and waking up at ${String(
          wakeTime.value
        )}.`,
        [bedtime, wakeTime],
        "This provides an initial picture of your sleep routine. Koach will need observations across multiple days before identifying a consistent sleep pattern."
      )
    );
  }

  return patterns;
}
function getObservationDay(observedAt: string): string {
  return new Date(observedAt).toISOString().slice(0, 10);
}
function timeToMinutes(time: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(time);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}
function getMetricObservations(
  observations: Observation[],
  metric: string,
  mode: ObservationMode
): Observation[] {
  return observations
    .filter(
      (observation) =>
        observation.metric === metric &&
        observation.mode === mode
    )
    .sort(
      (a, b) =>
        new Date(a.observedAt).getTime() -
        new Date(b.observedAt).getTime()
    );
}
export function detectHistoricalPatterns(
  observations: Observation[],
  mode: ObservationMode
): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];

  const stepObservations = getMetricObservations(
    observations,
    "steps",
    mode
  );

  const dailySteps = new Map<string, Observation>();

  for (const observation of stepObservations) {
    dailySteps.set(
      getObservationDay(observation.observedAt),
      observation
    );
  }

  const stepRecords = Array.from(dailySteps.values());

  if (stepRecords.length >= 3) {
    const first = Number(stepRecords[0].value);
    const last = Number(stepRecords[stepRecords.length - 1].value);

    if (
      Number.isFinite(first) &&
      Number.isFinite(last) &&
      first !== last
    ) {
      const direction = last > first ? "increased" : "decreased";

      patterns.push({
        id: `${mode}-activity-trend`,
        category: "activity",
        title: "Change in daily activity",
        description: `Recorded daily steps ${direction} from ${first} to ${last} across the observation period.`,
        status: "candidate",
        confidence: "moderate",
        evidenceFactIds: [],
        evidenceStatuses: [],
        evidenceObservationIds: stepRecords.map(
          (observation) => observation.id
        ),
        explanation:
          "This is a change between the first and last recorded daily step counts. More observations are needed to establish whether it represents a recurring pattern.",
        detectedAt: new Date().toISOString(),
      });
    }
  }
  // Sleep bedtime trend
  const bedtimeObservations = getMetricObservations(
    observations,
    "bedtime",
    mode
  );

  const dailyBedtimes = new Map<string, Observation>();

  for (const observation of bedtimeObservations) {
    dailyBedtimes.set(
      getObservationDay(observation.observedAt),
      observation
    );
  }

  const bedtimeRecords = Array.from(dailyBedtimes.values());

  if (bedtimeRecords.length >= 3) {
    const bedtimeMinutes = bedtimeRecords.map((observation) =>
      timeToMinutes(String(observation.value))
    );

    if (bedtimeMinutes.every((value) => value !== null)) {
      const unwrappedTimes: number[] = [];

      for (const time of bedtimeMinutes) {
        let adjustedTime = time as number;

        if (unwrappedTimes.length > 0) {
          const previous =
            unwrappedTimes[unwrappedTimes.length - 1];

          while (adjustedTime - previous < -720) {
            adjustedTime += 1440;
          }

          while (adjustedTime - previous > 720) {
            adjustedTime -= 1440;
          }
        }

        unwrappedTimes.push(adjustedTime);
      }

          const earliest = Math.min(...unwrappedTimes);
      const latest = Math.max(...unwrappedTimes);
      const difference = latest - earliest;

      if (difference >= 30) {
        patterns.push({
          id: `${mode}-bedtime-trend`,
          category: "sleep",
          title: "Variation in bedtime",
          description:
            `Your recorded bedtimes varied by approximately ${Math.round(
              difference
            )} minutes across the observation period.`,
          status: "candidate",
          confidence: "moderate",
          evidenceFactIds: [],
          evidenceStatuses: [],
          evidenceObservationIds: bedtimeRecords.map(
            (observation) => observation.id
          ),
          explanation:
            "This measures the range between the earliest and latest recorded bedtimes while accounting for midnight. It identifies variation, not a consistent direction of change or its cause.",
          detectedAt: new Date().toISOString(),
        });
      }
    }
  }
    // Exercise frequency
  const exerciseObservations = getMetricObservations(
    observations,
    "exercise_session",
    mode
  );

  const dailyExercise = new Map<string, Observation>();

  for (const observation of exerciseObservations) {
    dailyExercise.set(
      getObservationDay(observation.observedAt),
      observation
    );
  }

  const exerciseRecords = Array.from(dailyExercise.values());

  if (exerciseRecords.length >= 3) {
    const exerciseDays = exerciseRecords.filter(
      (observation) => observation.value === true
    ).length;

    const totalDays = exerciseRecords.length;

    patterns.push({
      id: `${mode}-exercise-frequency`,
      category: "activity",
      title: "Exercise frequency",
      description:
        `Exercise was recorded on ${exerciseDays} of ${totalDays} observed days.`,
      status: "candidate",
      confidence: "moderate",
      evidenceFactIds: [],
      evidenceStatuses: [],
      evidenceObservationIds: exerciseRecords.map(
        (observation) => observation.id
      ),
      explanation:
        "This summarises recorded exercise sessions across the available days. It does not establish why exercise did or did not occur.",
      detectedAt: new Date().toISOString(),
    });
  }
  return patterns;
}