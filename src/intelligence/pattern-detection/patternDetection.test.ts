
import { describe, it, expect } from "vitest";

import {
  createPersonalContext,
  addFact,
} from "../personal-profile/personalContext";

import {
  detectCandidatePatterns,
  detectHistoricalPatterns,
} from "./patternDetection";

import { generateDemoObservations } from "../observations/demoDataGenerator";

describe("Koach Pattern Detection Engine", () => {
  it("returns no patterns when the profile has no facts", () => {
    const context = createPersonalContext();

    const patterns = detectCandidatePatterns(context);

    expect(patterns).toHaveLength(0);
  });

  it("detects an activity baseline when both activity answers exist", () => {
    let context = createPersonalContext();

    context = addFact(context, {
      category: "behaviour",
      key: "current_activity_level",
      value: "Moderately active",
      status: "confirmed",
      source: "user_input",
      permissionRequired: false,
    });

    context = addFact(context, {
      category: "behaviour",
      key: "weekly_exercise_days",
      value: "3",
      status: "confirmed",
      source: "user_input",
      permissionRequired: false,
    });

    const patterns = detectCandidatePatterns(context);

    expect(patterns).toHaveLength(1);
    expect(patterns[0].category).toBe("activity");
    expect(patterns[0].status).toBe("candidate");
    expect(patterns[0].confidence).toBe("low");
    expect(patterns[0].evidenceFactIds).toHaveLength(2);
  });

  it("detects a sleep baseline when both sleep answers exist", () => {
    let context = createPersonalContext();

    context = addFact(context, {
      category: "routines",
      key: "usual_bedtime",
      value: "23:00",
      status: "confirmed",
      source: "user_input",
      permissionRequired: false,
    });

    context = addFact(context, {
      category: "routines",
      key: "usual_wake_time",
      value: "07:00",
      status: "confirmed",
      source: "user_input",
      permissionRequired: false,
    });

    const patterns = detectCandidatePatterns(context);

    expect(patterns).toHaveLength(1);
    expect(patterns[0].category).toBe("sleep");
    expect(patterns[0].status).toBe("candidate");
    expect(patterns[0].confidence).toBe("low");
    expect(patterns[0].evidenceFactIds).toHaveLength(2);
  });

  it("detects both baselines when all four answers exist", () => {
    let context = createPersonalContext();

    const answers = [
      {
        category: "behaviour" as const,
        key: "current_activity_level",
        value: "Moderately active",
      },
      {
        category: "behaviour" as const,
        key: "weekly_exercise_days",
        value: "3",
      },
      {
        category: "routines" as const,
        key: "usual_bedtime",
        value: "23:00",
      },
      {
        category: "routines" as const,
        key: "usual_wake_time",
        value: "07:00",
      },
    ];

    for (const answer of answers) {
      context = addFact(context, {
        ...answer,
        status: "confirmed",
        source: "user_input",
        permissionRequired: false,
      });
    }

    const patterns = detectCandidatePatterns(context);

    expect(patterns).toHaveLength(2);
  });
});

describe("Historical Pattern Detection", () => {
  it("detects an activity trend from demo observations", () => {
    const observations = generateDemoObservations();

    const patterns = detectHistoricalPatterns(
      observations,
      "demo"
    );

    const activityPattern = patterns.find(
      (pattern) => pattern.id === "demo-activity-trend"
    );

    expect(activityPattern).toBeDefined();
    expect(activityPattern?.category).toBe("activity");
    expect(activityPattern?.status).toBe("candidate");
    expect(activityPattern?.evidenceObservationIds).toHaveLength(7);
  });

  it("detects a bedtime trend across the observation period", () => {
    const observations = generateDemoObservations();

    const patterns = detectHistoricalPatterns(
      observations,
      "demo"
    );

    const sleepPattern = patterns.find(
      (pattern) => pattern.id === "demo-bedtime-trend"
    );

    expect(sleepPattern).toBeDefined();
    expect(sleepPattern?.category).toBe("sleep");
    expect(sleepPattern?.evidenceObservationIds).toHaveLength(7);
  });

  it("detects exercise frequency across observed days", () => {
    const observations = generateDemoObservations();

    const patterns = detectHistoricalPatterns(
      observations,
      "demo"
    );

    const exercisePattern = patterns.find(
      (pattern) => pattern.id === "demo-exercise-frequency"
    );

    expect(exercisePattern).toBeDefined();
    expect(exercisePattern?.description).toContain("4 of 7");
    expect(exercisePattern?.evidenceObservationIds).toHaveLength(7);
  });

  it("does not mix demo observations into live detection", () => {
    const observations = generateDemoObservations();

    const patterns = detectHistoricalPatterns(
      observations,
      "live"
    );

    expect(patterns).toHaveLength(0);
  });

  it("does not detect a trend with fewer than three daily step records", () => {
    const observations = generateDemoObservations().slice(0, 2);

    const patterns = detectHistoricalPatterns(
      observations,
      "demo"
    );

    expect(
      patterns.find((pattern) => pattern.id === "demo-activity-trend")
    ).toBeUndefined();
  });
});
