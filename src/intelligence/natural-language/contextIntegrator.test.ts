
import { describe, it, expect } from "vitest";

import {
  integrateInterpretation,
} from "./contextIntegrator";

import {
  createPersonalContext,
} from "../personal-profile/personalContext";

import type {
  InterpretationResult,
} from "./types";

const message =
  "Work has been keeping me busy. I've been getting home late.";

function createInterpretation(
  interpretationType: "explicit" | "inferred" = "explicit"
): InterpretationResult {
  return {
    originalMessage: message,
    summary: "The user has been getting home late.",
    extractedInformation: [
      {
        category: "schedule",
        key: "late_arrival",
        value: "Getting home late",
        supportingText: "I've been getting home late.",
        interpretationType,
        confidence: interpretationType === "explicit" ? 1 : 0.7,
        requiresConfirmation: interpretationType === "inferred",
        status: interpretationType === "explicit"
          ? "confirmed"
          : "uncertain",
      },
    ],
    unresolvedQuestions: [],
    requiresFollowUp: interpretationType === "inferred",
    interpretedAt: new Date().toISOString(),
  };
}

describe("Natural Language Context Integrator", () => {
  it("adds explicitly stated information to Personal Context", () => {
    const context = createPersonalContext();

    const updatedContext = integrateInterpretation(
      context,
      createInterpretation("explicit")
    );

    expect(updatedContext.facts).toHaveLength(1);
    expect(updatedContext.facts[0].key).toBe("late_arrival");
    expect(updatedContext.facts[0].status).toBe("confirmed");
    expect(updatedContext.facts[0].source).toBe("user_input");
  });

  it("stores inferred information as uncertain", () => {
    const context = createPersonalContext();

    const updatedContext = integrateInterpretation(
      context,
      createInterpretation("inferred")
    );

    expect(updatedContext.facts[0].status).toBe("uncertain");
    expect(updatedContext.facts[0].lastConfirmedAt).toBeUndefined();
  });

  it("preserves the original message and supporting evidence", () => {
    const context = createPersonalContext();

    const updatedContext = integrateInterpretation(
      context,
      createInterpretation()
    );

    const storedValue = updatedContext.facts[0].value as {
      originalMessage: string;
      supportingText: string;
      extractedValue: unknown;
    };

    expect(storedValue.originalMessage).toBe(message);
    expect(storedValue.supportingText).toBe(
      "I've been getting home late."
    );
    expect(storedValue.extractedValue).toBe("Getting home late");
  });

  it("does not mutate the original Personal Context", () => {
    const context = createPersonalContext();
    const originalFactCount = context.facts.length;

    const updatedContext = integrateInterpretation(
      context,
      createInterpretation()
    );

    expect(context.facts).toHaveLength(originalFactCount);
    expect(updatedContext).not.toBe(context);
  });

  it("rejects extracted information with invalid supporting evidence", () => {
    const context = createPersonalContext();

    const interpretation = createInterpretation();

    interpretation.extractedInformation[0].supportingText =
      "I exercise every morning.";

    expect(() =>
      integrateInterpretation(context, interpretation)
    ).toThrow(
      "Supporting text must exist in the original user message."
    );

    expect(context.facts).toHaveLength(0);
  });

  it("updates an existing fact instead of creating a duplicate", () => {
    const context = createPersonalContext();

    const firstResult = integrateInterpretation(
      context,
      createInterpretation("explicit")
    );

    const secondMessage =
      "I've been arriving home late because of work.";

    const secondInterpretation = createInterpretation("explicit");

    secondInterpretation.originalMessage = secondMessage;
    secondInterpretation.extractedInformation[0].supportingText =
      "arriving home late";

    const updatedContext = integrateInterpretation(
      firstResult,
      secondInterpretation
    );

    expect(updatedContext.facts).toHaveLength(1);
    expect(updatedContext.facts[0].id).toBe(
      firstResult.facts[0].id
    );
  });
    it("preserves evidence from multiple messages", () => {
    const context = createPersonalContext();

    const firstResult = integrateInterpretation(
      context,
      createInterpretation("explicit")
    );

    const secondMessage =
      "I've been arriving home late because of work.";

    const secondInterpretation = createInterpretation("explicit");

    secondInterpretation.originalMessage = secondMessage;
    secondInterpretation.extractedInformation[0].supportingText =
      "arriving home late";

    const updatedContext = integrateInterpretation(
      firstResult,
      secondInterpretation
    );

    const storedValue = updatedContext.facts[0].value as {
      evidence: Array<{
        originalMessage: string;
        supportingText: string;
      }>;
    };

    expect(storedValue.evidence).toHaveLength(2);
    expect(storedValue.evidence[0].originalMessage).toBe(message);
    expect(storedValue.evidence[1].originalMessage).toBe(secondMessage);
  });
  it("does not downgrade a confirmed fact when a later inference arrives", () => {
    const context = createPersonalContext();

    const confirmedContext = integrateInterpretation(
      context,
      createInterpretation("explicit")
    );

    const inferredInterpretation = createInterpretation("inferred");

    const updatedContext = integrateInterpretation(
      confirmedContext,
      inferredInterpretation
    );

    expect(updatedContext.facts).toHaveLength(1);
    expect(updatedContext.facts[0].status).toBe("confirmed");
    expect(updatedContext.facts[0].id).toBe(
      confirmedContext.facts[0].id
    );
  });
});
