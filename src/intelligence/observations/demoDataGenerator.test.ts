
import { describe, it, expect } from "vitest";

import { generateDemoObservations } from "./demoDataGenerator";

describe("Koach Demo Data Generator", () => {
  it("generates exactly 28 observations", () => {
    const observations = generateDemoObservations();

    expect(observations).toHaveLength(28);
  });

  it("generates observations across seven days", () => {
    const observations = generateDemoObservations();

    const uniqueDays = new Set(
      observations.map((observation) =>
        observation.observedAt.slice(0, 10)
      )
    );

    expect(uniqueDays.size).toBe(7);
  });

  it("generates activity and sleep observations", () => {
    const observations = generateDemoObservations();

    expect(
      observations.some(
        (observation) => observation.category === "activity"
      )
    ).toBe(true);

    expect(
      observations.some(
        (observation) => observation.category === "sleep"
      )
    ).toBe(true);
  });

  it("labels every observation as simulated demo data", () => {
    const observations = generateDemoObservations();

    for (const observation of observations) {
      expect(observation.mode).toBe("demo");
      expect(observation.source).toBe("simulated");
      expect(observation.isSimulated).toBe(true);
      expect(observation.permissionGranted).toBe(false);
    }
  });

  it("includes step counts, bedtime, wake time and exercise records", () => {
    const observations = generateDemoObservations();

    const metrics = observations.map(
      (observation) => observation.metric
    );

    expect(metrics).toContain("steps");
    expect(metrics).toContain("bedtime");
    expect(metrics).toContain("wake_time");
    expect(metrics).toContain("exercise_session");
  });
});
