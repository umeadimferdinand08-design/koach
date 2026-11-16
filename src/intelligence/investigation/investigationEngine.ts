
import type {
  DetectedPattern,
} from "../pattern-detection/types";

import type {
  Investigation,
  InvestigationAnswer,
} from "./types";

import type {
  PersonalContext,
  ContextCategory,
} from "../personal-profile/types";

import {
  addFact,
  updateFact,
} from "../personal-profile/personalContext";

import {
  generateInvestigationQuestions,
} from "./questionGenerator";

export function createInvestigation(
  pattern: DetectedPattern
): Investigation {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    patternId: pattern.id,
    pattern,
    status: "pending",
    questions: generateInvestigationQuestions(pattern),
    answers: [],
    createdAt: now,
    updatedAt: now,
  };
}


function validateInvestigationAnswer(
  question: Investigation["questions"][number],
  answer: InvestigationAnswer
): void {
  if (question.type === "single_choice") {
    const validOption = question.options?.some(
      (option) => option.id === answer.value
    );

    if (typeof answer.value !== "string" || !validOption) {
      throw new Error("Answer must match one of the available options.");
    }
  }

  if (question.type === "multiple_choice") {
    const validOptions =
      Array.isArray(answer.value) &&
      answer.value.length > 0 &&
      answer.value.every(
        (value) =>
          typeof value === "string" &&
          question.options?.some((option) => option.id === value)
      );

    if (!validOptions) {
      throw new Error("Answer must contain valid available options.");
    }
  }

  if (question.type === "free_text") {
    if (
      typeof answer.value !== "string" ||
      answer.value.trim().length === 0
    ) {
      throw new Error("Free-text answers cannot be empty.");
    }
  }

  if (question.type === "yes_no") {
    if (typeof answer.value !== "boolean") {
      throw new Error("Answer must be yes or no.");
    }
  }
}

export function submitInvestigationAnswer(
  investigation: Investigation,
  answer: InvestigationAnswer
): Investigation {
  const question = investigation.questions.find(
    (item) => item.id === answer.questionId
  );

  if (!question) {
    throw new Error(
      "Cannot answer a question that does not belong to this investigation."
    );
  }

  validateInvestigationAnswer(question, answer);

  const updatedAnswers = [
    ...investigation.answers.filter(
      (existingAnswer) =>
        existingAnswer.questionId !== answer.questionId
    ),
    answer,
  ];

  const requiredQuestions = investigation.questions.filter(
    (question) => question.required
  );

  const allRequiredAnswered = requiredQuestions.every(
    (question) =>
      updatedAnswers.some(
        (existingAnswer) =>
          existingAnswer.questionId === question.id
      )
  );

  const now = new Date().toISOString();

  return {
    ...investigation,
    answers: updatedAnswers,
    status: allRequiredAnswered ? "completed" : "in_progress",
    updatedAt: now,
    completedAt: allRequiredAnswered ? now : undefined,
  };
}

// Map investigation patterns to relevant Personal Context categories.
function getContextCategory(
  pattern: DetectedPattern
): ContextCategory {
  switch (pattern.category) {
    case "activity":
      return "behaviour";
    case "sleep":
      return "health";
    case "routine":
      return "routines";
    case "schedule":
      return "schedule";
    case "behaviour":
      return "behaviour";
  }
}

// Submit an answer and record the user's report in Personal Context.
export function submitInvestigationAnswerWithContext(
  investigation: Investigation,
  answer: InvestigationAnswer,
  context: PersonalContext
): {
  investigation: Investigation;
  context: PersonalContext;
} {
  const updatedInvestigation = submitInvestigationAnswer(
    investigation,
    answer
  );

  const question = investigation.questions.find(
    (item) => item.id === answer.questionId
  );

  if (!question) {
    throw new Error("Investigation question could not be found.");
  }

  const factKey = `investigation.${investigation.id}.${question.id}`;

  const existingFact = context.facts.find(
    (fact) => fact.key === factKey
  );

  const factValue = {
    question: question.text,
    answer: answer.value,
  };

  let updatedContext: PersonalContext;

  if (existingFact) {
    updatedContext = updateFact(
      context,
      existingFact.id,
      {
        value: factValue,
        status: "confirmed",
      }
    );
  } else {
    updatedContext = addFact(context, {
      category: getContextCategory(investigation.pattern),
      key: factKey,
      value: factValue,
      status: "confirmed",
      source: "investigation",
      permissionRequired: false,
    });
  }

  return {
    investigation: updatedInvestigation,
    context: updatedContext,
  };
}

export function dismissInvestigation(
  investigation: Investigation
): Investigation {
  return {
    ...investigation,
    status: "dismissed",
    updatedAt: new Date().toISOString(),
  };
}
