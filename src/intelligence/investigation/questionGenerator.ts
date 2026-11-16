
import type {
  DetectedPattern,
} from "../pattern-detection/types";

import type {
  InvestigationQuestion,
} from "./types";

export function generateInvestigationQuestions(
  pattern: DetectedPattern
): InvestigationQuestion[] {
  const questions: InvestigationQuestion[] = [];

  switch (pattern.category) {
    case "activity":
      questions.push({
        id: `${pattern.id}-activity-change`,
        patternId: pattern.id,
        text: "Has anything changed recently that has affected your usual physical activity?",
        type: "single_choice",
        required: true,
        purpose: "Understand possible reasons for changes in physical activity.",
        options: [
          { id: "schedule", label: "My daily schedule has changed" },
          { id: "energy", label: "I've been feeling less energetic" },
          { id: "time", label: "I've had less time to exercise" },
          { id: "environment", label: "My usual environment or access has changed" },
          { id: "other", label: "Something else" },
          { id: "unknown", label: "I'm not sure" },
        ],
      });
      break;

    case "sleep":
      questions.push({
        id: `${pattern.id}-sleep-change`,
        patternId: pattern.id,
        text: "Have there been any recent changes to your sleep routine?",
        type: "single_choice",
        required: true,
        purpose: "Understand possible contextual changes affecting sleep.",
        options: [
          { id: "work", label: "Work or study commitments" },
          { id: "stress", label: "Stress or personal concerns" },
          { id: "environment", label: "Changes in my sleeping environment" },
          { id: "screen", label: "More screen time before bed" },
          { id: "other", label: "Something else" },
          { id: "unknown", label: "I'm not sure" },
        ],
      });
      break;

    case "routine":
      questions.push({
        id: `${pattern.id}-routine-change`,
        patternId: pattern.id,
        text: "Has your usual daily routine changed recently?",
        type: "single_choice",
        required: true,
        purpose: "Identify possible changes in the user's daily routine.",
        options: [
          { id: "work", label: "Work or study schedule" },
          { id: "family", label: "Family or personal responsibilities" },
          { id: "travel", label: "Travel or change of environment" },
          { id: "health", label: "Changes in how I've been feeling" },
          { id: "other", label: "Something else" },
          { id: "unknown", label: "I'm not sure" },
        ],
      });
      break;

    case "schedule":
      questions.push({
        id: `${pattern.id}-schedule-change`,
        patternId: pattern.id,
        text: "What has changed most in your daily schedule?",
        type: "single_choice",
        required: true,
        purpose: "Understand schedule changes that may affect daily behaviour.",
        options: [
          { id: "earlier", label: "My day starts earlier" },
          { id: "later", label: "My day ends later" },
          { id: "workload", label: "My workload has increased" },
          { id: "unpredictable", label: "My schedule has become less predictable" },
          { id: "other", label: "Something else" },
          { id: "unknown", label: "I'm not sure" },
        ],
      });
      break;

    case "behaviour":
      questions.push({
        id: `${pattern.id}-behaviour-change`,
        patternId: pattern.id,
        text: "What best describes the change you've noticed in your behaviour?",
        type: "single_choice",
        required: true,
        purpose: "Understand the user's experience of the detected behavioural change.",
        options: [
          { id: "intentional", label: "It was an intentional change" },
          { id: "circumstances", label: "My circumstances changed" },
          { id: "difficulty", label: "I've found the behaviour harder to maintain" },
          { id: "other", label: "Something else" },
          { id: "unknown", label: "I'm not sure" },
        ],
      });
      break;
  }

  return questions;
}
