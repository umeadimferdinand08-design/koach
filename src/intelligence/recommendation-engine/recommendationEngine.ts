import type {
  Recommendation,
  RecommendationEngineInput,
  RecommendationEngineResult,
  RecommendationConfidence,
} from "./types";

import type { PersonalFact } from "../personal-profile/types";

function getUsableFacts(
  input: RecommendationEngineInput
): PersonalFact[] {
  return input.facts.filter((fact) => {
    if (fact.status === "unknown") return false;

    if (fact.permissionRequired) return false;

    // Derived facts must not independently support recommendations.
    if (fact.source === "derived") return false;

    // Simulated information is only valid in Demo Mode.
    if (
      input.mode === "live" &&
      fact.source === "simulated"
    ) {
      return false;
    }

    // Live Mode only accepts explicitly eligible sources.
    if (
      input.mode === "live" &&
      ![
        "user_input",
        "investigation",
        "permitted_sensor",
        "calendar",
        "system_observation",
      ].includes(fact.source)
    ) {
      return false;
    }

    return true;
  });
}

function getUsablePatterns(
  input: RecommendationEngineInput,
  facts: PersonalFact[]
) {
  const usableFactIds = new Set(
    facts.map((fact) => fact.id)
  );

  return input.patterns.filter((pattern) => {
    if (pattern.status === "dismissed") return false;

    if (
      pattern.evidenceStatuses.some(
        (status) => status === "unknown"
      )
    ) {
      return false;
    }

    // A pattern must have identifiable supporting evidence.
    const hasFactEvidence =
      pattern.evidenceFactIds.length > 0;

    const hasObservationEvidence =
      (pattern.evidenceObservationIds?.length ?? 0) > 0;

    if (!hasFactEvidence && !hasObservationEvidence) {
      return false;
    }

    // Every referenced personal fact must be eligible.
    if (
      hasFactEvidence &&
      !pattern.evidenceFactIds.every(
        (id) => usableFactIds.has(id)
      )
    ) {
      return false;
    }

    // The engine currently receives no observation records
    // with which to verify observation-backed patterns in Live Mode.
    // Exclude them until their original observations can be checked.
    if (
      input.mode === "live" &&
      hasObservationEvidence
    ) {
      return false;
    }

    return true;
  });
}

function getConfidence(
  statuses: PersonalFact["status"][]
): RecommendationConfidence {
  if (
    statuses.length > 0 &&
    statuses.every((status) => status === "confirmed")
  ) {
    return "high";
  }

  if (statuses.some((status) => status === "confirmed")) {
    return "moderate";
  }

  return "low";
}

function createResult(
  decision: RecommendationEngineResult["decision"],
  reasons: string[],
  missingInformation: string[] = [],
  recommendation: Recommendation | null = null
): RecommendationEngineResult {
  return {
    decision,
    recommendation,
    reasons,
    missingInformation,
    generatedAt: new Date().toISOString(),
  };
}

export function generateRecommendation(
  input: RecommendationEngineInput
): RecommendationEngineResult {
  const facts = getUsableFacts(input);
  const patterns = getUsablePatterns(input, facts);

  if (facts.length === 0 && patterns.length === 0) {
    return createResult(
      "needs_more_information",
      ["Koach does not yet have enough eligible personal context."],
      ["More information about your sleep or activity routine."]
    );
  }

  const activityPattern = patterns.find(
    (pattern) => pattern.category === "activity"
  );

  const activityFact = facts.find(
    (fact) =>
      fact.key === "current_activity_level" ||
      fact.key === "weekly_exercise_days"
  );

  if (activityPattern || activityFact) {
    const supportingFacts = facts.filter(
      (fact) =>
        fact.key === "current_activity_level" ||
        fact.key === "weekly_exercise_days"
    );

    const statuses = [
      ...(activityPattern?.evidenceStatuses ?? []),
      ...supportingFacts.map((fact) => fact.status),
    ];

    const recommendation: Recommendation = {
      id: crypto.randomUUID(),
      category: "physical_activity",
      title: "Try a 15-minute walk after lunch.",
      action:
        "Take a short walk after lunch. Choose a convenient and safe route that fits your day.",
      durationMinutes: 15,
      timing: "After lunch",
      confidence: getConfidence(statuses),
      explanation:
        "Your activity information provides a starting point for exploring a manageable movement routine. The recommendation is a practical suggestion, not proof that a particular barrier or cause has been identified.",
      supportingPatternIds: activityPattern
        ? [activityPattern.id]
        : [],
      supportingFactIds: supportingFacts.map(
        (fact) => fact.id
      ),
      mode: input.mode,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    return createResult(
      "recommended",
      ["A relevant activity context was identified."],
      [],
      recommendation
    );
  }

  const sleepFact = facts.find(
    (fact) =>
      fact.key === "usual_bedtime" ||
      fact.key === "usual_wake_time" ||
      fact.key === "sleep_hours"
  );

  const sleepPattern = patterns.find(
    (pattern) => pattern.category === "sleep"
  );

  if (sleepFact || sleepPattern) {
    const supportingFacts = facts.filter(
      (fact) =>
        fact.key === "usual_bedtime" ||
        fact.key === "usual_wake_time" ||
        fact.key === "sleep_hours"
    );

    const recommendation: Recommendation = {
      id: crypto.randomUUID(),
      category: "sleep",
      title: "Build a consistent wind-down routine.",
      action:
        "Choose a regular time to begin winding down before bed.",
      timing: "Before bedtime",
      confidence: getConfidence([
        ...(sleepPattern?.evidenceStatuses ?? []),
        ...supportingFacts.map((fact) => fact.status),
      ]),
      explanation:
        "Your reported sleep information gives Koach a starting point for exploring a more consistent bedtime routine. This is a practical suggestion, not a diagnosis.",
      supportingPatternIds: sleepPattern
        ? [sleepPattern.id]
        : [],
      supportingFactIds: supportingFacts.map(
        (fact) => fact.id
      ),
      mode: input.mode,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    return createResult(
      "recommended",
      ["A relevant sleep context was identified."],
      [],
      recommendation
    );
  }

  return createResult(
    "needs_more_information",
    ["No suitable recommendation rule matched the available information."],
    ["More information about the user's activity or sleep routine."]
  );
}