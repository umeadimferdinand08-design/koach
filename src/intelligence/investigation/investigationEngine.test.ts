
import { describe, it, expect } from "vitest";

import {
  createInvestigation,
  submitInvestigationAnswer,
  submitInvestigationAnswerWithContext,
  dismissInvestigation,
} from "./investigationEngine";

import {
  createPersonalContext,
} from "../personal-profile/personalContext";

import type { DetectedPattern } from "../pattern-detection/types";

const mockPattern: DetectedPattern = {
  id: "pattern-001",
  category: "activity",
  title: "Declining daily activity",
  description: "Daily activity has decreased over the observation period.",
  status: "candidate",
  confidence: "moderate",
  evidenceFactIds: [],
  evidenceStatuses: [],
  evidenceObservationIds: ["obs-001", "obs-002", "obs-003"],
  explanation: "This is a candidate pattern requiring further investigation.",
  detectedAt: new Date().toISOString(),
};

describe("Investigation Engine", () => {
  it("creates an investigation from a detected pattern", () => {
    const investigation = createInvestigation(mockPattern);

    expect(investigation.patternId).toBe(mockPattern.id);
    expect(investigation.status).toBe("pending");
    expect(investigation.questions.length).toBeGreaterThan(0);
    expect(investigation.answers).toHaveLength(0);
  });

  it("moves an investigation to in_progress after an answer", () => {
    const investigation = createInvestigation(mockPattern);
    const question = investigation.questions[0];

    const updated = submitInvestigationAnswer(investigation, {
      questionId: question.id,
      value: "schedule",
      answeredAt: new Date().toISOString(),
    });

    expect(updated.status).toBe("completed");
    expect(updated.answers).toHaveLength(1);
  });

  it("updates an existing answer instead of duplicating it", () => {
    const investigation = createInvestigation(mockPattern);
    const question = investigation.questions[0];

    const firstAnswer = submitInvestigationAnswer(investigation, {
      questionId: question.id,
      value: "schedule",
      answeredAt: new Date().toISOString(),
    });

    const updated = submitInvestigationAnswer(firstAnswer, {
      questionId: question.id,
      value: "energy",
      answeredAt: new Date().toISOString(),
    });

    expect(updated.answers).toHaveLength(1);
    expect(updated.answers[0].value).toBe("energy");
  });

  it("rejects answers to questions outside the investigation", () => {
    const investigation = createInvestigation(mockPattern);

    expect(() =>
      submitInvestigationAnswer(investigation, {
        questionId: "invalid-question",
        value: "schedule",
        answeredAt: new Date().toISOString(),
      })
    ).toThrow(
      "Cannot answer a question that does not belong to this investigation."
    );
  });

  it("allows an investigation to be dismissed", () => {
    const investigation = createInvestigation(mockPattern);

    const dismissed = dismissInvestigation(investigation);

    expect(dismissed.status).toBe("dismissed");
  });

   it("rejects answers to dismissed investigations", () => {
    const investigation = createInvestigation(mockPattern);
    const dismissed = dismissInvestigation(investigation);
    const question = dismissed.questions[0];

    expect(() =>
      submitInvestigationAnswer(dismissed, {
        questionId: question.id,
        value: "schedule",
        answeredAt: new Date().toISOString(),
      })
    ).toThrow(
      "Cannot submit answers to a dismissed investigation."
    );
  });

  it("rejects duplicate options in multiple-choice answers", () => {
  const baseInvestigation = createInvestigation(mockPattern);

  const investigation = {
    ...baseInvestigation,
    questions: [
      {
        id: "multi-question-001",
        patternId: mockPattern.id,
        text: "Which factors affect your activity?",
        type: "multiple_choice" as const,
        options: [
          { id: "schedule", label: "Busy schedule" },
          { id: "energy", label: "Low energy" },
        ],
        required: true,
        purpose: "Identify activity barriers",
      },
    ],
  };

  expect(() =>
    submitInvestigationAnswer(investigation, {
      questionId: "multi-question-001",
      value: ["schedule", "schedule"],
      answeredAt: new Date().toISOString(),
    })
  ).toThrow("Answer must contain valid available options.");
});
});


describe("Investigation and Personal Context integration", () => {
  it("records an investigation answer as a Personal Fact", () => {
    const investigation = createInvestigation(mockPattern);
    const context = createPersonalContext();
    const question = investigation.questions[0];

    const result = submitInvestigationAnswerWithContext(
      investigation,
      {
        questionId: question.id,
        value: "schedule",
        answeredAt: new Date().toISOString(),
      },
      context
    );

    expect(result.investigation.answers).toHaveLength(1);
    expect(result.context.facts).toHaveLength(1);

    expect(result.context.facts[0]).toMatchObject({
      category: "behaviour",
      status: "confirmed",
      source: "investigation",
      permissionRequired: false,
    });

    expect(result.context.facts[0].value).toMatchObject({
      question: question.text,
      answer: "schedule",
    });
  });

  it("updates an existing Personal Fact when an answer is changed", () => {
    const investigation = createInvestigation(mockPattern);
    const context = createPersonalContext();
    const question = investigation.questions[0];

    const firstResult = submitInvestigationAnswerWithContext(
      investigation,
      {
        questionId: question.id,
        value: "schedule",
        answeredAt: new Date().toISOString(),
      },
      context
    );

    const secondResult = submitInvestigationAnswerWithContext(
      firstResult.investigation,
      {
        questionId: question.id,
        value: "energy",
        answeredAt: new Date().toISOString(),
      },
      firstResult.context
    );

    expect(secondResult.context.facts).toHaveLength(1);

    expect(secondResult.context.facts[0].value).toMatchObject({
      question: question.text,
      answer: "energy",
    });
  });

  it("does not change Personal Context when an invalid question is answered", () => {
    const investigation = createInvestigation(mockPattern);
    const context = createPersonalContext();

    expect(() =>
      submitInvestigationAnswerWithContext(
        investigation,
        {
          questionId: "invalid-question",
          value: "schedule",
          answeredAt: new Date().toISOString(),
        },
        context
      )
    ).toThrow(
      "Cannot answer a question that does not belong to this investigation."
    );

    expect(context.facts).toHaveLength(0);
  });
});
