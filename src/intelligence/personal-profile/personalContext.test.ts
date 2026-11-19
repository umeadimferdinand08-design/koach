
import { describe, it, expect } from "vitest";

import {
  createPersonalContext,
  addFact,
  getFactsByCategory,
  getFactsByStatus,
  updateFact,
  confirmFact,
} from "./personalContext";

describe("Koach Personal Context Engine", () => {
  it("creates an empty personal context", () => {
    const context = createPersonalContext();

    expect(context.facts).toHaveLength(0);
    expect(context.schemaVersion).toBe("1.0");
  });

  it("adds a personal fact", () => {
    const context = createPersonalContext();

    const updated = addFact(context, {
      category: "preferences",
      key: "preferred_activity",
      value: "walking",
      status: "confirmed",
      source: "user_input",
      permissionRequired: false,
    });

    expect(updated.facts).toHaveLength(1);
    expect(updated.facts[0].value).toBe("walking");
  });

    it("records simulated facts with explicit simulated provenance", () => {
    const context = createPersonalContext();

    const updated = addFact(context, {
      category: "health",
      key: "activity_minutes",
      value: 32,
      status: "observed",
      source: "simulated",
      permissionRequired: false,
    });

    expect(updated.facts).toHaveLength(1);
    expect(updated.facts[0].source).toBe("simulated");
  });

  it("retrieves facts by category", () => {
    let context = createPersonalContext();

    context = addFact(context, {
      category: "preferences",
      key: "activity",
      value: "walking",
      status: "confirmed",
      source: "user_input",
      permissionRequired: false,
    });

    expect(
      getFactsByCategory(context, "preferences")
    ).toHaveLength(1);
  });

  it("retrieves facts by status", () => {
    let context = createPersonalContext();

    context = addFact(context, {
      category: "routines",
      key: "exercise_time",
      value: "18:00",
      status: "observed",
      source: "system_observation",
      permissionRequired: false,
    });

    expect(
      getFactsByStatus(context, "observed")
    ).toHaveLength(1);
  });

  it("updates a fact without changing its source", () => {
    let context = createPersonalContext();

    context = addFact(context, {
      category: "preferences",
      key: "activity",
      value: "walking",
      status: "observed",
      source: "system_observation",
      permissionRequired: false,
    });

    const factId = context.facts[0].id;

    context = updateFact(context, factId, {
      value: "cycling",
    });

    expect(context.facts[0].value).toBe("cycling");
    expect(context.facts[0].source).toBe("system_observation");
  });

    it("records confirmation time when an update confirms a fact", () => {
    let context = createPersonalContext();

    context = addFact(context, {
      category: "routines",
      key: "usual_bedtime",
      value: "23:00",
      status: "observed",
      source: "system_observation",
      permissionRequired: false,
    });

    const factId = context.facts[0].id;

    context = updateFact(context, factId, {
      status: "confirmed",
    });

    expect(context.facts[0].status).toBe("confirmed");
    expect(context.facts[0].lastConfirmedAt).toBeDefined();
  });

  it("updates the source when explicitly provided", () => {
  let context = createPersonalContext();

  context = addFact(context, {
    category: "goals",
    key: "primary_goal",
    value: "Build exercise habits",
    status: "confirmed",
    source: "simulated",
    permissionRequired: false,
  });

  const factId = context.facts[0].id;

  context = updateFact(context, factId, {
    value: "Improve cardiovascular fitness",
    source: "user_input",
  });

  expect(context.facts[0].value).toBe(
    "Improve cardiovascular fitness"
  );
  expect(context.facts[0].source).toBe("user_input");
});

  it("confirms an observation", () => {
    let context = createPersonalContext();

    context = addFact(context, {
      category: "routines",
      key: "exercise_time",
      value: "18:00",
      status: "observed",
      source: "system_observation",
      permissionRequired: false,
    });

    const factId = context.facts[0].id;

    context = confirmFact(context, factId);

    expect(context.facts[0].status).toBe("confirmed");
    expect(context.facts[0].lastConfirmedAt).toBeDefined();
  });
});
