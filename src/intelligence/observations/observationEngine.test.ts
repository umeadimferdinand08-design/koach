
import { describe, it, expect } from "vitest";

import {
  createObservationStore,
  recordObservation,
} from "./observationEngine";

describe("Koach Observation Engine", () => {
  it("creates an empty observation store", () => {
    const observations = createObservationStore();

    expect(observations).toHaveLength(0);
  });

  it("accepts a correctly labelled demo observation", () => {
    const observations = createObservationStore();

    const updated = recordObservation(observations, {
      mode: "demo",
      category: "activity",
      metric: "steps",
      value: 6500,
      unit: "steps",
      source: "simulated",
      confidence: "high",
      observedAt: "2026-11-15T08:00:00.000Z",
      permissionGranted: false,
      isSimulated: true,
    });

    expect(updated).toHaveLength(1);
    expect(updated[0].isSimulated).toBe(true);
    expect(updated[0].source).toBe("simulated");
  });

  it("accepts genuine user-entered information in live mode", () => {
    const observations = createObservationStore();

    const updated = recordObservation(observations, {
      mode: "live",
      category: "sleep",
      metric: "bedtime",
      value: "23:00",
      source: "user_input",
      confidence: "high",
      observedAt: "2026-11-15T23:00:00.000Z",
      permissionGranted: false,
      isSimulated: false,
    });

    expect(updated).toHaveLength(1);
    expect(updated[0].mode).toBe("live");
  });

  it("rejects simulated data in live mode", () => {
    const observations = createObservationStore();

    expect(() =>
      recordObservation(observations, {
        mode: "live",
        category: "activity",
        metric: "steps",
        value: 6500,
        source: "simulated",
        confidence: "high",
        observedAt: "2026-11-15T08:00:00.000Z",
        permissionGranted: false,
        isSimulated: true,
      })
    ).toThrow();
  });

  it("rejects connected data without permission", () => {
    const observations = createObservationStore();

    expect(() =>
      recordObservation(observations, {
        mode: "live",
        category: "activity",
        metric: "steps",
        value: 6500,
        source: "wearable",
        confidence: "high",
        observedAt: "2026-11-15T08:00:00.000Z",
        permissionGranted: false,
        isSimulated: false,
      })
    ).toThrow();
  });

  it("rejects demo data claiming real permissions", () => {
    const observations = createObservationStore();

    expect(() =>
      recordObservation(observations, {
        mode: "demo",
        category: "activity",
        metric: "steps",
        value: 6500,
        source: "simulated",
        confidence: "high",
        observedAt: "2026-11-15T08:00:00.000Z",
        permissionGranted: true,
        isSimulated: true,
      })
    ).toThrow();
  });
});
